export const createRefreshCoordinator = (refresh: () => Promise<void>, isActive: () => boolean = () => true): (() => Promise<void>) => {
  let pending: Promise<void> | null = null;
  let dirty = false;
  return () => {
    dirty = true;
    if (!pending) {
      pending = Promise.resolve().then(async () => {
        try {
          while (dirty && isActive()) {
            dirty = false;
            await refresh();
          }
        } finally {
          pending = null;
        }
      });
    }
    return pending;
  };
};
