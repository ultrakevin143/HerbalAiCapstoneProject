interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache {
  private readonly values = new Map<string, CacheEntry<unknown>>();
  private readonly pending = new Map<string, Promise<unknown>>();
  private generation = 0;

  public constructor(private readonly maxEntries = 250) {}

  public set<T>(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) return;
    if (this.values.size >= this.maxEntries && !this.values.has(key)) {
      const oldestKey = this.values.keys().next().value as string | undefined;
      if (oldestKey) this.values.delete(oldestKey);
    }
    this.values.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  public async getOrSet<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const current = this.values.get(key) as CacheEntry<T> | undefined;
    if (current && current.expiresAt > Date.now()) return current.value;
    if (current) this.values.delete(key);

    const inFlight = this.pending.get(key) as Promise<T> | undefined;
    if (inFlight) return inFlight;

    const loadGeneration = this.generation;
    const request = load()
      .then((value) => {
        if (loadGeneration === this.generation) {
          this.set(key, value, ttlMs);
        }
        return value;
      })
      .finally(() => {
        if (this.pending.get(key) === request) this.pending.delete(key);
      });

    this.pending.set(key, request);
    return request;
  }

  public deletePrefix(prefix: string): void {
    this.generation += 1;
    for (const key of this.values.keys()) {
      if (key.startsWith(prefix)) this.values.delete(key);
    }
    for (const key of this.pending.keys()) {
      if (key.startsWith(prefix)) this.pending.delete(key);
    }
  }
}
