import { afterAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

// Exercise real API/database flows without delivering mail outside the test process.
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn().mockResolvedValue({ suppressed: true }) }));
vi.mock('../src/lib/mailer.js', () => ({ sendMail }));
import app from '../src/app.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import * as tokenRepo from '../src/repositories/token.repository.js';
import { comparePassword } from '../src/utils/password.js';

const emails: string[] = [];
const password = 'TEST-only-' + randomUUID();
async function signup() {
  const email = `${randomUUID()}@loadtest.invalid`;
  emails.push(email);
  const response = await request(app).post('/api/auth/signup').send({
    username: `recovery_${randomUUID().replaceAll('-', '').slice(0, 18)}`,
    email, password, name: 'TEST account recovery',
  });
  expect(response.status).toBe(201);
  return prisma.user.findUniqueOrThrow({ where: { email } });
}
const login = (email: string, value = password) => request(app).post('/api/auth/login').send({ email, password: value });
async function token(userId: string, type: string) {
  return prisma.token.findFirstOrThrow({ where: { userId, type, revokedAt: null }, orderBy: { createdAt: 'desc' } });
}
async function overlappingRedemptions(run: () => Promise<number[]>) {
  // Make both requests finish their initial lookup before either can write.
  // This deterministically exercises the race rather than relying on DB latency.
  const lookup = tokenRepo.findActiveTokenByValue;
  let arrivals = 0;
  let release!: () => void;
  const bothReady = new Promise<void>(resolve => { release = resolve; });
  const spy = vi.spyOn(tokenRepo, 'findActiveTokenByValue').mockImplementation(async (...args) => {
    const result = await lookup(...args);
    if (++arrivals === 2) release();
    await bothReady;
    return result;
  });
  try { return await run(); } finally { spy.mockRestore(); }
}
afterAll(async () => {
  try {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    expect(await prisma.user.count({ where: { email: { in: emails } } })).toBe(0);
  } finally { await closeDatabasePool(); }
});

describe('Registration and account recovery (mail intercepted)', () => {
  it('requires verification, replaces a resent link and accepts it only once', async () => {
    const user = await signup();
    expect(user.emailVerified).toBeNull();
    expect((await login(user.email)).status).toBe(403);
    const original = await token(user.id, 'EMAIL_VERIFY');
    const email = sendMail.mock.calls.find(([mail]) => mail.to === user.email)?.[0];
    expect(email.html).toContain(`/verify-email?token=${original.token}`);
    const known = await request(app).post('/api/auth/resend-email-verification').send({ email: user.email });
    const unknown = await request(app).post('/api/auth/resend-email-verification').send({ email: `${randomUUID()}@loadtest.invalid` });
    expect(known.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
    expect((await request(app).get('/api/auth/verify-email').query({ token: original.token })).status).toBe(400);
    const replacement = await token(user.id, 'EMAIL_VERIFY');
    expect((await request(app).get('/api/auth/verify-email').query({ token: replacement.token })).status).toBe(200);
    expect((await request(app).get('/api/auth/verify-email').query({ token: replacement.token })).status).toBe(400);
    expect((await login(user.email)).status).toBe(200);
  }, 40000);

  it('rejects an expired verification link without activating the account', async () => {
    const user = await signup();
    const verification = await token(user.id, 'EMAIL_VERIFY');
    await prisma.token.update({ where: { id: verification.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await request(app).get('/api/auth/verify-email').query({ token: verification.token })).status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerified).toBeNull();
  });

  it('resets the password once, rejects the old password and revokes refresh sessions', async () => {
    const user = await signup();
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    const session = await login(user.email);
    expect(session.status).toBe(200);
    const known = await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: `${randomUUID()}@loadtest.invalid` });
    expect(known.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
    const reset = await token(user.id, 'PASSWORD_RESET');
    const mail = sendMail.mock.calls.find(([message]) => message.to === user.email && message.html.includes('/reset-password?'))?.[0];
    expect(mail.html).toContain(`/reset-password?token=${reset.token}`);
    expect((await request(app).post('/api/auth/reset-password').send({ token: reset.token, password: 'short' })).status).toBe(400);
    const newPassword = password + '-new';
    expect((await request(app).post('/api/auth/reset-password').send({ token: reset.token, password: newPassword })).status).toBe(200);
    expect((await request(app).post('/api/auth/reset-password').send({ token: reset.token, password })).status).toBe(400);
    expect((await login(user.email)).status).toBe(401);
    expect((await login(user.email, newPassword)).status).toBe(200);
    expect((await request(app).post('/api/auth/refresh-token').send({ refreshToken: session.body.data.refreshToken })).status).toBe(401);
  }, 40000);

  it('rejects replaced, expired and wrong-purpose reset tokens without changing the password', async () => {
    const user = await signup();
    const verification = await token(user.id, 'EMAIL_VERIFY');
    await request(app).post('/api/auth/forgot-password').send({ email: user.email }).expect(200);
    const first = await token(user.id, 'PASSWORD_RESET');
    await request(app).post('/api/auth/forgot-password').send({ email: user.email }).expect(200);
    const replacement = await token(user.id, 'PASSWORD_RESET');
    await prisma.token.update({ where: { id: replacement.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    for (const value of [first.token, replacement.token, verification.token, 'invalid-token']) {
      expect((await request(app).post('/api/auth/reset-password').send({ token: value, password: password + '-changed' })).status).toBe(400);
    }
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).password).toBe(user.password);
  }, 40000);

  it('allows only one concurrent redemption of a password reset link', async () => {
    const user = await signup();
    await request(app).post('/api/auth/forgot-password').send({ email: user.email }).expect(200);
    const reset = await token(user.id, 'PASSWORD_RESET');
    const statuses = await overlappingRedemptions(async () => {
      const responses = await Promise.all(['-one', '-two'].map(suffix => request(app).post('/api/auth/reset-password').send({ token: reset.token, password: password + suffix })));
      return responses.map(response => response.status);
    });
    expect([...statuses].sort()).toEqual([200, 400]);
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const winner = statuses.indexOf(200);
    expect(await comparePassword(password + ['-one', '-two'][winner], saved.password)).toBe(true);
    expect(await comparePassword(password + ['-one', '-two'][1 - winner], saved.password)).toBe(false);
  }, 40000);

  it('allows only one concurrent redemption of an email verification link', async () => {
    const user = await signup();
    const verification = await token(user.id, 'EMAIL_VERIFY');
    const statuses = await overlappingRedemptions(async () => {
      const responses = await Promise.all([1, 2].map(() => request(app).get('/api/auth/verify-email').query({ token: verification.token })));
      return responses.map(response => response.status);
    });
    expect(statuses.sort()).toEqual([200, 400]);
  }, 40000);
});
