import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ account: vi.fn(), prime: vi.fn(), token: vi.fn(), compare: vi.fn(), credentials: vi.fn(), replace: vi.fn() }));
vi.mock('../src/repositories/user.repository.js', () => ({
  findUserByLoginIdentifier: mocks.account, findUserByEmail: mocks.account, findUserById: mocks.account,
  primeCachedUser: mocks.prime, findPasswordCredentials: mocks.credentials, replacePassword: mocks.replace,
}));
vi.mock('../src/repositories/token.repository.js', () => ({ cleanupTokens: vi.fn(), createToken: mocks.token }));
vi.mock('../src/utils/password.js', () => ({ comparePassword: mocks.compare, hashPassword: vi.fn() }));
vi.mock('google-auth-library', () => ({ OAuth2Client: class {
  async getToken() { return { tokens: { id_token: 'TEST-google-token' } }; }
  async verifyIdToken() { return { getPayload: () => ({ email: 'qa@example.invalid', email_verified: true, name: 'TEST Google QA' }) }; }
} }));
import { login, googleLogin, changePassword, forgotPassword } from '../src/services/auth.service.js';

const account = { id: 'TEST-login', name: 'TEST login', username: 'TEST_login', email: 'qa@example.invalid', password: 'TEST-hash',
  role: 'contributor', isBanned: true, banReason: 'TEST ONLY active ban', banExpiresAt: null, sessionVersion: 1,
  emailVerified: new Date(), emailVerificationRequired: false };

describe('password and Google login ban behavior (mocked provider/database)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue(account);
    mocks.credentials.mockResolvedValue(account);
    mocks.compare.mockResolvedValue(true);
  });

  it('rejects an indefinite password ban and exposes its reason only after password validation', async () => {
    await expect(login({ identifier: account.username, password: 'TEST-valid' })).rejects.toMatchObject({ status: 403, message: expect.stringContaining(account.banReason) });
    expect(mocks.token).not.toHaveBeenCalled();
    mocks.compare.mockResolvedValue(false);
    await expect(login({ identifier: account.username, password: 'TEST-invalid' })).rejects.toMatchObject({ status: 401, message: 'Invalid email/username or password.' });
  });

  it('shows the exact future expiry for a temporary ban', async () => {
    const expiry = new Date(Date.now() + 3_600_000);
    mocks.account.mockResolvedValue({ ...account, banExpiresAt: expiry });
    await expect(login({ identifier: account.username, password: 'TEST-valid' })).rejects.toMatchObject({ status: 403, message: expect.stringContaining(expiry.toISOString()) });
  });

  it('allows fresh password sign-in after expiry without modifying a password or verification record', async () => {
    mocks.account.mockResolvedValue({ ...account, banExpiresAt: new Date(0) });
    await expect(login({ identifier: account.username, password: 'TEST-valid' })).resolves.toHaveProperty('accessToken');
    expect(mocks.token).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('blocks verified Google sign-in while banned', async () => {
    await expect(googleLogin('TEST-code')).rejects.toMatchObject({ status: 403, message: expect.stringContaining(account.banReason) });
    expect(mocks.token).not.toHaveBeenCalled();
  });

  it('allows verified Google sign-in after expiry for the same account', async () => {
    mocks.account.mockResolvedValue({ ...account, banExpiresAt: new Date(0) });
    await expect(googleLogin('TEST-code')).resolves.toMatchObject({ user: { id: account.id } });
  });

  it('blocks password replacement while actively banned', async () => {
    await expect(changePassword(account.id, 1, 'TEST-current', 'TEST-new-password')).rejects.toMatchObject({ status: 403 });
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('keeps recovery responses neutral and sends no token for a banned account', async () => {
    await expect(forgotPassword(account.email)).resolves.toMatchObject({ message: expect.stringContaining('If an account') });
    expect(mocks.token).not.toHaveBeenCalled();
  });
});
