import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../herbalaifrontend/components/HerbComments.tsx', import.meta.url), 'utf8');
const syntax = ts.createSourceFile('HerbComments.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const helperSource = await readFile(new URL('../herbalaifrontend/lib/library-discussion.ts', import.meta.url), 'utf8');
const coordinatorSource = await readFile(new URL('../herbalaifrontend/lib/refresh-coordinator.ts', import.meta.url), 'utf8');
const coordinatorOutput = ts.transpileModule(coordinatorSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const coordinator = await import(`data:text/javascript;base64,${Buffer.from(coordinatorOutput).toString('base64')}`);
const helperOutput = ts.transpileModule(helperSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const helperExports = {};
new Function('require', 'exports', helperOutput)((name) => {
  assert.equal(name, './refresh-coordinator');
  return coordinator;
}, helperExports);
const { reconcileDeletedComments, createDiscussionRefresh } = helperExports;
const compile = expression => ts.transpileModule(`const handler = ${expression};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText + '\nreturn handler;';
const findExpression = (predicate, optional = false) => {
  let found;
  const inspect = node => {
    if (predicate(node)) found = node;
    ts.forEachChild(node, inspect);
  };
  inspect(syntax);
  if (!optional) assert.ok(found, 'component expression exists');
  return found;
};
const callback = (name, optional = false) => {
  const declaration = findExpression(node => ts.isVariableDeclaration(node) && node.name.getText(syntax) === name, optional);
  if (!declaration) return undefined;
  return ts.isCallExpression(declaration.initializer) ? declaration.initializer.arguments[0].getText(syntax) : declaration.initializer.getText(syntax);
};
const deletionEvent = findExpression(node => ts.isCallExpression(node) && node.expression.getText(syntax) === "socketRef.current.on" && node.arguments[0]?.text === 'comment_deleted');
const parent = { id: 7, parentCommentId: null, content: 'TEST parent' };
const reply = { id: 8, parentCommentId: 7, content: 'TEST retained reply' };
const nested = { id: 9, parentCommentId: 8, content: 'TEST nested reply' };

const harness = () => {
  let comments = [parent, reply, nested];
  let replyingTo = 7;
  const deletedCommentIds = { current: new Set() };
  const versions = new Map();
  const markCommentChanged = id => versions.set(id, (versions.get(id) ?? 0) + 1);
  const markCommentDeleted = id => { deletedCommentIds.current.add(id); markCommentChanged(id); };
  const setComments = update => { comments = typeof update === 'function' ? update(comments) : update; };
  const setReplyingTo = update => { replyingTo = typeof update === 'function' ? update(replyingTo) : update; };
  const removalSource = callback('removeComment', true);
  const removeComment = removalSource && new Function('markCommentDeleted', 'setComments', 'deletedCommentIds', 'setReplyingTo', 'reconcileDeletedComments', compile(removalSource)) (
    markCommentDeleted, setComments, deletedCommentIds, setReplyingTo, reconcileDeletedComments,
  );
  const onDelete = new Function('removeComment', 'markCommentDeleted', 'setComments', 'isCurrentSocket', compile(deletionEvent.arguments[1].getText(syntax)))(removeComment, markCommentDeleted, setComments, () => true);
  const appendComment = new Function('deletedCommentIds', 'markCommentChanged', 'setComments', 'reconcileDeletedComments', 'knownCommentIds', compile(callback('appendComment')))(deletedCommentIds, markCommentChanged, setComments, reconcileDeletedComments, { current: new Set([7, 8, 9]) });
  return { onDelete, appendComment, deletedCommentIds, versions, comments: () => comments, replyingTo: () => replyingTo };
};

test('a realtime parent deletion retains its replies immediately with database-compatible roots', () => {
  const state = harness();
  state.onDelete(7);
  assert.deepEqual(state.comments(), [{ ...reply, parentCommentId: null }, nested]);
  assert.equal(state.replyingTo(), null);
});

test('duplicate deletion events do not remove or duplicate retained replies', () => {
  const state = harness();
  state.onDelete(7);
  state.onDelete(7);
  assert.deepEqual(state.comments(), [{ ...reply, parentCommentId: null }, nested]);
});

test('a delayed new reply to a removed parent is retained as a root', () => {
  const state = harness();
  state.onDelete(7);
  state.appendComment({ id: 10, parentCommentId: 7, content: 'TEST delayed reply' });
  assert.equal(state.comments().find(comment => comment.id === 10).parentCommentId, null);
});

test('a delayed parent event cannot resurrect a deleted comment', () => {
  const state = harness();
  state.onDelete(7);
  state.appendComment(parent);
  assert.equal(state.comments().some(comment => comment.id === 7), false);
});

test('deleting a reply promotes its direct child and leaves other comments intact', () => {
  const state = harness();
  state.onDelete(8);
  assert.deepEqual(state.comments(), [parent, { ...nested, parentCommentId: null }]);
});

test('the rendered grouping keeps retained grandchildren visible under the promoted root', () => {
  const state = harness();
  state.onDelete(7);
  const group = new Function('comments', compile(callback('topLevelComments')))(state.comments());
  assert.deepEqual(group(), [{ ...reply, parentCommentId: null, replies: [nested] }]);
});

test('a stale fetched parent/reply snapshot cannot undo local deletion and reply promotion', async () => {
  const state = harness();
  let resolveFetch;
  const pending = new Promise(resolve => { resolveFetch = resolve; });
  let comments = [parent, reply, nested];
  const deletedCommentIds = state.deletedCommentIds;
  const mutationVersion = { current: 0 };
  const commentVersions = { current: new Map() };
  const fetchSequence = { current: 0 };
  const setComments = update => { comments = update(comments); };
  const request = new Function('mutationVersion', 'fetchSequence', 'api', 'herbId', 'commentVersions', 'deletedCommentIds', 'setComments', 'setLoading', 'reconcileDeletedComments', 'discussionActive', 'fetchAbortController', 'knownCommentIds', compile(callback('fetchCommentsCallback')))(
    mutationVersion, fetchSequence, { get: () => pending }, 'TEST-herb', commentVersions,
    deletedCommentIds, setComments, () => {}, reconcileDeletedComments, { current: true }, { current: null }, { current: new Set([7, 8, 9]) },
  );
  const completion = request();
  state.onDelete(7);
  comments = state.comments();
  mutationVersion.current++;
  commentVersions.current.set(7, mutationVersion.current);
  resolveFetch({ data: { status: 'success', data: { comments: [parent, reply, nested] } } });
  await completion;
  assert.deepEqual(comments, [{ ...reply, parentCommentId: null }, nested]);
});

test('failed local deletion preserves comments and the pending reply composer', async () => {
  const state = harness();
  let notices = 0;
  let removed = 0;
  const handler = new Function('window', 'api', 'removeComment', 'markCommentDeleted', 'setComments', 'alert', 'console', compile(callback('handleDeleteComment')))(
    { confirm: () => true }, { delete: async () => { throw new Error('TEST ONLY offline'); } },
    () => removed++, () => removed++, () => removed++, () => notices++, { error() {} },
  );
  await handler(7);
  assert.equal(removed, 0);
  assert.equal(notices, 1);
  assert.deepEqual(state.comments(), [parent, reply, nested]);
  assert.equal(state.replyingTo(), 7);
});

test('confirmed local deletion uses the same reconciliation as the realtime event', async () => {
  const state = harness();
  const handler = new Function('window', 'api', 'removeComment', compile(callback('handleDeleteComment')))(
    { confirm: () => true }, { delete: async () => {} }, state.onDelete,
  );
  await handler(7);
  assert.deepEqual(state.comments(), [{ ...reply, parentCommentId: null }, nested]);
});

test('canceled confirmation performs no API write or local mutation', async () => {
  let writes = 0;
  let removed = 0;
  const handler = new Function('window', 'api', 'removeComment', compile(callback('handleDeleteComment')))(
    { confirm: () => false }, { delete: async () => writes++ }, () => removed++,
  );
  await handler(7);
  assert.equal(writes, 0);
  assert.equal(removed, 0);
});

test('the shared reconciliation preserves the source and handles simultaneous parent/child removals', () => {
  const initial = [parent, reply, nested];
  assert.deepEqual(reconcileDeletedComments(initial, new Set([7, 8])), [{ ...nested, parentCommentId: null }]);
  assert.deepEqual(initial, [parent, reply, nested]);
});

test('unrelated deletions do not alter comment content, reactions or ancestry', () => {
  const initial = [{ ...reply, likes: 3, userLikes: [{ userId: 'TEST ONLY' }] }];
  const output = reconcileDeletedComments(initial, new Set([999]));
  assert.deepEqual(output, initial);
  assert.equal(output[0], initial[0]);
});

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
};
const drain = async () => { for (let index = 0; index < 12; index++) await Promise.resolve(); };
const effect = findExpression(node => ts.isCallExpression(node) && node.expression.getText(syntax) === 'useEffect' &&
  node.arguments[0]?.getText(syntax).includes("'comment_liked'"));

const timingHarness = (options = {}) => {
  let comments = [{ ...parent, herbId: 'TEST-herb', likes: 0, userLikes: [] }];
  const listeners = new Map();
  const mutationVersion = { current: 0 };
  const commentVersions = { current: new Map() };
  const deletedCommentIds = { current: new Set() };
  const knownCommentIds = { current: new Set([7]) };
  const fetchSequence = { current: 0 };
  const fetchAbortController = { current: null };
  const discussionActive = { current: true };
  const pendingLikeIds = { current: new Set() };
  let pending = new Set();
  let reads = 0;
  let writes = 0;
  const api = {
    get: (...args) => { reads++; return options.get?.(...args) ?? Promise.resolve({ data: { status: 'success', data: { comments } } }); },
    post: (...args) => { writes++; return options.post?.(...args) ?? Promise.resolve({ data: { data: { comment: comments[0] } } }); },
  };
  const setComments = update => { comments = typeof update === 'function' ? update(comments) : update; };
  const setLikingCommentIds = update => { pending = typeof update === 'function' ? update(pending) : update; };
  const markCommentChanged = id => commentVersions.current.set(id, ++mutationVersion.current);
  const fetchCommentsCallback = new Function('mutationVersion', 'fetchSequence', 'api', 'herbId', 'commentVersions',
    'deletedCommentIds', 'knownCommentIds', 'setComments', 'setLoading', 'reconcileDeletedComments', 'fetchAbortController', 'discussionActive', 'console',
    compile(callback('fetchCommentsCallback')))(mutationVersion, fetchSequence, api, 'TEST-herb', commentVersions,
    deletedCommentIds, knownCommentIds, setComments, () => {}, reconcileDeletedComments, fetchAbortController, discussionActive, { error() {} });
  const discussionGeneration = { current: 0 };
  const refreshQueue = { current: createDiscussionRefresh(fetchCommentsCallback) };
  const refreshComments = new Function('discussionActive', 'refreshQueue', compile(callback('refreshComments')))(discussionActive, refreshQueue);
  const appendComment = new Function('deletedCommentIds', 'markCommentChanged', 'setComments', 'reconcileDeletedComments', 'knownCommentIds', compile(callback('appendComment')))(
    deletedCommentIds, markCommentChanged, setComments, reconcileDeletedComments, knownCommentIds,
  );
  const removeComment = new Function('markCommentDeleted', 'setComments', 'deletedCommentIds', 'setReplyingTo', 'reconcileDeletedComments', compile(callback('removeComment')))(
    id => { deletedCommentIds.current.add(id); markCommentChanged(id); }, setComments, deletedCommentIds, () => {}, reconcileDeletedComments,
  );
  const socketRef = { current: null };
  const socket = { on: (name, handler) => listeners.set(name, handler), disconnect() {} };
  const setup = new Function('fetchCommentsCallback', 'refreshComments', 'socketRef', 'io', 'herbId', 'appendComment',
    'markCommentChanged', 'removeComment', 'setComments', 'fetchSequence', 'fetchAbortController', 'discussionActive', 'discussionGeneration', 'refreshQueue', 'createDiscussionRefresh', 'process',
    compile(effect.arguments[0].getText(syntax)))(fetchCommentsCallback, refreshComments, socketRef, () => socket, 'TEST-herb',
    appendComment, markCommentChanged, removeComment, setComments, fetchSequence, fetchAbortController, discussionActive, discussionGeneration, refreshQueue, createDiscussionRefresh, { env: {} });
  const toggle = new Function('isAuthenticated', 'user', 'markCommentChanged', 'setComments', 'api', 'fetchCommentsCallback',
    'refreshComments', 'pendingLikeIds', 'setLikingCommentIds', 'discussionActive', 'deletedCommentIds', 'alert', 'console', compile(callback('handleToggleLike')))(
    options.authenticated ?? true, { id: 'TEST-user' }, markCommentChanged, setComments, api, fetchCommentsCallback,
    refreshComments, pendingLikeIds, setLikingCommentIds, discussionActive, deletedCommentIds, () => {}, { error() {} });
  return { setup, toggle, listeners, setComments, comments: () => comments, pending: () => pending,
    reads: () => reads, writes: () => writes, refresh: refreshComments };
};

test('a delayed reaction payload cannot replace the authoritative fetched count', async () => {
  const state = timingHarness({ get: async () => ({ data: { status: 'success', data: { comments: [{ ...parent, herbId: 'TEST-herb', likes: 3, userLikes: [] }] } } }) });
  const cleanup = state.setup();
  await drain();
  state.listeners.get('comment_liked')({ commentId: 7, likes: 0, userLikes: [] });
  await drain();
  assert.equal(state.comments()[0].likes, 3);
  cleanup();
});

test('two same-comment reaction clicks send only one in-flight write', async () => {
  const write = deferred();
  const state = timingHarness({ post: () => write.promise });
  const first = state.toggle(7);
  const second = state.toggle(7);
  assert.equal(state.writes(), 1);
  write.resolve({ data: { data: { comment: { ...parent, likes: 1, userLikes: [] } } } });
  await Promise.all([first, second]);
});

test('a successful reaction refreshes canonical state even without a socket event', async () => {
  const state = timingHarness({ get: async () => ({ data: { status: 'success', data: { comments: [{ ...parent, likes: 2, userLikes: [{ userId: 'TEST-user' }] }] } } }) });
  await state.toggle(7);
  assert.equal(state.reads(), 1);
  assert.equal(state.comments()[0].likes, 2);
});

test('reconnecting a socket refreshes events missed while offline', async () => {
  const state = timingHarness();
  const cleanup = state.setup();
  await drain();
  const initial = state.reads();
  assert.equal(typeof state.listeners.get('connect'), 'function');
  state.listeners.get('connect')();
  await drain();
  assert.equal(state.reads(), initial + 1);
  cleanup();
});

test('a failed reaction and failed refresh do not leave an invented optimistic count', async () => {
  const state = timingHarness({ post: async () => { throw new Error('TEST write unavailable'); }, get: async () => { throw new Error('TEST read unavailable'); } });
  await state.toggle(7);
  await drain();
  assert.equal(state.comments()[0].likes, 0);
  assert.deepEqual(state.comments()[0].userLikes, []);
  assert.equal(state.pending().size, 0);
});

test('duplicate creation acknowledgements do not mark unchanged comments as newer mutations', () => {
  const state = harness();
  state.appendComment(parent);
  state.appendComment(parent);
  assert.equal(state.versions.has(7), false);
});

test('a burst of same-turn invalidations is coalesced into one read', async () => {
  let reads = 0;
  const refresh = createDiscussionRefresh(async () => { reads++; });
  await Promise.all(Array.from({ length: 12 }, () => refresh()));
  assert.equal(reads, 1);
});

test('invalidations arriving during an old read trigger one follow-up before callers settle', async () => {
  const first = deferred();
  let reads = 0;
  const refresh = createDiscussionRefresh(async () => { if (++reads === 1) await first.promise; });
  const completion = refresh();
  await drain();
  const queued = Array.from({ length: 10 }, () => refresh());
  assert.equal(reads, 1);
  first.resolve();
  await Promise.all([completion, ...queued]);
  assert.equal(reads, 2);
  await refresh();
  assert.equal(reads, 3);
});

test('a rejected refresh releases the queue so a later request can recover', async () => {
  let reads = 0;
  const refresh = createDiscussionRefresh(async () => { if (++reads === 1) throw new Error('TEST read failure'); });
  await assert.rejects(refresh(), /TEST read failure/);
  await refresh();
  assert.equal(reads, 2);
});

test('an inactive lifecycle drops an old queued follow-up instead of starting a read', async () => {
  const read = deferred();
  let active = true;
  let reads = 0;
  const refresh = createDiscussionRefresh(async () => { reads++; await read.promise; }, () => active);
  const completion = refresh();
  await drain();
  void refresh();
  active = false;
  read.resolve();
  await completion;
  assert.equal(reads, 1);
});

test('a reaction carrying another herb ID does not issue a refresh or alter state', async () => {
  const state = timingHarness();
  const cleanup = state.setup();
  await drain();
  const initial = state.reads();
  state.listeners.get('comment_liked')({ herbId: 'OTHER-herb', commentId: 7, likes: 99, userLikes: [] });
  await drain();
  assert.equal(state.reads(), initial);
  assert.equal(state.comments()[0].likes, 0);
  cleanup();
});

test('a canonical read settles a missed reaction on a newly announced comment', async () => {
  const state = timingHarness({ get: async () => ({ data: { status: 'success', data: { comments: [{ ...reply, herbId: 'TEST-herb', likes: 4, userLikes: [] }] } } }) });
  const cleanup = state.setup();
  await drain();
  const initial = state.reads();
  state.listeners.get('new_comment')({ ...reply, herbId: 'TEST-herb', likes: 0, userLikes: [] });
  await drain();
  assert.equal(state.reads(), initial + 1);
  assert.equal(state.comments()[0].likes, 4);
  cleanup();
});

test('cleanup aborts the fetch and prevents a late response from updating the closed discussion', async () => {
  const read = deferred();
  let signal;
  const state = timingHarness({ get: (_path, config) => { signal = config.signal; return read.promise; } });
  const cleanup = state.setup();
  await drain();
  cleanup();
  assert.equal(signal.aborted, true);
  read.resolve({ data: { status: 'success', data: { comments: [{ ...parent, likes: 99, userLikes: [] }] } } });
  await drain();
  assert.equal(state.comments()[0].likes, 0);
  const reads = state.reads();
  await state.refresh();
  assert.equal(state.reads(), reads);
});

test('Strict Mode cleanup and setup can resume without a stuck refresh queue', async () => {
  const read = deferred();
  let reads = 0;
  const state = timingHarness({ get: async () => {
    if (++reads === 1) return read.promise;
    return { data: { status: 'success', data: { comments: [{ ...parent, likes: 5, userLikes: [] }] } } };
  } });
  const cleanup = state.setup();
  await drain();
  cleanup();
  const secondCleanup = state.setup();
  read.resolve({ data: { status: 'success', data: { comments: [{ ...parent, likes: 99, userLikes: [] }] } } });
  await drain();
  assert.equal(state.comments()[0].likes, 5);
  assert.equal(reads, 2);
  secondCleanup();
});

test('a known missing/held discussion removes its obsolete visible comments', async () => {
  const state = timingHarness({ get: async () => { throw { response: { status: 404 } }; } });
  await state.refresh();
  assert.deepEqual(state.comments(), []);
});

test('unauthenticated reactions never issue a write', async () => {
  const state = timingHarness({ authenticated: false });
  await state.toggle(7);
  assert.equal(state.writes(), 0);
  assert.equal(state.reads(), 0);
});

test('reaction controls for both roots and replies expose their pending state', () => {
  const markup = source.slice(source.indexOf('  return ('));
  assert.match(markup, /disabled=\{likingCommentIds\.has\(comment\.id\)\}/);
  assert.match(markup, /aria-busy=\{likingCommentIds\.has\(comment\.id\)\}/);
  assert.match(markup, /disabled=\{likingCommentIds\.has\(reply\.id\)\}/);
  assert.match(markup, /aria-busy=\{likingCommentIds\.has\(reply\.id\)\}/);
});

test('a reaction followed by a late creation payload settles to the newest canonical snapshot', async () => {
  const read = deferred();
  let reads = 0;
  const state = timingHarness({ get: async () => {
    if (++reads === 2) return read.promise;
    return { data: { status: 'success', data: { comments: [{ ...parent, likes: 0, userLikes: [] }, { ...reply, herbId: 'TEST-herb', likes: 6, userLikes: [] }] } } };
  } });
  const cleanup = state.setup();
  await drain();
  state.listeners.get('comment_liked')({ commentId: 8, herbId: 'TEST-herb', likes: 1, userLikes: [] });
  await drain();
  state.listeners.get('new_comment')({ ...reply, herbId: 'TEST-herb', likes: 0, userLikes: [] });
  read.resolve({ data: { status: 'success', data: { comments: [{ ...reply, likes: 1, userLikes: [] }] } } });
  await drain();
  assert.equal(state.comments().find(comment => comment.id === 8).likes, 6);
  assert.equal(reads, 3);
  cleanup();
});

test('a deletion during a pending reaction snapshot cannot resurrect the deleted parent', async () => {
  const read = deferred();
  let reads = 0;
  const state = timingHarness({ get: () => ++reads === 1
    ? Promise.resolve({ data: { status: 'success', data: { comments: [{ ...parent, likes: 0, userLikes: [] }, reply] } } })
    : read.promise });
  const cleanup = state.setup();
  await drain();
  state.listeners.get('comment_liked')({ commentId: 7, likes: 1, userLikes: [] });
  await drain();
  state.listeners.get('comment_deleted')(7);
  read.resolve({ data: { status: 'success', data: { comments: [{ ...parent, likes: 1, userLikes: [] }, reply] } } });
  await drain();
  assert.deepEqual(state.comments(), [{ ...reply, parentCommentId: null }]);
  cleanup();
});

test('listeners queued after cleanup neither mutate comments nor start another read', async () => {
  const state = timingHarness();
  const cleanup = state.setup();
  await drain();
  cleanup();
  const reads = state.reads();
  state.listeners.get('new_comment')({ ...reply, herbId: 'TEST-herb' });
  state.listeners.get('comment_deleted')(7);
  state.listeners.get('comment_liked')({ commentId: 7 });
  state.listeners.get('connect')();
  await drain();
  assert.equal(state.reads(), reads);
  assert.equal(state.comments().length, 1);
  assert.equal(state.comments()[0].id, 7);
});

test('successful and failed reactions release their pending controls for a later retry', async () => {
  let writes = 0;
  const state = timingHarness({ post: async () => { if (++writes === 1) throw new Error('TEST first write failure'); return {}; } });
  await state.toggle(7);
  assert.equal(state.pending().size, 0);
  await state.toggle(7);
  assert.equal(state.pending().size, 0);
  assert.equal(state.writes(), 2);
});
