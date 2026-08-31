import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

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

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
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
  return prisma.user.update({
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
};

export const updateUserEmailVerified = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { emailVerified: new Date() },
  });
};

export const updateUserPassword = async (id: string, passwordHash: string) => {
  return prisma.user.update({
    where: { id },
    data: { password: passwordHash },
  });
};

