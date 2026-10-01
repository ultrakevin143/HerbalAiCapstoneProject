import { afterAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  sendMail: vi.fn().mockResolvedValue({ messageId: 'TEST intercepted mail' }),
  googlePayload: { email: '', email_verified: true, name: 'TEST Google settings', picture: undefined },
}));
vi.mock('express-rate-limit', () => ({ default: () => (_req: unknown, _res: unknown, next: () => void) => next() }));
vi.mock('../src/lib/mailer.js', () => ({ sendMail: mocks.sendMail, ensureMailReady: vi.fn() }));
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    async getToken() { return { tokens: { id_token: 'TEST verified by fixture' } }; }
    async verifyIdToken() { return { getPayload: () => mocks.googlePayload }; }
  },
}));

import app from '../src/app.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { googleLogin } from '../src/services/auth.service.js';
import * as userRepo from '../src/repositories/user.repository.js';
import { onSessionInvalidated } from '../src/lib/session-invalidation.js';
import { ENV } from '../src/config/env.js';

const database = new URL(ENV.DATABASE_URL ?? 'postgresql://localhost/invalid');
if (process.env.NODE_ENV !== 'test' || !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) || database.pathname !== '/herbalai_test') {
  throw new Error('Password settings integration tests require the isolated loopback herbalai_test database.');
}

const ids: string[] = [];
const password = 'TEST-settings-' + randomUUID();
const createAccount = async () => {
  const user = await prisma.user.create({
    data: {
      username: 'settings_' + randomUUID().replaceAll('-', '').slice(0, 16),
      email: randomUUID() + '@loadtest.invalid', name: 'TEST password settings',
      password: await hashPassword(password), emailVerified: new Date(),
    },
  });
  ids.push(user.id);
  return user;
};
const login = (email: string, candidate: string) => request(app).post('/api/auth/login').send({ email, password: candidate });
const protectedPost = (path: string, access: string, body: object) =>
  request(app).post('/api/auth/' + path).set('Authorization', 'Bearer ' + access).send(body);

afterAll(async () => {
  try {
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    expect(await prisma.user.count({ where: { id: { in: ids } } })).toBe(0);
  } finally { await closeDatabasePool(); }
});

