import express from 'express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ account: vi.fn(), list: vi.fn(), count: vi.fn(), update: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  user: { findUnique: mocks.account },
  notification: { findMany: mocks.list, count: mocks.count, updateMany: mocks.update },
} }));

import notificationRoutes from '../src/routes/notification.routes.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { errorResponse } from '../src/utils/error-response.js';

const createApp = (extended = false) => {
  const app = express();
  if (extended) app.set('query parser', 'extended');
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/notifications', notificationRoutes);
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const response = errorResponse(error, true);
    res.status(response.status).json(response.body);
  });
  return app;
};
const app = createApp();
const headers = { Authorization: `Bearer ${generateAccessToken({ userId: 'qa-notification-owner', role: 'contributor' })}` };
const notification = { id: 7, userId: 'qa-notification-owner', title: 'TEST ONLY', message: 'TEST ONLY',
  type: 'SYSTEM', link: null, isRead: false, createdAt: '2026-10-03T00:00:00.000Z' };
const getList = (limit: string) => request(app).get('/api/notifications').query({ limit }).set(headers);
const markOne = (id: string) => request(app).patch(`/api/notifications/${encodeURIComponent(id)}/read`).set(headers);
const assertNoNotificationAccess = () => {
  for (const dependency of [mocks.list, mocks.count, mocks.update]) expect(dependency).not.toHaveBeenCalled();
};
const perform = (action: 'list' | 'one' | 'all') => action === 'list'
  ? request(app).get('/api/notifications')
  : request(app).patch(action === 'one' ? '/api/notifications/7/read' : '/api/notifications/read-all');

