import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { ENV } from '../src/config/env.js';
import { updateUserBanStatus, findAllUsers } from '../src/repositories/user.repository.js';
import { getMessageableUserById } from '../src/repositories/message.repository.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { validateAccessSession } from '../src/lib/access-session.js';
import { onSessionInvalidated } from '../src/lib/session-invalidation.js';

const suffix = randomUUID();
const adminId = `TEST-ban-admin-${suffix}`;
const targetId = `TEST-ban-user-${suffix}`;
const reason = 'TEST ONLY temporary-ban integration fixture';
const invalidated = vi.fn();
const unsubscribe = onSessionInvalidated(invalidated);
let initialized = false;

describe('temporary/indefinite ban PostgreSQL transactions', () => {
  beforeAll(async () => {
    const database = new URL(ENV.DATABASE_URL);
    if (ENV.NODE_ENV !== 'test' || !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)
      || database.pathname !== '/herbalai_test') throw new Error('Ban fixtures require the isolated loopback herbalai_test database.');
    await prisma.user.createMany({ data: [
      { id: adminId, name: 'TEST Ban Admin', username: adminId, email: `${adminId}@example.invalid`, role: 'admin', password: 'disabled-TEST-password' },
      { id: targetId, name: 'TEST Ban Target', username: targetId, email: `${targetId}@example.invalid`, password: 'disabled-TEST-password' },
    ] });
    initialized = true;
  });

  beforeEach(async () => {
    if (!initialized) return;
    await prisma.auditLog.deleteMany({ where: { adminId } });
    await prisma.token.deleteMany({ where: { userId: targetId } });
    await prisma.user.update({ where: { id: targetId }, data: { isBanned: false, banExpiresAt: null, banReason: null, sessionVersion: 0 } });
    await prisma.token.createMany({ data: ['REFRESH', 'PASSWORD_RESET'].map(type => ({
      userId: targetId, type, token: `TEST-only-${type}-${randomUUID()}`, expiresAt: new Date(Date.now() + 3_600_000),
    })) });
    invalidated.mockClear();
  });

  afterAll(async () => {
    unsubscribe();
    if (initialized) {
      await prisma.auditLog.deleteMany({ where: { adminId } });
      await prisma.token.deleteMany({ where: { userId: { in: [adminId, targetId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [adminId, targetId] } } });
    }
    await closeDatabasePool();
  });

  it('commits custom expiry, reason, version, revoked tokens and audit together', async () => {
    const before = Date.now();
    const result = await updateUserBanStatus(targetId, true, adminId, { type: 'temporary', duration: 17, unit: 'minutes', reason });
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: targetId } });
    expect(stored).toMatchObject({ isBanned: true, banReason: reason, sessionVersion: 1 });
    expect(stored.banExpiresAt!.getTime()).toBeGreaterThanOrEqual(before + 17 * 60_000);
    expect(stored.banExpiresAt!.getTime()).toBeLessThanOrEqual(Date.now() + 17 * 60_000);
    expect(result.banExpiresAt).toEqual(stored.banExpiresAt);
    expect(await prisma.token.count({ where: { userId: targetId, revokedAt: null } })).toBe(0);
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { adminId, targetId, action: 'BAN_USER' } });
    expect(audit.details).toMatchObject({ banType: 'temporary', reason, duration: 17, unit: 'minutes', expiresAt: stored.banExpiresAt!.toISOString() });
    expect(invalidated).toHaveBeenCalledOnce();
  });

  it('restores access at expiry without restoring an old access or refresh session', async () => {
    const oldToken = generateAccessToken({ userId: targetId, role: 'contributor', sessionVersion: 0 });
    await updateUserBanStatus(targetId, true, adminId, { type: 'temporary', duration: 1, unit: 'minutes', reason });
    expect((await validateAccessSession(oldToken)).status).toBe('banned');
    await prisma.user.update({ where: { id: targetId }, data: { banExpiresAt: new Date(Date.now() - 1000) } });
    expect((await validateAccessSession(oldToken)).status).toBe('invalid');
    expect((await validateAccessSession(generateAccessToken({ userId: targetId, role: 'contributor', sessionVersion: 1 }))).status).toBe('valid');
    expect(await getMessageableUserById(adminId, targetId)).toMatchObject({ id: targetId });
    expect((await findAllUsers(100)).find(user => user.id === targetId)).toMatchObject({ isBanned: false });
    expect(await prisma.token.count({ where: { userId: targetId, type: 'REFRESH', revokedAt: null } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { adminId, targetId } })).toBe(1);
  });

  it('keeps an indefinite ban active until explicit unban, preserving records and revocation', async () => {
    await updateUserBanStatus(targetId, true, adminId, { type: 'indefinite', reason });
    expect(await getMessageableUserById(adminId, targetId)).toBeNull();
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: targetId } });
    expect(stored.banExpiresAt).toBeNull();
    await updateUserBanStatus(targetId, false, adminId);
    expect(await prisma.user.findUniqueOrThrow({ where: { id: targetId } })).toMatchObject({ isBanned: false, banReason: null, banExpiresAt: null, sessionVersion: 2 });
    expect(await prisma.token.count({ where: { userId: targetId, revokedAt: null } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { adminId, targetId, action: 'UNBAN_USER' } })).toBe(1);
  });

  it('rolls back all ban state and token revocation when its audit cannot commit', async () => {
    await expect(updateUserBanStatus(targetId, true, `TEST-missing-admin-${suffix}`, { type: 'indefinite', reason })).rejects.toThrow();
    expect(await prisma.user.findUniqueOrThrow({ where: { id: targetId } })).toMatchObject({ isBanned: false, sessionVersion: 0, banReason: null });
    expect(await prisma.token.count({ where: { userId: targetId, revokedAt: null } })).toBe(2);
    expect(await prisma.auditLog.count({ where: { targetId } })).toBe(0);
    expect(invalidated).not.toHaveBeenCalled();
  });

  it('allows only one concurrent ban/audit against the same account version', async () => {
    const outcomes = await Promise.allSettled([
      updateUserBanStatus(targetId, true, adminId, { type: 'indefinite', reason }),
      updateUserBanStatus(targetId, true, adminId, { type: 'temporary', duration: 5, unit: 'hours', reason }),
    ]);
    expect(outcomes.filter(outcome => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.auditLog.count({ where: { adminId, targetId, action: 'BAN_USER' } })).toBe(1);
    expect(await prisma.user.findUniqueOrThrow({ where: { id: targetId } })).toMatchObject({ sessionVersion: 1 });
    expect(invalidated).toHaveBeenCalledOnce();
  });
});
