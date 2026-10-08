import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const requireFrontend = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const axios = requireFrontend('axios');
const source = await readFile(new URL('../herbalaifrontend/lib/axios.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const contextSource = await readFile(new URL('../herbalaifrontend/context/AuthContext.tsx', import.meta.url), 'utf8');
const contextSyntax = ts.createSourceFile('AuthContext.tsx', contextSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
let checkSessionSource;
const findSession = node => {
  if (ts.isVariableDeclaration(node) && node.name.getText(contextSyntax) === 'checkSession') {
    checkSessionSource = node.initializer.getText(contextSyntax);
  }
  ts.forEachChild(node, findSession);
};
findSession(contextSyntax);
assert.ok(checkSessionSource);
const sessionCompiled = ts.transpileModule(`return (${checkSessionSource});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise(complete => { resolve = complete; });
  return { promise, resolve };
};
const response = (config, status = 200) => ({ config, status, statusText: String(status), headers: {}, data: { status: 'success' } });
const httpError = (config, status) => new axios.AxiosError('TEST ONLY HTTP error', 'ERR_BAD_RESPONSE', config, undefined, response(config, status));
const client = handler => {
  const exports = {};
  const events = [];
  new Function('require', 'exports', 'window', compiled)(requireFrontend, exports, { dispatchEvent: event => events.push(event.type) });
  const api = exports.default;
  const requests = [];
  if (handler) {
    api.defaults.adapter = async config => {
      requests.push(config);
      return handler(config);
    };
  }
  return { api, requests, events };
};

test('shared requests have a finite default while retaining cookies and caller timeout overrides', async () => {
  const fixture = client(config => response(config));
  assert.equal(fixture.api.defaults.timeout, 30_000);
  assert.equal(fixture.api.defaults.withCredentials, true);
  await fixture.api.get('/messages/users', { timeout: 10_000 });
  assert.equal(fixture.requests[0].timeout, 10_000);
});

test('concurrent unauthorized requests share one refresh and each retry once', async () => {
  const gate = deferred();
  const attempts = new Map();
  let refreshes = 0;
  const fixture = client(async config => {
    if (config.url === '/auth/refresh-token') {
      refreshes += 1;
      await gate.promise;
      assert.equal(config.timeout, 10_000);
      return response(config);
    }
    const count = (attempts.get(config.url) || 0) + 1;
    attempts.set(config.url, count);
    if (count === 1) throw httpError(config, 401);
    return response(config);
  });
  const pending = Promise.allSettled([fixture.api.get('/first'), fixture.api.get('/second')]);
  await flush();
  assert.equal(refreshes, 1);
  gate.resolve();
  const results = await pending;
  assert.ok(results.every(result => result.status === 'fulfilled'));
  assert.equal(attempts.get('/first'), 2);
  assert.equal(attempts.get('/second'), 2);
  assert.deepEqual(fixture.events, []);
});

test('a queued request still unauthorized after refresh cannot start another refresh', async () => {
  const gate = deferred();
  const attempts = new Map();
  let refreshes = 0;
  const fixture = client(async config => {
    if (config.url === '/auth/refresh-token') {
      refreshes += 1;
      await gate.promise;
      return response(config);
    }
    const count = (attempts.get(config.url) || 0) + 1;
    attempts.set(config.url, count);
    if (config.url === '/second' || count === 1) throw httpError(config, 401);
    return response(config);
  });
  const pending = Promise.allSettled([fixture.api.get('/first'), fixture.api.get('/second')]);
  await flush();
  gate.resolve();
  const results = await pending;
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].status, 'rejected');
  assert.equal(results[1].reason.response.status, 401);
  assert.equal(refreshes, 1);
  assert.equal(attempts.get('/second'), 2);
});

for (const status of [400, 401, 403, 503]) {
  test(`refresh HTTP ${status} settles the queue and permits a later recovery attempt`, async () => {
    const gate = deferred();
    let failure = true;
    let recovered = false;
    const fixture = client(async config => {
      if (config.url === '/auth/refresh-token') {
        await gate.promise;
        if (failure) throw httpError(config, status);
        recovered = true;
        return response(config);
      }
      if (!recovered) throw httpError(config, 401);
      return response(config);
    });
    const pending = Promise.allSettled([fixture.api.get('/first'), fixture.api.get('/second')]);
    await flush();
    gate.resolve();
    const results = await pending;
    assert.ok(results.every(result => result.status === 'rejected'));
    assert.ok(results.every(result => result.reason.response.status === (status === 503 ? 503 : 401)));
    assert.deepEqual(fixture.events, status === 503 ? [] : ['auth-logout']);
    failure = false;
    assert.equal((await fixture.api.get('/recovery')).status, 200);
  });
}

test('session bootstrap handles invalid refresh without dispatching duplicate logout navigation', async () => {
  const fixture = client(config => { throw httpError(config, 401); });
  await assert.rejects(fixture.api.get('/auth/me'), error => error.response.status === 401);
  assert.equal(fixture.requests.filter(config => config.url === '/auth/refresh-token').length, 1);
  assert.deepEqual(fixture.events, []);
});

test('bad login credentials and direct refresh failures do not recursively refresh', async () => {
  const fixture = client(config => { throw httpError(config, 401); });
  await assert.rejects(fixture.api.post('/auth/login'), error => error.response.status === 401);
  await assert.rejects(fixture.api.post('/auth/refresh-token'), error => error.response.status === 401);
  assert.deepEqual(fixture.requests.map(config => config.url), ['/auth/login', '/auth/refresh-token']);
  assert.deepEqual(fixture.events, []);
});

test('an aborted queued request is not replayed after successful refresh', async () => {
  const gate = deferred();
  const controller = new AbortController();
  let recovered = false;
  const fixture = client(async config => {
    if (config.url === '/auth/refresh-token') {
      await gate.promise;
      recovered = true;
      return response(config);
    }
    if (!recovered) throw httpError(config, 401);
    return response(config);
  });
  const pending = Promise.allSettled([fixture.api.get('/first'), fixture.api.get('/second', { signal: controller.signal })]);
  await flush();
  controller.abort();
  gate.resolve();
  const results = await pending;
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].reason.code, 'ERR_CANCELED');
  assert.equal(fixture.requests.filter(config => config.url === '/second').length, 1);
});

test('canceling a queued request rejects before the shared refresh completes', async () => {
  const gate = deferred();
  const controller = new AbortController();
  let recovered = false;
  const fixture = client(async config => {
    if (config.url === '/auth/refresh-token') {
      await gate.promise;
      recovered = true;
      return response(config);
    }
    if (!recovered) throw httpError(config, 401);
    return response(config);
  });
  const primary = fixture.api.get('/first');
  const queued = fixture.api.get('/second', { signal: controller.signal });
  let canceled = false;
  const queuedResult = queued.then(
    () => { throw new Error('Canceled request unexpectedly succeeded'); },
    error => { assert.equal(error.code, 'ERR_CANCELED'); canceled = true; },
  );
  try {
    await flush();
    controller.abort();
    await flush();
    assert.equal(canceled, true, 'canceled request is still waiting for the stalled shared refresh');
  } finally {
    gate.resolve();
    await primary;
    await queuedResult;
  }
  assert.equal(fixture.requests.filter(config => config.url === '/second').length, 1);
  assert.equal(fixture.requests.filter(config => config.url === '/auth/refresh-token').length, 1);
  assert.deepEqual(fixture.events, []);
});

test('canceling a middle queued caller preserves all remaining shared-refresh callers', async () => {
  const gate = deferred();
  const controller = new AbortController();
  let recovered = false;
  const fixture = client(async config => {
    if (config.url === '/auth/refresh-token') {
      await gate.promise;
      recovered = true;
      return response(config);
    }
    if (!recovered) throw httpError(config, 401);
    return response(config);
  });
  const pending = Promise.allSettled([
    fixture.api.get('/primary'),
    fixture.api.get('/before'),
    fixture.api.get('/canceled', { signal: controller.signal }),
    fixture.api.get('/after'),
  ]);
  await flush();
  controller.abort();
  gate.resolve();
  const results = await pending;
  assert.deepEqual(results.map(result => result.status), ['fulfilled', 'fulfilled', 'rejected', 'fulfilled']);
  assert.equal(results[2].reason.code, 'ERR_CANCELED');
  assert.equal(fixture.requests.filter(config => config.url === '/canceled').length, 1);
  assert.equal(fixture.requests.filter(config => config.url === '/auth/refresh-token').length, 1);
  assert.deepEqual(fixture.events, []);
});

test('canceling the refresh-owning request settles promptly without abandoning another caller', async () => {
  const gate = deferred();
  const controller = new AbortController();
  let recovered = false;
  const fixture = client(async config => {
    if (config.url === '/auth/refresh-token') {
      await gate.promise;
      recovered = true;
      return response(config);
    }
    if (!recovered) throw httpError(config, 401);
    return response(config);
  });
  let canceled = false;
  const owner = fixture.api.get('/first', { signal: controller.signal }).then(
    () => { throw new Error('Canceled owner unexpectedly succeeded'); },
    error => { assert.equal(error.code, 'ERR_CANCELED'); canceled = true; },
  );
  const queued = fixture.api.get('/second');
  try {
    await flush();
    controller.abort();
    await flush();
    assert.equal(canceled, true, 'canceled refresh owner is still waiting for shared refresh');
  } finally {
    gate.resolve();
    await owner;
    assert.equal((await queued).status, 200);
  }
  assert.equal(fixture.requests.filter(config => config.url === '/first').length, 1);
  assert.equal(fixture.requests.filter(config => config.url === '/auth/refresh-token').length, 1);
  assert.deepEqual(fixture.events, []);
});

const refreshListenerCases = ['success', 'failure', 'cancellation'].flatMap(outcome =>
  ['first', 'second'].map(caller => ({ outcome, caller })),
);
for (const { outcome, caller } of refreshListenerCases) {
  test(`${caller} caller cancellation listeners are released on refresh ${outcome}`, async () => {
    const gate = deferred();
    const controller = new AbortController();
    const listeners = new Set();
    const addListener = controller.signal.addEventListener.bind(controller.signal);
    const removeListener = controller.signal.removeEventListener.bind(controller.signal);
    controller.signal.addEventListener = (type, listener, options) => {
      if (type === 'abort') listeners.add(listener);
      addListener(type, listener, options);
    };
    controller.signal.removeEventListener = (type, listener, options) => {
      if (type === 'abort') listeners.delete(listener);
      removeListener(type, listener, options);
    };
    let recovered = false;
    const fixture = client(async config => {
      if (config.url === '/auth/refresh-token') {
        await gate.promise;
        if (outcome === 'failure') throw httpError(config, 503);
        recovered = true;
        return response(config);
      }
      if (!recovered) throw httpError(config, 401);
      return response(config);
    });
    const pending = Promise.allSettled([
      fixture.api.get('/first', caller === 'first' ? { signal: controller.signal } : {}),
      fixture.api.get('/second', caller === 'second' ? { signal: controller.signal } : {}),
    ]);
    try {
      await flush();
      assert.equal(listeners.size, 1);
      if (outcome === 'cancellation') controller.abort();
    } finally {
      gate.resolve();
      await pending;
    }
    const results = await pending;
    assert.equal(listeners.size, 0);
    if (outcome === 'failure') {
      assert.ok(results.every(result => result.status === 'rejected' && result.reason.response.status === 503));
    } else {
      const callerIndex = caller === 'first' ? 0 : 1;
      assert.equal(results[1 - callerIndex].status, 'fulfilled');
      assert.equal(results[callerIndex].status, outcome === 'success' ? 'fulfilled' : 'rejected');
      if (outcome === 'cancellation') assert.equal(results[callerIndex].reason.code, 'ERR_CANCELED');
    }
    controller.abort();
    assert.equal(fixture.requests.filter(config => config.url === '/auth/refresh-token').length, 1);
    assert.deepEqual(fixture.events, []);
  });
}

for (const status of [400, 401, 403, 503]) {
  test(`refresh HTTP ${status} after owner cancellation settles remaining callers and allows recovery`, async () => {
    const gate = deferred();
    const controller = new AbortController();
    let failing = true;
    let recovered = false;
    const fixture = client(async config => {
      if (config.url === '/auth/refresh-token') {
        await gate.promise;
        if (failing) throw httpError(config, status);
        recovered = true;
        return response(config);
      }
      if (!recovered) throw httpError(config, 401);
      return response(config);
    });
    let ownerError;
    const owner = fixture.api.get('/first', { signal: controller.signal }).catch(error => { ownerError = error; });
    const queued = fixture.api.get('/second').catch(error => error);
    try {
      await flush();
      controller.abort();
      await flush();
      assert.equal(ownerError?.code, 'ERR_CANCELED');
    } finally {
      gate.resolve();
      await owner;
      await queued;
    }
    assert.equal((await queued).response.status, status === 503 ? 503 : 401);
    assert.deepEqual(fixture.events, status === 503 ? [] : ['auth-logout']);
    assert.equal(fixture.requests.filter(config => config.url === '/first').length, 1);
    failing = false;
    assert.equal((await fixture.api.get('/recovery')).status, 200);
    assert.equal(fixture.requests.filter(config => config.url === '/auth/refresh-token').length, 2);
  });
}

test('a caller arriving after owner cancellation still shares the active refresh', async () => {
  const gate = deferred();
  const controller = new AbortController();
  let recovered = false;
  const fixture = client(async config => {
    if (config.url === '/auth/refresh-token') {
      await gate.promise;
      recovered = true;
      return response(config);
    }
    if (!recovered) throw httpError(config, 401);
    return response(config);
  });
  const owner = fixture.api.get('/first', { signal: controller.signal }).catch(error => error);
  let lateCaller;
  try {
    await flush();
    controller.abort();
    await flush();
    lateCaller = fixture.api.get('/late');
    await flush();
    assert.equal(fixture.requests.filter(config => config.url === '/auth/refresh-token').length, 1);
  } finally {
    gate.resolve();
    await owner;
    if (lateCaller) await lateCaller;
  }
  assert.equal((await owner).code, 'ERR_CANCELED');
  assert.equal((await lateCaller).status, 200);
  assert.equal(fixture.requests.filter(config => config.url === '/first').length, 1);
  assert.deepEqual(fixture.events, []);
});

test('a refresh failure after its sole caller cancels is observed and releases the refresh lock', async () => {
  const gate = deferred();
  const controller = new AbortController();
  let failing = true;
  let recovered = false;
  const fixture = client(async config => {
    if (config.url === '/auth/refresh-token') {
      await gate.promise;
      if (failing) throw httpError(config, 503);
      recovered = true;
      return response(config);
    }
    if (!recovered) throw httpError(config, 401);
    return response(config);
  });
  const owner = fixture.api.get('/first', { signal: controller.signal }).catch(error => error);
  try {
    await flush();
    controller.abort();
    await flush();
  } finally {
    gate.resolve();
    await owner;
    await flush();
  }
  assert.equal((await owner).code, 'ERR_CANCELED');
  assert.deepEqual(fixture.events, []);
  failing = false;
  assert.equal((await fixture.api.get('/recovery')).status, 200);
  assert.equal(fixture.requests.filter(config => config.url === '/auth/refresh-token').length, 2);
});

test('a pre-canceled request does not start a refresh or enter the adapter', async () => {
  const controller = new AbortController();
  controller.abort();
  const fixture = client(config => { throw httpError(config, 401); });
  await assert.rejects(fixture.api.get('/first', { signal: controller.signal }), error => error.code === 'ERR_CANCELED');
  assert.deepEqual(fixture.requests, []);
  assert.deepEqual(fixture.events, []);
});

test('a write timeout is returned without replaying the write or logging out', async () => {
  const fixture = client(config => { throw new axios.AxiosError('TEST ONLY timeout', 'ECONNABORTED', config); });
  await assert.rejects(fixture.api.post('/suggest', { name: 'TEST ONLY' }), error => error.code === 'ECONNABORTED');
  assert.equal(fixture.requests.length, 1);
  assert.deepEqual(fixture.events, []);
});

for (const existingUser of [null, { id: 'TEST ONLY existing user' }]) {
  test(`session check settles transient failure and restores recovery (${existingUser ? 'existing session' : 'initial load'})`, async () => {
    let recovered = false;
    let user = existingUser;
    let loading = false;
    let unavailable = false;
    let invalidations = 0;
    const fixture = client(config => {
      if (config.url === '/auth/refresh-token') throw new axios.AxiosError('TEST ONLY timeout', 'ECONNABORTED', config);
      if (!recovered) throw httpError(config, 401);
      return { ...response(config), data: { status: 'success', data: { user: { id: 'TEST ONLY recovered' } } } };
    });
    const context = {
      sessionRevision: { current: 0 },
      setLoading: value => { loading = value; },
      setUser: value => { user = value; },
      setSessionUnavailable: value => { unavailable = value; },
      cachedApiGet: url => fixture.api.get(url),
      invalidateApiGetCache: () => { invalidations += 1; },
    };
    const checkSession = new Function(...Object.keys(context), sessionCompiled)(...Object.values(context));
    assert.equal(await checkSession(true), null);
    assert.equal(user, existingUser);
    assert.equal(loading, false);
    assert.equal(unavailable, true);
    assert.equal(invalidations, 0);
    assert.deepEqual(fixture.events, []);
    recovered = true;
    assert.equal((await checkSession(true)).id, 'TEST ONLY recovered');
    assert.equal(loading, false);
    assert.equal(unavailable, false);
  });
}

test('the existing sequential knowledge import explicitly keeps a longer finite budget', async () => {
  const adminSource = await readFile(new URL('../herbalaifrontend/app/admin/page.tsx', import.meta.url), 'utf8');
  const syntax = ts.createSourceFile('admin.tsx', adminSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  let options;
  const findImport = node => {
    if (ts.isCallExpression(node) && node.expression.getText(syntax) === 'api.post' &&
        node.arguments[0]?.text === '/knowledge-base/import') {
      options = node.arguments[2]?.getText(syntax);
    }
    ts.forEachChild(node, findImport);
  };
  findImport(syntax);
  assert.ok(options);
  assert.equal(new Function(`return (${options});`)().timeout, 120_000);
});

for (const page of ['suggest/page.tsx', 'community/new/page.tsx']) {
  test(`${page} distinguishes a session outage from confirmed unauthenticated access and wires retry`, async () => {
    const pageSource = await readFile(new URL(`../herbalaifrontend/app/${page}`, import.meta.url), 'utf8');
    const syntax = ts.createSourceFile(page, pageSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
    let guard;
    let recovery;
    const findGuard = node => {
      if (ts.isCallExpression(node) && node.expression.getText(syntax) === 'useEffect' &&
          node.arguments[0]?.getText(syntax).includes('router.push')) {
        guard = node.arguments[0].getText(syntax);
      }
      if (ts.isIfStatement(node) && node.expression.getText(syntax).includes('sessionUnavailable') &&
          node.thenStatement.getText(syntax).includes('<SessionUnavailable')) {
        recovery = node.thenStatement.getText(syntax);
      }
      ts.forEachChild(node, findGuard);
    };
    findGuard(syntax);
    assert.ok(guard);
    const redirects = [];
    const runGuard = (authLoading, isAuthenticated, sessionUnavailable) => {
      const code = ts.transpileModule(`return (${guard});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
      new Function('authLoading', 'isAuthenticated', 'sessionUnavailable', 'router', code)(
        authLoading, isAuthenticated, sessionUnavailable, { push: path => redirects.push(path) },
      )();
    };
    runGuard(false, false, true);
    runGuard(true, false, false);
    runGuard(false, true, true);
    assert.deepEqual(redirects, []);
    runGuard(false, false, false);
    assert.deepEqual(redirects, [page.startsWith('suggest') ? '/signin?callbackUrl=/suggest' : '/signin?callbackUrl=/community/new']);
    assert.ok(recovery);
    const code = ts.transpileModule(`function render() ${recovery}; return render();`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
    }).outputText;
    let forced;
    const rendered = new Function('React', 'SessionUnavailable', 'checkSession', code)(
      { createElement: (component, props) => ({ component, props }) }, 'SessionUnavailable', value => { forced = value; },
    );
    assert.equal(rendered.component, 'SessionUnavailable');
    rendered.props.retry();
    assert.equal(forced, true);
  });
}

