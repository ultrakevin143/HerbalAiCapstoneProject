import { prisma } from "../lib/prisma.js";

type AccountTokenRedemption = { id: string; userId: string } & (
  | { type: 'EMAIL_VERIFY' }
  | { type: 'PASSWORD_RESET'; passwordHash: string }
);

/** Consume the still-valid link and change account state as one atomic operation. */
export const redeemAccountToken = async (redemption: AccountTokenRedemption): Promise<boolean> => {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const claimed = await tx.token.updateMany({
      where: {
        id: redemption.id, userId: redemption.userId, type: redemption.type,
        revokedAt: null, expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });
    if (claimed.count !== 1) return false;

    if (redemption.type === 'EMAIL_VERIFY') {
      await tx.user.update({ where: { id: redemption.userId }, data: { emailVerified: now } });
    } else {
      await tx.user.update({ where: { id: redemption.userId }, data: { password: redemption.passwordHash } });
      await tx.token.updateMany({
        where: { userId: redemption.userId, type: 'REFRESH', revokedAt: null },
        data: { revokedAt: now },
      });
    }
    return true;
  });
};

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
