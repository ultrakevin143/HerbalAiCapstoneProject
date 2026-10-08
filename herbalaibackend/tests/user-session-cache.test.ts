import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const findMany = vi.fn();
const update = vi.fn();
const auditCreate = vi.fn();
const revoke = vi.fn();

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique, findMany, update },
    $transaction: (callback: (transaction: unknown) => unknown) => callback({ user: { update, findUnique }, token: { updateMany: revoke }, auditLog: { create: auditCreate } }),
  },
}));

const userRepo = await import('../src/repositories/user.repository.js');

const profile = {
  id: 'cache-user-1',
  username: 'cache_user',
  email: 'cache@example.test',
  name: 'Cache User',
  avatar: null,
  role: 'contributor',
  joined: new Date('2026-01-01'),
  isBanned: false,
  emailVerified: new Date('2026-01-01'),
};

describe('authenticated user cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue({ ...profile, sessionVersion: 0 });
    userRepo.invalidateCachedUser(profile.id);
  });

  it('reuses a recent user profile without another database query', async () => {
    findMany.mockResolvedValue([profile]);

    await expect(userRepo.findUserById(profile.id)).resolves.toEqual(profile);
    await expect(userRepo.findUserById(profile.id)).resolves.toEqual(profile);

    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('primes a safe post-login profile without caching credential fields', async () => {
    const authenticatedRecord = { ...profile, password: 'must-not-be-cached' };
    userRepo.primeCachedUser(authenticatedRecord);

    const cached = await userRepo.findUserById(profile.id);

    expect(cached).toEqual(profile);
    expect(cached).not.toHaveProperty('password');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('invalidates the cached profile immediately after a ban change', async () => {
    const bannedProfile = { ...profile, isBanned: true };
    findMany.mockResolvedValueOnce([profile]).mockResolvedValueOnce([bannedProfile]);
    update.mockResolvedValue(bannedProfile);

    await userRepo.findUserById(profile.id);
    await userRepo.updateUserBanStatus(profile.id, true, 'test-admin', { type: 'indefinite', reason: 'TEST moderation' });
    await expect(userRepo.findUserById(profile.id)).resolves.toMatchObject({ isBanned: true });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: profile.id, sessionVersion: 0 },
      data: { isBanned: true, banReason: 'TEST moderation', banExpiresAt: null, sessionVersion: { increment: 1 } },
    }));
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('invalidates the cached profile immediately after a profile change', async () => {
    const updatedProfile = { ...profile, name: 'Updated Cache User' };
    findMany.mockResolvedValueOnce([profile]).mockResolvedValueOnce([updatedProfile]);
    update.mockResolvedValue(updatedProfile);

    await userRepo.findUserById(profile.id);
    await userRepo.updateUserProfile(profile.id, { name: updatedProfile.name });
    await expect(userRepo.findUserById(profile.id)).resolves.toMatchObject({
      name: updatedProfile.name,
    });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: profile.id },
      data: { name: updatedProfile.name },
    }));
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('does not repopulate the cache from a stale in-flight batch after a ban', async () => {
    const bannedProfile = { ...profile, isBanned: true };
    let release!: (value: typeof profile[]) => void;
    findMany.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }))
      .mockResolvedValueOnce([bannedProfile]);
    update.mockResolvedValue(bannedProfile);
    const oldLookup = userRepo.findUserById(profile.id);
    await vi.waitFor(() => expect(findMany).toHaveBeenCalledTimes(1));
    await userRepo.updateUserBanStatus(profile.id, true, 'test-admin', { type: 'indefinite', reason: 'TEST moderation' });
    await expect(userRepo.findUserById(profile.id)).resolves.toMatchObject({ isBanned: true });
    release([profile]);
    await oldLookup;
    await expect(userRepo.findUserById(profile.id)).resolves.toMatchObject({ isBanned: true });
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('recalculates expiry even while the raw banned profile is still cached', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const expiry = new Date(Date.now() + 1000);
      userRepo.primeCachedUser({ ...profile, isBanned: true, banExpiresAt: expiry });
      await expect(userRepo.findUserById(profile.id)).resolves.toMatchObject({ isBanned: true });
      vi.setSystemTime(expiry);
      await expect(userRepo.findUserById(profile.id)).resolves.toMatchObject({ isBanned: false });
      expect(findMany).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
});
