import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';
import { createServer } from 'node:http';
import { once } from 'node:events';

const source = await readFile(new URL('../herbalaifrontend/lib/dr-ai-stream.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const flush = () => new Promise(resolve => setImmediate(resolve));
const encoder = new TextEncoder();
const event = (name, data) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
const chunk = event('chunk', { text: 'TEST ONLY answer 🌿' });
const done = event('done', { sources: [{ type: 'herb', title: 'TEST ONLY source' }], history: [{ role: 'model', parts: [{ text: 'TEST ONLY answer' }] }] });
const body = (text = '', close = true) => {
  let controller;
  let cancellations = 0;
  const stream = new ReadableStream({
    start: value => { controller = value; if (text) value.enqueue(encoder.encode(text)); if (close) value.close(); },
    cancel: () => { cancellations += 1; },
  });
  return { stream, controller, cancelled: () => cancellations };
};
const harness = fetcher => {
  const exports = {};
  const requests = [];
  const refreshes = [];
  const events = [];
  const timers = new Map();
  let nextTimer = 0;
  let refresh = async () => {};
  new Function('require', 'exports', 'fetch', 'setTimeout', 'clearTimeout', compiled)(
    () => ({ post: (...args) => { refreshes.push(args); return refresh(...args); } }), exports,
    (url, options) => { requests.push({ url, options }); return fetcher(url, options); },
    (callback, delay) => { nextTimer += 1; timers.set(nextTimer, { callback, delay }); return nextTimer; },
    timer => timers.delete(timer),
  );
  return {
    requests, refreshes, events, timers,
    run: options => exports.streamDrAiResponse('TEST ONLY question', [], value => events.push(value), options),
    refresh: callback => { refresh = callback; },
    fire: delay => {
      const match = [...timers.entries()].find(([, value]) => value.delay === delay);
      assert.ok(match, `missing ${delay}ms timeout`);
      timers.delete(match[0]);
      match[1].callback();
    },
  };
};
const observe = promise => {
  const outcome = { settled: false };
  const completed = promise.then(
    () => { outcome.settled = true; },
    error => { outcome.settled = true; outcome.error = error; },
  );
  return { outcome, completed };
};

test('done completes and cancels an open transport without waiting for EOF', async () => {
  const fixtureBody = body(chunk + done, false);
  const fixture = harness(async () => new Response(fixtureBody.stream));
  const pending = observe(fixture.run());
  try {
    await flush();
    assert.equal(pending.outcome.settled, true);
    assert.equal(pending.outcome.error, undefined);
    assert.equal(fixtureBody.cancelled(), 1);
    assert.equal(fixtureBody.stream.locked, false);
    assert.equal(fixture.timers.size, 0);
    assert.deepEqual(fixture.events.map(value => value.event), ['chunk', 'done']);
  } finally {
    if (!pending.outcome.settled) fixtureBody.controller.close();
    await pending.completed;
  }
});

test('SSE heartbeats renew only the idle gap without emitting an answer or extending the total budget', async () => {
  const fixtureBody = body(event('sources', { sources: [] }), false);
  const fixture = harness(async () => new Response(fixtureBody.stream));
  const pending = observe(fixture.run());
  await flush();
  const totalTimer = [...fixture.timers.keys()].find(key => fixture.timers.get(key).delay === 120_000);
  const previousGap = [...fixture.timers.keys()].find(key => fixture.timers.get(key).delay === 30_000);
  fixtureBody.controller.enqueue(encoder.encode(': heartbeat\n\n'));
  await flush();
  const renewedGap = [...fixture.timers.keys()].find(key => fixture.timers.get(key).delay === 30_000);
  assert.notEqual(previousGap, renewedGap);
  assert.equal(fixture.timers.has(totalTimer), true);
  assert.deepEqual(fixture.events.map(value => value.event), ['sources']);
  fixture.fire(120_000);
  await pending.completed;
  assert.equal(pending.outcome.error?.name, 'TimeoutError');
  assert.equal(fixtureBody.cancelled(), 1);
  assert.equal(fixture.timers.size, 0);
});

test('external cancellation settles a stalled body and releases its reader', async () => {
  const fixtureBody = body('', false);
  const controller = new AbortController();
  const fixture = harness(async () => new Response(fixtureBody.stream));
  const pending = observe(fixture.run({ signal: controller.signal }));
  await flush();
  controller.abort();
  try {
    await flush();
    assert.equal(pending.outcome.settled, true);
    assert.equal(pending.outcome.error?.name, 'AbortError');
    assert.equal(fixtureBody.cancelled(), 1);
    assert.equal(fixtureBody.stream.locked, false);
    assert.equal(fixture.timers.size, 0);
  } finally {
    if (!pending.outcome.settled) fixtureBody.controller.close();
    await pending.completed;
  }
});

test('headers, first data, idle gaps and total duration have finite independent budgets', async () => {
  for (const [stage, delay] of [['headers', 30_000], ['first data', 90_000], ['idle gap', 30_000], ['total', 120_000]]) {
    const fixtureBody = body(stage === 'idle gap' ? chunk : '', false);
    let finishFetch;
    const fixture = harness((_url, options) => {
      if (stage !== 'headers') return Promise.resolve(new Response(fixtureBody.stream));
      return new Promise((resolve, reject) => {
        finishFetch = resolve;
        options.signal?.addEventListener('abort', () => reject(options.signal.reason), { once: true });
      });
    });
    const pending = observe(fixture.run());
    try {
      await flush();
      fixture.fire(delay);
      await flush();
      assert.equal(pending.outcome.settled, true, stage);
      assert.equal(pending.outcome.error?.name, 'TimeoutError', stage);
      assert.equal(fixture.timers.size, 0);
    } finally {
      if (!pending.outcome.settled) {
        fixtureBody.controller.close();
        finishFetch?.(new Response(fixtureBody.stream));
      }
      await pending.completed;
    }
  }
});

test('provider errors cancel and unlock the reader, even before EOF', async () => {
  const fixtureBody = body(event('error', { message: 'TEST ONLY unavailable' }), false);
  const fixture = harness(async () => new Response(fixtureBody.stream));
  await assert.rejects(fixture.run(), /TEST ONLY unavailable/);
  assert.equal(fixtureBody.cancelled(), 1);
  assert.equal(fixtureBody.stream.locked, false);
  assert.equal(fixture.timers.size, 0);
});

for (const [name, text] of [
  ['malformed sources', event('sources', { sources: [{ type: 'herb', title: null }] }) + chunk + done],
  ['malformed chunk', event('chunk', { text: null }) + done],
  ['malformed history', chunk + event('done', { sources: [], history: [{ role: 'model', parts: null }] })],
  ['null event', event('sources', null) + chunk + done],
  ['empty answer', done],
]) {
  test(`rejects ${name} without accepting it as a completed answer`, async () => {
    const fixture = harness(async () => new Response(body(text).stream));
    await assert.rejects(fixture.run());
    assert.equal(fixture.events.some(value => value.event === 'done'), false);
    assert.equal(fixture.timers.size, 0);
  });
}

test('bounded buffering rejects an unterminated event rather than growing indefinitely', async () => {
  const fixtureBody = body('data: ' + 'x'.repeat(1_048_577), false);
  const fixture = harness(async () => new Response(fixtureBody.stream));
  const pending = observe(fixture.run());
  try {
    await flush();
    assert.equal(pending.outcome.settled, true);
    assert.ok(pending.outcome.error);
    assert.equal(fixtureBody.stream.locked, false);
  } finally {
    if (!pending.outcome.settled) fixtureBody.controller.close();
    await pending.completed;
  }
});

test('split UTF-8, CRLF, multiple blocks and final done without a blank line remain supported', async () => {
  const bytes = encoder.encode((event('sources', { sources: [] }) + chunk + done.trimEnd()).replaceAll('\n', '\r\n'));
  const stream = new ReadableStream({ start: controller => {
    for (const value of bytes) controller.enqueue(new Uint8Array([value]));
    controller.close();
  } });
  const fixture = harness(async () => new Response(stream));
  await fixture.run();
  assert.equal(fixture.events.find(value => value.event === 'chunk').data.text, 'TEST ONLY answer 🌿');
  assert.equal(fixture.events.at(-1).event, 'done');
});

test('a truncated answer remains a failure', async () => {
  const fixture = harness(async () => new Response(body(chunk).stream));
  await assert.rejects(fixture.run(), /before completion/);
  assert.equal(fixture.events.some(value => value.event === 'done'), false);
});

test('one 401 refresh preserves cookies and signal, with no second unauthorized replay', async () => {
  const fixture = harness(async () => new Response('{}', { status: 401 }));
  await assert.rejects(fixture.run());
  assert.equal(fixture.requests.length, 2);
  assert.equal(fixture.refreshes.length, 1);
  assert.equal(fixture.refreshes[0][2]?.timeout, 10_000);
  assert.ok(fixture.refreshes[0][2]?.signal);
  assert.ok(fixture.requests.every(value => value.options.credentials === 'include' && value.options.signal));
  assert.equal(fixture.timers.size, 0);
});

test('503 does not retry generation or refresh authentication', async () => {
  const fixture = harness(async () => new Response(JSON.stringify({ message: 'TEST ONLY unavailable' }), { status: 503 }));
  await assert.rejects(fixture.run(), /TEST ONLY unavailable/);
  assert.equal(fixture.requests.length, 1);
  assert.equal(fixture.refreshes.length, 0);
});

test('an already aborted request makes no network call', async () => {
  const controller = new AbortController();
  controller.abort();
  const fixture = harness(async () => new Response(body(chunk + done).stream));
  await assert.rejects(fixture.run({ signal: controller.signal }), error => error.name === 'AbortError');
  assert.equal(fixture.requests.length, 0);
});

test('native fetch aborts a real loopback stalled response and closes a done-but-open connection', { timeout: 8000 }, async () => {
  const sockets = new Set();
  let sendDone = false;
  let arrived;
  const closedResponses = [];
  const server = createServer((_request, reply) => {
    closedResponses.push(new Promise(resolve => reply.once('close', resolve)));
    reply.writeHead(200, { 'Content-Type': 'text/event-stream' });
    reply.write(sendDone ? chunk + done : chunk);
    arrived?.();
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const fixture = harness((_url, options) => fetch(`http://127.0.0.1:${server.address().port}/api/chat/stream`, options));
    const received = new Promise(resolve => { arrived = resolve; });
    const pending = observe(fixture.run());
    await received;
    await flush();
    await flush();
    fixture.fire(120_000);
    await pending.completed;
    assert.equal(pending.outcome.error?.name, 'TimeoutError');
    assert.equal(fixture.timers.size, 0);
    sendDone = true;
    const recovered = harness((_url, options) => fetch(`http://127.0.0.1:${server.address().port}/api/chat/stream`, options));
    await recovered.run();
    await Promise.all(closedResponses);
    assert.equal(recovered.events.at(-1).event, 'done');
    assert.equal(recovered.timers.size, 0);
  } finally {
    for (const socket of sockets) socket.destroy();
    server.close();
  }
});

const pageSource = await readFile(new URL('../herbalaifrontend/app/chat/page.tsx', import.meta.url), 'utf8');
const pageSyntax = ts.createSourceFile('chat.tsx', pageSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
let sendSource;
let lifecycleSource;
const findCallbacks = node => {
  if (ts.isVariableDeclaration(node) && node.name.getText(pageSyntax) === 'handleSendQuery') {
    sendSource = node.initializer.arguments[0].getText(pageSyntax);
  }
  if (ts.isCallExpression(node) && node.expression.getText(pageSyntax) === 'useEffect' &&
      node.arguments[0]?.getText(pageSyntax).includes('activeRequestRef.current?.abort')) {
    lifecycleSource = node.arguments[0].getText(pageSyntax);
  }
  ts.forEachChild(node, findCallbacks);
};
findCallbacks(pageSyntax);
const pageHarness = stream => {
  let messages = [{ id: 'welcome', role: 'model', text: 'TEST ONLY welcome' }];
  let input = 'TEST ONLY question';
  let history = [];
  let sending = false;
  let error = null;
  let updates = 0;
  const context = {
    isSending: false, history, activeRequestRef: { current: null }, mountedRef: { current: true },
    setMessages: value => { updates += 1; messages = typeof value === 'function' ? value(messages) : value; },
    setInput: value => { updates += 1; input = typeof value === 'function' ? value(input) : value; },
    setHistory: value => { updates += 1; history = value; },
    setIsSending: value => { updates += 1; sending = value; },
    setChatError: value => { updates += 1; error = value; },
    streamDrAiResponse: stream,
  };
  const compile = text => {
    const code = ts.transpileModule(`return (${text});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
    return new Function(...Object.keys(context), code)(...Object.values(context));
  };
  return { send: compile(sendSource), unmount: lifecycleSource ? compile(lifecycleSource)() : null, state: () => ({ messages, input, history, sending, error, updates }) };
};

test('the chat handler blocks duplicate submissions before React rerenders', async () => {
  const release = [];
  let calls = 0;
  const fixture = pageHarness(() => { calls += 1; return new Promise(resolve => release.push(resolve)); });
  const first = fixture.send('TEST ONLY question');
  const second = fixture.send('TEST ONLY question');
  try { assert.equal(calls, 1); }
  finally { for (const complete of release) complete(); await Promise.all([first, second]); }
});

test('a failed partial answer restores the question draft without committing model history', async () => {
  const fixture = pageHarness(async (_query, _history, onEvent) => {
    onEvent({ event: 'chunk', data: { text: 'TEST ONLY incomplete answer' } });
    throw new Error('TEST ONLY interruption');
  });
  await fixture.send('TEST ONLY question');
  assert.equal(fixture.state().input, 'TEST ONLY question');
  assert.equal(fixture.state().messages.length, 1);
  assert.deepEqual(fixture.state().history, []);
  assert.equal(fixture.state().sending, false);
  assert.ok(fixture.state().error);
});

test('unmount aborts the active stream and ignores late events and state updates', async () => {
  let callback;
  let signal;
  let finish;
  const fixture = pageHarness((_query, _history, onEvent, options) => {
    callback = onEvent;
    signal = options?.signal;
    return new Promise(resolve => { finish = resolve; });
  });
  const pending = fixture.send('TEST ONLY question');
  try {
    assert.ok(fixture.unmount);
    fixture.unmount();
    assert.equal(signal.aborted, true);
    const updates = fixture.state().updates;
    callback({ event: 'chunk', data: { text: 'TEST ONLY late answer' } });
    finish();
    await pending;
    assert.equal(fixture.state().updates, updates);
  } finally { finish(); await pending; }
});

test('a successful answer commits history and unlocks the composer', async () => {
  const fixture = pageHarness(async (_query, _history, onEvent) => {
    onEvent({ event: 'chunk', data: { text: 'TEST ONLY completed answer' } });
    onEvent({ event: 'done', data: { sources: [], history: [{ role: 'model', parts: [{ text: 'TEST ONLY completed answer' }] }] } });
  });
  await fixture.send('TEST ONLY question');
  assert.equal(fixture.state().messages.length, 3);
  assert.equal(fixture.state().history.length, 1);
  assert.equal(fixture.state().input, '');
  assert.equal(fixture.state().sending, false);
  assert.equal(fixture.state().error, null);
});

let authRedirectSource;
let authRedirectDependencies;
const findAuthRedirect = node => {
  if (ts.isCallExpression(node) && node.expression.getText(pageSyntax) === 'useEffect'
    && node.arguments[0]?.getText(pageSyntax).includes('/signin?callbackUrl=')) {
    authRedirectSource = node.arguments[0].getText(pageSyntax);
    authRedirectDependencies = node.arguments[1]?.getText(pageSyntax);
  }
  ts.forEachChild(node, findAuthRedirect);
};
findAuthRedirect(pageSyntax);
assert.ok(authRedirectSource, 'test must exercise the actual ChatContent authentication effect');
const authRedirectCompiled = ts.transpileModule(`const redirect = ${authRedirectSource}; redirect();`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const authRedirectHelpers = {};
const authRedirectHelperSource = await readFile(new URL('../herbalaifrontend/lib/auth-redirect.ts', import.meta.url), 'utf8');
new Function('exports', ts.transpileModule(authRedirectHelperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(authRedirectHelpers);

const runChatAuthRedirect = (search = '', state = {}) => {
  const routes = [];
  const router = {
    push: url => routes.push({ method: 'push', url }),
    replace: url => routes.push({ method: 'replace', url }),
  };
  new Function('loading', 'isAuthenticated', 'sessionUnavailable', 'router', 'searchParams', authRedirectCompiled)(
    state.loading ?? false, state.isAuthenticated ?? false, state.sessionUnavailable ?? false, router, new URLSearchParams(search),
  );
  return routes;
};

for (const query of [
  'What preparation and safety information is available for Balanay?',
  'Explain documented uses of Thespesia populnea.',
  'Compare leaves & seeds: "food use" or treatment? #sources + limits',
]) {
  test(`Library-to-AI login preserves the exact query: ${query}`, () => {
    const search = new URLSearchParams({ q: query }).toString();
    const routes = runChatAuthRedirect(search);
    assert.equal(routes.length, 1);
    assert.equal(routes[0].method, 'replace');
    const signIn = new URL(routes[0].url, 'https://herbalai.example');
    assert.equal(signIn.pathname, '/signin');
    const callback = authRedirectHelpers.safeAuthCallback(signIn.searchParams.get('callbackUrl'));
    assert.equal(callback, `/chat?${search}`);
    assert.equal(new URL(callback, signIn.origin).searchParams.get('q'), query);
  });
}

test('direct Chat navigation without a query retains its safe plain callback', () => {
  const routes = runChatAuthRedirect();
  const callback = new URL(routes[0].url, 'https://herbalai.example').searchParams.get('callbackUrl');
  assert.equal(authRedirectHelpers.safeAuthCallback(callback), '/chat');
});

for (const state of [{ loading: true }, { isAuthenticated: true }, { sessionUnavailable: true }]) {
  test(`Chat guard does not discard context during ${JSON.stringify(state)}`, () => {
    assert.deepEqual(runChatAuthRedirect('q=TEST-only-herb', state), []);
  });
}

test('Chat authentication effect reacts to changed query parameters', () => {
  assert.match(authRedirectDependencies, /\bsearchParams\b/);
});
