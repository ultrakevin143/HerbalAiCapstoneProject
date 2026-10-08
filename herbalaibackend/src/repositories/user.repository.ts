import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { ENV } from "../config/env.js";
import { TtlCache } from "../lib/ttl-cache.js";
import { BatchedLookup } from "../lib/batched-lookup.js";
import { runAuditedMutation } from "./audit.repository.js";
import { banInputSchema, banExpiry, eligibleAccountFilter, isAccountBanned } from '../lib/user-ban.js';
import type { BanInput } from '../lib/user-ban.js';
import { notifySessionInvalidated } from '../lib/session-invalidation.js';

const userSessionCache = new TtlCache(ENV.AUTH_USER_CACHE_MAX_ENTRIES);
const userCacheKey = (id: string) => `auth-user:${id}`;

type SessionUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  joined: Date;
  isBanned: boolean;
  banReason?: string | null;
  banExpiresAt?: Date | null;
  emailVerified: Date | null;
};

const toSessionUser = (user: SessionUser): SessionUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
  role: user.role,
  joined: user.joined,
  isBanned: user.isBanned,
  ...(user.banReason !== undefined ? { banReason: user.banReason } : {}),
  ...(user.banExpiresAt !== undefined ? { banExpiresAt: user.banExpiresAt } : {}),
  emailVerified: user.emailVerified,
});

export const primeCachedUser = (user: SessionUser): void => {
  userSessionCache.set(userCacheKey(user.id), toSessionUser(user), ENV.AUTH_USER_CACHE_TTL_MS);
};

export const invalidateCachedUser = (id: string): void => {
  userSessionCache.deletePrefix(userCacheKey(id));
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
};

export const claimPasswordResetRequest = async (userId: string, requestedAt: Date, cooldownStart: Date): Promise<boolean> => {
  const result = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { passwordResetRequestedAt: null },
        { passwordResetRequestedAt: { lte: cooldownStart } },
      ],
    },
    data: { passwordResetRequestedAt: requestedAt },
  });
  return result.count === 1;
};

export const releasePasswordResetRequest = async (userId: string, requestedAt: Date): Promise<void> => {
  await prisma.user.updateMany({
    where: { id: userId, passwordResetRequestedAt: requestedAt },
    data: { passwordResetRequestedAt: null },
  });
};

export const findUserByUsername = async (username: string) => {
  return prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });
};

export const findUserByLoginIdentifier = async (identifier: string) => {
  const normalized = identifier.trim();
  const users = await prisma.user.findMany({
    where: normalized.includes('@')
      ? { email: { equals: normalized, mode: 'insensitive' } }
      : { username: { equals: normalized, mode: 'insensitive' } },
    take: 2,
  });
  return users.length === 1 ? users[0] : null;
};

const fetchSessionUsers = async (ids: string[]) => {
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      joined: true,
      isBanned: true,
      banReason: true,
      banExpiresAt: true,
      emailVerified: true,
    },
  });
  return new Map(users.map(user => [user.id, user]));
};
const sessionLookup = new BatchedLookup(fetchSessionUsers);

export const findUserById = async (id: string) => {
  const user = await userSessionCache.getOrSet<SessionUser | null>(userCacheKey(id), ENV.AUTH_USER_CACHE_TTL_MS, () => sessionLookup.load(id));
  return user ? { ...user, isBanned: isAccountBanned(user) } : user;
};

export const findPasswordCredentials = (id: string) => prisma.user.findUnique({
  where: { id },
  select: { id: true, password: true, sessionVersion: true, isBanned: true, banExpiresAt: true, banReason: true },
});

export const replacePassword = (
  id: string, expectedHash: string, expectedVersion: number, passwordHash: string,
): Promise<boolean> => prisma.$transaction(async transaction => {
  const changed = await transaction.user.updateMany({
    where: { id, password: expectedHash, sessionVersion: expectedVersion, ...eligibleAccountFilter() },
    data: { password: passwordHash, sessionVersion: { increment: 1 } },
  });
  if (changed.count !== 1) return false;
  await transaction.token.updateMany({
    where: { userId: id, type: { in: ["REFRESH", "PASSWORD_RESET"] }, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return true;
}, { timeout: 15_000 });

export const createUser = async (data: Prisma.UserCreateInput) => {
  return prisma.user.create({
    data,
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      joined: true,
      isBanned: true,
      emailVerified: true,
    },
  });
};

export const findAllUsers = async (limit = 25, offset = 0) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      joined: true,
      isBanned: true,
      banReason: true,
      banExpiresAt: true,
      emailVerified: true,
    },
    orderBy: [{ joined: 'desc' }, { id: 'desc' }],
    take: limit,
    skip: offset,
  });
  return users.map(user => ({ ...user, isBanned: isAccountBanned(user) }));
};

export const countUsers = () => prisma.user.count();

export const updateUserBanStatus = async (id: string, isBanned: boolean, adminId: string, input?: BanInput) => {
  if (id === adminId) throw { status: 400, message: 'You cannot change your own ban status.' };
  const parsed = isBanned ? banInputSchema.safeParse(input) : null;
  if (parsed && !parsed.success) throw { status: 400, message: parsed.error.issues[0]?.message ?? 'Invalid ban options.' };
  const options = parsed?.success ? parsed.data : null;
  const user = await runAuditedMutation({
    adminId,
    action: isBanned ? "BAN_USER" : "UNBAN_USER",
    targetType: "User",
  }, async (transaction) => {
    const current = await transaction.user.findUnique({ where: { id } });
    if (!current) throw { status: 404, message: 'User not found.' };
    const now = new Date();
    if (isAccountBanned(current, now) === isBanned) {
      throw { status: 409, message: isBanned ? 'This user is already banned.' : 'This user is not currently banned.' };
    }
    const expiresAt = options ? banExpiry(options, now) : null;
    const updated = await transaction.user.update({
      where: { id, sessionVersion: current.sessionVersion },
      data: { isBanned, banReason: options?.reason ?? null, banExpiresAt: expiresAt, sessionVersion: { increment: 1 } },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        joined: true,
        isBanned: true,
        banReason: true,
        banExpiresAt: true,
        emailVerified: true,
      },
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw { status: 409, message: 'This account changed during moderation. Refresh and try again.' };
      }
      throw error;
    });
    if (isBanned) {
      await transaction.token.updateMany({
        where: { userId: id, type: { in: ['REFRESH', 'PASSWORD_RESET'] }, revokedAt: null },
        data: { revokedAt: now },
      });
    }
    return {
      result: updated,
      targetId: id,
      details: {
        targetUsername: updated.username, targetEmail: updated.email,
        banType: options?.type ?? (current.banExpiresAt ? 'temporary' : 'indefinite'),
        reason: options?.reason ?? current.banReason,
        expiresAt: (isBanned ? expiresAt : current.banExpiresAt)?.toISOString() ?? null,
        ...(options?.type === 'temporary' ? { duration: options.duration, unit: options.unit } : {}),
        sessionsRevoked: true,
      },
    };
  });
  invalidateCachedUser(id);
  notifySessionInvalidated(id);
  return user;
};

export const updateUserProfile = async (
  id: string,
  data: { name?: string; avatar?: string | null },
) => {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      joined: true,
      isBanned: true,
      emailVerified: true,
    },
  });
  invalidateCachedUser(id);
  return user;
};
