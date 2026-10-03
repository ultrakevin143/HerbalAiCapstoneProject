import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resend: vi.fn() }));
vi.mock('../src/services/auth.service.js', () => ({ resendEmailVerification: mocks.resend }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {} }));
vi.mock('express-rate-limit', () => ({ default: () => (_req: Request, _res: Response, next: NextFunction) => next() }));
import authRoutes from '../src/routes/auth.routes.js';
import { errorResponse } from '../src/utils/error-response.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const response = errorResponse(error, true);
  res.status(response.status).json(response.body);
});

describe('Resend email verification request validation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.resend.mockResolvedValue({ message: 'If this email is registered and unverified, a new link has been sent.' });
  });

  it.each([{}, { email: '' }, { email: '   ' }, { email: 'not-an-email' }, { email: 7 }, { email: ['qa@example.invalid'] }, { email: {} }, []])
    ('rejects malformed request %j before account lookup or mail', async body => {
      const response = await request(app).post('/api/auth/resend-email-verification').send(body);
      expect(response.status).toBe(400);
      expect(mocks.resend).not.toHaveBeenCalled();
    });

  it('rejects a missing body without an internal server error', async () => {
    const response = await request(app).post('/api/auth/resend-email-verification');
    expect(response.status).toBe(400);
    expect(mocks.resend).not.toHaveBeenCalled();
  });

  it('preserves the neutral recovery result for a valid address', async () => {
    const response = await request(app).post('/api/auth/resend-email-verification').send({ email: 'qa@example.invalid' });
    expect(response.status).toBe(200);
    expect(mocks.resend).toHaveBeenCalledExactlyOnceWith('qa@example.invalid');
    expect(response.body.message).toContain('If this email');
  });
});
