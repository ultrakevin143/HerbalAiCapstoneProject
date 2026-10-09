import { ENV } from '../config/env.js';
import type { ServerOptions } from 'socket.io';

export const parseSocketCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((cookies, item) => {
    const [name, ...value] = item.trim().split('=');
    if (name && value.length > 0) {
      try {
        cookies[name] = decodeURIComponent(value.join('='));
      } catch {
        delete cookies[name];
      }
    }
    return cookies;
  }, {} as Record<string, string>);
};

export const socketServerOptions: Partial<ServerOptions> = {
  cors: { origin: ENV.FRONTEND_URL, credentials: true },
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const trusted = origin === undefined
      ? req.headers['sec-fetch-site'] !== 'cross-site'
      : origin === new URL(ENV.FRONTEND_URL).origin;
    callback(trusted ? null : 'Untrusted request origin', trusted);
  },
};
