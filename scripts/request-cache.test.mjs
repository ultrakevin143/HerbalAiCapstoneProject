import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../herbalaifrontend/lib/request-cache.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
};
const fixture = () => {
  const requests = [];
  let now = 100;
  const exports = {};
  const api = { get: url => { const gate = deferred(); requests.push({ url, ...gate }); return gate.promise; } };
  new Function('require', 'exports', 'Date', compiled)(() => ({ default: api }), exports, { now: () => now });
  return { ...exports, requests, advance: elapsed => { now += elapsed; } };
};
const response = owner => ({ data: { status: 'success', data: { owner } } });

test('a fulfilled response is reused only within its TTL', async () => {
  const state = fixture();
  const first = state.cachedApiGet('/public', 50);
  state.requests[0].resolve(response('public'));
  assert.equal(await state.cachedApiGet('/public', 50), await first);
  state.advance(51);
  const expired = state.cachedApiGet('/public', 50);
  assert.equal(state.requests.length, 2);
  state.requests[1].resolve(response('fresh'));
  assert.equal((await expired).data.data.owner, 'fresh');
});

test('same-scope concurrent callers share one read', async () => {
  const state = fixture();
  const requests = Array.from({ length: 8 }, () => state.cachedApiGet('/notifications', 100, false, 'owner-A'));
  assert.equal(state.requests.length, 1);
  state.requests[0].resolve(response('A'));
  assert.ok((await Promise.all(requests)).every(item => item.data.data.owner === 'A'));
});

test('different owners never share private pending or cached responses', async () => {
  const state = fixture();
  const first = state.cachedApiGet('/notifications', 100, false, 'owner-A');
  const second = state.cachedApiGet('/notifications', 100, false, 'owner-B');
  assert.equal(state.requests.length, 2);
  state.requests[1].resolve(response('B'));
  state.requests[0].resolve(response('A'));
  assert.equal((await first).data.data.owner, 'A');
  assert.equal((await second).data.data.owner, 'B');
  assert.equal((await state.cachedApiGet('/notifications', 100, false, 'owner-A')).data.data.owner, 'A');
  assert.equal((await state.cachedApiGet('/notifications', 100, false, 'owner-B')).data.data.owner, 'B');
});

test('forced refresh supersedes a late older response without corrupting the cache', async () => {
  const state = fixture();
  const old = state.cachedApiGet('/public');
  const fresh = state.cachedApiGet('/public', 100, true);
  state.requests[1].resolve(response('fresh'));
  await fresh;
  state.requests[0].resolve(response('old'));
  await old;
  assert.equal((await state.cachedApiGet('/public')).data.data.owner, 'fresh');
});

test('invalidated pending responses cannot repopulate a cleared cache', async () => {
  const state = fixture();
  const old = state.cachedApiGet('/notifications');
  state.invalidateApiGetCache();
  state.requests[0].resolve(response('old'));
  await old;
  const fresh = state.cachedApiGet('/notifications');
  assert.equal(state.requests.length, 2);
  state.requests[1].resolve(response('fresh'));
  await fresh;
});

test('prefix invalidation preserves unrelated public responses', async () => {
  const state = fixture();
  const notifications = state.cachedApiGet('/notifications');
  const catalog = state.cachedApiGet('/herbs/catalog');
  state.requests[0].resolve(response('private'));
  state.requests[1].resolve(response('public'));
  await Promise.all([notifications, catalog]);
  state.invalidateApiGetCache('/notifications');
  assert.equal((await state.cachedApiGet('/herbs/catalog')).data.data.owner, 'public');
  const fresh = state.cachedApiGet('/notifications');
  assert.equal(state.requests.length, 3);
  state.requests[2].resolve(response('fresh'));
  await fresh;
});

test('rejected reads are not cached and do not strand future callers', async () => {
  const state = fixture();
  const failure = state.cachedApiGet('/public');
  state.requests[0].reject(new Error('TEST offline'));
  await assert.rejects(failure, /TEST offline/);
  const retry = state.cachedApiGet('/public');
  state.requests[1].resolve(response('retry'));
  assert.equal((await retry).data.data.owner, 'retry');
});

test('zero TTL reads can deduplicate in flight but do not leave a response cache', async () => {
  const state = fixture();
  const first = state.cachedApiGet('/public', 0);
  const joined = state.cachedApiGet('/public', 0);
  assert.equal(state.requests.length, 1);
  state.requests[0].resolve(response('first'));
  await Promise.all([first, joined]);
  const next = state.cachedApiGet('/public', 0);
  assert.equal(state.requests.length, 2);
  state.requests[1].resolve(response('next'));
  await next;
});

test('prefix invalidation clears completed responses across every owner', async () => {
  const state = fixture();
  const first = state.cachedApiGet('/notifications', 100, false, 'owner-A');
  const second = state.cachedApiGet('/notifications', 100, false, 'owner-B');
  state.requests[0].resolve(response('A')); state.requests[1].resolve(response('B'));
  await Promise.all([first, second]);
  state.invalidateApiGetCache('/notifications');
  const nextFirst = state.cachedApiGet('/notifications', 100, false, 'owner-A');
  const nextSecond = state.cachedApiGet('/notifications', 100, false, 'owner-B');
  assert.equal(state.requests.length, 4);
  state.requests[2].resolve(response('fresh-A')); state.requests[3].resolve(response('fresh-B'));
  await Promise.all([nextFirst, nextSecond]);
});

test('an invalidated owner request cannot overwrite its newer replacement', async () => {
  const state = fixture();
  const old = state.cachedApiGet('/notifications', 100, false, 'owner-A');
  state.invalidateApiGetCache('/notifications');
  const fresh = state.cachedApiGet('/notifications', 100, false, 'owner-A');
  state.requests[1].resolve(response('new')); await fresh;
  state.requests[0].resolve(response('old')); await old;
  assert.equal((await state.cachedApiGet('/notifications', 100, false, 'owner-A')).data.data.owner, 'new');
});

test('scoped notification invalidation does not evict unrelated public cache entries', async () => {
  const state = fixture();
  const privateRead = state.cachedApiGet('/notifications', 100, false, 'owner-A');
  const publicRead = state.cachedApiGet('/herbs/catalog');
  state.requests[0].resolve(response('A')); state.requests[1].resolve(response('public'));
  await Promise.all([privateRead, publicRead]);
  state.invalidateApiGetCache('/notifications');
  assert.equal((await state.cachedApiGet('/herbs/catalog')).data.data.owner, 'public');
  assert.equal(state.requests.length, 2);
});

test('scope serialization separates anonymous keys from similar literal owner names', async () => {
  const state = fixture();
  const reads = [state.cachedApiGet('/notifications'), state.cachedApiGet('/notifications', 100, false, 'null'), state.cachedApiGet('/notifications', 100, false, '')];
  assert.equal(state.requests.length, 3);
  state.requests.forEach((request, index) => request.resolve(response(index)));
  assert.deepEqual((await Promise.all(reads)).map(item => item.data.data.owner), [0, 1, 2]);
});
