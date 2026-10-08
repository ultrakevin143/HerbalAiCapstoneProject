import { prisma } from './prisma.js';
import { verifyAccessToken } from '../utils/jwt.js';
import type { JwtPayload } from '../utils/jwt.js';
import { isAccountBanned, banMessage } from './user-ban.js';

type AccessSession =
  | { status: 'valid'; payload: JwtPayload }
  | { status: 'banned'; message: string }
  | { status: 'invalid' };

export const validateAccessSession = async (token: string): Promise<AccessSession> => {
  const payload = verifyAccessToken(token);
  if (!payload) return { status: 'invalid' };

  const account = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { sessionVersion: true, isBanned: true, role: true, banExpiresAt: true, banReason: true },
  });
  if (!account) return { status: 'invalid' };
  if (isAccountBanned(account)) return { status: 'banned', message: banMessage(account) };
  if ((payload.sessionVersion ?? 0) !== account.sessionVersion) return { status: 'invalid' };
  return { status: 'valid', payload: { ...payload, role: account.role } };
};
