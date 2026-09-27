import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));

import { permittedRole } from '../src/middlewares/role.middleware.js';

const app = express();
app.get('/missing-session', permittedRole([Role.admin]), (_req, res) => res.status(200).end());
app.get('/protected', (req, _res, next) => {
  (req as typeof req & { user: { userId: string; role: string } }).user = {
    userId: 'user-1',
    role: req.header('x-token-role') ?? Role.contributor,
  };
  next();
}, permittedRole([Role.admin]), (req, res) => {
  res.status(200).json({ role: (req as typeof req & { user: { role: string } }).user.role });
});
app.use((_error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ status: 'error' });
});

describe('current database role authorization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('allows a promoted user even when the access token has the old contributor role', async () => {
    mocks.findUnique.mockResolvedValue({ role: Role.admin, isBanned: false });

    const response = await request(app).get('/protected').set('x-token-role', Role.contributor);

    expect(response.status).toBe(200);
    expect(response.body.role).toBe(Role.admin);
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { role: true, isBanned: true },
    });
  });

  it('revokes administrator access immediately after a database role change', async () => {
    mocks.findUnique.mockResolvedValue({ role: Role.contributor, isBanned: false });

    const response = await request(app).get('/protected').set('x-token-role', Role.admin);

    expect(response.status).toBe(403);
  });

  it('denies banned and deleted accounts', async () => {
    mocks.findUnique.mockResolvedValueOnce({ role: Role.admin, isBanned: true });
    mocks.findUnique.mockResolvedValueOnce(null);

    expect((await request(app).get('/protected').set('x-token-role', Role.admin)).status).toBe(403);
    expect((await request(app).get('/protected').set('x-token-role', Role.admin)).status).toBe(401);
  });

  it('denies requests without an authenticated user before querying the database', async () => {
    const response = await request(app).get('/missing-session');

    expect(response.status).toBe(401);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('passes database failures to the error handler', async () => {
    mocks.findUnique.mockRejectedValue(new Error('database unavailable'));

    const response = await request(app).get('/protected');

    expect(response.status).toBe(500);
  });
});
