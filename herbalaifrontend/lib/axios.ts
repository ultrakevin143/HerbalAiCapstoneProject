import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let sessionGeneration = 0;
let authenticationGeneration: number | null = null;
let refreshController: AbortController | null = null;
type SessionRequestConfig = InternalAxiosRequestConfig & { _sessionGeneration?: number };
const isSessionBoundary = (config: InternalAxiosRequestConfig) => ['/auth/login', '/auth/logout'].includes(config.url?.split('?')[0] ?? '');
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  const queue = failedQueue;
  failedQueue = [];
  queue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
};

api.interceptors.request.use((config) => {
  const request = config as SessionRequestConfig;
  if (request._sessionGeneration === undefined) {
    if (isSessionBoundary(request)) {
      sessionGeneration += 1;
      authenticationGeneration = sessionGeneration;
      refreshController?.abort();
      refreshController = null;
      isRefreshing = false;
      processQueue(new axios.CanceledError('The authentication session changed.'));
    }
    request._sessionGeneration = sessionGeneration;
  }
  if (request._sessionGeneration !== sessionGeneration) {
    throw new axios.CanceledError('The authentication session changed.', request);
  }
  if (authenticationGeneration !== null && !isSessionBoundary(request)) {
    throw new axios.CanceledError('Authentication is still being confirmed.', request);
  }
  return request;
});

api.interceptors.response.use(
  (response) => {
    if ((response.config as SessionRequestConfig)._sessionGeneration !== sessionGeneration) {
      throw new axios.CanceledError('The authentication session changed.', response.config);
    }
    if (isSessionBoundary(response.config)) authenticationGeneration = null;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest && originalRequest._sessionGeneration !== sessionGeneration) {
      throw new axios.CanceledError('The authentication session changed.', originalRequest);
    }
    if (originalRequest && isSessionBoundary(originalRequest)) authenticationGeneration = null;

    // Check if error response is 401 (Unauthorized) and request hasn't been retried yet
    if (!error.response || error.response.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Do not attempt to refresh failed credential or refresh requests.
    if (
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (originalRequest.signal?.aborted) {
      throw new axios.CanceledError('Request canceled', originalRequest);
    }

    const waitingForRefresh = new Promise((resolve, reject) => {
      const signal = originalRequest.signal;
      const cleanup = () => signal?.removeEventListener?.('abort', handleAbort);
      const queuedRequest = {
        resolve: (value?: unknown) => {
          cleanup();
          resolve(value);
        },
        reject: (reason?: unknown) => {
          cleanup();
          reject(reason);
        },
      };
      const handleAbort = () => {
        failedQueue = failedQueue.filter((request) => request !== queuedRequest);
        queuedRequest.reject(new axios.CanceledError('Request canceled', originalRequest));
      };
      failedQueue.push(queuedRequest);
      signal?.addEventListener?.('abort', handleAbort);
      if (signal?.aborted) handleAbort();
    });

    if (!isRefreshing) {
      isRefreshing = true;
      const generation = sessionGeneration;
      const controller = new AbortController();
      refreshController = controller;
      void (async () => {
        try {
          await api.post('/auth/refresh-token', undefined, { timeout: 10_000, signal: controller.signal });
          if (generation !== sessionGeneration) return;
          isRefreshing = false;
          processQueue(null);
        } catch (refreshError) {
          if (generation !== sessionGeneration) return;
          isRefreshing = false;
          const refreshStatus = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined;
          const sessionExpired = refreshStatus === 400 || refreshStatus === 401 || refreshStatus === 403;
          processQueue(sessionExpired ? error : refreshError);

          if (sessionExpired && typeof window !== 'undefined' &&
              !originalRequest.url?.startsWith('/auth/me')) {
            window.dispatchEvent(new Event('auth-logout'));
          }
        } finally {
          if (refreshController === controller) refreshController = null;
        }
      })();
    }

    return waitingForRefresh.then(() => api(originalRequest));
  }
);

export default api;
