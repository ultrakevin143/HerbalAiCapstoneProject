import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  verifyIdToken: vi.fn(),
  generateAuthUrl: vi.fn(),
  findUserByEmail: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    getToken = mocks.getToken;
    verifyIdToken = mocks.verifyIdToken;
    generateAuthUrl = mocks.generateAuthUrl;
    setCredentials = vi.fn();
  },
}));
vi.mock('../src/repositories/user.repository.js', () => ({ findUserByEmail: mocks.findUserByEmail }));

import { getGoogleAuthUrl, googleLogin } from '../src/services/auth.service.js';

describe('Google sign-in validation', () => {
  beforeEach(() => vi.resetAllMocks());

  it('passes the one-time state to Google', () => {
    getGoogleAuthUrl('test-state');
    expect(mocks.generateAuthUrl).toHaveBeenCalledWith(expect.objectContaining({ state: 'test-state' }));
  });

  it('rejects an unverified Google email before looking up an account', async () => {
    mocks.getToken.mockResolvedValue({ tokens: { id_token: 'test-id-token' } });
    mocks.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: 'unverified@example.invalid', email_verified: false }),
    });

    await expect(googleLogin('test-code')).rejects.toMatchObject({ status: 400 });
    expect(mocks.findUserByEmail).not.toHaveBeenCalled();
  });

  it('rejects a Google response without an ID token', async () => {
    mocks.getToken.mockResolvedValue({ tokens: {} });

    await expect(googleLogin('test-code')).rejects.toMatchObject({ status: 400 });
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
    expect(mocks.findUserByEmail).not.toHaveBeenCalled();
  });
});
