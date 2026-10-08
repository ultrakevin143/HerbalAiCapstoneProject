import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), findUnique: vi.fn(), update: vi.fn(), revoke: vi.fn(), audit: vi.fn(), invalidated: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock('../src/lib/session-invalidation.js', () => ({ notifySessionInvalidated: mocks.invalidated }));
import { updateUserBanStatus } from '../src/repositories/user.repository.js';

const current = { id: 'TEST-ban-target', username: 'TEST_ban_target', email: 'ban@example.invalid', isBanned: false, banExpiresAt: null, banReason: null, sessionVersion: 3 };
const admin = 'TEST-admin';
const reason = 'TEST ONLY moderation';

describe('transactional user bans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUnique.mockResolvedValue(current);
    mocks.update.mockImplementation(async ({ data }) => ({ ...current, ...data }));
    mocks.revoke.mockResolvedValue({ count: 2 });
    mocks.audit.mockResolvedValue({ id: 1 });
    mocks.transaction.mockImplementation(callback => callback({
      user: { findUnique: mocks.findUnique, update: mocks.update }, token: { updateMany: mocks.revoke }, auditLog: { create: mocks.audit },
    }));
  });

  it.each([['minutes', 17], ['hours', 5], ['days', 12]] as const)('persists custom %s and reason with session revocation and audit', async (unit, duration) => {
    const before = Date.now();
    const result = await updateUserBanStatus(current.id, true, admin, { type: 'temporary', reason, duration, unit });
    const data = mocks.update.mock.calls[0][0].data;
    expect(data).toMatchObject({ isBanned: true, banReason: reason, sessionVersion: { increment: 1 } });
    expect(data.banExpiresAt.getTime()).toBeGreaterThanOrEqual(before + duration * { minutes: 60_000, hours: 3_600_000, days: 86_400_000 }[unit]);
    expect(mocks.update.mock.calls[0][0].where).toEqual({ id: current.id, sessionVersion: 3 });
    expect(mocks.revoke).toHaveBeenCalledWith({ where: { userId: current.id, type: { in: ['REFRESH', 'PASSWORD_RESET'] }, revokedAt: null }, data: { revokedAt: expect.any(Date) } });
    expect(mocks.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ adminId: admin, action: 'BAN_USER', targetId: current.id,
      details: expect.objectContaining({ reason, duration, unit, banType: 'temporary', expiresAt: data.banExpiresAt.toISOString(), sessionsRevoked: true }) }) });
    expect(result.banExpiresAt).toEqual(data.banExpiresAt);
    expect(mocks.invalidated).toHaveBeenCalledWith(current.id);
  });

  it('stores indefinite expiry as NULL and keeps its reason', async () => {
    await updateUserBanStatus(current.id, true, admin, { type: 'indefinite', reason });
    expect(mocks.update.mock.calls[0][0].data).toMatchObject({ isBanned: true, banExpiresAt: null, banReason: reason });
  });

  it('manually unbans without resurrecting a session and retains previous details in the audit', async () => {
    mocks.findUnique.mockResolvedValue({ ...current, isBanned: true, banReason: reason });
    await updateUserBanStatus(current.id, false, admin);
    expect(mocks.update.mock.calls[0][0].data).toEqual({ isBanned: false, banReason: null, banExpiresAt: null, sessionVersion: { increment: 1 } });
    expect(mocks.audit.mock.calls[0][0].data).toMatchObject({ action: 'UNBAN_USER', details: { reason, banType: 'indefinite' } });
    expect(mocks.invalidated).toHaveBeenCalledWith(current.id);
  });

  it.each([true, false])('prevents self moderation (%s) at the repository boundary', async banned => {
    await expect(updateUserBanStatus(admin, banned, admin, { type: 'indefinite', reason })).rejects.toMatchObject({ status: 400 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects a missing reason even if a caller bypasses HTTP validation', async () => {
    await expect(updateUserBanStatus(current.id, true, admin)).rejects.toMatchObject({ status: 400 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('does not disconnect sessions or report success before the audit commits', async () => {
    mocks.audit.mockRejectedValue(new Error('TEST audit unavailable'));
    await expect(updateUserBanStatus(current.id, true, admin, { type: 'indefinite', reason })).rejects.toThrow('TEST audit unavailable');
    expect(mocks.invalidated).not.toHaveBeenCalled();
  });

  it('rejects missing accounts without writing audit entries', async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(updateUserBanStatus(current.id, true, admin, { type: 'indefinite', reason })).rejects.toMatchObject({ status: 404 });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it('rejects conflicting duplicate ban/unban requests', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...current, isBanned: true }).mockResolvedValueOnce(current);
    await expect(updateUserBanStatus(current.id, true, admin, { type: 'indefinite', reason })).rejects.toMatchObject({ status: 409 });
    await expect(updateUserBanStatus(current.id, false, admin)).rejects.toMatchObject({ status: 409 });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('allows a new ban after an earlier temporary ban has expired', async () => {
    mocks.findUnique.mockResolvedValue({ ...current, isBanned: true, banExpiresAt: new Date(0) });
    await updateUserBanStatus(current.id, true, admin, { type: 'indefinite', reason });
    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.audit.mock.calls[0][0].data.details).toMatchObject({ banType: 'indefinite', expiresAt: null });
  });

  it('retains the previous temporary expiry only when explicitly unbanning', async () => {
    const previousExpiry = new Date(Date.now() + 60_000);
    mocks.findUnique.mockResolvedValue({ ...current, isBanned: true, banExpiresAt: previousExpiry, banReason: reason });
    await updateUserBanStatus(current.id, false, admin);
    expect(mocks.audit.mock.calls[0][0].data.details).toMatchObject({ banType: 'temporary', expiresAt: previousExpiry.toISOString(), reason });
    expect(mocks.update.mock.calls[0][0].data.banExpiresAt).toBeNull();
  });

  it('rejects a concurrent version change and writes no audit or session notification', async () => {
    mocks.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('TEST concurrent change', { code: 'P2025', clientVersion: 'test' }));
    await expect(updateUserBanStatus(current.id, true, admin, { type: 'indefinite', reason })).rejects.toMatchObject({ status: 409 });
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.invalidated).not.toHaveBeenCalled();
  });
});
