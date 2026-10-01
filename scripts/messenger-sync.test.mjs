import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../herbalaifrontend/lib/messenger-sync.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { mergeConversationMessages, createHistoryRequests, startMessengerConnection, updateConversationPreview, reconcileConversationPreviews } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
const message = (id, contact = 'alpha', extra = {}) => ({ id, senderId: 'self', receiverId: contact, time: '2026-10-01T00:00:00.000Z', content: `TEST ONLY ${id}`, ...extra });
const flush = () => new Promise(resolve => setImmediate(resolve));

const contact = id => ({ id, name: `TEST ONLY ${id}` });
const preview = (id, time) => ({ contact: contact(id), lastMessage: `TEST ONLY ${id} initial`, lastTime: time });
const previewMessage = (id, peer, time, extra = {}) => message(id, peer, { sender: contact('self'), receiver: contact(peer), time, ...extra });

test('editing an older conversation retains activity ordering and ignores older message previews', () => {
  const initial = [preview('beta', '2026-10-01T00:00:01.000Z'), preview('alpha', '2026-10-01T00:00:00.000Z')];
  const result = updateConversationPreview(initial, previewMessage(1, 'alpha', initial[1].lastTime, { content: 'TEST ONLY edited' }), 'self');
  assert.deepEqual(result.map(item => item.contact.id), ['beta', 'alpha']);
  assert.equal(result[1].lastMessage, 'TEST ONLY edited');
  assert.deepEqual(updateConversationPreview(result, previewMessage(2, 'beta', initial[1].lastTime), 'self'), result);
  assert.equal(initial[1].lastMessage, 'TEST ONLY alpha initial');
});

test('reconciles a stale sidebar snapshot with concurrent sends, edits, and deletions', () => {
  const initial = [preview('beta', '2026-10-01T00:00:01.000Z'), preview('alpha', '2026-10-01T00:00:00.000Z')];
  const updates = [previewMessage(3, 'beta', '2026-10-01T00:00:02.000Z'), previewMessage(1, 'alpha', initial[1].lastTime, { isDeleted: true, content: '' })];
  const result = reconcileConversationPreviews(initial, updates, 'self');
  assert.equal(result[0].lastMessage, 'TEST ONLY 3');
  assert.equal(result[1].lastMessage, 'This message was deleted');
});

test('keeps a newer server snapshot rather than reverting it with an older buffered event', () => {
  const initial = [preview('alpha', '2026-10-01T00:00:03.000Z')];
  assert.deepEqual(reconcileConversationPreviews(initial, [previewMessage(1, 'alpha', '2026-10-01T00:00:02.000Z')], 'self'), initial);
});

test('creates a new peer preview without substituting the sender for an outgoing recipient', () => {
  const result = updateConversationPreview([], previewMessage(1, 'beta', '2026-10-01T00:00:00.000Z', { imageUrl: 'TEST-only-image' }), 'self');
  assert.equal(result[0].contact.id, 'beta');
  assert.equal(result[0].lastMessage, '📷 Sent an image');
  assert.deepEqual(updateConversationPreview([], previewMessage(1, 'beta', '2026-10-01T00:00:00.000Z', { receiver: undefined }), 'self'), []);
});

test('uses deterministic contact ordering for equal activity times and ignores unrelated events', () => {
  const initial = [preview('beta', '2026-10-01T00:00:00.000Z')];
  const result = updateConversationPreview(initial, previewMessage(1, 'alpha', initial[0].lastTime), 'self');
  assert.deepEqual(result.map(item => item.contact.id), ['alpha', 'beta']);
  assert.deepEqual(updateConversationPreview(result, previewMessage(2, 'beta', initial[0].lastTime, { senderId: 'alpha' }), 'self'), result);
  assert.deepEqual(updateConversationPreview(result, previewMessage(2, 'beta', initial[0].lastTime, { senderId: undefined, receiverId: 'self' }), 'self'), result);
});

