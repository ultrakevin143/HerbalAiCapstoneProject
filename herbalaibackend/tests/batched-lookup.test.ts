import { describe, expect, it, vi } from 'vitest';
import { BatchedLookup } from '../src/lib/batched-lookup.js';

describe('bounded lookup batching', () => {
  it('maps out-of-order results, duplicate keys and missing users correctly', async () => {
    const fetch = vi.fn(async () => new Map([['b', 2], ['a', 1]]));
    const loader = new BatchedLookup(fetch);
    expect(await Promise.all(['a', 'missing', 'b', 'a'].map(key => loader.load(key)))).toEqual([1, null, 2, 1]);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(['a', 'missing', 'b']);
  });
  it('bounds database batches to 100 IDs', async () => {
    const fetch = vi.fn(async (keys: string[]) => new Map(keys.map(key => [key, key])));
    const loader = new BatchedLookup(fetch);
    const keys = Array.from({ length: 250 }, (_, i) => String(i));
    expect(await Promise.all(keys.map(key => loader.load(key)))).toEqual(keys);
    expect(fetch.mock.calls.map(([keys]) => keys.length)).toEqual([100, 100, 50]);
  });
  it('rejects the whole failed batch and permits a later retry', async () => {
    const failure = new Error('database unavailable');
    const fetch = vi.fn< (keys: string[]) => Promise<Map<string, number>> >()
      .mockRejectedValueOnce(failure).mockResolvedValueOnce(new Map([['a', 1]]));
    const loader = new BatchedLookup(fetch);
    const results = await Promise.allSettled([loader.load('a'), loader.load('b')]);
    expect(results).toEqual([{ status: 'rejected', reason: failure }, { status: 'rejected', reason: failure }]);
    expect(await loader.load('a')).toBe(1);
  });
  it('does not reuse an in-flight result after a later lookup', async () => {
    let release!: (value: Map<string, number>) => void;
    const fetch = vi.fn<(keys: string[]) => Promise<Map<string, number>>>()
      .mockImplementationOnce(() => new Promise(resolve => { release = resolve; }))
      .mockResolvedValueOnce(new Map([['a', 2]]));
    const loader = new BatchedLookup(fetch);
    const old = loader.load('a');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(await loader.load('a')).toBe(2);
    release(new Map([['a', 1]]));
    expect(await old).toBe(1);
  });
});
