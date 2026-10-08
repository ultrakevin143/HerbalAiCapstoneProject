import { describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  account: null as null | { id: string; email: string; username: string; name: string; password: string; role: 'contributor'; sessionVersion: number; emailVerified: Date; isBanned: boolean },
  tokens: [] as { id: string; userId: string; type: string; token: string; expiresAt: Date; revokedAt: Date | null }[],
  sendMail: vi.fn().mockResolvedValue({ messageId: 'TEST intercepted' }),
  claimed: false,
}));
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    async getToken() { return { tokens: { id_token: 'TEST signed-provider fixture' } }; }
    async verifyIdToken() {
      return { getPayload: () => ({ email: 'oauth-password@example.invalid', email_verified: true, name: 'TEST OAuth password' }) };
    }
  },
}));
vi.mock('../src/lib/mailer.js', () => ({ sendMail: fixture.sendMail, ensureMailReady: vi.fn() }));
vi.mock('../src/repositories/user.repository.js', () => ({
  findUserByEmail: vi.fn(async email => fixture.account?.email === email ? fixture.account : null),
  findUserByLoginIdentifier: vi.fn(async identifier => fixture.account?.email === identifier || fixture.account?.username === identifier ? fixture.account : null),
  createUser: vi.fn(async data => {
    fixture.account = { ...data, id: 'TEST-oauth-user', role: 'contributor', sessionVersion: 0, isBanned: false };
    return fixture.account;
  }),
  findUserById: vi.fn(async () => fixture.account),
  findPasswordCredentials: vi.fn(async () => fixture.account),
  replacePassword: vi.fn(async (_id, hash, version, replacement) => {
    if (!fixture.account || fixture.account.password !== hash || fixture.account.sessionVersion !== version) return false;
    fixture.account.password = replacement;
    fixture.account.sessionVersion++;
    for (const record of fixture.tokens) {
      if (['PASSWORD_RESET', 'REFRESH'].includes(record.type)) record.revokedAt = new Date();
    }
    return true;
  }),
  primeCachedUser: vi.fn(), invalidateCachedUser: vi.fn(),
  claimPasswordResetRequest: vi.fn(async () => {
    if (fixture.claimed) return false;
    fixture.claimed = true;
    return true;
  }),
}));
vi.mock('../src/repositories/token.repository.js', () => ({
  cleanupTokens: vi.fn(),
  createToken: vi.fn(async data => {
    const record = { ...data, id: 'TEST-record-' + fixture.tokens.length, revokedAt: null };
    fixture.tokens.push(record);
    return record;
  }),
  revokeOtherUserTokensByType: vi.fn(async (userId, type, keepId) => {
    for (const record of fixture.tokens) {
      if (record.userId === userId && record.type === type && record.id !== keepId) record.revokedAt = new Date();
    }
  }),
  findActiveTokenByValue: vi.fn(async (token, type) => {
    const record = fixture.tokens.find(candidate => candidate.token === token && candidate.type === type && candidate.revokedAt === null && candidate.expiresAt > new Date());
    return record ? { ...record, user: { ...fixture.account } } : null;
  }),
  redeemAccountToken: vi.fn(async redemption => {
    const record = fixture.tokens.find(candidate => candidate.id === redemption.id && candidate.revokedAt === null);
    if (!record || !fixture.account) return false;
    record.revokedAt = new Date();
    fixture.account.password = redemption.passwordHash;
    fixture.account.sessionVersion++;
    for (const refresh of fixture.tokens.filter(candidate => candidate.type === 'REFRESH')) refresh.revokedAt = new Date();
    return true;
  }),
}));
vi.mock('../src/lib/session-invalidation.js', () => ({ notifySessionInvalidated: vi.fn() }));

import { changePassword, googleLogin, login, requestPasswordSetup, resetPassword } from '../src/services/auth.service.js';
import { comparePassword } from '../src/utils/password.js';
import { verifyAccessToken } from '../src/utils/jwt.js';

describe('Google-to-password lifecycle (memory persistence, intercepted providers, real service/bcrypt/JWT)', () => {
  it('keeps Google and email/password login on the same account, rejects old passwords and used links', async () => {
    const initial = await googleLogin('TEST-google-code');
    expect(initial.user.email).toBe('oauth-password@example.invalid');
    expect(fixture.account?.emailVerified).toBeInstanceOf(Date);
    const initialHash = fixture.account!.password;
    const response = await requestPasswordSetup(initial.user.id);
    expect(response.message).toContain('Spam');
    expect(fixture.sendMail).toHaveBeenCalledOnce();
    expect(fixture.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: initial.user.email }));
    const delivery = fixture.sendMail.mock.calls[0];
    expect(delivery).toBeDefined();
    const mailHtml = delivery![0].html;
    expect(mailHtml).toContain('create or reset your');
    expect(mailHtml).toContain('does not change your Google password');
    expect(mailHtml).toContain('still sign in with Google');
    expect(mailHtml).toContain('can be used only once');
    expect(mailHtml).toContain('signs you out on all devices');
    await expect(requestPasswordSetup(initial.user.id)).rejects.toMatchObject({ status: 429 });
    expect(fixture.sendMail).toHaveBeenCalledOnce();
    const reset = fixture.tokens.find(record => record.type === 'PASSWORD_RESET')!;
    expect(mailHtml).toContain('/reset-password?token=' + reset.token);
    const chosen = 'TEST-Google-chosen-password';
    await resetPassword(reset.token, chosen);
    expect(fixture.account!.password).not.toBe(initialHash);
    expect(await comparePassword(chosen, fixture.account!.password)).toBe(true);
    expect(fixture.account!.sessionVersion).toBe(1);
    expect(fixture.tokens.filter(record => record.type === 'REFRESH').every(record => record.revokedAt !== null)).toBe(true);
    await expect(resetPassword(reset.token, chosen + '-reuse')).rejects.toMatchObject({ status: 400 });
    const emailSession = await login({ email: initial.user.email, password: chosen });
    expect(emailSession.user.id).toBe(initial.user.id);
    expect(verifyAccessToken(emailSession.accessToken)?.sessionVersion).toBe(1);
    const googleAgain = await googleLogin('TEST-google-again');
    expect(googleAgain.user.id).toBe(initial.user.id);
    expect(verifyAccessToken(googleAgain.accessToken)?.sessionVersion).toBe(1);
    const replacement = chosen + '-changed';
    await changePassword(initial.user.id, 1, chosen, replacement);
    await expect(login({ email: initial.user.email, password: chosen })).rejects.toMatchObject({ status: 401 });
    const newSession = await login({ email: initial.user.email, password: replacement });
    expect(newSession.user.id).toBe(initial.user.id);
    expect(verifyAccessToken(newSession.accessToken)?.sessionVersion).toBe(2);
    const stillGoogle = await googleLogin('TEST-google-after-change');
    expect(stillGoogle.user.id).toBe(initial.user.id);
    expect(verifyAccessToken(stillGoogle.accessToken)?.sessionVersion).toBe(2);
  }, 40_000);
});
