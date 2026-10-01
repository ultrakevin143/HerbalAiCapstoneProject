import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../herbalaifrontend/lib/messenger-sync.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { mergeConversationMessages, createHistoryRequests, startMessengerConnection } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
const message = (id, contact = 'alpha', extra = {}) => ({ id, senderId: 'self', receiverId: contact, time: '2026-10-01T00:00:00.000Z', content: `TEST ONLY ${id}`, ...extra });
const flush = () => new Promise(resolve => setImmediate(resolve));

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
