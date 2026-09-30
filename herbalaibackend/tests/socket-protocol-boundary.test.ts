import { randomBytes } from 'node:crypto';
import { createServer, request as httpRequest } from 'node:http';
import { Server } from 'socket.io';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const server = createServer((_req, res) => res.end('healthy'));
const io = new Server(server);
let baseUrl: string;

const handshake = async () => {
  const response = await request(server).get('/socket.io/?EIO=4&transport=polling');
  expect(response.status).toBe(200);
  expect(response.text.startsWith('0')).toBe(true);
  return JSON.parse(response.text.slice(1)) as { sid: string; upgrades: string[] };
};

const upgradeStatus = (url: URL) => new Promise<number>((resolve, reject) => {
  const upgrade = httpRequest(url, {
    headers: {
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      'Sec-WebSocket-Key': randomBytes(16).toString('base64'),
      'Sec-WebSocket-Version': '13',
    },
  });
  upgrade.once('error', reject);
  upgrade.once('response', response => {
    response.resume();
    resolve(response.statusCode ?? 0);
  });
  upgrade.once('upgrade', (response, socket) => {
    socket.destroy();
    resolve(response.statusCode ?? 0);
  });
  upgrade.setTimeout(5000, () => upgrade.destroy(new Error('Local protocol-boundary test timed out.')));
  upgrade.end();
});

describe('Socket.IO protocol upgrade boundary', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a loopback test server.');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => io.close(() => resolve()));
  });

  it('preserves a normal protocol-4 polling handshake', async () => {
    const session = await handshake();
    expect(session.sid).toEqual(expect.any(String));
    expect(session.upgrades).toContain('websocket');
  });

  it.each(['3', undefined])('rejects a mismatched or missing EIO revision (%s) without taking down HTTP', async revision => {
    const session = await handshake();
    const url = new URL('/socket.io/', baseUrl);
    url.searchParams.set('transport', 'websocket');
    url.searchParams.set('sid', session.sid);
    if (revision) url.searchParams.set('EIO', revision);
    expect(await upgradeStatus(url)).toBe(400);
    expect((await request(server).get('/health')).status).toBe(200);
    expect(await handshake()).toMatchObject({ sid: expect.any(String) });
  });
});
