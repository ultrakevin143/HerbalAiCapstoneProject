import type { RequestHandler } from 'express';
import { ENV } from '../config/env.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const requestOriginGuard: RequestHandler = (req, res, next) => {
  if (safeMethods.has(req.method)) { next(); return; }
  const origin = req.get('Origin');
  const trustedOrigin = new URL(ENV.FRONTEND_URL).origin;
  if ((origin && origin !== trustedOrigin) || (!origin && req.get('Sec-Fetch-Site') === 'cross-site')) {
    res.status(403).json({ status: 'error', code: 'UNTRUSTED_REQUEST_ORIGIN', message: 'This request came from an untrusted site.' });
    return;
  }
  next();
};