test('an unresponsive loopback refresh times out, releases both callers, and recovers later', { timeout: 5000 }, async () => {
  const sockets = new Set();
  let recover = false;
  let refreshes = 0;
  const server = createServer((request, reply) => {
    if (request.url === '/api/auth/refresh-token') {
      refreshes += 1;
      if (!recover) return;
    }
    reply.writeHead(recover ? 200 : 401, { 'Content-Type': 'application/json' });
    reply.end(JSON.stringify({ status: recover ? 'success' : 'error' }));
  });
  server.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const fixture = client();
  fixture.api.defaults.baseURL = `http://127.0.0.1:${server.address().port}/api`;
  const adapter = axios.getAdapter('http');
  const refreshTimeouts = [];
  fixture.api.defaults.adapter = config => {
    if (config.url === '/auth/refresh-token') refreshTimeouts.push(config.timeout);
    return adapter({ ...config, proxy: false, timeout: config.url === '/auth/refresh-token' ? Math.min(config.timeout, 150) : config.timeout });
  };
  let pending;
  let deadline;
  try {
    pending = Promise.allSettled([fixture.api.get('/first'), fixture.api.get('/second')]);
    const results = await Promise.race([
      pending,
      new Promise(resolve => { deadline = setTimeout(() => resolve(null), 2000); }),
    ]);
    assert.notEqual(results, null, 'refresh and its queue did not settle before the test deadline');
    assert.ok(results.every(result => result.status === 'rejected' && result.reason.code === 'ECONNABORTED'));
    assert.deepEqual(refreshTimeouts, [10_000]);
    assert.equal(refreshes, 1);
    assert.deepEqual(fixture.events, []);
    recover = true;
    assert.equal((await fixture.api.get('/recovery')).status, 200);
  } finally {
    clearTimeout(deadline);
    for (const socket of sockets) socket.destroy();
    server.close();
    if (pending) await pending;
  }
});