const pageSource = await readFile(new URL('../herbalaifrontend/app/messenger/page.tsx', import.meta.url), 'utf8');
const pageSyntax = ts.createSourceFile('messenger.tsx', pageSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
const callbacks = new Map();
const findCallbacks = node => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && ['applyMessage', 'refreshConversations', 'loadUsers'].includes(node.name.text)) {
    callbacks.set(node.name.text, node.initializer.arguments[0].getText(pageSyntax));
  }
  ts.forEachChild(node, findCallbacks);
};
findCallbacks(pageSyntax);
const pickerActions = new Map();
const findPickerActions = node => {
  if (ts.isCallExpression(node) && node.expression.getText(pageSyntax) === 'window.setTimeout' &&
      node.arguments[0]?.getText(pageSyntax).includes("api.get('/messages/users'")) {
    pickerActions.set('legacyLoad', node.arguments[0].getText(pageSyntax));
  }
  if (ts.isJsxElement(node) && node.openingElement.tagName.getText(pageSyntax) === 'button' &&
      node.children.some(child => child.getText(pageSyntax).includes('Load more users'))) {
    const attribute = node.openingElement.attributes.properties.find(item => item.name?.getText(pageSyntax) === 'onClick');
    pickerActions.set('more', attribute.initializer.expression.getText(pageSyntax));
  }
  ts.forEachChild(node, findPickerActions);
};
findPickerActions(pageSyntax);
const pickerHarness = () => {
  let users = [];
  let offset = 0;
  let loading = false;
  let hasMore = false;
  let error = '';
  let lastRequest;
  let search = '';
  const pending = [];
  const queryRef = { current: 0 };
  const loadingRef = { current: false };
  const invoke = (source, ...args) => {
    const context = {
      userOffset: offset, userPickerSearch: search, normalizedUserPickerSearch: search.trim().slice(0, 100),
      cancelled: false, userQueryRef: queryRef, loadingUsersRef: loadingRef,
      setAllUsers: next => { users = typeof next === 'function' ? next(users) : next; },
      setUserOffset: next => { offset = typeof next === 'function' ? next(offset) : next; },
      setLoadingUsers: next => { loading = next; }, setHasMoreUsers: next => { hasMore = next; },
      setUserLoadError: next => { error = next; },
      api: { get: (path, options) => new Promise((resolve, reject) => pending.push({ path, options, resolve, reject })) },
      console: { error: () => {} },
      loadUsers: (...parameters) => { lastRequest = invoke(callbacks.get('loadUsers'), ...parameters); return lastRequest; },
    };
    const compiled = ts.transpileModule(`const callback = ${source}; return callback;`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
    return new Function(...Object.keys(context), compiled)(...Object.values(context))(...args);
  };
  return {
    pending, queryRef, loadingRef,
    first: () => invoke(callbacks.get('loadUsers') ?? pickerActions.get('legacyLoad'), 0),
    more: () => {
      invoke(pickerActions.get('more'));
      return callbacks.has('loadUsers') ? lastRequest : invoke(pickerActions.get('legacyLoad'));
    },
    newSearch: next => { search = next; queryRef.current += 1; loadingRef.current = false; },
    state: () => ({ users, offset, loading, hasMore, error }),
  };
};
const pickerResponse = (users, hasMore = false) => ({ data: { status: 'success', data: { users, hasMore } } });

test('New Chat retries a failed next page at the same offset rather than skipping users', async () => {
  const fixture = pickerHarness();
  const initial = fixture.first();
  fixture.pending[0].resolve(pickerResponse(Array.from({ length: 20 }, (_, index) => contact(`user${index}`)), true));
  await initial;
  const next = fixture.more();
  assert.equal(fixture.pending[1].options.params.offset, 20);
  fixture.pending[1].reject(new Error('TEST ONLY offline'));
  await next;
  const retry = fixture.more();
  assert.equal(fixture.pending[2].options.params.offset, 20);
  fixture.pending[2].resolve(pickerResponse([contact('user20')]));
  await retry;
  assert.equal(fixture.state().users.length, 21);
  assert.equal(fixture.state().offset, 21);
});

test('New Chat deduplicates overlapping pages but advances by the server row count', async () => {
  const fixture = pickerHarness();
  const initial = fixture.first();
  fixture.pending[0].resolve(pickerResponse([contact('alpha')], true));
  await initial;
  const next = fixture.more();
  fixture.pending[1].resolve(pickerResponse([contact('alpha'), contact('beta')]));
  await next;
  assert.deepEqual(fixture.state().users.map(user => user.id), ['alpha', 'beta']);
  assert.equal(fixture.state().offset, 3);
});

test('New Chat displays a recoverable error on first-page failure instead of an empty-search result', async () => {
  const fixture = pickerHarness();
  const request = fixture.first();
  fixture.pending[0].reject(new Error('TEST ONLY unavailable'));
  await request;
  assert.equal(fixture.state().error, 'Unable to load users. Please try again.');
  assert.equal(fixture.state().loading, false);
  assert.equal(fixture.state().offset, 0);
});

test('New Chat bounds requests and normalizes the name or username search', async () => {
  const fixture = pickerHarness();
  fixture.newSearch('  ALPHA  ');
  const request = fixture.first();
  assert.equal(fixture.pending[0].options.timeout, 10000);
  assert.equal(fixture.pending[0].options.params.search, 'ALPHA');
  fixture.pending[0].resolve(pickerResponse([]));
  await request;
});

test('New Chat rejects malformed pages without losing the last successful offset', async () => {
  const fixture = pickerHarness();
  const request = fixture.first();
  fixture.pending[0].resolve(pickerResponse('not an array', true));
  await request;
  assert.equal(fixture.state().error, 'Unable to load users. Please try again.');
  assert.deepEqual(fixture.state().users, []);
  assert.equal(fixture.state().offset, 0);
});

test('New Chat ignores an old search response and does not clear the newer request loading state', async () => {
  const fixture = pickerHarness();
  const oldRequest = fixture.first();
  fixture.newSearch('beta');
  const currentRequest = fixture.first();
  fixture.pending[0].resolve(pickerResponse([contact('alpha')], true));
  await oldRequest;
  assert.deepEqual(fixture.state().users, []);
  assert.equal(fixture.state().loading, true);
  fixture.pending[1].resolve(pickerResponse([contact('beta')]));
  await currentRequest;
  assert.deepEqual(fixture.state().users.map(user => user.id), ['beta']);
  assert.equal(fixture.state().loading, false);
});

test('New Chat prevents simultaneous duplicate requests and stops pagination at an empty final page', async () => {
  const fixture = pickerHarness();
  const first = fixture.first();
  await fixture.first();
  assert.equal(fixture.pending.length, 1);
  fixture.pending[0].resolve(pickerResponse([], true));
  await first;
  assert.equal(fixture.state().hasMore, false);
  assert.equal(fixture.state().offset, 0);
});

const searchExpressions = new Map();
const findSearchExpressions = node => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      ['normalizedConversationSearch', 'filteredConversations'].includes(node.name.text)) {
    searchExpressions.set(node.name.text, node.initializer.getText(pageSyntax));
  }
  ts.forEachChild(node, findSearchExpressions);
};
findSearchExpressions(pageSyntax);
const visibleConversations = (conversations, searchTerm) => {
  const normalization = searchExpressions.get('normalizedConversationSearch') ?? 'searchTerm';
  const filtering = searchExpressions.get('filteredConversations');
  return new Function('conversations', 'searchTerm', `const normalizedConversationSearch = ${normalization}; return ${filtering};`)(conversations, searchTerm);
};

