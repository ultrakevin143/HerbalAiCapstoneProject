import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { findUserByEmail, findUserByUsername, findUserByLoginIdentifier, createUser, primeCachedUser, createToken, cleanupTokens, sendMail, ensureMailReady, comparePassword } = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  findUserByLoginIdentifier: vi.fn(),
  createUser: vi.fn(),
  primeCachedUser: vi.fn(),
  createToken: vi.fn(),
  cleanupTokens: vi.fn(),
  sendMail: vi.fn(),
  ensureMailReady: vi.fn(),
  comparePassword: vi.fn(),
}));

vi.mock('../src/repositories/user.repository.js', () => ({ findUserByEmail, findUserByUsername, findUserByLoginIdentifier, createUser, primeCachedUser }));
vi.mock('../src/repositories/token.repository.js', () => ({ createToken, cleanupTokens }));
vi.mock('../src/lib/mailer.js', () => ({ sendMail, ensureMailReady }));
vi.mock('../src/utils/password.js', () => ({ hashPassword: vi.fn().mockResolvedValue('hashed-password'), comparePassword }));
vi.mock('../src/utils/jwt.js', () => ({ generateAccessToken: vi.fn().mockReturnValue('access-token'), generateRefreshToken: vi.fn().mockReturnValue('refresh-token') }));

import { ENV } from '../src/config/env.js';
import { login, resendEmailVerification, signup } from '../src/services/auth.service.js';

const account = { email: 'example@loadtest.invalid', username: 'example_user', name: 'Test User', password: 'safe-password' };
const originalVerificationRequirement = ENV.REQUIRE_EMAIL_VERIFICATION;

beforeEach(() => {
  vi.clearAllMocks();
  ENV.REQUIRE_EMAIL_VERIFICATION = true;
  findUserByEmail.mockResolvedValue(null);
  findUserByUsername.mockResolvedValue(null);
  createUser.mockResolvedValue({ id: 'user-1', email: account.email, username: account.username, name: account.name, role: 'contributor' });
  createToken.mockResolvedValue({ id: 'token-1' });
  sendMail.mockResolvedValue({ id: 'accepted-email' });
  comparePassword.mockResolvedValue(true);
});

afterEach(() => {
  ENV.REQUIRE_EMAIL_VERIFICATION = originalVerificationRequirement;
});

describe('signup delivery outcomes', () => {
  it('does not create an account when mail is not configured', async () => {
    ensureMailReady.mockImplementationOnce(() => { throw new Error('Not configured'); });
    await expect(signup(account)).rejects.toMatchObject({ status: 503 });
    expect(createUser).not.toHaveBeenCalled();
  });

  it('keeps the unverified account recoverable when delivery fails', async () => {
    sendMail.mockRejectedValueOnce(new Error('Connection unavailable'));
    const result = await signup(account);
    expect(result.verificationEmailSent).toBe(false);
    expect(createUser).toHaveBeenCalledOnce();
    expect(createToken).toHaveBeenCalledOnce();
  });

  it('does not claim a suppressed email was sent', async () => {
    sendMail.mockResolvedValueOnce({ suppressed: true });
    expect((await signup(account)).verificationEmailSent).toBe(false);
  });

  it('reports accepted delivery', async () => {
    expect((await signup(account)).verificationEmailSent).toBe(true);
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ emailVerificationRequired: true }));
  });

  it('keeps the existing-email conflict without creating another account', async () => {
    findUserByEmail.mockResolvedValueOnce({ id: 'existing-user' });
    await expect(signup(account)).rejects.toMatchObject({ status: 409, verificationRequired: true });
    expect(createUser).not.toHaveBeenCalled();
  });

  it('directs existing accounts to sign in while verification is disabled', async () => {
    ENV.REQUIRE_EMAIL_VERIFICATION = false;
    findUserByEmail.mockResolvedValueOnce({ id: 'existing-user' });
    await expect(signup(account)).rejects.toMatchObject({ status: 409, verificationRequired: false });
    expect(createUser).not.toHaveBeenCalled();
  });

  it('creates an unverified account without contacting email when the temporary switch is off', async () => {
    ENV.REQUIRE_EMAIL_VERIFICATION = false;
    const result = await signup(account);
    expect(result).toMatchObject({ verificationRequired: false, verificationEmailSent: false });
    expect(createUser).toHaveBeenCalledOnce();
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ emailVerificationRequired: false }));
    expect(ensureMailReady).not.toHaveBeenCalled();
    expect(createToken).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('permits password login without changing the email verification record while the switch is off', async () => {
    const unverifiedUser = { id: 'user-1', email: account.email, username: account.username, name: account.name, role: 'contributor', password: 'hashed-password', isBanned: false, emailVerified: null, emailVerificationRequired: true };
    findUserByLoginIdentifier.mockResolvedValue(unverifiedUser);

    await expect(login({ email: account.email, password: account.password })).rejects.toMatchObject({ status: 403 });

    ENV.REQUIRE_EMAIL_VERIFICATION = false;
    await expect(login({ email: account.email, password: account.password })).resolves.toMatchObject({ accessToken: 'access-token' });
    expect(unverifiedUser.emailVerified).toBeNull();
    expect(cleanupTokens).toHaveBeenCalledOnce();
  });

  it('keeps legacy unverified accounts accessible when verification is restored', async () => {
    findUserByLoginIdentifier.mockResolvedValue({
      id: 'legacy-user', email: account.email, username: account.username, name: account.name,
      role: 'contributor', password: 'hashed-password', isBanned: false,
      emailVerified: null, emailVerificationRequired: false,
    });

    await expect(login({ email: account.email, password: account.password })).resolves.toMatchObject({ accessToken: 'access-token' });
  });

  it('does not attempt a verification resend while verification is disabled', async () => {
    ENV.REQUIRE_EMAIL_VERIFICATION = false;
    await expect(resendEmailVerification(account.email)).resolves.toMatchObject({ message: expect.stringContaining('disabled') });
    expect(sendMail).not.toHaveBeenCalled();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it('normalizes account identifiers before duplicate lookup and creation', async () => {
    ENV.REQUIRE_EMAIL_VERIFICATION = false;
    await signup({ ...account, email: '  Example@Loadtest.Invalid  ', username: 'Example_User' });
    expect(findUserByEmail).toHaveBeenCalledWith(account.email);
    expect(findUserByUsername).toHaveBeenCalledWith(account.username);
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email: account.email, username: account.username }));
  });
});