test('native HTTP owner cancellation settles while shared refresh remains available', { timeout: 5000 }, async () => {
  const refreshStarted = deferred();
  const queuedUnauthorized = deferred();
  const sockets = new Set();
  let refreshReply;
  let recovered = false;
  let refreshes = 0;
  const server = createServer((request, reply) => {
    if (request.url === '/api/auth/refresh-token') {
      refreshes += 1;
      refreshReply = reply;
      refreshStarted.resolve();
      return;
    }
    reply.writeHead(recovered ? 200 : 401, { 'Content-Type': 'application/json' });
    reply.end(JSON.stringify({ status: recovered ? 'success' : 'error' }));
  });
  server.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const fixture = client();
  fixture.api.defaults.baseURL = `http://127.0.0.1:${server.address().port}/api`;
  const adapter = axios.getAdapter('http');
  fixture.api.defaults.adapter = async config => {
    try {
      return await adapter({ ...config, proxy: false });
    } catch (error) {
      if (config.url === '/second') queuedUnauthorized.resolve();
      throw error;
    }
  };
  const controller = new AbortController();
  const owner = fixture.api.get('/first', { signal: controller.signal }).catch(error => error);
  let queued;
  let deadline;
  try {
    await refreshStarted.promise;
    queued = fixture.api.get('/second').catch(error => error);
    await queuedUnauthorized.promise;
    await flush();
    controller.abort();
    const canceled = await Promise.race([
      owner,
      new Promise(resolve => { deadline = setTimeout(() => resolve(null), 1000); }),
    ]);
    assert.equal(canceled?.code, 'ERR_CANCELED', 'native owner stayed pending behind the stalled refresh');
    assert.equal(refreshReply.writableEnded, false);
    recovered = true;
    refreshReply.writeHead(200, { 'Content-Type': 'application/json' });
    refreshReply.end(JSON.stringify({ status: 'success' }));
    assert.equal((await queued).status, 200);
    assert.equal(refreshes, 1);
    assert.deepEqual(fixture.events, []);
  } finally {
    clearTimeout(deadline);
    controller.abort();
    for (const socket of sockets) socket.destroy();
    server.close();
    await owner;
    if (queued) await queued;
  }
});
