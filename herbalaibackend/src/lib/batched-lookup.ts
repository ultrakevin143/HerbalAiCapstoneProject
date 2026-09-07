type Pending<T> = { key: string; resolve: (value: T | null) => void; reject: (error: unknown) => void };

/** Short-lived query coalescing, not a cache. In-flight results are never reused. */
export class BatchedLookup<T> {
  private pending: Pending<T>[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly fetchMany: (keys: string[]) => Promise<Map<string, T>>) {}

  load(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.pending.push({ key, resolve, reject });
      if (this.pending.length >= 100) {
        clearTimeout(this.timer);
        this.timer = undefined;
        void this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => {
          this.timer = undefined;
          void this.flush();
        }, 5);
      }
    });
  }

  private async flush(): Promise<void> {
    const batch = this.pending;
    this.pending = [];
    if (!batch.length) return;
    try {
      const values = await this.fetchMany([...new Set(batch.map(item => item.key))]);
      for (const item of batch) item.resolve(values.get(item.key) ?? null);
    } catch (error) {
      for (const item of batch) item.reject(error);
    }
  }
}
