import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCreditsConfig } from '../src/config/credits.js';

describe('starting credit configuration', () => {
  beforeEach(() => {
    vi.stubEnv('DR_AI_CREDITS_MODE', 'test');
    vi.stubEnv('DR_AI_TRIAL_CREDITS', undefined);
    vi.stubEnv('DR_AI_CREDIT_PACKAGES', '[]');
    vi.stubEnv('PAYMONGO_TEST_SECRET_KEY', '');
    vi.stubEnv('PAYMONGO_TEST_WEBHOOK_SECRET', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('defaults to ten starting credits without enabling checkout', () => {
    expect(getCreditsConfig()).toMatchObject({ mode: 'test', trialCredits: 10, packages: [], secretKey: '', webhookSecret: '' });
  });

  it('keeps credit enforcement disabled unless explicitly enabled', () => {
    vi.stubEnv('DR_AI_CREDITS_MODE', undefined);
    expect(getCreditsConfig()).toMatchObject({ mode: 'off', trialCredits: 0, packages: [], secretKey: '', webhookSecret: '' });
  });

  it.each(['0', '2', '10', '100'])('preserves an explicit %s-credit override', value => {
    vi.stubEnv('DR_AI_TRIAL_CREDITS', value);
    expect(getCreditsConfig().trialCredits).toBe(Number(value));
  });

  it.each(['-1', '101', '1.5', 'invalid'])('rejects an invalid %s-credit starting balance', value => {
    vi.stubEnv('DR_AI_TRIAL_CREDITS', value);
    expect(getCreditsConfig).toThrow();
  });
});