describe('Notification HTTP boundaries and ownership', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.account.mockResolvedValue({ role: 'contributor', sessionVersion: 0, isBanned: false });
    mocks.list.mockResolvedValue([notification]);
    mocks.count.mockResolvedValue(120);
    mocks.update.mockResolvedValue({ count: 1 });
  });

  it.each(['7junk', '7.5', '7e0', '0x7', '+7', ' 7 ', '007', '0', '-7', '2147483648', '9007199254740992', 'Infinity', 'NaN', '\n7', '7\n', '7\r', '7\r\n', '7\u2028', '7\u2029'])
    ('rejects malformed action ID %s before persistence', async (id) => {
      const response = await markOne(id);
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ status: 'error', code: 400, message: 'Invalid notification ID' });
      assertNoNotificationAccess();
    });

  it.each(['1', '7', '2147483647'])('accepts canonical Int action ID %s and retains owner scope', async (id) => {
    expect((await markOne(id)).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: Number(id), userId: 'qa-notification-owner' }, data: { isRead: true },
    });
  });

  it.each(['', '0', '-1', '1.5', '7junk', '1e2', '0x10', '+7', ' 7 ', '007', '101', '2147483647', '2147483648', '9007199254740992', 'Infinity', 'NaN', '\n7', '7\n', '7\r', '7\r\n', '7\u2028', '7\u2029'])
    ('rejects invalid/out-of-range list limit %s before notification queries', async (limit) => {
      const response = await getList(limit);
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ status: 'error', code: 400 });
      expect(response.body.message).toContain('limit');
      assertNoNotificationAccess();
    });

  it('rejects repeated limit parameters instead of coercing an array to its first item', async () => {
    expect((await request(app).get('/api/notifications?limit=7&limit=8').set(headers)).status).toBe(400);
    assertNoNotificationAccess();
  });

  it.each(['limit[]=7', 'limit[value]=7'])('rejects structured query %s with an extended parser', async (query) => {
    expect((await request(createApp(true)).get(`/api/notifications?${query}`).set(headers)).status).toBe(400);
    assertNoNotificationAccess();
  });

  it.each(['1', '30', '100'])('accepts list limit %s without losing the global unread count', async (limit) => {
    const response = await getList(limit);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ notifications: [notification], unreadCount: 120 });
    expect(mocks.list).toHaveBeenCalledExactlyOnceWith({
      where: { userId: 'qa-notification-owner' }, orderBy: { createdAt: 'desc' }, take: Number(limit),
    });
    expect(mocks.count).toHaveBeenCalledExactlyOnceWith({ where: { userId: 'qa-notification-owner', isRead: false } });
  });

  it('preserves the omitted-limit default of thirty records', async () => {
    expect((await request(app).get('/api/notifications').set(headers)).status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ take: 30 }));
  });

  it('returns an empty list and zero unread without manufacturing notifications', async () => {
    mocks.list.mockResolvedValue([]); mocks.count.mockResolvedValue(0);
    const response = await request(app).get('/api/notifications').set(headers);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ notifications: [], unreadCount: 0 });
  });

  it('retains owner-only unread filtering for read-all', async () => {
    expect((await perform('all').set(headers).send({ userId: 'foreign-owner' })).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({
      where: { userId: 'qa-notification-owner', isRead: false }, data: { isRead: true },
    });
  });

  it('ignores caller-provided owner overrides for lists and single-row writes', async () => {
    expect((await request(app).get('/api/notifications?userId=foreign-owner').set(headers)).status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'qa-notification-owner' } }));
    expect((await perform('one').set(headers).send({ userId: 'foreign-owner', id: 8, isRead: false })).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 7, userId: 'qa-notification-owner' }, data: { isRead: true },
    });
  });

  it.each(['one', 'all'] as const)('retains idempotent success for a zero-row %s mutation without exposing existence', async (action) => {
    mocks.update.mockResolvedValue({ count: 0 });
    expect((await perform(action).set(headers)).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  for (const action of ['list', 'one', 'all'] as const) {
    it(`supports the existing browser cookie authentication path: ${action}`, async () => {
      expect((await perform(action).set('Cookie', `accessToken=${headers.Authorization.slice(7)}`)).status).toBe(200);
      expect(mocks.account).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'qa-notification-owner' } }));
    });

    it(`requires authentication before notification access: ${action}`, async () => {
      expect((await perform(action)).status).toBe(401);
      assertNoNotificationAccess();
    });

    it(`rejects an invalid bearer token: ${action}`, async () => {
      expect((await perform(action).set('Authorization', 'Bearer TEST-not-a-jwt')).status).toBe(401);
      assertNoNotificationAccess();
    });

    it(`rejects a revoked account session: ${action}`, async () => {
      mocks.account.mockResolvedValue({ role: 'contributor', sessionVersion: 1, isBanned: false });
      expect((await perform(action).set(headers)).status).toBe(401);
      assertNoNotificationAccess();
    });

    it(`rejects a banned account: ${action}`, async () => {
      mocks.account.mockResolvedValue({ role: 'contributor', sessionVersion: 0, isBanned: true });
      expect((await perform(action).set(headers)).status).toBe(403);
      assertNoNotificationAccess();
    });
  }

  it('authenticates before interpreting malformed query or path input', async () => {
    expect((await request(app).get('/api/notifications?limit=-7')).status).toBe(401);
    expect((await request(app).patch('/api/notifications/7junk/read')).status).toBe(401);
    assertNoNotificationAccess();
  });

  it('propagates authentication database failure without touching notifications', async () => {
    mocks.account.mockRejectedValue(Object.assign(new Error('TEST private database details'), { code: 'P1001' }));
    const response = await perform('list').set(headers);
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('DATABASE_UNAVAILABLE');
    expect(JSON.stringify(response.body)).not.toContain('TEST private');
    assertNoNotificationAccess();
  });

  for (const dependency of ['list', 'count', 'one', 'all'] as const) {
    it(`does not acknowledge a failed notification dependency or leak its details: ${dependency}`, async () => {
      const failure = Object.assign(new Error('TEST private database details'), { code: 'P1001' });
      if (dependency === 'list') mocks.list.mockRejectedValue(failure);
      else if (dependency === 'count') mocks.count.mockRejectedValue(failure);
      else mocks.update.mockRejectedValue(failure);
      const response = await perform(dependency === 'list' || dependency === 'count' ? 'list' : dependency).set(headers);
      expect(response.status).toBe(503);
      expect(response.body.code).toBe('DATABASE_UNAVAILABLE');
      expect(JSON.stringify(response.body)).not.toContain('TEST private');
      if (dependency === 'one' || dependency === 'all') expect(mocks.update).toHaveBeenCalledTimes(1);
    });
  }
});
