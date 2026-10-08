import type { Prisma } from '@prisma/client';
import { z } from 'zod';

const durationMilliseconds = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 };
const maximumDuration = 365 * durationMilliseconds.days;
const reason = z.string().trim().min(3, 'Provide a ban reason of at least 3 characters.').max(500);

export const banInputSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('temporary'), reason, duration: z.number().int().positive(), unit: z.enum(['minutes', 'hours', 'days']) }).strict(),
  z.object({ type: z.literal('indefinite'), reason }).strict(),
]).refine(input => input.type === 'indefinite' || input.duration * durationMilliseconds[input.unit] <= maximumDuration,
  'Temporary bans must not exceed 365 days.');

export type BanInput = z.infer<typeof banInputSchema>;
export interface BanState {
  isBanned: boolean;
  banExpiresAt?: Date | null;
  banReason?: string | null;
}

export const isAccountBanned = (account: BanState, now = new Date()): boolean => {
  if (!account.isBanned) return false;
  if (!account.banExpiresAt) return true;
  const expiry = account.banExpiresAt.getTime();
  return !Number.isFinite(expiry) || expiry > now.getTime();
};

export const banMessage = (account: BanState): string => {
  const expiry = account.banExpiresAt && Number.isFinite(account.banExpiresAt.getTime())
    ? ` until ${account.banExpiresAt.toISOString()}` : ' until an administrator unbans it';
  return `Your account is banned${expiry}.${account.banReason ? ` Reason: ${account.banReason}` : ''}`;
};

export const eligibleAccountFilter = (now = new Date()): Prisma.UserWhereInput => ({
  OR: [{ isBanned: false }, { isBanned: true, banExpiresAt: { lte: now } }],
});

export const banExpiry = (input: BanInput, now = new Date()): Date | null =>
  input.type === 'temporary' ? new Date(now.getTime() + input.duration * durationMilliseconds[input.unit]) : null;
