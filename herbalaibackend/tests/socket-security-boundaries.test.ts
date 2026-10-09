import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createServer, request as httpRequest } from 'node:http';
import { Server } from 'socket.io';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ENV } from '../src/config/env.js';
import { parseSocketCookies, socketServerOptions } from '../src/lib/socket-boundary.js';

const server = createServer((_req, res) => res.end('TEST ONLY'));
const io = new Server(server, socketServerOptions);
let baseUrl: string;
const upgradeStatus = (origin?: string) => new Promise<number>((resolve, reject) => {
  const upgrade = httpRequest(new URL('/socket.io/?EIO=4&transport=websocket', baseUrl), {
    headers: {
      Connection: 'Upgrade', Upgrade: 'websocket',
      'Sec-WebSocket-Key': randomBytes(16).toString('base64'), 'Sec-WebSocket-Version': '13',
      ...(origin === undefined ? {} : { Origin: origin }),
    },
  });
  upgrade.once('error', reject);
  upgrade.once('response', response => { response.resume(); resolve(response.statusCode ?? 0); });
  upgrade.once('upgrade', (response, socket) => { socket.destroy(); resolve(response.statusCode ?? 0); });
  upgrade.setTimeout(5000, () => upgrade.destroy(new Error('Local socket boundary timed out.')));
  upgrade.end();
});

describe('production socket security boundaries on loopback', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a loopback server.');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => { await new Promise<void>(resolve => io.close(() => resolve())); });

  it('rejects foreign-origin direct WebSocket upgrades, not just HTTP polling', async () => {
    expect(await upgradeStatus('https://untrusted.example')).toBe(400);
  });
  it('rejects foreign-origin polling', async () => {
    expect((await request(server).get('/socket.io/?EIO=4&transport=polling').set('Origin', 'https://untrusted.example')).status).toBe(403);
  });
  it('rejects a cross-site browser handshake with no Origin', async () => {
    expect((await request(server).get('/socket.io/?EIO=4&transport=polling').set('Sec-Fetch-Site', 'cross-site')).status).toBe(403);
  });
  it.each([new URL(ENV.FRONTEND_URL).origin, undefined])('preserves legitimate WebSocket handshakes (%s)', async origin => {
    expect(await upgradeStatus(origin)).toBe(101);
  });
  it('preserves trusted polling', async () => {
    expect((await request(server).get('/socket.io/?EIO=4&transport=polling').set('Origin', new URL(ENV.FRONTEND_URL).origin)).status).toBe(200);
  });
  it.each(['%ZZ', '%E0%A4%A'])('ignores malformed encoded cookies (%s) without throwing', encoded => {
    expect(parseSocketCookies(`accessToken=${encoded}; other=valid`)).toEqual({ other: 'valid' });
  });
  it('preserves valid encoded cookies and equals signs', () => {
    expect(parseSocketCookies('accessToken=valid%20token; other=a=b')).toEqual({ accessToken: 'valid token', other: 'a=b' });
  });
  it('accepts absent or empty cookie headers', () => {
    expect(parseSocketCookies()).toEqual({});
    expect(parseSocketCookies('')).toEqual({});
  });
  it('uses these tested boundaries in the production socket server', () => {
    const source = readFileSync(new URL('../src/server.ts', import.meta.url), 'utf8');
    expect(source).toContain('new Server(httpServer, socketServerOptions)');
    expect(source).toContain('parseSocketCookies(socket.handshake.headers.cookie)');
  });
});