describe('Password settings with isolated PostgreSQL and intercepted Google/mail providers', () => {
  it('changes the hash, rejects old credentials, invalidates access/refresh/socket sessions and stale reset links', async () => {
    const user = await createAccount();
    const session = await login(user.email, password);
    expect(session.status).toBe(200);
    const { accessToken, refreshToken } = session.body.data;
    const reset = await prisma.token.create({
      data: { userId: user.id, type: 'PASSWORD_RESET', token: randomUUID(), expiresAt: new Date(Date.now() + 3_600_000) },
    });
    const disconnect = vi.fn();
    const unsubscribe = onSessionInvalidated(disconnect);
    try {
      const changed = await protectedPost('change-password', accessToken, { currentPassword: password, newPassword: password + '-new' });
      expect(changed.status).toBe(200);
      expect(changed.headers['set-cookie']).toHaveLength(2);
      expect(disconnect).toHaveBeenCalledExactlyOnceWith(user.id);
    } finally { unsubscribe(); }
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(saved.sessionVersion).toBe(user.sessionVersion + 1);
    expect(await comparePassword(password + '-new', saved.password)).toBe(true);
    expect((await login(user.email, password)).status).toBe(401);
    expect((await login(user.email.toUpperCase(), password + '-new')).status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + accessToken)).status).toBe(401);
    expect((await request(app).post('/api/auth/refresh-token').send({ refreshToken })).status).toBe(401);
    expect((await request(app).post('/api/auth/reset-password').send({ token: reset.token, password: password + '-stale' })).status).toBe(400);
  }, 40_000);

  it('preserves the session and hash on wrong-current and same-password requests', async () => {
    const user = await createAccount();
    const session = await login(user.email, password);
    for (const body of [
      { currentPassword: 'TEST-wrong-current', newPassword: password + '-new' },
      { currentPassword: password, newPassword: password },
    ]) {
      expect((await protectedPost('change-password', session.body.data.accessToken, body)).status).toBe(400);
    }
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(saved.password).toBe(user.password);
    expect(saved.sessionVersion).toBe(user.sessionVersion);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + session.body.data.accessToken)).status).toBe(200);
  });

  it('lets a newly Google-created user prove email ownership, create a password and use both login methods on the same account', async () => {
    const email = randomUUID() + '@loadtest.invalid';
    mocks.googlePayload.email = email;
    const googleSession = await googleLogin('TEST-only-oauth-code');
    ids.push(googleSession.user.id);
    const original = await prisma.user.findUniqueOrThrow({ where: { id: googleSession.user.id } });
    expect(original.emailVerified).not.toBeNull();
    const before = mocks.sendMail.mock.calls.length;
    expect((await protectedPost('password-setup', googleSession.accessToken, {})).status).toBe(200);
    expect(mocks.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({ to: email }));
    const reset = await prisma.token.findFirstOrThrow({ where: { userId: original.id, type: 'PASSWORD_RESET', revokedAt: null } });
    expect(mocks.sendMail.mock.calls.at(-1)?.[0].html).toContain('/reset-password?token=' + reset.token);
    expect((await protectedPost('password-setup', googleSession.accessToken, {})).status).toBe(200);
    expect((await request(app).post('/api/auth/forgot-password').send({ email })).status).toBe(200);
    expect(mocks.sendMail.mock.calls.length).toBe(before + 1);
    const chosen = password + '-google';
    expect((await request(app).post('/api/auth/reset-password').send({ token: reset.token, password: chosen })).status).toBe(200);
    expect((await request(app).post('/api/auth/reset-password').send({ token: reset.token, password: chosen + '-again' })).status).toBe(400);
    const emailSession = await login(email, chosen);
    expect(emailSession.status).toBe(200);
    expect(emailSession.body.data.user.id).toBe(original.id);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + googleSession.accessToken)).status).toBe(401);
    const stillGoogle = await googleLogin('TEST-second-oauth-code');
    expect(stillGoogle.user.id).toBe(original.id);
    expect(await prisma.user.count({ where: { email } })).toBe(1);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + stillGoogle.accessToken)).status).toBe(200);
    expect((await protectedPost('change-password', emailSession.body.data.accessToken, { currentPassword: chosen, newPassword: chosen + '-changed' })).status).toBe(200);
    expect((await login(email, chosen)).status).toBe(401);
    expect((await login(email, chosen + '-changed')).status).toBe(200);
  }, 40_000);

  it('does not consume a reset link when the replacement is the current password', async () => {
    const user = await createAccount();
    const reset = await prisma.token.create({
      data: { userId: user.id, type: 'PASSWORD_RESET', token: randomUUID(), expiresAt: new Date(Date.now() + 3_600_000) },
    });
    const unchanged = await request(app).post('/api/auth/reset-password').send({ token: reset.token, password });
    expect(unchanged.status).toBe(400);
    expect(unchanged.body.message).toContain('different');
    expect((await prisma.token.findUniqueOrThrow({ where: { id: reset.id } })).revokedAt).toBeNull();
    expect((await request(app).post('/api/auth/reset-password').send({ token: reset.token, password: password + '-new' })).status).toBe(200);
  });

  it('allows only one winner when two password changes read the same credentials', async () => {
    const user = await createAccount();
    const session = await login(user.email, password);
    const lookup = userRepo.findPasswordCredentials;
    let arrivals = 0;
    let release!: () => void;
    const barrier = new Promise<void>(resolve => { release = resolve; });
    const spy = vi.spyOn(userRepo, 'findPasswordCredentials').mockImplementation(async id => {
      const result = await lookup(id);
      if (++arrivals === 2) release();
      await barrier;
      return result;
    });
    try {
      const results = await Promise.all([
        protectedPost('change-password', session.body.data.accessToken, { currentPassword: password, newPassword: password + '-first' }),
        protectedPost('change-password', session.body.data.accessToken, { currentPassword: password, newPassword: password + '-second' }),
      ]);
      expect(results.map(result => result.status).sort()).toEqual([200, 409]);
      const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(saved.sessionVersion).toBe(user.sessionVersion + 1);
      const accepted = await Promise.all([comparePassword(password + '-first', saved.password), comparePassword(password + '-second', saved.password)]);
      expect(accepted.filter(Boolean)).toHaveLength(1);
    } finally { spy.mockRestore(); }
  });

  it('rejects a banned account and cannot be tricked into mailing another user', async () => {
    const user = await createAccount();
    const session = await login(user.email, password);
    expect((await protectedPost('password-setup', session.body.data.accessToken, { email: 'someone-else@loadtest.invalid' })).status).toBe(400);
    await prisma.user.update({ where: { id: user.id }, data: { isBanned: true } });
    expect((await protectedPost('password-setup', session.body.data.accessToken, {})).status).toBe(403);
    expect((await protectedPost('change-password', session.body.data.accessToken, { currentPassword: password, newPassword: password + '-new' })).status).toBe(403);
  });
});
