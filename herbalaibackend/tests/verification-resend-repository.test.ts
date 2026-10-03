import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { token: { updateMany: mocks.update } } }));
import { revokeOlderUserTokensByType } from '../src/repositories/token.repository.js';

describe('Verification resend cleanup predicate', () => {
  beforeEach(() => vi.resetAllMocks());

  it('revokes only active earlier links for the same account and purpose', async () => {
    const createdAt = new Date('2026-10-03T00:00:00Z');
    mocks.update.mockResolvedValue({ count: 1 });
    await expect(revokeOlderUserTokensByType('qa-user', 'EMAIL_VERIFY', 'replacement-id', createdAt))
      .resolves.toEqual({ count: 1 });
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({
      where: {
        userId: 'qa-user', type: 'EMAIL_VERIFY', id: { not: 'replacement-id' },
        createdAt: { lt: createdAt }, revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
