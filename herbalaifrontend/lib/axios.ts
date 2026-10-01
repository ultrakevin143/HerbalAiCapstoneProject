import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    isRefreshing = true;

    try {
      // Call refresh-token endpoint on the backend
      await api.post('/auth/refresh-token', undefined, { timeout: 10_000 });
      isRefreshing = false;
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      const refreshStatus = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined;
      const sessionExpired = refreshStatus === 400 || refreshStatus === 401 || refreshStatus === 403;
      processQueue(sessionExpired ? error : refreshError);

      if (sessionExpired && typeof window !== 'undefined' &&
          !originalRequest.url?.startsWith('/auth/me')) {
        window.dispatchEvent(new Event('auth-logout'));
      }

      return Promise.reject(sessionExpired ? error : refreshError);
    }
  }
);

export default api;
