import express from 'express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ account: vi.fn(), list: vi.fn(), count: vi.fn(), create: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  user: { findUnique: mocks.account },
  auditLog: { findMany: mocks.list, count: mocks.count, create: mocks.create },
} }));

import auditRoutes from '../src/routes/audit.routes.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { errorResponse } from '../src/utils/error-response.js';

const createApp = (extended = false) => {
  const app = express();
  if (extended) app.set('query parser', 'extended');
  app.use(cookieParser());
  app.use('/api/admin/audit-logs', auditRoutes);
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const response = errorResponse(error, true);
    res.status(response.status).json(response.body);
  });
  return app;
};
const app = createApp();
const token = generateAccessToken({ userId: 'qa-audit-reader', role: 'admin' });
const headers = { Authorization: `Bearer ${token}` };
const account = { role: 'admin', sessionVersion: 0, isBanned: false };
const log = { id: 9, adminId: 'qa-audit-actor', action: 'TEST ONLY', targetType: 'User', targetId: 'qa-only',
  details: { test: true }, createdAt: '2026-10-03T00:00:00.000Z', admin: { id: 'qa-audit-actor', name: 'QA Only',
    email: 'audit@example.invalid', username: 'qa_only', avatar: null } };
const read = (query: Record<string, string> = {}) => request(app).get('/api/admin/audit-logs').query(query).set(headers);
const assertNoAuditAccess = () => {
  for (const dependency of [mocks.list, mocks.count, mocks.create]) expect(dependency).not.toHaveBeenCalled();
};

