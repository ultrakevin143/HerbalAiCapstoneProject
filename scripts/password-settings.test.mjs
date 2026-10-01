import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const requireFrontend = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const compile = async path => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const compiled = await compile('../herbalaifrontend/components/PasswordSettings.tsx');
const profileCompiled = await compile('../herbalaifrontend/components/ProfileEditorModal.tsx');
const icons = new Proxy({}, { get: () => props => React.createElement('svg', props) });
const user = { name: 'TEST settings', email: 'test@example.invalid', username: 'settings_test', avatar: null };
const load = (source, react, api, passwordComponent) => {
  const exports = {};
  const dependency = name => {
    if (name === 'react') return react;
    if (name === 'lucide-react') return icons;
    if (name === '../lib/axios') return { __esModule: true, default: api };
    if (name === '../context/AuthContext') return { useAuth: () => ({ user, updateProfile: async () => {} }) };
    if (name === './PasswordSettings') return { __esModule: true, default: passwordComponent };
    return requireFrontend(name);
  };
  new Function('require', 'exports', source)(dependency, exports);
  return exports.default;
};
const children = element => React.isValidElement(element) ? React.Children.toArray(element.props.children) : [];
const find = (element, predicate) => {
  if (!React.isValidElement(element)) return undefined;
  if (predicate(element)) return element;
  for (const child of children(element)) {
    const found = find(child, predicate);
    if (found) return found;
  }
};
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
};
const fixture = (values = {}, post = async () => ({ data: { message: 'TEST neutral response' } })) => {
  const state = [values.current ?? 'TEST-original-password', values.next ?? 'TEST-new-password', values.confirm ?? values.next ?? 'TEST-new-password', false, null, null, null];
  const lock = { current: false };
  let cursor = 0;
  const events = [];
  const requests = [];
  let closed = 0;
  const hooks = { ...React, useRef: () => lock, useState: () => {
    const index = cursor++;
    return [state[index], value => { state[index] = value; }];
  } };
  const component = load(compiled, hooks, { post: async (...args) => { requests.push(args); return post(...args); } });
  const render = () => {
    cursor = 0;
    return component({ email: user.email, onChanged: () => { closed++; } });
  };
  const invoke = async handler => {
    const previous = globalThis.window;
    globalThis.window = { dispatchEvent: event => events.push(event.type) };
    try { return await handler(); } finally { globalThis.window = previous; }
  };
  return {
    state, lock, requests, events, render, closed: () => closed,
    change: () => invoke(() => find(render(), element => element.type === 'form').props.onSubmit({ preventDefault() {} })),
    link: () => invoke(() => find(render(), element => element.type === 'button' && children(element).some(child => typeof child === 'string' && child.includes('Email a password link'))).props.onClick()),
  };
};

test('settings render separately from profile editing with labelled password fields and account-safe copy', () => {
  const password = load(compiled, React, { post: async () => {} });
  const profile = load(profileCompiled, React, {}, password);
  const markup = renderToStaticMarkup(React.createElement(profile, { isOpen: true, onClose() {} }));
  assert.match(markup, /Account settings/);
  assert.match(markup, /Current password/);
  assert.match(markup, /Confirm new password/);
  assert.match(markup, /autoComplete="current-password"/i);
  assert.match(markup, /autoComplete="new-password"/i);
  assert.equal((markup.match(/type="password"/g) || []).length, 3);
  assert.match(markup, /Google sign-in still works/);
  assert.match(markup, /all devices/);
  assert.match(markup, /work only once/);
  const forms = [...markup.matchAll(/<form\b|<\/form>/g)].map(match => match[0]);
  assert.deepEqual(forms, ['<form', '</form>', '<form', '</form>']);
});

