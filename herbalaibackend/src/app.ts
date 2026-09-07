import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import routes from './routes/index.js';
import { requestTiming } from './middlewares/request-timing.middleware.js';
import { errorResponse } from './utils/error-response.js';

const app = express();

app.disable('x-powered-by');
app.use(requestTiming);

// --- Security Headers ---
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// --- Core Middleware ---
app.use(cors({
  origin: ENV.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Simple Health Check Route (kept for backwards compatibility) ---
app.get('/api/test', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: "Herbal AI Backend is running successfully!",
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// --- API Router ---
app.use('/api', routes);

// --- 404 Handler ---
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// --- Global Error Handler ---
app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥 Global Error Hook:', err.message || err);
  
  const response = errorResponse(err, ENV.NODE_ENV === 'production');
  res.status(response.status).json(response.body);
});

export default app;
