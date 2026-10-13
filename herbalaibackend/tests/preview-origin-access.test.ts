import { randomBytes } from 'node:crypto';
import { createServer, request as httpRequest } from 'node:http';
import { Server } from 'socket.io';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: vi.fn(), account: vi.fn(), markAll: vi.fn(), user: vi.fn(),
  preview: 'https://approved-preview.example.test',
}));
vi.mock('../src/config/env.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/config/env.js')>();
  return { ENV: { ...actual.ENV, FRONTEND_URL: 'https://www.herbalai.site', FRONTEND_ADDITIONAL_ORIGINS: [mocks.preview] } };
});
vi.mock('../src/lib/prisma.js', () => ({ prisma: { user: { findUnique: mocks.account } }, getDatabasePoolMetrics: () => ({}) }));
vi.mock('../src/lib/access-session.js', () => ({ validateAccessSession: mocks.session }));
vi.mock('../src/repositories/notification.repository.js', () => ({ markAllAsRead: mocks.markAll }));
vi.mock('../src/repositories/user.repository.js', () => ({ findUserById: mocks.user }));

import app from '../src/app.js';
import { socketServerOptions } from '../src/lib/socket-boundary.js';

const server = createServer((_req, res) => res.end('LOCAL TEST ONLY'));
const sockets = new Server(server, socketServerOptions);
let baseUrl: string;
const upgradeStatus = (origin: string) => new Promise<number>((resolve, reject) => {
  const upgrade = httpRequest(new URL('/socket.io/?EIO=4&transport=websocket', baseUrl), {
    headers: {
      Connection: 'Upgrade', Upgrade: 'websocket',
      'Sec-WebSocket-Key': randomBytes(16).toString('base64'), 'Sec-WebSocket-Version': '13', Origin: origin,
    },
  });
  upgrade.once('error', reject);
  upgrade.once('response', response => { response.resume(); resolve(response.statusCode ?? 0); });
  upgrade.once('upgrade', (response, socket) => { socket.destroy(); resolve(response.statusCode ?? 0); });
  upgrade.setTimeout(5000, () => upgrade.destroy(new Error('Local preview socket boundary timed out.')));
  upgrade.end();
});

describe('configured preview API and socket boundaries with mocked persistence', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a loopback server.');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => { await new Promise<void>(resolve => sockets.close(() => resolve())); });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({ status: 'valid', payload: { userId: 'LOCAL-owner', role: 'contributor', sessionVersion: 0 } });
    mocks.account.mockResolvedValue({ role: 'contributor', isBanned: false, sessionVersion: 0 });
    mocks.markAll.mockResolvedValue({ count: 1 });
    mocks.user.mockResolvedValue({ id: 'LOCAL-owner', role: 'contributor', isBanned: false });
  });

  it.each(['https://www.herbalai.site', mocks.preview])('permits trusted cookie mutations and exact credentialed CORS (%s)', async origin => {
    const response = await request(app).patch('/api/notifications/read-all').set('Origin', origin).set('Cookie', 'accessToken=LOCAL-only-cookie');
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(mocks.markAll).toHaveBeenCalledWith('LOCAL-owner');
  });

  it.each([mocks.preview + '.evil.test', 'https://other.vercel.app', 'null'])('rejects nonconfigured mutation origins before authenticated work (%s)', async origin => {
    const response = await request(app).patch('/api/notifications/read-all').set('Origin', origin).set('Cookie', 'accessToken=LOCAL-only-cookie');
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('UNTRUSTED_REQUEST_ORIGIN');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.markAll).not.toHaveBeenCalled();
  });

  it('does not grant anonymous or contributor administrator permissions by trusting an origin', async () => {
    expect((await request(app).patch('/api/notifications/read-all').set('Origin', mocks.preview)).status).toBe(401);
    const response = await request(app).get('/api/auth/users').set('Origin', mocks.preview).set('Cookie', 'accessToken=LOCAL-only-cookie');
    expect(response.status).toBe(403);
    expect(mocks.markAll).not.toHaveBeenCalled();
  });

  it('retains cross-site missing-origin rejection', async () => {
    const response = await request(app).patch('/api/notifications/read-all').set('Sec-Fetch-Site', 'cross-site');
    expect(response.status).toBe(403);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('answers approved preview preflight with only the exact origin', async () => {
    const response = await request(app).options('/api/auth/login').set('Origin', mocks.preview).set('Access-Control-Request-Method', 'POST');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(mocks.preview);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('accepts approved preview polling and websocket handshakes', async () => {
    const response = await request(server).get('/socket.io/?EIO=4&transport=polling').set('Origin', mocks.preview);
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(mocks.preview);
    expect(await upgradeStatus(mocks.preview)).toBe(101);
  });

  it('continues rejecting nonconfigured polling and direct upgrades', async () => {
    expect((await request(server).get('/socket.io/?EIO=4&transport=polling').set('Origin', 'https://other.vercel.app')).status).toBe(403);
    expect(await upgradeStatus('https://other.vercel.app')).toBe(400);
  });
});
