import type { Request, Response, NextFunction } from 'express';
import { getDatabasePoolMetrics } from '../lib/prisma.js';
import { randomUUID } from 'node:crypto';

const configuredThreshold = Number(process.env['SLOW_REQUEST_THRESHOLD_MS'] ?? 1_000);
const slowThresholdMs = Number.isFinite(configuredThreshold) ? configuredThreshold : 1_000;

export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = process.hrtime.bigint();
  res.locals.requestId = randomUUID();
  res.locals.requestStartedAt = startedAt;

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    if (durationMs >= slowThresholdMs) {
      console.warn(JSON.stringify({
        event: 'slow_request',
        requestId: res.locals.requestId,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        durationMs: Number(durationMs.toFixed(1)),
        databasePool: getDatabasePoolMetrics(),
      }));
    }
  });

  const originalEnd = res.end.bind(res);
  res.end = ((...args: Parameters<Response['end']>) => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    if (!res.headersSent) {
      const currentTiming = res.getHeader('Server-Timing');
      const appTiming = `app;dur=${durationMs.toFixed(1)}`;
      res.setHeader('Server-Timing', currentTiming ? `${currentTiming}, ${appTiming}` : appTiming);
      res.setHeader('X-Response-Time', `${durationMs.toFixed(1)}ms`);
    }
    return originalEnd(...args);
  }) as Response['end'];

  next();
};
