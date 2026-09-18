import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Transaction acquisition wait configuration', () => {
  it.each([
    ['', 12000],
    ['invalid', 12000],
    ['20000', 20000],
    ['0', 1000],
    ['999999', 60000],
  ])('bounds the configured value %s to %s milliseconds', async (input, expected) => {
    vi.stubEnv('DB_TRANSACTION_MAX_WAIT_MS', input);
    const { ENV } = await import('../src/config/env.js');
    expect(ENV.DB_TRANSACTION_MAX_WAIT_MS).toBe(expected);
  });
});
