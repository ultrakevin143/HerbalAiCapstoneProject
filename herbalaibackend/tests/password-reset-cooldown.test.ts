import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findUserByEmail,
  claimPasswordResetRequest,
  releasePasswordResetRequest,
  createToken,
  revokeToken,
  revokeOtherUserTokensByType,
  sendMail,
} = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  claimPasswordResetRequest: vi.fn(),
  releasePasswordResetRequest: vi.fn(),
  createToken: vi.fn(),
  revokeToken: vi.fn(),
  revokeOtherUserTokensByType: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('../src/repositories/user.repository.js', () => ({
  findUserByEmail,
  claimPasswordResetRequest,
  releasePasswordResetRequest,
}));
vi.mock('../src/repositories/token.repository.js', () => ({
  createToken,
  revokeToken,
  revokeOtherUserTokensByType,
}));
vi.mock('../src/lib/mailer.js', () => ({ sendMail, ensureMailReady: vi.fn() }));

import { forgotPassword } from '../src/services/auth.service.js';

const user = { id: 'test-user', email: 'test@example.invalid', name: 'Test User' };

beforeEach(() => {
  vi.clearAllMocks();
  findUserByEmail.mockResolvedValue(user);
  claimPasswordResetRequest.mockResolvedValue(true);
  createToken.mockResolvedValue({ id: 'reset-token' });
  sendMail.mockResolvedValue({ messageId: 'sent' });
});

describe('password reset email cooldown', () => {
  it('returns the same neutral response for an unknown email', async () => {
    const known = await forgotPassword(user.email);
    findUserByEmail.mockResolvedValueOnce(null);
    const unknown = await forgotPassword('missing@example.invalid');

    expect(unknown).toEqual(known);
    expect(claimPasswordResetRequest).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledOnce();
  });

  it('sends only one link during a rolling hour and keeps the first link valid', async () => {
    claimPasswordResetRequest.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const first = await forgotPassword(user.email);
    const second = await forgotPassword(user.email);

    expect(second).toEqual(first);
    expect(createToken).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledOnce();
    expect(revokeToken).not.toHaveBeenCalled();
    const [, requestedAt, cooldownStart] = claimPasswordResetRequest.mock.calls[0];
    expect(requestedAt.getTime() - cooldownStart.getTime()).toBe(60 * 60 * 1000);
  });

  it('releases the cooldown and token if delivery fails so a retry can work', async () => {
    const error = new Error('Mail provider unavailable');
    sendMail.mockRejectedValueOnce(error);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const first = await forgotPassword(user.email);
      const second = await forgotPassword(user.email);

      expect(second).toEqual(first);
      expect(sendMail).toHaveBeenCalledTimes(2);
      expect(revokeToken).toHaveBeenCalledWith('reset-token');
      expect(releasePasswordResetRequest).toHaveBeenCalledOnce();
      expect(revokeOtherUserTokensByType).toHaveBeenCalledOnce();
    } finally {
      log.mockRestore();
    }
  });

  it('does not consume the cooldown when delivery is suppressed', async () => {
    sendMail.mockResolvedValueOnce({ suppressed: true });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await forgotPassword(user.email);
      expect(revokeToken).toHaveBeenCalledWith('reset-token');
      expect(releasePasswordResetRequest).toHaveBeenCalledOnce();
      expect(revokeOtherUserTokensByType).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
