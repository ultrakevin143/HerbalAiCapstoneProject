import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { ENV } from "../config/env.js";
import { TtlCache } from "../lib/ttl-cache.js";
import { BatchedLookup } from "../lib/batched-lookup.js";

const userSessionCache = new TtlCache(ENV.AUTH_USER_CACHE_MAX_ENTRIES);
const userCacheKey = (id: string) => `auth-user:${id}`;

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
      bio: true,
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
      bio: true,
      joined: true,
      isBanned: true,
      emailVerified: true,
    },
  });
};

export const findAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      bio: true,
      joined: true,
      isBanned: true,
      emailVerified: true,
    },
    orderBy: {
      joined: 'desc',
    },
  });
};

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
      bio: true,
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
  data: { name?: string; avatar?: string | null; bio?: string | null },
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
      bio: true,
      joined: true,
      isBanned: true,
      emailVerified: true,
    },
  });
  invalidateCachedUser(id);
  return user;
};
