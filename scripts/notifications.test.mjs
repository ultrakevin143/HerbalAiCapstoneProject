import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../herbalaifrontend/components/NotificationBell.tsx', import.meta.url), 'utf8');
const helper = async name => {
  const source = await readFile(new URL(`../herbalaifrontend/lib/${name}.ts`, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
};
const { createRefreshCoordinator } = await helper('refresh-coordinator');
const { isOwnedNotification, notificationSnapshot } = await helper('notification-state');
const syntax = ts.createSourceFile('NotificationBell.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expression = predicate => {
  let found;
  const inspect = node => { if (predicate(node)) found = node; ts.forEachChild(node, inspect); };
  inspect(syntax);
  assert.ok(found, 'actual source expression exists');
  return found;
};
const callback = name => expression(node => ts.isVariableDeclaration(node) && node.name.getText(syntax) === name).initializer.getText(syntax);
const compile = text => ts.transpileModule(`const handler = ${text};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + '\nreturn handler;';
const effect = expression(node => ts.isCallExpression(node) && node.expression.getText(syntax) === 'useEffect' && node.arguments[0]?.getText(syntax).includes("'notification'"));
const deferred = () => { let resolve; const promise = new Promise(accept => { resolve = accept; }); return { promise, resolve }; };
const drain = async () => { for (let index = 0; index < 20; index++) await Promise.resolve(); };
const notification = (id, fields = {}) => ({ id, userId: 'owner-A', title: 'TEST ONLY', message: 'TEST ONLY', type: 'DIRECT_MESSAGE', link: null, isRead: false, createdAt: '2026-10-03T00:00:00.000Z', ...fields });
const snapshot = (notifications, unreadCount = notifications.filter(item => !item.isRead).length) => ({ data: { status: 'success', data: { notifications, unreadCount } } });

const fixture = (options = {}) => {
  let notifications = [];
  let unread = 0;
  let loading = true;
  const listeners = new Map();
  const browserListeners = new Map();
  const reads = [];
  const writes = [];
  const sounds = [];
  const tokenReads = [];
  const activeRef = { current: true };
  const refreshRef = { current: null };
  const pendingReads = { current: new Set() };
  let pending = new Set();
  const setNotifications = update => { notifications = typeof update === 'function' ? update(notifications) : update; };
  const setUnreadCount = update => { unread = typeof update === 'function' ? update(unread) : update; };
  const setReadingIds = update => { pending = typeof update === 'function' ? update(pending) : update; };
  const cachedApiGet = (...args) => { reads.push(args); return options.get?.(...args) ?? Promise.resolve(snapshot([])); };
  const api = {
    get: (...args) => { tokenReads.push(args); return options.tokenGet?.(...args) ?? Promise.resolve({ data: { data: { token: `TEST-only-${tokenReads.length}` } } }); },
    patch: (...args) => { writes.push(args); return options.patch?.(...args) ?? Promise.resolve({}); },
  };
  let socketOptions;
  const socket = { on: (name, handler) => listeners.set(name, handler), connect() {}, disconnect() {} };
  const window = { addEventListener: (name, handler) => browserListeners.set(name, handler), removeEventListener: name => browserListeners.delete(name) };
  const document = { visibilityState: 'visible', addEventListener: window.addEventListener, removeEventListener: window.removeEventListener };
  const requireArguments = {
    cachedApiGet, invalidateApiGetCache() {}, api, window, document,
    io: (url, config) => { socketOptions = config; return options.io?.(url, config) ?? socket; }, userId: options.userId ?? 'owner-A',
    setNotifications, setUnreadCount, setLoading: value => { loading = value; },
    playNotificationSound: async id => sounds.push(id), prepareNotificationSound() {},
    process: { env: { NEXT_PUBLIC_SOCKET_URL: options.socketUrl } }, console: { error() {} }, activeRef, refreshRef, pendingReads, setReadingIds,
    setIsOpen() {},
    createRefreshCoordinator, isOwnedNotification, notificationSnapshot,
  };
  const run = text => new Function(...Object.keys(requireArguments), compile(text))(...Object.values(requireArguments));
  requireArguments.performRead = run(callback('performRead'));
  const setup = run(effect.arguments[0].getText(syntax));
  const markOne = run(callback('handleMarkAsRead'));
  const markAll = run(callback('handleMarkAllAsRead'));
  return { setup, markOne, markAll, notifications: () => notifications, unread: () => unread, loading: () => loading,
    listeners, browserListeners, reads, writes, sounds, pending: () => pending, socketOptions: () => socketOptions, document, tokenReads };
};

test('private notification reads include the explicit account cache scope', async () => {
  const state = fixture(); const cleanup = state.setup(); await drain();
  assert.equal(state.reads[0][3], 'owner-A'); cleanup();
});

test('the badge uses the server total, not only unread rows in the limited list', async () => {
  const state = fixture({ get: async () => snapshot([notification(1)], 120) });
  const cleanup = state.setup(); await drain(); assert.equal(state.unread(), 120); cleanup();
});

test('duplicate realtime notifications cannot duplicate rows or inflate the count', async () => {
  const state = fixture({ get: async () => snapshot([notification(1)]) });
  const cleanup = state.setup(); await drain();
  state.listeners.get('notification')(notification(1)); state.listeners.get('notification')(notification(1)); await drain();
  assert.equal(state.notifications().length, 1); assert.equal(state.unread(), 1); cleanup();
});

test('another account event cannot enter the current list or play its sound', async () => {
  const state = fixture(); const cleanup = state.setup(); await drain();
  state.listeners.get('notification')(notification(2, { userId: 'owner-B' })); await drain();
  assert.deepEqual(state.notifications(), []); assert.equal(state.unread(), 0); assert.deepEqual(state.sounds, []); cleanup();
});

test('a stale initial snapshot cannot overwrite a newer realtime refresh', async () => {
  const old = deferred(); let reads = 0;
  const state = fixture({ get: () => ++reads === 1 ? old.promise : Promise.resolve(snapshot([notification(2)])) });
  const cleanup = state.setup(); await drain(); state.listeners.get('notification')(notification(2)); await drain();
  old.resolve(snapshot([])); await drain();
  assert.deepEqual(state.notifications().map(item => item.id), [2]); assert.equal(state.unread(), 1); cleanup();
});

test('marking an already read row does not decrement a different unread notification', async () => {
  const state = fixture({ get: async () => snapshot([notification(1, { isRead: true }), notification(2)]) });
  const cleanup = state.setup(); await drain(); await state.markOne(1); assert.equal(state.unread(), 1); cleanup();
});

test('a notification arriving after a bulk-read write stays unread', async () => {
  const write = deferred(); let readCompleted = false;
  const state = fixture({ patch: () => write.promise, get: async () => snapshot(readCompleted
    ? [notification(2), notification(1, { isRead: true })] : [notification(1)]) });
  const cleanup = state.setup(); await drain(); const completion = state.markAll();
  readCompleted = true; state.listeners.get('notification')(notification(2)); await drain();
  write.resolve({}); await completion; await drain();
  assert.equal(state.notifications().find(item => item.id === 2).isRead, false); assert.equal(state.unread(), 1); cleanup();
});

test('reconnect has a canonical notification refresh handler', async () => {
  const state = fixture(); const cleanup = state.setup(); await drain();
  assert.equal(typeof state.listeners.get('connect'), 'function');
  const before = state.reads.length; state.listeners.get('connect')(); await drain();
  assert.equal(state.reads.length, before + 1); cleanup();
});

test('the rendered bell is keyed to its authenticated account', () => {
  assert.match(source, /<AccountNotificationBell\s+key=\{user\.id\}\s+userId=\{user\.id\}/);
});

test('duplicate IDs in a snapshot render once while retaining the server total', () => {
  const state = notificationSnapshot({ notifications: [notification(1), notification(1)], unreadCount: 40 }, 'owner-A');
  assert.equal(state.notifications.length, 1); assert.equal(state.unreadCount, 40);
});

test('invalid or foreign snapshots fail closed instead of displaying another account', () => {
  for (const notifications of [null, {}, [notification(1, { userId: 'owner-B' })], [notification(1, { id: '1' })], [null]]) {
    assert.throws(() => notificationSnapshot({ notifications, unreadCount: 99 }, 'owner-A'), /Invalid notification snapshot/);
  }
});

test('invalid unread totals fall back to confirmed visible unread rows', () => {
  for (const unreadCount of [undefined, -1, 1.5, '99', Infinity, NaN]) {
    assert.equal(notificationSnapshot({ notifications: [notification(1)], unreadCount }, 'owner-A').unreadCount, 1);
  }
});

test('unknown malformed events neither fetch nor play a sound', async () => {
  const state = fixture(); const cleanup = state.setup(); await drain(); const reads = state.reads.length;
  for (const value of [null, {}, notification(1, { id: 0 }), notification(1, { isRead: 'false' })]) state.listeners.get('notification')(value);
  await drain(); assert.equal(state.reads.length, reads); assert.deepEqual(state.sounds, []); cleanup();
});

test('new direct-message notification sound is requested once for duplicate delivery', async () => {
  const state = fixture(); const cleanup = state.setup(); await drain();
  state.listeners.get('notification')(notification(2)); state.listeners.get('notification')(notification(2)); await drain();
  assert.deepEqual(state.sounds, [2]); cleanup();
});

test('focus and a visible tab resume refresh without polling hidden tabs', async () => {
  const state = fixture(); const cleanup = state.setup(); await drain(); const reads = state.reads.length;
  state.document.visibilityState = 'hidden'; state.browserListeners.get('visibilitychange')(); await drain();
  assert.equal(state.reads.length, reads);
  state.document.visibilityState = 'visible'; state.browserListeners.get('visibilitychange')(); state.browserListeners.get('focus')(); await drain();
  assert.equal(state.reads.length, reads + 1); cleanup();
});

test('fresh socket credentials are fetched for each authorization attempt', async () => {
  const state = fixture(); const cleanup = state.setup(); await drain(); const received = [];
  assert.equal(typeof state.socketOptions().auth, 'function');
  state.socketOptions().auth(value => received.push(value)); await drain();
  state.socketOptions().auth(value => received.push(value)); await drain();
  assert.deepEqual(received, [{ token: 'TEST-only-1' }, { token: 'TEST-only-2' }]); cleanup();
});

test('cleanup aborts token requests and discards a late authorization response', async () => {
  const token = deferred(); const state = fixture({ tokenGet: () => token.promise });
  const cleanup = state.setup(); await drain(); const received = [];
  state.socketOptions().auth(value => received.push(value)); cleanup();
  assert.equal(state.tokenReads[0][1].signal.aborted, true);
  token.resolve({ data: { data: { token: 'TEST obsolete' } } }); await drain();
  assert.deepEqual(received, []);
});

test('old account reads and listeners cannot update a replacement account fixture', async () => {
  const old = deferred(); const first = fixture({ get: () => old.promise }); const cleanupFirst = first.setup(); await drain();
  cleanupFirst(); const second = fixture({ userId: 'owner-B', get: async () => snapshot([notification(3, { userId: 'owner-B' })]) }); const cleanupSecond = second.setup(); await drain();
  old.resolve(snapshot([notification(1)])); first.listeners.get('notification')(notification(2)); await drain();
  assert.deepEqual(first.notifications(), []); assert.deepEqual(second.notifications().map(item => item.id), [3]); cleanupSecond();
});

test('duplicate read clicks share one write and release their busy state after canonical refresh', async () => {
  const write = deferred(); const state = fixture({ patch: () => write.promise }); const cleanup = state.setup(); await drain();
  const first = state.markOne(1); const duplicate = state.markOne(1); assert.equal(state.writes.length, 1);
  assert.equal(state.pending().has(1), true); write.resolve({}); await Promise.all([first, duplicate]);
  assert.equal(state.pending().size, 0); cleanup();
});

test('failed read mutation and refresh retain confirmed state and release controls', async () => {
  let failRead = false;
  const state = fixture({ get: async () => { if (failRead) throw new Error('TEST offline'); return snapshot([notification(1)]); }, patch: async () => { throw new Error('TEST write failure'); } });
  const cleanup = state.setup(); await drain(); failRead = true; await state.markOne(1);
  assert.equal(state.unread(), 1); assert.equal(state.notifications()[0].isRead, false); assert.equal(state.pending().size, 0); cleanup();
});

test('a bulk mutation excludes conflicting single-row mutations until it settles', async () => {
  const write = deferred(); const state = fixture({ patch: () => write.promise }); const cleanup = state.setup(); await drain();
  const all = state.markAll(); const one = state.markOne(1); assert.equal(state.writes.length, 1);
  assert.equal(state.pending().has('all'), true); write.resolve({}); await Promise.all([all, one]); cleanup();
});

test('a foreign cached response cannot produce another account badge or list', async () => {
  const state = fixture({ get: async () => snapshot([notification(3, { userId: 'owner-B' })], 99) });
  const cleanup = state.setup(); await drain(); assert.deepEqual(state.notifications(), []); assert.equal(state.unread(), 0); cleanup();
});

test('real loopback reconnect obtains a fresh token and retrieves events missed while disconnected', { timeout: 10000 }, async () => {
  const backendRequire = createRequire(new URL('../herbalaibackend/package.json', import.meta.url));
  const frontendRequire = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
  const { Server } = backendRequire('socket.io');
  const { io } = frontendRequire('socket.io-client');
  const http = createServer();
  const server = new Server(http);
  const sockets = [];
  const accepted = [];
  let requiredToken = 'TEST-only-1';
  server.use((socket, next) => {
    if (socket.handshake.auth.token !== requiredToken) return next(new Error('TEST obsolete credential'));
    accepted.push(socket.handshake.auth.token); next();
  });
  server.on('connection', socket => sockets.push(socket));
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  let client;
  let cleanup;
  let stored = [];
  const waitUntil = async predicate => {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      if (predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('TEST loopback reconnect deadline exceeded');
  };
  try {
    const state = fixture({ socketUrl: `http://127.0.0.1:${http.address().port}`,
      get: async () => snapshot(stored),
      io: (url, config) => {
        client = io(url, { ...config, transports: ['websocket'], reconnectionDelay: 20, reconnectionDelayMax: 20, randomizationFactor: 0, timeout: 2000 });
        return client;
      },
    });
    cleanup = state.setup();
    await waitUntil(() => client.connected && accepted.length === 1 && !state.loading());
    requiredToken = 'TEST-only-2';
    stored = [notification(4)];
    sockets[0].conn.close();
    await waitUntil(() => client.connected && accepted.length === 2 && state.notifications().some(item => item.id === 4));
    assert.deepEqual(accepted, ['TEST-only-1', 'TEST-only-2']);
    assert.equal(state.tokenReads.length, 2);
    assert.equal(state.unread(), 1);
  } finally {
    cleanup?.(); client?.disconnect();
    await new Promise(resolve => server.close(resolve));
    if (http.listening) await new Promise(resolve => http.close(resolve));
  }
});
