import { describe, expect, it } from 'vitest';
import { banInputSchema, banExpiry, banMessage, eligibleAccountFilter, isAccountBanned } from '../src/lib/user-ban.js';

const now = new Date('2026-10-08T04:00:00Z');
const reason = 'TEST ONLY moderation check';

describe('user ban policy', () => {
  it.each([['minutes', 17, 17 * 60_000], ['hours', 5, 5 * 3_600_000], ['days', 12, 12 * 86_400_000]] as const)
    ('accepts administrator-entered custom %s', (unit, duration, milliseconds) => {
      const input = banInputSchema.parse({ type: 'temporary', unit, duration, reason: ` ${reason} ` });
      expect(input.reason).toBe(reason);
      expect(banExpiry(input, now)?.getTime()).toBe(now.getTime() + milliseconds);
    });

  it('keeps indefinite bans active without an expiry', () => {
    const input = banInputSchema.parse({ type: 'indefinite', reason });
    expect(banExpiry(input, now)).toBeNull();
    expect(isAccountBanned({ isBanned: true, banExpiresAt: null }, new Date('2100-01-01'))).toBe(true);
  });

  it.each([
    {}, { type: 'temporary', reason, duration: 1 }, { type: 'unknown', reason },
    { type: 'indefinite', reason: '  ' }, { type: 'indefinite', reason: 'a'.repeat(501) },
    { type: 'indefinite', reason, duration: 1 },
    ...[0, -1, 1.5, '5', Infinity, NaN, 366].map(duration => ({ type: 'temporary', unit: 'days', duration, reason })),
    { type: 'temporary', reason, unit: 'weeks', duration: 1 },
    { type: 'temporary', reason, unit: 'minutes', duration: 525_601 },
  ])('rejects malformed or unsafe ban input %#', input => {
    expect(banInputSchema.safeParse(input).success).toBe(false);
  });

  it.each(['minutes', 'hours', 'days'] as const)('accepts the full duration limit in %s', unit => {
    const duration = { minutes: 525_600, hours: 8_760, days: 365 }[unit];
    expect(banExpiry(banInputSchema.parse({ type: 'temporary', reason, unit, duration }), now))
      .toEqual(new Date('2027-10-08T04:00:00Z'));
  });

  it('expires exactly at the stored UTC end time without extending it', () => {
    const account = { isBanned: true, banExpiresAt: now };
    expect(isAccountBanned(account, new Date(now.getTime() - 1))).toBe(true);
    expect(isAccountBanned(account, now)).toBe(false);
    expect(isAccountBanned(account, new Date(now.getTime() + 1))).toBe(false);
    expect(account.isBanned).toBe(true);
  });

  it('preserves legacy indefinite bans and fails closed for corrupt dates', () => {
    expect(isAccountBanned({ isBanned: true }, now)).toBe(true);
    expect(isAccountBanned({ isBanned: true, banExpiresAt: new Date('invalid') }, now)).toBe(true);
    expect(isAccountBanned({ isBanned: false, banExpiresAt: new Date('invalid') }, now)).toBe(false);
  });

  it('shows reason and UTC expiry without claiming account deletion', () => {
    expect(banMessage({ isBanned: true, banReason: reason, banExpiresAt: now })).toContain(now.toISOString());
    expect(banMessage({ isBanned: true, banReason: reason })).toContain(reason);
    expect(banMessage({ isBanned: true })).toContain('administrator unbans');
  });

  it('admits expired bans in database queries but excludes indefinite and future bans', () => {
    expect(eligibleAccountFilter(now)).toEqual({ OR: [{ isBanned: false }, { isBanned: true, banExpiresAt: { lte: now } }] });
  });
});
