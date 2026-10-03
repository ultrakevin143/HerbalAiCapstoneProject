import type { AxiosResponse } from 'axios';
import api from './axios';

interface CachedResponse {
  url: string;
  response: AxiosResponse;
  expiresAt: number;
}

const responses = new Map<string, CachedResponse>();
const pending = new Map<string, { url: string; request: Promise<AxiosResponse> }>();

export const cachedApiGet = async (
  url: string,
  ttlMs = 60_000,
  force = false,
  ownerId?: string,
): Promise<AxiosResponse> => {
  const key = JSON.stringify([ownerId ?? null, url]);
  if (!force) {
    const cached = responses.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.response;
    if (cached) responses.delete(key);

    const inFlight = pending.get(key);
    if (inFlight) return inFlight.request;
  }

  const request = api.get(url)
    .then((response) => {
      if (ttlMs > 0 && pending.get(key)?.request === request) {
        responses.set(key, { url, response, expiresAt: Date.now() + ttlMs });
      }
      return response;
    })
    .finally(() => {
      if (pending.get(key)?.request === request) pending.delete(key);
    });

  pending.set(key, { url, request });
  return request;
};

export const invalidateApiGetCache = (prefix?: string): void => {
  if (!prefix) {
    responses.clear();
    pending.clear();
    return;
  }
  for (const [key, cached] of responses) {
    if (cached.url.startsWith(prefix)) responses.delete(key);
  }
  for (const [key, inFlight] of pending) {
    if (inFlight.url.startsWith(prefix)) pending.delete(key);
  }
};
