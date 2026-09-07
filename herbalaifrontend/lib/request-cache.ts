import type { AxiosResponse } from 'axios';
import api from './axios';

interface CachedResponse {
  response: AxiosResponse;
  expiresAt: number;
}

const responses = new Map<string, CachedResponse>();
const pending = new Map<string, Promise<AxiosResponse>>();

export const cachedApiGet = async (
  url: string,
  ttlMs = 60_000,
  force = false
): Promise<AxiosResponse> => {
  if (!force) {
    const cached = responses.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.response;
    if (cached) responses.delete(url);

    const inFlight = pending.get(url);
    if (inFlight) return inFlight;
  }

  const request = api.get(url)
    .then((response) => {
      if (ttlMs > 0) responses.set(url, { response, expiresAt: Date.now() + ttlMs });
      return response;
    })
    .finally(() => pending.delete(url));

  pending.set(url, request);
  return request;
};

export const invalidateApiGetCache = (prefix?: string): void => {
  if (!prefix) {
    responses.clear();
    return;
  }
  for (const key of responses.keys()) {
    if (key.startsWith(prefix)) responses.delete(key);
  }
};
