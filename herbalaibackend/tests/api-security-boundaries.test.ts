import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

const mocks = vi.hoisted(() => ({ session: vi.fn(), account: vi.fn(), markAll: vi.fn(), user: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { user: { findUnique: mocks.account } }, getDatabasePoolMetrics: () => ({}) }));
vi.mock('../src/lib/access-session.js', () => ({ validateAccessSession: mocks.session }));
vi.mock('../src/repositories/notification.repository.js', () => ({ markAllAsRead: mocks.markAll }));
vi.mock('../src/repositories/user.repository.js', () => ({ findUserById: mocks.user }));

import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { uploadImage } from '../src/middlewares/upload.middleware.js';

const accessToken = generateAccessToken({ userId: 'TEST-owner', role: 'contributor', sessionVersion: 0 });

const protectedEndpoints = [
  ['get', '/auth/me'], ['get', '/auth/socket-token'], ['patch', '/auth/me'],
  ['post', '/auth/change-password'], ['post', '/auth/password-setup'], ['get', '/auth/users'],
  ['post', '/auth/users/TEST/ban'], ['post', '/auth/users/TEST/unban'],
  ['post', '/chat'], ['post', '/chat/stream'], ['get', '/knowledge-base/all'], ['get', '/knowledge-base/page'],
  ['post', '/knowledge-base/create'], ['post', '/knowledge-base/import'], ['patch', '/knowledge-base/TEST'], ['delete', '/knowledge-base/TEST'],
  ['get', '/suggest'], ['post', '/suggest'], ['patch', '/suggest/1'], ['post', '/suggest/1/resubmit'],
  ['post', '/suggest/1/approve'], ['post', '/suggest/1/request-changes'], ['post', '/suggest/1/reject'],
  ['post', '/herbs/TEST/comments'], ['post', '/herbs/comments/1/like'], ['delete', '/herbs/comments/1'],
  ['put', '/herbs/TEST'], ['delete', '/herbs/TEST'], ['get', '/stats/dashboard'],
  ['get', '/messages/users'], ['get', '/messages/conversations'], ['get', '/messages/history/TEST'],
  ['post', '/messages'], ['put', '/messages/1'], ['delete', '/messages/1'],
  ['get', '/admin/audit-logs'], ['get', '/notifications'], ['patch', '/notifications/read-all'], ['patch', '/notifications/1/read'],
  ['get', '/credits'], ['post', '/credits/checkout'], ['get', '/credits/answers/TEST'],
  ['post', '/forum/threads'], ['delete', '/forum/threads/1'], ['post', '/forum/threads/1/like'],
  ['get', '/forum/threads/1/like-status'], ['get', '/forum/threads/1/comment-like-statuses'],
  ['post', '/forum/threads/1/comments'], ['post', '/forum/comments/1/like'], ['delete', '/forum/comments/1'],
] as const;
const perform = (method: string, path: string) => {
  const client = request(app);
  if (method === 'get') return client.get(`/api${path}`);
  if (method === 'post') return client.post(`/api${path}`);
  if (method === 'patch') return client.patch(`/api${path}`);
  if (method === 'put') return client.put(`/api${path}`);
  return client.delete(`/api${path}`);
};