test('conversation name search ignores surrounding whitespace and remains case insensitive', () => {
  const rows = [preview('alpha', ''), preview('beta', '')];
  assert.deepEqual(visibleConversations(rows, '  ALPHA  ').map(row => row.contact.id), ['alpha']);
});

test('whitespace-only conversation search shows all loaded conversations', () => {
  const rows = [preview('alpha', ''), preview('beta', '')];
  assert.deepEqual(visibleConversations(rows, '   \t').map(row => row.contact.id), ['alpha', 'beta']);
});

test('conversation search uses the same 100-character boundary as the API', () => {
  const name = 'a'.repeat(100);
  const rows = [{ contact: { id: 'long', name }, lastMessage: '', lastTime: '' }];
  assert.deepEqual(visibleConversations(rows, `${name}ignored`).map(row => row.contact.id), ['long']);
});

test('conversation name search still hides nonmatching realtime contacts', () => {
  const rows = updateConversationPreview([preview('alpha', '')], previewMessage(2, 'beta', '2026-10-01T00:00:01.000Z'), 'self');
  assert.deepEqual(visibleConversations(rows, 'alpha').map(row => row.contact.id), ['alpha']);
});

const sidebarHarness = () => {
  let conversations = [preview('beta', '2026-10-01T00:00:01.000Z'), preview('alpha', '2026-10-01T00:00:00.000Z')];
  let offset = 0;
  const pending = [];
  const context = {
    user: { id: 'self' }, isAuthenticated: true, debouncedConversationSearch: '',
    conversationQueryRef: { current: 0 }, conversationEventsRef: { current: null },
    historyRequests: { record: () => {} }, activeContactRef: { current: null },
    updateConversationPreview, reconcileConversationPreviews, isConversationMessage: () => false,
    setMessages: () => {},
    setConversations: next => { conversations = typeof next === 'function' ? next(conversations) : next; },
    setConversationOffset: next => { offset = next; }, setHasMoreConversations: () => {},
    api: { get: () => new Promise(resolve => pending.push(resolve)) },
  };
  const compile = name => {
    const text = ts.transpileModule(`const callback = ${callbacks.get(name)}; return callback;`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
    return new Function(...Object.keys(context), text)(...Object.values(context));
  };
  return { context, pending, apply: compile('applyMessage'), refresh: compile('refreshConversations'), state: () => ({ conversations, offset }) };
};

test('the page refresh itself replays pending sidebar events and keeps the server pagination offset', async () => {
  const fixture = sidebarHarness();
  const snapshot = fixture.state().conversations;
  const request = fixture.refresh();
  fixture.apply(previewMessage(3, 'beta', '2026-10-01T00:00:02.000Z', { content: 'TEST ONLY pending edit' }));
  fixture.pending[0]({ data: { status: 'success', data: { conversations: snapshot, hasMore: false } } });
  await request;
  assert.equal(fixture.state().conversations[0].lastMessage, 'TEST ONLY pending edit');
  assert.equal(fixture.state().offset, snapshot.length);
  assert.equal(fixture.context.conversationEventsRef.current, null);
});

test('a superseded page refresh cannot clear the current event buffer or replace current results', async () => {
  const fixture = sidebarHarness();
  const snapshot = fixture.state().conversations;
  const first = fixture.refresh();
  const second = fixture.refresh();
  fixture.apply(previewMessage(4, 'gamma', '2026-10-01T00:00:03.000Z'));
  fixture.pending[0]({ data: { status: 'success', data: { conversations: [], hasMore: false } } });
  await first;
  assert.equal(fixture.context.conversationEventsRef.current.size, 1);
  fixture.pending[1]({ data: { status: 'success', data: { conversations: snapshot, hasMore: false } } });
  await second;
  assert.deepEqual(fixture.state().conversations.map(item => item.contact.id), ['gamma', 'beta', 'alpha']);
  assert.equal(fixture.state().offset, snapshot.length);
});

test('merges by ID, applies edits/deletions, orders ties, and excludes unrelated contacts', () => {
  const result = mergeConversationMessages([message(2), message(1)], [message(2, 'alpha', { content: '', isDeleted: true }), message(3, 'beta')], 'self', 'alpha');
  assert.deepEqual(result.map(record => record.id), [1, 2]);
  assert.equal(result[1].isDeleted, true);
});

test('edits and deletions update loaded records without inserting an unloaded older message', () => {
  const result = mergeConversationMessages([message(2), message(3)], [message(1), message(2, 'alpha', { content: '', isDeleted: true })], 'self', 'alpha', false);
  assert.deepEqual(result.map(record => record.id), [2, 3]);
  assert.equal(result[0].isDeleted, true);
});

test('ignores a history response after switching contact or starting a newer request', () => {
  const requests = createHistoryRequests();
  const old = requests.begin('self', 'alpha');
  const current = requests.begin('self', 'beta');
  assert.equal(requests.finish(old, [message(1)]), null);
  assert.deepEqual(requests.finish(current, [message(2, 'beta')]).map(record => record.id), [2]);
  requests.cancel();
  assert.equal(requests.isCurrent(current), false);
});

test('replays events arriving during a stale HTTP snapshot without losing other history', () => {
  const requests = createHistoryRequests();
  const ticket = requests.begin('self', 'alpha');
  requests.record(message(2, 'alpha', { content: 'TEST ONLY edited' }));
  requests.record(message(3));
  requests.record(message(4, 'beta'));
  const result = requests.finish(ticket, [message(1), message(2)]);
  assert.deepEqual(result.map(record => record.id), [1, 2, 3]);
  assert.equal(result[1].content, 'TEST ONLY edited');
});

test('does not insert an out-of-window old edit into a refreshed latest page', () => {
  const requests = createHistoryRequests();
  const ticket = requests.begin('self', 'alpha');
  requests.record(message(1));
  assert.deepEqual(requests.finish(ticket, [message(2), message(3)]).map(record => record.id), [2, 3]);
});

test('ignores malformed history rows rather than crashing or leaking another conversation', () => {
  assert.deepEqual(mergeConversationMessages([], [null, {}, message(0), message(1, 'alpha', { time: 'invalid' }), message(2)], 'self', 'alpha').map(record => record.id), [2]);
});

const harness = getToken => {
  const events = new Map();
  const scheduled = [];
  const tokens = [];
  let reconciliations = 0;
  let authorizations = 0;
  let connections = 0;
  const socket = {
    connected: false, active: false,
    on(event, callback) { events.set(event, callback); },
    off(event) { events.delete(event); },
    connect() { connections += 1; this.auth(auth => tokens.push(auth.token)); },
    disconnect() { this.connected = false; },
  };
  const connection = startMessengerConnection(socket, {
    getToken,
    onConnected: () => { reconciliations += 1; },
    onAuthorizationFailure: () => { authorizations += 1; },
    onError: () => {},
    schedule(callback) { const task = { callback, cancelled: false }; scheduled.push(task); return () => { task.cancelled = true; }; },
  });
  return { socket, connection, events, scheduled, tokens, counts: () => ({ reconciliations, authorizations, connections }) };
};

test('gets a fresh token on each connection and reconciles after every connect', async () => {
  let counter = 0;
  const fixture = harness(async () => `TEST-only-token-${++counter}`);
  await flush();
  fixture.events.get('connect')();
  fixture.socket.connect();
  await flush();
  fixture.events.get('connect')();
  assert.deepEqual(fixture.tokens, ['TEST-only-token-1', 'TEST-only-token-2']);
  assert.equal(fixture.counts().reconciliations, 2);
  fixture.connection.stop();
});

test('never falls back to guest auth and bounds temporary token-fetch retries', async () => {
  const fixture = harness(async () => { throw new Error('TEST ONLY offline'); });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await flush();
    const task = fixture.scheduled[attempt];
    if (task) task.callback();
  }
  await flush();
  assert.equal(fixture.scheduled.length, 3);
  assert.equal(fixture.counts().connections, 4);
  assert.deepEqual(fixture.tokens, []);
  fixture.connection.stop();
});

