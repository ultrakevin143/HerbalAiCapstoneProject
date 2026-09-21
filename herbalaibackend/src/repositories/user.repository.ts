import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { ENV } from "../config/env.js";
import { TtlCache } from "../lib/ttl-cache.js";
import { BatchedLookup } from "../lib/batched-lookup.js";

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
  emailVerified: user.emailVerified,
});

export const primeCachedUser = (user: SessionUser): void => {
  userSessionCache.set(userCacheKey(user.id), toSessionUser(user), ENV.AUTH_USER_CACHE_TTL_MS);
};

export const invalidateCachedUser = (id: string): void => {
  userSessionCache.deletePrefix(userCacheKey(id));
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
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
      emailVerified: true,
    },
  });
  return new Map(users.map(user => [user.id, user]));
};
const sessionLookup = new BatchedLookup(fetchSessionUsers);

export const findUserById = async (id: string) => {
  return userSessionCache.getOrSet(userCacheKey(id), ENV.AUTH_USER_CACHE_TTL_MS, () => sessionLookup.load(id));
};

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
  return prisma.user.findMany({
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
    orderBy: [{ joined: 'desc' }, { id: 'desc' }],
    take: limit,
    skip: offset,
  });
};

export const countUsers = () => prisma.user.count();

export const updateUserBanStatus = async (id: string, isBanned: boolean) => {
  const user = await prisma.user.update({
    where: { id },
    data: { isBanned },
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