for (const [name, values, expected] of [
  ['missing current password', { current: '' }, /current password/],
  ['short replacement', { next: 'short' }, /8 characters/],
  ['same password', { next: 'TEST-original-password' }, /different/],
  ['confirmation mismatch', { confirm: 'TEST-other-password' }, /do not match/],
  ['long ASCII password', { next: 'a'.repeat(73) }, /72 UTF-8 bytes/],
  ['long Unicode password', { next: '🙂'.repeat(19) }, /72 UTF-8 bytes/],
]) {
  test('rejects ' + name + ' before sending a request', async () => {
    const instance = fixture(values);
    await instance.change();
    assert.equal(instance.requests.length, 0);
    assert.match(instance.state[5], expected);
    assert.deepEqual(instance.events, []);
  });
}

test('successful changes send only password fields, clear secrets and sign out exactly once', async () => {
  const instance = fixture();
  await instance.change();
  assert.deepEqual(instance.requests, [['/auth/change-password', { currentPassword: 'TEST-original-password', newPassword: 'TEST-new-password' }]]);
  assert.deepEqual(instance.state.slice(0, 3), ['', '', '']);
  assert.deepEqual(instance.events, ['auth-logout']);
  assert.equal(instance.closed(), 1);
  assert.equal(instance.lock.current, false);
});

test('accepts an exactly 72-byte Unicode replacement', async () => {
  const instance = fixture({ next: '🙂'.repeat(18) });
  await instance.change();
  assert.equal(instance.requests.length, 1);
});

test('guards duplicate and competing link requests while a change is pending', async () => {
  const gate = deferred();
  const instance = fixture({}, () => gate.promise);
  const pending = instance.change();
  assert.equal(instance.state[4], 'change');
  assert.equal(instance.lock.current, true);
  await instance.change();
  await instance.link();
  assert.equal(instance.requests.length, 1);
  gate.resolve({ data: {} });
  await pending;
  assert.equal(instance.lock.current, false);
});

for (const [name, failure, expected] of [
  ['wrong current password', { response: { data: { message: 'Current password is incorrect.' } } }, /incorrect/],
  ['validation response', { response: { data: { message: 'Validation failed', errors: [{ message: 'Password too long' }] } } }, /too long/],
  ['rate limit', { response: { data: { message: 'Too many password requests.' } } }, /Too many/],
  ['concurrent mutation', { response: { data: { message: 'Your account changed during this request.' } } }, /account changed/],
  ['timeout or server failure', new Error('TEST timeout'), /Could not confirm.*Try signing in/],
]) {
  test(name + ' does not clear credentials, close settings or falsely sign out', async () => {
    const instance = fixture({}, async () => { throw failure; });
    await instance.change();
    assert.match(instance.state[5], expected);
    assert.equal(instance.closed(), 0);
    assert.deepEqual(instance.events, []);
    assert.equal(instance.state[0], 'TEST-original-password');
    assert.equal(instance.lock.current, false);
    assert.equal(instance.state[4], null);
  });
}

test('setup sends no user-selected target and retains the existing session', async () => {
  const instance = fixture();
  await instance.link();
  assert.deepEqual(instance.requests, [['/auth/password-setup', {}]]);
  assert.equal(instance.state[6], 'TEST neutral response');
  assert.deepEqual(instance.events, []);
  assert.equal(instance.closed(), 0);
});

test('setup fallback requests checking inbox without claiming mail delivery was proven', async () => {
  const instance = fixture({}, async () => ({ data: {} }));
  await instance.link();
  assert.match(instance.state[6], /requested.*Spam.*once an hour/);
});

test('link failure unlocks the form and presents an error, not success', async () => {
  const instance = fixture({}, async () => { throw new Error('TEST mail request failure'); });
  await instance.link();
  assert.match(instance.state[5], /Could not request/);
  assert.equal(instance.state[6], null);
  assert.equal(instance.lock.current, false);
});

test('password visibility uses a labelled toggle without changing field values', () => {
  const instance = fixture();
  const button = find(instance.render(), element => element.type === 'button' && 'aria-pressed' in element.props);
  assert.equal(button.props['aria-pressed'], false);
  button.props.onClick();
  const markup = renderToStaticMarkup(instance.render());
  assert.equal((markup.match(/type="text"/g) || []).length, 3);
  assert.match(markup, /Hide passwords/);
  assert.equal(instance.state[0], 'TEST-original-password');
});
