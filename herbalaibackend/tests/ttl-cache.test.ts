import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../src/lib/ttl-cache.js';

describe('TtlCache request deduplication', () => {
  it('shares an in-flight load and reuses the resolved value', async () => {
    const cache = new TtlCache();
    const loader = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { herbs: 14 };
    });

    const [first, second] = await Promise.all([
      cache.getOrSet('herbs:list', 1_000, loader),
      cache.getOrSet('herbs:list', 1_000, loader),
    ]);
    const third = await cache.getOrSet('herbs:list', 1_000, loader);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(third).toEqual(first);
  });

  it('invalidates matching cache prefixes only', async () => {
    const cache = new TtlCache();
    const herbLoader = vi.fn(async () => 'herbs');
    const otherLoader = vi.fn(async () => 'other');

    await cache.getOrSet('herbs:list', 1_000, herbLoader);
    await cache.getOrSet('users:list', 1_000, otherLoader);
    cache.deletePrefix('herbs:');
    await cache.getOrSet('herbs:list', 1_000, herbLoader);
    await cache.getOrSet('users:list', 1_000, otherLoader);

    expect(herbLoader).toHaveBeenCalledTimes(2);
    expect(otherLoader).toHaveBeenCalledTimes(1);
  });
});
