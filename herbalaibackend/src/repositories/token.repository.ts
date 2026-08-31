import { prisma } from "../lib/prisma.js";

export const createToken = async (data: {
  userId: string;
  type: string;
  token: string;
  expiresAt: Date;
}) => {
  return prisma.token.create({
    data,
  });
};

export const findActiveRefreshToken = async (token: string) => {
  return prisma.token.findFirst({
    where: {
      token,
      type: "REFRESH",
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });
};

export const revokeToken = async (id: string) => {
  return prisma.token.update({
    where: { id },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const revokeAllUserRefreshTokens = async (userId: string) => {
  return prisma.token.updateMany({
    where: {
      userId,
      type: "REFRESH",
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

// Revoke all active tokens of a given type for a user (e.g. EMAIL_VERIFY, PASSWORD_RESET)
// This prevents token accumulation when users repeatedly request new links
export const revokeAllUserTokensByType = async (userId: string, type: string) => {
  return prisma.token.updateMany({
    where: {
      userId,
      type,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const cleanupTokens = async (userId: string) => {
  // 1. Delete all expired or revoked tokens for this user
  await prisma.token.deleteMany({
    where: {
      userId,
      OR: [
        { revokedAt: { not: null } },
        { expiresAt: { lte: new Date() } },
      ],
    },
  });

  // 2. Keep only the 5 most recent active tokens, delete the rest
  const activeTokens = await prisma.token.findMany({
    where: {
      userId,
      type: "REFRESH",
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (activeTokens.length > 5) {
    const tokensToDelete = activeTokens.slice(5).map((t) => t.id);
    await prisma.token.deleteMany({
      where: {
        id: { in: tokensToDelete },
      },
    });
  }
};

export const findActiveTokenByValue = async (token: string, type: string) => {
  return prisma.token.findFirst({
    where: {
      token,
      type,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });
};

