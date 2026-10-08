import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  findPasswordCredentials: vi.fn(), replacePassword: vi.fn(), invalidateCachedUser: vi.fn(),
  findUserById: vi.fn(), findUserByEmail: vi.fn(), claimPasswordResetRequest: vi.fn(),
  releasePasswordResetRequest: vi.fn(), createToken: vi.fn(), revokeToken: vi.fn(),
  revokeOtherUserTokensByType: vi.fn(), findActiveTokenByValue: vi.fn(), redeemAccountToken: vi.fn(),
  sendMail: vi.fn(), notifySessionInvalidated: vi.fn(), validateAccessSession: vi.fn(),
}));
vi.mock('../src/repositories/user.repository.js', () => ({
  findPasswordCredentials: mocks.findPasswordCredentials, replacePassword: mocks.replacePassword,
  invalidateCachedUser: mocks.invalidateCachedUser, findUserById: mocks.findUserById,
  findUserByEmail: mocks.findUserByEmail, claimPasswordResetRequest: mocks.claimPasswordResetRequest,
  releasePasswordResetRequest: mocks.releasePasswordResetRequest,
}));
vi.mock('../src/repositories/token.repository.js', () => ({
  createToken: mocks.createToken, revokeToken: mocks.revokeToken,
  revokeOtherUserTokensByType: mocks.revokeOtherUserTokensByType,
  findActiveTokenByValue: mocks.findActiveTokenByValue, redeemAccountToken: mocks.redeemAccountToken,
}));
vi.mock('../src/lib/mailer.js', () => ({ sendMail: mocks.sendMail, ensureMailReady: vi.fn() }));
vi.mock('../src/lib/session-invalidation.js', () => ({ notifySessionInvalidated: mocks.notifySessionInvalidated }));
vi.mock('../src/lib/access-session.js', () => ({ validateAccessSession: mocks.validateAccessSession }));

import authRoutes from '../src/routes/auth.routes.js';
import { changePassword, requestPasswordSetup, resetPassword } from '../src/services/auth.service.js';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { changePasswordSchema, resetPasswordSchema } from '../src/schema/auth.schema.js';
import { ENV } from '../src/config/env.js';

const oldPassword = 'TEST-only-original';
const newPassword = 'TEST-only-replacement';
const passwordHash = await hashPassword(oldPassword);
const user = { id: 'password-settings-user', password: passwordHash, sessionVersion: 4, isBanned: false, email: 'settings@example.invalid', name: 'TEST settings' };
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use((error: { status?: number; message?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(error.status ?? 500).json({ message: error.message ?? 'Test failure' });
});
let requestId = 0;
const authenticated = (path: string) => {
  const id = 'test-settings-session-' + ++requestId;
  mocks.validateAccessSession.mockResolvedValue({ status: 'valid', payload: { userId: id, role: 'contributor', sessionVersion: 4 } });
  return request(app).post('/api/auth/' + path).set('Authorization', 'Bearer TEST-only-session');
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findPasswordCredentials.mockResolvedValue(user);
  mocks.replacePassword.mockResolvedValue(true);
  mocks.findUserById.mockResolvedValue(user);
  mocks.findUserByEmail.mockResolvedValue(user);
  mocks.claimPasswordResetRequest.mockResolvedValue(true);
  mocks.createToken.mockResolvedValue({ id: 'test-reset-record' });
  mocks.sendMail.mockResolvedValue({ messageId: 'intercepted' });
  mocks.redeemAccountToken.mockResolvedValue(true);
});