describe('API-wide security and parser boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({ status: 'valid', payload: { userId: 'TEST-owner', role: 'contributor', sessionVersion: 0 } });
    mocks.account.mockResolvedValue({ role: 'contributor', isBanned: false, sessionVersion: 0 });
    mocks.markAll.mockResolvedValue({ count: 1 });
    mocks.user.mockResolvedValue({ id: 'TEST-owner', name: 'TEST ONLY', role: 'contributor', isBanned: false });
  });

  it.each(protectedEndpoints)('%s %s rejects anonymous access before authenticated work', async (method, path) => {
    const response = await perform(method, path);
    expect(response.status).toBe(401);
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.markAll).not.toHaveBeenCalled();
  });

  it('rejects foreign-origin form submissions before cookie-authenticated writes', async () => {
    const response = await request(app).post('/api/auth/logout').set('Origin', 'https://untrusted.example').type('form').send({});
    expect(response.status).toBe(403);
  });

  it.each(protectedEndpoints.filter(([, path]) => path.startsWith('/knowledge-base') || path.startsWith('/stats') || path.startsWith('/admin/') || path.startsWith('/auth/users') || /\/(approve|reject|request-changes)$/.test(path) || ['/herbs/TEST'].includes(path)))
    ('%s %s rejects contributor access to administrator-only work', async (method, path) => {
      const response = await perform(method, path).set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(403);
    });

  it('rejects cross-site cookie-authenticated mutations before session/database access', async () => {
    const response = await request(app).patch('/api/notifications/read-all').set('Origin', 'https://untrusted.example').set('Cookie', 'accessToken=TEST-cookie');
    expect(response.status).toBe(403);
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.markAll).not.toHaveBeenCalled();
  });

  it('rejects cross-site browser mutations with a missing Origin', async () => {
    const response = await request(app).patch('/api/notifications/read-all').set('Sec-Fetch-Site', 'cross-site').set('Cookie', 'accessToken=TEST-cookie');
    expect(response.status).toBe(403);
    expect(mocks.markAll).not.toHaveBeenCalled();
  });

  it('allows the configured frontend origin to use its cookie session', async () => {
    const response = await request(app).patch('/api/notifications/read-all').set('Origin', new URL(ENV.FRONTEND_URL).origin).set('Cookie', 'accessToken=TEST-cookie');
    expect(response.status).toBe(200);
    expect(mocks.markAll).toHaveBeenCalledWith('TEST-owner');
  });

  it('allows no-origin bearer API requests', async () => {
    const response = await request(app).patch('/api/notifications/read-all').set('Authorization', 'Bearer TEST-token');
    expect(response.status).toBe(200);
  });

  it.each(['/auth/me', '/auth/socket-token', '/credits'])('disables shared caching for private GET %s', async path => {
    const response = await request(app).get(`/api${path}`).set('Cookie', `accessToken=${accessToken}`);
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('no-store');
  });

  it('does not leak malformed JSON credentials in responses or logs', async () => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('SECRET-API-PARSER');
      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).not.toContain('SECRET-API');
      expect(JSON.stringify(logger.mock.calls)).not.toContain('SECRET-API');
      expect(response.body.code).toBe('INVALID_JSON');
    } finally { logger.mockRestore(); }
  });

  it('rejects oversized JSON without diagnostic echo', async () => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await request(app).post('/api/auth/login').send({ password: 'x'.repeat(110000) });
      expect(response.status).toBe(413);
      expect(response.body.code).toBe('REQUEST_BODY_TOO_LARGE');
      expect(response.body).not.toHaveProperty('stack');
    } finally { logger.mockRestore(); }
  });

  it('keeps disabled signed-webhook handling separate from browser Origin checks', async () => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await request(app).post('/api/credits/webhook').set('Origin', 'https://provider.example').send({});
      expect(response.status).toBe(404);
      expect(mocks.session).not.toHaveBeenCalled();
    } finally { logger.mockRestore(); }
  });

  it('bounds multipart text-field count before controller work', async () => {
    let mutation = request(app).post('/api/messages').set('Authorization', `Bearer ${accessToken}`);
    for (let fieldIndex = 0; fieldIndex < 21; fieldIndex++) mutation = mutation.field(`extra${fieldIndex}`, 'TEST ONLY');
    const response = await mutation;
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid image upload');
  });

  it('bounds multipart text-field size before controller work', async () => {
    const response = await request(app).post('/api/messages').set('Authorization', `Bearer ${accessToken}`).field('content', 'x'.repeat(65537));
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid image upload');
  });

  it('preserves the allowed field budget plus a single image', async () => {
    const uploadApp = express();
    uploadApp.post('/', uploadImage, (req, res) => { res.json({ fields: Object.keys(req.body).length, image: Boolean(req.file) }); });
    let upload = request(uploadApp).post('/');
    for (let fieldIndex = 0; fieldIndex < 20; fieldIndex++) upload = upload.field(`field${fieldIndex}`, 'TEST ONLY');
    const response = await upload.attach('image', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), { filename: 'TEST.png', contentType: 'image/png' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ fields: 20, image: true });
  });
});
