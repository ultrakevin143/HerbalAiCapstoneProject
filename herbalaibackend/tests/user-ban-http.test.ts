import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ account: vi.fn(), moderation: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { user: { findUnique: mocks.account } } }));
vi.mock('../src/repositories/user.repository.js', () => ({ updateUserBanStatus: mocks.moderation }));

import authRoutes from '../src/routes/auth.routes.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { AuthMiddleware } from '../src/middlewares/auth.middleware.js';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.get('/protected', new AuthMiddleware().execute, (_request, response) => response.json({ status: 'success' }));
app.use((error: { status?: number; message?: string }, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(error.status ?? 500).json({ message: error.message });
});
const token = generateAccessToken({ userId: 'TEST-admin', role: 'admin', sessionVersion: 0 });
const input = { type: 'temporary', duration: 17, unit: 'minutes', reason: 'TEST ONLY custom ban' };
const account = { role: 'admin', isBanned: false, sessionVersion: 0, banExpiresAt: null, banReason: null };

describe('admin ban HTTP and access-session enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue(account);
    mocks.moderation.mockResolvedValue({ id: 'TEST-target', isBanned: true, banReason: input.reason });
  });

  it('passes custom duration and reason to the transactional repository', async () => {
    const result = await request(app).post('/auth/users/TEST-target/ban').set('Authorization', `Bearer ${token}`).send(input);
    expect(result.status).toBe(200);
    expect(mocks.moderation).toHaveBeenCalledWith('TEST-target', true, 'TEST-admin', input);
  });

  it('accepts indefinite bans without a duration', async () => {
    expect((await request(app).post('/auth/users/TEST-target/ban').set('Authorization', `Bearer ${token}`)
      .send({ type: 'indefinite', reason: 'TEST ONLY indefinite' })).status).toBe(200);
  });

  it.each([{}, { ...input, duration: 0 }, { ...input, duration: 1.5 }, { ...input, unit: 'weeks' },
    { ...input, reason: ' ' }, { ...input, unit: 'days', duration: 366 }, { ...input, extra: 'unsupported' },
    { type: 'indefinite', reason: input.reason, duration: 3 }])('rejects invalid options before mutation %#', async invalid => {
    expect((await request(app).post('/auth/users/TEST-target/ban').set('Authorization', `Bearer ${token}`).send(invalid)).status).toBe(400);
    expect(mocks.moderation).not.toHaveBeenCalled();
  });

  it('blocks anonymous and contributor moderation', async () => {
    expect((await request(app).post('/auth/users/TEST-target/ban').send(input)).status).toBe(401);
    mocks.account.mockResolvedValue({ ...account, role: 'contributor' });
    expect((await request(app).post('/auth/users/TEST-target/ban').set('Authorization', `Bearer ${token}`).send(input)).status).toBe(403);
    expect(mocks.moderation).not.toHaveBeenCalled();
  });

  it('blocks self banning before a repository write', async () => {
    expect((await request(app).post('/auth/users/TEST-admin/ban').set('Authorization', `Bearer ${token}`).send(input)).status).toBe(400);
    expect(mocks.moderation).not.toHaveBeenCalled();
  });

  it('keeps explicit unban on the administrator-protected route', async () => {
    expect((await request(app).post('/auth/users/TEST-target/unban').set('Authorization', `Bearer ${token}`).send({})).status).toBe(200);
    expect(mocks.moderation).toHaveBeenCalledWith('TEST-target', false, 'TEST-admin');
  });

  it('shows ban reason/expiry and blocks an already authenticated session', async () => {
    const expiry = new Date(Date.now() + 60_000);
    mocks.account.mockResolvedValue({ ...account, sessionVersion: 1, isBanned: true, banReason: input.reason, banExpiresAt: expiry });
    const result = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(403);
    expect(result.body.message).toContain(input.reason);
    expect(result.body.message).toContain(expiry.toISOString());
  });

  it('does not restore an old session after a temporary ban expires', async () => {
    mocks.account.mockResolvedValue({ ...account, isBanned: true, sessionVersion: 1, banExpiresAt: new Date(0) });
    expect((await request(app).get('/protected').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    const freshToken = generateAccessToken({ userId: 'TEST-admin', role: 'admin', sessionVersion: 1 });
    expect((await request(app).get('/protected').set('Authorization', `Bearer ${freshToken}`)).status).toBe(200);
  });

  it('does not restore an old session after manual unban', async () => {
    mocks.account.mockResolvedValue({ ...account, sessionVersion: 2 });
    expect((await request(app).get('/protected').set('Authorization', `Bearer ${token}`)).status).toBe(401);
  });
});
