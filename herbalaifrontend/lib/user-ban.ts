export interface BanUser {
  id: string;
  name: string;
  username: string;
  isBanned: boolean;
  banReason?: string | null;
  banExpiresAt?: string | null;
}

export type BanDurationUnit = 'minutes' | 'hours' | 'days';
export type BanRequest = { type: 'indefinite'; reason: string }
  | { type: 'temporary'; reason: string; duration: number; unit: BanDurationUnit };

export const maximumBanDurations = { minutes: 525_600, hours: 8_760, days: 365 };

export const isActiveUserBan = (user: Pick<BanUser, 'isBanned' | 'banExpiresAt'>, now = Date.now()): boolean => {
  if (!user.isBanned) return false;
  if (!user.banExpiresAt) return true;
  const expiry = Date.parse(user.banExpiresAt);
  return !Number.isFinite(expiry) || expiry > now;
};

export const createBanRequest = (type: 'temporary' | 'indefinite', reason: string, duration: string, unit: BanDurationUnit): BanRequest => {
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 3 || trimmedReason.length > 500) throw new Error('Enter a reason between 3 and 500 characters.');
  if (type === 'indefinite') return { type, reason: trimmedReason };
  const amount = Number(duration);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > maximumBanDurations[unit]) {
    throw new Error('Enter a whole-number duration between one minute and 365 days.');
  }
  return { type, reason: trimmedReason, duration: amount, unit };
};