describe('Administrator audit pagination and access', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.account.mockResolvedValue(account);
    mocks.list.mockResolvedValue([log]);
    mocks.count.mockResolvedValue(500);
  });

  it.each(['', '0', '-1', '1.5', '7junk', '1e2', '0x10', '+7', ' 7 ', '007', '101', '2147483647',
    '2147483648', '9007199254740992', 'Infinity', 'NaN', '\n7', '7\n', '7\r', '7\r\n', '7\u2028', '7\u2029'])
    ('rejects malformed/out-of-range limit %s before audit queries', async (limit) => {
      const response = await read({ limit });
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ status: 'error', code: 400 });
      expect(response.body.message).toContain('limit');
      assertNoAuditAccess();
    });

  it.each(['', '-1', '1.5', '7junk', '1e2', '0x10', '+7', ' 7 ', '007', '00', '-0', '10001', '2147483647',
    '2147483648', '9007199254740992', 'Infinity', 'NaN', '\n7', '7\n', '7\r', '7\r\n', '7\u2028', '7\u2029'])
    ('rejects malformed/out-of-range offset %s before audit queries', async (offset) => {
      const response = await read({ offset });
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ status: 'error', code: 400 });
      expect(response.body.message).toContain('offset');
      assertNoAuditAccess();
    });

  it.each(['limit', 'offset'])('rejects repeated %s parameters instead of coercing an array', async (field) => {
    expect((await request(app).get(`/api/admin/audit-logs?${field}=7&${field}=8`).set(headers)).status).toBe(400);
    assertNoAuditAccess();
  });

  it.each(['limit[]=7', 'limit[value]=7', 'offset[]=7', 'offset[value]=7'])
    ('rejects structured query %s with an extended parser', async (query) => {
      expect((await request(createApp(true)).get(`/api/admin/audit-logs?${query}`).set(headers)).status).toBe(400);
      assertNoAuditAccess();
    });

  it.each([
    { query: {}, limit: 50, offset: 0 },
    { query: { limit: '1' }, limit: 1, offset: 0 },
    { query: { limit: '100' }, limit: 100, offset: 0 },
    { query: { offset: '0' }, limit: 50, offset: 0 },
    { query: { offset: '1' }, limit: 50, offset: 1 },
    { query: { offset: '10000' }, limit: 50, offset: 10000 },
    { query: { limit: '30', offset: '50' }, limit: 30, offset: 50 },
  ])('retains canonical pagination and the platform total: %j', async ({ query, limit, offset }) => {
    const response = await read(query);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ logs: [log], total: 500, limit, offset });
    expect(mocks.list).toHaveBeenCalledExactlyOnceWith({
      include: { admin: { select: { id: true, name: true, email: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }, take: limit, skip: offset,
    });
    expect(mocks.count).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('returns an empty page with its actual total rather than manufacturing records', async () => {
    mocks.list.mockResolvedValue([]);
    const response = await read({ offset: '500' });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ logs: [], total: 500, limit: 50, offset: 500 });
  });

  it('ignores unrelated query fields without adding filters or selecting secrets', async () => {
    expect((await read({ adminId: 'foreign-owner', select: 'password', where: 'all' })).status).toBe(200);
    expect(mocks.list.mock.calls[0]?.[0].where).toBeUndefined();
    expect(mocks.list.mock.calls[0]?.[0].include.admin.select).toEqual({
      id: true, name: true, email: true, username: true, avatar: true,
    });
  });

  it('supports the existing browser access-token cookie', async () => {
    expect((await request(app).get('/api/admin/audit-logs').set('Cookie', `accessToken=${token}`)).status).toBe(200);
    expect(mocks.account).toHaveBeenCalledTimes(2);
  });

  it.each(['', '?limit=-7&offset=7junk'])('requires authentication before interpreting pagination %s', async (query) => {
    expect((await request(app).get(`/api/admin/audit-logs${query}`)).status).toBe(401);
    assertNoAuditAccess();
  });

  it('rejects an invalid bearer token', async () => {
    expect((await request(app).get('/api/admin/audit-logs').set('Authorization', 'Bearer TEST-not-a-jwt')).status).toBe(401);
    assertNoAuditAccess();
  });

  it.each(['contributor', 'guest'])('denies the current nonadministrator role %s before pagination', async (role) => {
    mocks.account.mockResolvedValue({ ...account, role });
    expect((await read({ limit: '-7' })).status).toBe(403);
    assertNoAuditAccess();
  });

  it('does not trust a stale administrator role in the signed token', async () => {
    mocks.account.mockResolvedValue({ ...account, role: 'contributor' });
    expect((await read()).status).toBe(403);
    assertNoAuditAccess();
  });

  it('accepts a promoted account based on its current role, not its older contributor token', async () => {
    const contributorToken = generateAccessToken({ userId: 'qa-audit-reader', role: 'contributor' });
    expect((await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${contributorToken}`)).status).toBe(200);
    expect(mocks.account).toHaveBeenCalledTimes(2);
    expect(mocks.list).toHaveBeenCalledTimes(1);
  });

  it.each([
    { name: 'demotion', result: { ...account, role: 'contributor' }, status: 403 },
    { name: 'ban', result: { ...account, isBanned: true }, status: 403 },
    { name: 'deletion', result: null, status: 401 },
  ])('rechecks an account changed between session and permission validation: $name', async ({ result, status }) => {
    mocks.account.mockResolvedValueOnce(account).mockResolvedValueOnce(result);
    expect((await read()).status).toBe(status);
    assertNoAuditAccess();
  });

  it('rejects a revoked access session', async () => {
    mocks.account.mockResolvedValue({ ...account, sessionVersion: 1 });
    expect((await read()).status).toBe(401);
    assertNoAuditAccess();
  });

  it('rejects a banned account during session validation', async () => {
    mocks.account.mockResolvedValue({ ...account, isBanned: true });
    expect((await read()).status).toBe(403);
    assertNoAuditAccess();
  });

  it('rejects a missing account during session validation', async () => {
    mocks.account.mockResolvedValue(null);
    expect((await read()).status).toBe(401);
    assertNoAuditAccess();
  });

  for (const stage of ['session', 'permission'] as const) {
    it(`does not expose audit data after ${stage} database failure`, async () => {
      const failure = Object.assign(new Error('TEST private database details'), { code: 'P1001' });
      if (stage === 'session') mocks.account.mockRejectedValue(failure);
      else mocks.account.mockResolvedValueOnce(account).mockRejectedValueOnce(failure);
      const response = await read();
      expect(response.status).toBe(503);
      expect(response.body.code).toBe('DATABASE_UNAVAILABLE');
      expect(JSON.stringify(response.body)).not.toContain('TEST private');
      assertNoAuditAccess();
    });
  }

  for (const stage of ['list', 'count'] as const) {
    it(`propagates ${stage} failure without leaking private details or claiming a partial success`, async () => {
      mocks[stage].mockRejectedValue(Object.assign(new Error('TEST private database details'), { code: 'P1001' }));
      const response = await read();
      expect(response.status).toBe(503);
      expect(response.body.code).toBe('DATABASE_UNAVAILABLE');
      expect(response.body.data).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('TEST private');
      expect(mocks.create).not.toHaveBeenCalled();
    });
  }
});