describe('Password settings service with real bcrypt', () => {
  it('verifies the current password, hashes the replacement and invalidates only after commit', async () => {
    await expect(changePassword(user.id, 4, oldPassword, newPassword)).resolves.toHaveProperty('message');
    const write = mocks.replacePassword.mock.calls[0];
    expect(write).toBeDefined();
    const [id, expectedHash, version, replacement] = write!;
    expect([id, expectedHash, version]).toEqual([user.id, passwordHash, 4]);
    expect(replacement).not.toBe(newPassword);
    expect(await comparePassword(newPassword, replacement)).toBe(true);
    expect(await comparePassword(oldPassword, replacement)).toBe(false);
    expect(mocks.invalidateCachedUser).toHaveBeenCalledExactlyOnceWith(user.id);
    expect(mocks.notifySessionInvalidated).toHaveBeenCalledExactlyOnceWith(user.id);
    expect(mocks.notifySessionInvalidated.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.replacePassword.mock.invocationCallOrder[0]!);
  });

  it('rejects an incorrect current password without changing the account', async () => {
    await expect(changePassword(user.id, 4, 'wrong-password', newPassword)).rejects.toMatchObject({ status: 400, message: 'Current password is incorrect.' });
    expect(mocks.replacePassword).not.toHaveBeenCalled();
    expect(mocks.notifySessionInvalidated).not.toHaveBeenCalled();
  });

  it('rejects the same password using the stored hash, not a client assertion', async () => {
    await expect(changePassword(user.id, 4, oldPassword, oldPassword)).rejects.toMatchObject({ status: 400, message: expect.stringContaining('different') });
    expect(mocks.replacePassword).not.toHaveBeenCalled();
  });

  it.each([
    [null, 401],
    [{ ...user, sessionVersion: 5 }, 401],
    [{ ...user, isBanned: true }, 403],
  ])('rejects missing, stale or banned accounts (%s)', async (account, status) => {
    mocks.findPasswordCredentials.mockResolvedValueOnce(account);
    await expect(changePassword(user.id, 4, oldPassword, newPassword)).rejects.toMatchObject({ status });
    expect(mocks.replacePassword).not.toHaveBeenCalled();
  });

  it('does not report success or notify sessions when the conditional write loses a race', async () => {
    mocks.replacePassword.mockResolvedValueOnce(false);
    await expect(changePassword(user.id, 4, oldPassword, newPassword)).rejects.toMatchObject({ status: 409 });
    expect(mocks.invalidateCachedUser).not.toHaveBeenCalled();
    expect(mocks.notifySessionInvalidated).not.toHaveBeenCalled();
  });

  it('propagates database failures without notifying sessions', async () => {
    mocks.replacePassword.mockRejectedValueOnce(new Error('TEST transaction failure'));
    await expect(changePassword(user.id, 4, oldPassword, newPassword)).rejects.toThrow('TEST transaction failure');
    expect(mocks.notifySessionInvalidated).not.toHaveBeenCalled();
  });

  it('uses the authenticated account email and the existing one-hour recovery cooldown', async () => {
    await requestPasswordSetup(user.id);
    expect(mocks.findUserById).toHaveBeenCalledWith(user.id);
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    const claim = mocks.claimPasswordResetRequest.mock.calls[0];
    expect(claim).toBeDefined();
    const [, requestedAt, cooldownStart] = claim!;
    expect(requestedAt.getTime() - cooldownStart.getTime()).toBe(3_600_000);
    mocks.claimPasswordResetRequest.mockResolvedValueOnce(false);
    await expect(requestPasswordSetup(user.id)).rejects.toMatchObject({ status: 429 });
    expect(mocks.sendMail).toHaveBeenCalledOnce();
  });

  it.each([
    new Error('Gmail authorization failed (HTTP 400).'),
    new Error('TEST provider timeout'),
    { suppressed: true },
  ])('does not claim an authenticated password link was sent after delivery failure (%s)', async delivery => {
    if (delivery instanceof Error) mocks.sendMail.mockRejectedValueOnce(delivery);
    else mocks.sendMail.mockResolvedValueOnce(delivery);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(requestPasswordSetup(user.id)).rejects.toMatchObject({
        status: 503,
        message: 'We could not send your password link. Please try again later.',
      });
      expect(mocks.revokeToken).toHaveBeenCalledWith('test-reset-record');
      expect(mocks.releasePasswordResetRequest).toHaveBeenCalledOnce();
      expect(mocks.revokeOtherUserTokensByType).not.toHaveBeenCalled();
      expect(mocks.replacePassword).not.toHaveBeenCalled();
      expect(mocks.notifySessionInvalidated).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it.each([null, { ...user, isBanned: true }])('does not email absent or banned accounts (%s)', async account => {
    mocks.findUserById.mockResolvedValueOnce(account);
    await expect(requestPasswordSetup(user.id)).rejects.toHaveProperty('status');
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('rejects resetting to the current password without consuming the link', async () => {
    mocks.findActiveTokenByValue.mockResolvedValueOnce({ id: 'reset-record', userId: user.id, user });
    await expect(resetPassword('TEST-reset-link', oldPassword)).rejects.toMatchObject({ status: 400, message: expect.stringContaining('different') });
    expect(mocks.redeemAccountToken).not.toHaveBeenCalled();
    expect(mocks.notifySessionInvalidated).not.toHaveBeenCalled();
  });

  it('accepts a distinct replacement through the existing single-use reset transaction', async () => {
    mocks.findActiveTokenByValue.mockResolvedValueOnce({ id: 'reset-record', userId: user.id, user });
    await expect(resetPassword('TEST-reset-link', newPassword)).resolves.toHaveProperty('message');
    expect(mocks.redeemAccountToken).toHaveBeenCalledWith(expect.objectContaining({ id: 'reset-record', userId: user.id, type: 'PASSWORD_RESET' }));
    const redemption = mocks.redeemAccountToken.mock.calls[0];
    expect(redemption).toBeDefined();
    expect(await comparePassword(newPassword, redemption![0].passwordHash)).toBe(true);
  });

  it('rejects missing or concurrently consumed reset links', async () => {
    mocks.findActiveTokenByValue.mockResolvedValueOnce(null);
    await expect(resetPassword('missing', newPassword)).rejects.toMatchObject({ status: 400 });
    mocks.findActiveTokenByValue.mockResolvedValueOnce({ id: 'reset-record', userId: user.id, user });
    mocks.redeemAccountToken.mockResolvedValueOnce(false);
    await expect(resetPassword('used-during-request', newPassword)).rejects.toMatchObject({ status: 400 });
    expect(mocks.notifySessionInvalidated).not.toHaveBeenCalled();
  });
});

describe('Protected HTTP endpoints and request validation', () => {
  it.each(['change-password', 'password-setup'])('rejects a cross-site browser request to %s', async path => {
    const response = await authenticated(path).set('Origin', 'https://untrusted.example.invalid').send({});
    expect(response.status).toBe(403);
    expect(mocks.replacePassword).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('accepts the configured frontend origin', async () => {
    expect((await authenticated('password-setup').set('Origin', new URL(ENV.FRONTEND_URL).origin).send({})).status).toBe(200);
  });

  it.each(['change-password', 'password-setup'])('requires authentication for %s', async path => {
    expect((await request(app).post('/api/auth/' + path).send({})).status).toBe(401);
    expect(mocks.findPasswordCredentials).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('clears both auth cookies only after a successful password change', async () => {
    const response = await authenticated('change-password').send({ currentPassword: oldPassword, newPassword });
    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('accessToken=;'), expect.stringContaining('refreshToken=;'),
    ]));
  });

  it('keeps cookies and sessions intact on an incorrect current password', async () => {
    const response = await authenticated('change-password').send({ currentPassword: 'wrong', newPassword });
    expect(response.status).toBe(400);
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it.each([
    {},
    { currentPassword: oldPassword, newPassword: 'short' },
    { currentPassword: oldPassword, newPassword, userId: 'someone-else' },
    { currentPassword: oldPassword, newPassword, email: 'someone@example.invalid' },
    { currentPassword: oldPassword, newPassword, role: 'admin' },
    { currentPassword: oldPassword, newPassword: '🙂'.repeat(19) },
  ])('rejects invalid or forged password bodies (%s)', async body => {
    expect((await authenticated('change-password').send(body)).status).toBe(400);
    expect(mocks.replacePassword).not.toHaveBeenCalled();
  });

  it('rejects a client-selected target email for password setup', async () => {
    expect((await authenticated('password-setup').send({ email: 'someone@example.invalid' })).status).toBe(400);
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('accepts the empty password setup request', async () => {
    const response = await authenticated('password-setup').send({});
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('Spam');
    expect(response.body.message).not.toContain('If an account');
  });

  it('returns HTTP 503 for failed authenticated delivery without provider details or cookie changes', async () => {
    mocks.sendMail.mockRejectedValueOnce(new Error('Gmail authorization failed (HTTP 400).'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await authenticated('password-setup').send({});
      expect(response.status).toBe(503);
      expect(response.body.message).toBe('We could not send your password link. Please try again later.');
      expect(response.headers['set-cookie']).toBeUndefined();
      expect(mocks.replacePassword).not.toHaveBeenCalled();
      expect(mocks.notifySessionInvalidated).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it('returns HTTP 429 for an authenticated cooldown without sending a replacement link', async () => {
    mocks.claimPasswordResetRequest.mockResolvedValueOnce(false);
    const response = await authenticated('password-setup').send({});
    expect(response.status).toBe(429);
    expect(response.body.message).toContain('one password link per hour');
    expect(mocks.createToken).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.revokeToken).not.toHaveBeenCalled();
  });

  it('limits the combined settings endpoints per authenticated account, not shared IP', async () => {
    mocks.validateAccessSession.mockResolvedValue({ status: 'valid', payload: { userId: 'rate-limit-test', role: 'contributor', sessionVersion: 4 } });
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await request(app).post('/api/auth/change-password').set('Authorization', 'Bearer TEST-session').send({})).status).toBe(400);
    }
    const blocked = await request(app).post('/api/auth/password-setup').set('Authorization', 'Bearer TEST-session').send({});
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect((await authenticated('password-setup').send({})).status).toBe(200);
  });

  it('enforces the bcrypt UTF-8 byte limit at the boundary for changes and resets', () => {
    for (const password of ['a'.repeat(72), '🙂'.repeat(18)]) {
      expect(changePasswordSchema.safeParse({ body: { currentPassword: oldPassword, newPassword: password } }).success).toBe(true);
      expect(resetPasswordSchema.safeParse({ body: { token: 'test', password } }).success).toBe(true);
    }
    for (const password of ['a'.repeat(73), '🙂'.repeat(19)]) {
      expect(changePasswordSchema.safeParse({ body: { currentPassword: oldPassword, newPassword: password } }).success).toBe(false);
      expect(resetPasswordSchema.safeParse({ body: { token: 'test', password } }).success).toBe(false);
    }
  });
});
