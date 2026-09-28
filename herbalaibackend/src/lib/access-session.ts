import { prisma } from './prisma.js';
import { verifyAccessToken } from '../utils/jwt.js';
import type { JwtPayload } from '../utils/jwt.js';

type AccessSession =
  | { status: 'valid'; payload: JwtPayload }
  | { status: 'banned' }
  | { status: 'invalid' };

export const validateAccessSession = async (token: string): Promise<AccessSession> => {
  const payload = verifyAccessToken(token);
  if (!payload) return { status: 'invalid' };

  const account = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { sessionVersion: true, isBanned: true },
  });
  if (!account || (payload.sessionVersion ?? 0) !== account.sessionVersion) return { status: 'invalid' };
  if (account.isBanned) return { status: 'banned' };
  return { status: 'valid', payload };
};
