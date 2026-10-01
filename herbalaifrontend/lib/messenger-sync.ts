import type { Socket } from 'socket.io-client';

export type MessageIdentity = { id: number; senderId: string; receiverId: string; time: string };

export const isConversationMessage = (message: MessageIdentity, userId: string, contactId: string) =>
  !!message && Number.isInteger(message.id) && message.id > 0 &&
  typeof message.time === 'string' && Number.isFinite(Date.parse(message.time)) &&
  ((message.senderId === userId && message.receiverId === contactId) ||
  (message.receiverId === userId && message.senderId === contactId));

const compareMessages = (first: MessageIdentity, second: MessageIdentity) =>
  Date.parse(first.time) - Date.parse(second.time) || first.id - second.id;

export const mergeConversationMessages = <Message extends MessageIdentity>(
  current: Message[], incoming: Message[], userId: string, contactId: string, allowInsert = true,
): Message[] => {
  const messages = new Map<number, Message>();
  for (const message of current) {
    if (isConversationMessage(message, userId, contactId)) messages.set(message.id, message);
  }
  for (const message of incoming) {
    if (isConversationMessage(message, userId, contactId) && (allowInsert || messages.has(message.id))) messages.set(message.id, message);
  }
  return [...messages.values()].sort(compareMessages);
};

export const createHistoryRequests = <Message extends MessageIdentity>() => {
  let revision = 0;
  let current: { revision: number; userId: string; contactId: string } | null = null;
  let pending = false;
  const updates = new Map<number, Message>();
  return {
    begin(userId: string, contactId: string) {
      current = { revision: ++revision, userId, contactId };
      pending = true;
      updates.clear();
      return current;
    },
    isCurrent(request: { revision: number }) { return current?.revision === request.revision; },
    record(message: Message) {
      if (pending && current && isConversationMessage(message, current.userId, current.contactId)) updates.set(message.id, message);
    },
    finish(request: { revision: number; userId: string; contactId: string }, snapshot: Message[]) {
      if (current?.revision !== request.revision) return null;
      const page = mergeConversationMessages([], snapshot, request.userId, request.contactId);
      const ids = new Set(page.map(message => message.id));
      const oldest = page[0];
      const recentUpdates = [...updates.values()].filter(message => !oldest || ids.has(message.id) || compareMessages(message, oldest) >= 0);
      pending = false;
      updates.clear();
      return mergeConversationMessages(page, recentUpdates, request.userId, request.contactId);
    },
    cancel() { current = null; pending = false; updates.clear(); revision += 1; },
  };
};

type ConnectionOptions = {
  getToken: () => Promise<string>;
  onConnected: () => void;
  onAuthorizationFailure: () => void;
  onError: (error: unknown) => void;
  schedule?: (callback: () => void) => () => void;
};

export const startMessengerConnection = (socket: Socket, options: ConnectionOptions) => {
  let active = true;
  let generation = 0;
  let pending = false;
  let authorizationFailed = false;
  let retries = 0;
  let cancelRetry: (() => void) | undefined;
  const schedule = options.schedule ?? ((callback: () => void) => {
    const timer = setTimeout(callback, 3000);
    return () => clearTimeout(timer);
  });
  const retry = () => {
    if (!active || authorizationFailed || retries >= 3 || cancelRetry) return;
    retries += 1;
    cancelRetry = schedule(() => { cancelRetry = undefined; if (active) socket.connect(); });
  };
  const failAuthorization = () => {
    generation += 1;
    pending = false;
    authorizationFailed = true;
    cancelRetry?.();
    cancelRetry = undefined;
    options.onAuthorizationFailure();
  };
  socket.auth = callback => {
    const request = ++generation;
    pending = true;
    void options.getToken().then(token => {
      if (!active || request !== generation) return;
      if (typeof token !== 'string' || !token) throw new Error('Messenger authentication returned no token.');
      pending = false;
      callback({ token });
    }).catch(error => {
      if (!active || request !== generation) return;
      pending = false;
      socket.disconnect();
      options.onError(error);
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      if (status === 401 || status === 403) failAuthorization();
      else retry();
    });
  };
  const connected = () => { retries = 0; cancelRetry?.(); cancelRetry = undefined; options.onConnected(); };
  const connectionError = (error: Error) => { options.onError(error); if (!socket.active) retry(); };
  const disconnected = (reason: string) => { if (reason === 'io server disconnect') failAuthorization(); };
  socket.on('connect', connected);
  socket.on('connect_error', connectionError);
  socket.on('disconnect', disconnected);
  socket.connect();
  return {
    recover() {
      if (!active || authorizationFailed || socket.connected || pending) return;
      cancelRetry?.(); cancelRetry = undefined; retries = 0;
      socket.connect();
    },
    stop() {
      active = false; generation += 1;
      cancelRetry?.(); cancelRetry = undefined;
      socket.off('connect', connected);
      socket.off('connect_error', connectionError);
      socket.off('disconnect', disconnected);
      socket.disconnect();
    },
  };
};