test('does not retry terminal authorization failures or server session invalidation', async () => {
  const denied = harness(async () => { throw { response: { status: 401 } }; });
  await flush();
  denied.connection.recover();
  assert.equal(denied.counts().authorizations, 1);
  assert.equal(denied.counts().connections, 1);
  assert.equal(denied.scheduled.length, 0);
  denied.connection.stop();
  const revoked = harness(async () => 'TEST-only-token');
  await flush();
  revoked.events.get('disconnect')('io server disconnect');
  revoked.connection.recover();
  assert.equal(revoked.counts().authorizations, 1);
  assert.equal(revoked.counts().connections, 1);
  revoked.connection.stop();
});

test('ignores pending token callbacks after unmount and cancels retry timers', async () => {
  let release;
  const fixture = harness(() => new Promise(resolve => { release = resolve; }));
  fixture.connection.stop();
  release('TEST-only-stale-token');
  await flush();
  assert.deepEqual(fixture.tokens, []);
  assert.equal(fixture.events.size, 0);
  const failing = harness(async () => { throw new Error('TEST ONLY offline'); });
  await flush();
  failing.connection.stop();
  assert.equal(failing.scheduled[0].cancelled, true);
});

test('ignores an earlier token response after a newer handshake starts', async () => {
  const releases = [];
  const fixture = harness(() => new Promise(resolve => releases.push(resolve)));
  fixture.socket.connect();
  releases[1]('TEST-only-current-token');
  await flush();
  releases[0]('TEST-only-stale-token');
  await flush();
  assert.deepEqual(fixture.tokens, ['TEST-only-current-token']);
  fixture.connection.stop();
});

test('rejects an empty token and allows bounded recovery after a temporary outage', async () => {
  let available = false;
  const fixture = harness(async () => available ? 'TEST-only-recovered-token' : '');
  await flush();
  assert.deepEqual(fixture.tokens, []);
  available = true;
  fixture.connection.recover();
  await flush();
  assert.deepEqual(fixture.tokens, ['TEST-only-recovered-token']);
  assert.equal(fixture.scheduled[0].cancelled, true);
  fixture.connection.stop();
});
