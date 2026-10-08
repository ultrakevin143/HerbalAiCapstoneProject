import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const source = await readFile(new URL('../herbalaifrontend/lib/credits.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {};
new Function('require', 'exports', compiled)(require, exports);

const pageSource = await readFile(new URL('../herbalaifrontend/components/CreditsWallet.tsx', import.meta.url), 'utf8');
const chatSource = await readFile(new URL('../herbalaifrontend/app/chat/page.tsx', import.meta.url), 'utf8');
const dialogSource = await readFile(new URL('../herbalaifrontend/components/AccessibleDialog.tsx', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../herbalaifrontend/app/globals.css', import.meta.url), 'utf8');
const statusSource = await readFile(new URL('../herbalaifrontend/components/DrAiCreditsStatus.tsx', import.meta.url), 'utf8');
const standaloneSource = await readFile(new URL('../herbalaifrontend/app/credits/page.tsx', import.meta.url), 'utf8');
const syntax = ts.createSourceFile('credits.tsx', pageSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
const callbacks = new Map();
const visit = node => {
  if (ts.isVariableDeclaration(node) && ['buy', 'openAnswer'].includes(node.name.getText(syntax))) callbacks.set(node.name.getText(syntax), node.initializer.getText(syntax));
  if (ts.isCallExpression(node) && node.expression.getText(syntax) === 'useEffect' && node.arguments[0]?.getText(syntax).includes("api.get('/credits')")) callbacks.set('loadWallet', node.arguments[0].getText(syntax));
  if (ts.isCallExpression(node) && node.expression.getText(syntax) === 'useEffect' && node.arguments[0]?.getText(syntax).includes('refreshOnReturn')) callbacks.set('returnRefresh', node.arguments[0].getText(syntax));
  ts.forEachChild(node, visit);
};
visit(syntax);
const deferred = () => { let resolve, reject; const promise = new Promise((success, failure) => { resolve = success; reject = failure; }); return { promise, resolve, reject }; };
const purchaseId = '7a463e2d-9f94-4ed2-90ab-e29ad36e2b6e';
const pageHarness = () => {
  const state = { error: '', walletError: '', wallet: null, pending: false, revision: 0, answer: null, checkout: null, redirects: [], posts: [], gets: [] };
  const post = deferred(), get = deferred();
  const context = {
    userId: 'TEST-owner', active: { current: true }, account: { current: 'TEST-owner' }, locked: { current: false }, checkoutKeys: { current: new Map() },
    checkoutPurchases: { current: new Map() }, answerRequest: { current: 0 },
    api: { post: (...args) => { state.posts.push(args); return post.promise; }, get: (...args) => { state.gets.push(args); return get.promise; } },
    z: require('zod').z, safeTestCheckoutUrl: exports.safeTestCheckoutUrl, creditWalletSchema: exports.creditWalletSchema, sessionUnavailable: false,
    requestError: () => 'TEST ONLY checkout failure.',
    window: { location: { assign: url => state.redirects.push(url) } },
    setError: value => { state.error = value; }, setPending: value => { state.pending = value; },
    setWalletError: value => { state.walletError = value; }, setWallet: value => { state.wallet = value; },
    setRevision: value => { state.revision = value(state.revision); }, setAnswer: value => { state.answer = value; },
    setCheckout: value => { state.checkout = typeof value === 'function' ? value(state.checkout) : value; },
  };
  const compile = name => new Function(...Object.keys(context), ts.transpileModule(`return (${callbacks.get(name)});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText)(...Object.values(context));
  return { state, post, get, context, buy: compile('buy'), openAnswer: compile('openAnswer'), loadWallet: compile('loadWallet') };
};
test('validates disabled and enabled test wallet states', () => {
  assert.equal(exports.creditWalletSchema.parse({ enabled: false, testMode: true }).enabled, false);
  assert.equal(exports.creditWalletSchema.parse({ enabled: true, testMode: true, balance: 10 }).balance, 10);
  assert.throws(() => exports.creditWalletSchema.parse({ enabled: true, testMode: false }));
  assert.throws(() => exports.creditWalletSchema.parse({ enabled: true, testMode: true, balance: -1 }));
});

test('GCash checkout labels disclose simulated payments and warn against real credentials', () => {
  assert.match(pageSource, /Open GCash test checkout/);
  assert.match(pageSource, /Payment method: GCash through PayMongo/);
  assert.match(pageSource, /simulated Authorize or Fail controls/);
  assert.match(pageSource, /Never enter your real GCash PIN or OTP/);
  assert.doesNotMatch(pageSource, /published test card details/);
});
test('only redirects to HTTPS PayMongo checkout without embedded credentials', () => {
  assert.equal(exports.safeTestCheckoutUrl('https://checkout.paymongo.com/TEST'), 'https://checkout.paymongo.com/TEST');
  for (const value of ['javascript:alert(1)', 'http://checkout.paymongo.com/TEST', 'https://checkout.paymongo.com.evil.invalid/TEST', 'https://user:pass@checkout.paymongo.com/TEST', 'https://example.invalid', undefined]) assert.throws(() => exports.safeTestCheckoutUrl(value));
});

test('duplicate checkout clicks share one owner-bound request without sending a client price', async () => {
  const fixture = pageHarness();
  const first = fixture.buy('test-pack');
  await fixture.buy('test-pack');
  assert.equal(fixture.state.posts.length, 1);
  const [path, body] = fixture.state.posts[0];
  assert.equal(path, '/credits/checkout');
  assert.deepEqual(Object.keys(body).sort(), ['packageId', 'requestId']);
  assert.match(body.requestId, /^[a-f0-9-]{36}$/);
  fixture.post.resolve({ data: { data: { purchaseId, checkoutUrl: 'https://checkout.paymongo.com/TEST' } } });
  await first;
  assert.deepEqual(fixture.state.redirects, []);
  assert.deepEqual(fixture.state.checkout, { ownerId: 'TEST-owner', purchaseId, url: 'https://checkout.paymongo.com/TEST' });
  assert.equal(fixture.state.pending, false);
});
test('failed checkout retries retain the same key and never follow an untrusted redirect', async () => {
  const fixture = pageHarness();
  const first = fixture.buy('test-pack');
  fixture.post.resolve({ data: { data: { purchaseId, checkoutUrl: 'https://example.invalid/phishing' } } });
  await first; await fixture.buy('test-pack');
  assert.equal(fixture.state.posts[0][1].requestId, fixture.state.posts[1][1].requestId);
  assert.equal(fixture.state.redirects.length, 0);
  assert.equal(fixture.state.pending, false);
  assert.ok(fixture.state.error);
});
test('switching accounts during checkout prevents the former account redirect', async () => {
  const fixture = pageHarness(); const pending = fixture.buy('test-pack');
  fixture.context.account.current = 'TEST-other';
  fixture.post.resolve({ data: { data: { purchaseId, checkoutUrl: 'https://checkout.paymongo.com/TEST' } } });
  await pending; assert.equal(fixture.state.redirects.length, 0);
  assert.equal(fixture.state.checkout, null);
});
test('saved answers are owner-tagged and late answers cannot cross an account switch', async () => {
  const fixture = pageHarness(); const pending = fixture.openAnswer('TEST-request');
  fixture.get.resolve({ data: { data: { reply: 'TEST ONLY saved answer.' } } });
  await pending; assert.deepEqual(fixture.state.answer, { ownerId: 'TEST-owner', reply: 'TEST ONLY saved answer.' });
  const switched = pageHarness(); const stale = switched.openAnswer('TEST-request');
  switched.context.account.current = 'TEST-other'; switched.get.resolve({ data: { data: { reply: 'TEST ONLY former owner.' } } });
  await stale; assert.equal(switched.state.answer, null);
  assert.match(pageSource, /answer\.ownerId === userId/);
});

test('a late saved-answer response cannot replace the most recently selected answer', async () => {
  const fixture = pageHarness();
  const first = deferred(), second = deferred();
  fixture.context.api.get = path => path.endsWith('FIRST') ? first.promise : second.promise;
  const older = fixture.openAnswer('FIRST');
  const newer = fixture.openAnswer('SECOND');
  second.resolve({ data: { data: { reply: 'TEST ONLY newer selection.' } } });
  await newer;
  first.resolve({ data: { data: { reply: 'TEST ONLY stale selection.' } } });
  await older;
  assert.equal(fixture.state.answer.reply, 'TEST ONLY newer selection.');
});

test('a late saved-answer failure does not overwrite the newer successful selection', async () => {
  const fixture = pageHarness();
  const first = deferred(), second = deferred();
  fixture.context.api.get = path => path.endsWith('FIRST') ? first.promise : second.promise;
  const older = fixture.openAnswer('FIRST');
  const newer = fixture.openAnswer('SECOND');
  second.resolve({ data: { data: { reply: 'TEST ONLY current selection.' } } });
  await newer;
  first.reject(new Error('TEST ONLY stale failure.'));
  await older;
  assert.equal(fixture.state.answer.reply, 'TEST ONLY current selection.');
  assert.equal(fixture.state.error, '');
});

test('a confirmed paid checkout releases only that package key for a deliberate new purchase', async () => {
  const fixture = pageHarness();
  const initial = fixture.buy('test-pack');
  fixture.post.resolve({ data: { data: { purchaseId, checkoutUrl: 'https://checkout.paymongo.com/TEST' } } });
  await initial;
  const firstKey = fixture.state.posts[0][1].requestId;
  fixture.loadWallet();
  fixture.get.resolve({ data: { data: { enabled: true, testMode: true, balance: 13, purchases: [{ id: purchaseId, credits: 10, amountMinor: 10000, status: 'PAID', createdAt: '2026-10-08T00:00:00Z' }] } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.state.checkout, null);
  await fixture.buy('test-pack');
  assert.notEqual(fixture.state.posts[1][1].requestId, firstKey);
});

test('unconfirmed and unrelated paid purchases do not release a pending checkout key', async () => {
  for (const purchase of [{ id: purchaseId, status: 'PENDING' }, { id: purchaseId, status: 'UNCERTAIN' }, { id: 'OTHER-purchase', status: 'PAID' }]) {
    const fixture = pageHarness();
    const initial = fixture.buy('test-pack');
    fixture.post.resolve({ data: { data: { purchaseId, checkoutUrl: 'https://checkout.paymongo.com/TEST' } } });
    await initial;
    const firstKey = fixture.state.posts[0][1].requestId;
    fixture.loadWallet();
    fixture.get.resolve({ data: { data: { enabled: true, testMode: true, balance: 3, purchases: [{ ...purchase, credits: 10, amountMinor: 10000, createdAt: '2026-10-08T00:00:00Z' }] } } });
    await new Promise(resolve => setImmediate(resolve));
    await fixture.buy('test-pack');
    assert.equal(fixture.state.posts[1][1].requestId, firstKey);
  }
});
test('unmounted wallet pages do not redirect or reveal saved answers', async () => {
  const fixture = pageHarness(); const purchase = fixture.buy('test-pack'), answer = fixture.openAnswer('TEST-request');
  fixture.context.active.current = false;
  fixture.post.resolve({ data: { data: { purchaseId, checkoutUrl: 'https://checkout.paymongo.com/TEST' } } }); fixture.get.resolve({ data: { data: { reply: 'TEST ONLY saved answer.' } } });
  await Promise.all([purchase, answer]); assert.equal(fixture.state.redirects.length, 0); assert.equal(fixture.state.answer, null);
  assert.equal(fixture.state.checkout, null);
});

test('credits live above the composer, not in either header, and open an accessible drawer', () => {
  const marker = '<DrAiCreditsStatus revision={creditRevision} />';
  assert.equal(chatSource.split(marker).length, 2);
  assert.ok(chatSource.indexOf(marker) > chatSource.indexOf('className="chat-composer'));
  assert.ok(chatSource.indexOf(marker) < chatSource.indexOf('<form onSubmit={handleSubmit}'));
  assert.match(pageSource, /aria-haspopup="dialog"/);
  assert.match(pageSource, /panelOwner === userId/);
  assert.match(pageSource, /variant="drawer"/);
  assert.match(dialogSource, /dialog\.showModal\(\)/);
  assert.match(dialogSource, /previousFocus\.focus\(\)/);
  assert.match(dialogSource, /onCancel=/);
});

test('checkout opens only through a safe new-tab link and never navigates away from the draft', () => {
  assert.doesNotMatch(pageSource, /window\.location\.assign|window\.open/);
  assert.match(pageSource, /href=\{checkout\.url\} target="_blank" rel="noopener noreferrer"/);
  assert.match(pageSource, /checkout\.ownerId === userId/);
  assert.match(pageSource, /setCheckout\(null\)/);
});

test('mobile bottom sheet and desktop drawer keep test disclosures, zero-credit guidance and collapsed history', () => {
  assert.match(styleSource, /credits-drawer[^}]+height: 100dvh/);
  assert.match(styleSource, /credits-drawer[^}]+max-height: 85dvh/);
  assert.match(styleSource, /not\(\.dr-ai-credit-summary\)/);
  assert.match(pageSource, /No real-money purchases are enabled/);
  assert.match(pageSource, /current\.balance === 0/);
  assert.match(pageSource, /your typed question stays here/);
  for (const label of ['Purchase history', 'Credit activity', 'Saved answers']) assert.match(pageSource, new RegExp(`<summary[^>]+>${label}</summary>`));
});

const renderWallet = ({ ownerId = 'TEST-owner', userId = 'TEST-owner', enabled = true, balance = 3, open = false, walletLoaded = true, walletError = '', checkout = null, answer = null, sessionUnavailable = false } = {}) => {
  const react = require('react');
  const states = [walletLoaded ? { ownerId, data: exports.creditWalletSchema.parse({ enabled, balance, testMode: true }) } : null, 0, '', walletError, false, open ? ownerId : null, checkout, answer];
  let stateIndex = 0;
  const module = { exports: {} };
  const source = ts.transpileModule(pageSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const injectedRequire = name => {
    if (name === 'react') return { ...react, useState: () => [states[stateIndex++], () => {}], useRef: value => ({ current: value }), useEffect: () => {} };
    if (name === '../context/AuthContext') return { useAuth: () => ({ user: userId ? { id: userId } : null, loading: false, sessionUnavailable }) };
    if (name === '../lib/credits') return exports;
    if (name === '../lib/axios') return {};
    if (name === './AccessibleDialog') return { __esModule: true, default: ({ children, label, variant }) => react.createElement('div', { role: 'dialog', 'aria-label': label, 'data-layout': variant }, children) };
    if (name === './ui/button') return { Button: ({ children, disabled, onClick }) => react.createElement('button', { disabled, onClick }, children) };
    if (name === './SessionUnavailable') return { __esModule: true, default: () => null };
    return require(name);
  };
  new Function('require', 'exports', source)(injectedRequire, module.exports);
  return require('react-dom/server').renderToStaticMarkup(module.exports.default({ embedded: true }));
};

test('rendered composer summary shows balance and zero-credit recovery without opening the panel', () => {
  const normal = renderWallet();
  assert.match(normal, /3 test credits available/);
  assert.match(normal, /Manage credits/);
  assert.doesNotMatch(normal, /role="dialog"/);
  const empty = renderWallet({ balance: 0 });
  assert.match(empty, /Add test credits/);
  assert.match(empty, /your typed question stays here/);
});

test('rendered panel keeps test disclosure and history, and hides other owners checkout and answers', () => {
  const markup = renderWallet({ open: true, checkout: { ownerId: 'TEST-other', url: 'https://checkout.paymongo.com/OTHER' }, answer: { ownerId: 'TEST-other', reply: 'PRIVATE OTHER ANSWER' } });
  assert.match(markup, /role="dialog"/);
  assert.match(markup, /data-layout="drawer"/);
  assert.match(markup, /No real-money purchases are enabled/);
  assert.match(markup, /<details/);
  assert.doesNotMatch(markup, /PRIVATE OTHER ANSWER|checkout.paymongo.com\/OTHER/);
  const sameOwner = renderWallet({ open: true, checkout: { ownerId: 'TEST-owner', url: 'https://checkout.paymongo.com/TEST' } });
  assert.match(sameOwner, /target="_blank" rel="noopener noreferrer"/);
});

test('disabled, signed-out and unavailable-session summaries stay hidden; account switches reset wallet state', () => {
  assert.equal(renderWallet({ enabled: false }), '');
  assert.equal(renderWallet({ userId: null }), '');
  assert.equal(renderWallet({ sessionUnavailable: true }), '');
  assert.equal(renderWallet({ userId: 'TEST-other', open: true }), '');
  assert.match(renderWallet({ walletError: 'TEST ONLY unavailable' }), /Credit balance unavailable/);
  assert.match(statusSource, /key=\{user\?\.id \?\? 'signed-out'\}/);
  assert.match(standaloneSource, /key=\{user\?\.id \?\? 'signed-out'\}/);
});

test('failed initial wallet loading shows unavailable status rather than a permanent loading indicator', () => {
  const markup = renderWallet({ walletLoaded: false, open: true, walletError: 'TEST ONLY unavailable' });
  assert.match(markup, /Wallet unavailable\. Try Refresh wallet\./);
  assert.doesNotMatch(markup, /Loading wallet/);
});

test('returning to the chat refreshes balance without clearing purchase feedback and removes listeners', () => {
  const fixture = pageHarness();
  const listeners = new Map();
  const lastRefresh = { current: 0 };
  const window = { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name) };
  const document = { visibilityState: 'visible', addEventListener: window.addEventListener, removeEventListener: window.removeEventListener };
  const context = { ...fixture.context, window, document, lastRefresh };
  const effect = new Function(...Object.keys(context), ts.transpileModule(`return (${callbacks.get('returnRefresh')});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText)(...Object.values(context));
  fixture.state.error = 'TEST ONLY uncertain payment.';
  const cleanup = effect();
  document.visibilityState = 'hidden';
  listeners.get('visibilitychange')();
  assert.equal(fixture.state.revision, 0);
  document.visibilityState = 'visible';
  listeners.get('visibilitychange')();
  listeners.get('focus')();
  assert.equal(fixture.state.revision, 1);
  assert.equal(fixture.state.error, 'TEST ONLY uncertain payment.');
  cleanup();
  assert.equal(listeners.size, 0);
});

test('automatic wallet reload does not erase a checkout failure notification', async () => {
  const fixture = pageHarness();
  const purchase = fixture.buy('test-pack');
  fixture.post.reject(new Error('TEST ONLY provider unavailable.'));
  await purchase;
  assert.equal(fixture.state.revision, 1);
  assert.equal(fixture.state.error, 'TEST ONLY checkout failure.');
  fixture.loadWallet();
  fixture.get.resolve({ data: { data: { enabled: true, testMode: true, balance: 3 } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.state.wallet.data.balance, 3);
  assert.equal(fixture.state.error, 'TEST ONLY checkout failure.');
});

test('wallet-load failures stay separate from checkout errors', async () => {
  const fixture = pageHarness();
  fixture.state.error = 'TEST ONLY purchase confirmation is uncertain.';
  fixture.loadWallet();
  fixture.get.reject(new Error('TEST ONLY wallet unavailable.'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.state.walletError, 'The wallet could not be loaded. Please try Refresh.');
  assert.equal(fixture.state.error, 'TEST ONLY purchase confirmation is uncertain.');
});

test('wallet reload clears its own failure and owner-tags the result', async () => {
  const fixture = pageHarness();
  fixture.state.walletError = 'TEST ONLY earlier loading failure.';
  fixture.loadWallet();
  fixture.get.resolve({ data: { data: { enabled: false, testMode: true } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.state.walletError, '');
  assert.equal(fixture.state.wallet.ownerId, 'TEST-owner');
  assert.equal(fixture.state.wallet.data.enabled, false);
});

test('cancelled wallet loads cannot overwrite a later account or its feedback', async () => {
  const fixture = pageHarness();
  const cleanup = fixture.loadWallet();
  cleanup();
  fixture.get.resolve({ data: { data: { enabled: true, testMode: true, balance: 3 } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.state.wallet, null);
  assert.equal(fixture.state.walletError, '');
});

test('wallet loads wait during a recoverable authentication outage', async () => {
  const fixture = pageHarness();
  const context = { ...fixture.context, sessionUnavailable: true };
  const load = new Function(...Object.keys(context), ts.transpileModule(`return (${callbacks.get('loadWallet')});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText)(...Object.values(context));
  load();
  assert.equal(fixture.state.gets.length, 0);
});
