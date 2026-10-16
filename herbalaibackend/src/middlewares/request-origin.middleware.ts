import type { RequestHandler } from 'express';
import { ENV } from '../config/env.js';
import { trustedRequestOrigins } from '../config/frontend-origins.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const requestOriginGuard: RequestHandler = (req, res, next) => {
  if (safeMethods.has(req.method)) { next(); return; }
  const origin = req.get('Origin');
  const trustedOrigins = trustedRequestOrigins(ENV.FRONTEND_URL, ENV.FRONTEND_ADDITIONAL_ORIGINS);
  if ((origin && !trustedOrigins.has(origin)) || (!origin && req.get('Sec-Fetch-Site') === 'cross-site')) {
    res.status(403).json({ status: 'error', code: 'UNTRUSTED_REQUEST_ORIGIN', message: 'This request came from an untrusted site.' });
    return;
  }
  next();
};
