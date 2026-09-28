type SessionInvalidationListener = (userId: string) => void;

const listeners = new Set<SessionInvalidationListener>();

export const onSessionInvalidated = (listener: SessionInvalidationListener): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const notifySessionInvalidated = (userId: string): void => {
  for (const listener of listeners) listener(userId);
};
