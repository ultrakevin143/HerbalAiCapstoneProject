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
const dialogCompiled = await compile('../herbalaifrontend/lib/dialog-focus.ts');
const forgotCompiled = await compile('../herbalaifrontend/app/forgot-password/page.tsx');
const resetCompiled = await compile('../herbalaifrontend/app/reset-password/page.tsx');
const dialogExports = {};
new Function('exports', dialogCompiled)(dialogExports);
const icons = new Proxy({}, { get: () => props => React.createElement('svg', props) });
const user = { id: 'TEST-settings-user', name: 'TEST settings', email: 'test@example.invalid', username: 'settings_test', avatar: null };
const load = (source, react, api, passwordComponent, overrides = {}) => {
  const exports = {};
  const dependency = name => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name === 'react') return react;
    if (name === 'lucide-react') return icons;
    if (name === '../lib/axios' || name === '../../lib/axios') return { __esModule: true, default: api };
    if (name === '../context/AuthContext') return { useAuth: () => ({ user, updateProfile: async () => {} }) };
    if (name === './PasswordSettings') return { __esModule: true, default: passwordComponent };
    if (name === '../lib/dialog-focus') return dialogExports;
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

test('settings explain optional app-password creation without claiming to know the login provider', () => {
  const component = load(compiled, React, {});
  const markup = renderToStaticMarkup(React.createElement(component, { email: user.email, onChanged() {} }));
  assert.match(markup, /Create or reset your Herbal-Ai password/);
  assert.match(markup, /haven&#x27;t created a Herbal-Ai password/);
  assert.match(markup, /forgot an existing Herbal-Ai password/);
  assert.match(markup, /does not change your Google password/);
  assert.match(markup, /Google sign-in still works for linked accounts/);
  assert.match(markup, /test@example.invalid/);
});

const pageOverrides = token => ({
  'next/link': { __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) },
  'next/navigation': { useRouter: () => ({ replace() {} }), useSearchParams: () => new URLSearchParams(token ? { token } : {}) },
});

test('public recovery explains separate Herbal-Ai credentials and the continuing Google option', () => {
  const component = load(forgotCompiled, React, {}, undefined, pageOverrides());
  const markup = renderToStaticMarkup(React.createElement(component));
  assert.match(markup, /Forgot Your Herbal-Ai Password/);
  assert.match(markup, /create or reset your Herbal-Ai password/);
  assert.match(markup, /keep using Google sign-in/);
  assert.match(markup, /Google password will not change/);
  assert.match(markup, /Email a Password Link/);
  assert.match(markup, /type="email"/);
  assert.match(markup, /href="\/signin"/);
});

test('public recovery fallback stays neutral when no delivery message is returned', async () => {
  const state = [user.email, null, null, false];
  const requests = [];
  let cursor = 0;
  const hooks = { ...React, useState: () => {
    const index = cursor++;
    return [state[index], value => { state[index] = value; }];
  } };
  const component = load(forgotCompiled, hooks, { post: async (...args) => {
    requests.push(args);
    return { data: {} };
  } }, undefined, pageOverrides());
  const form = find(component(), element => element.type === 'form');
  await form.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(requests, [['/auth/forgot-password', { email: user.email }]]);
  assert.match(state[2], /If an account with that email exists/);
  assert.match(state[2], /requested.*Spam.*wait an hour/);
  assert.doesNotMatch(state[2], /has been sent/);
  assert.equal(state[1], null);
  assert.equal(state[3], false);
});

test('password link form covers setup and recovery while preserving new-password fields', () => {
  const component = load(resetCompiled, React, {}, undefined, pageOverrides('TEST-only-reset-token'));
  const markup = renderToStaticMarkup(React.createElement(component));
  assert.match(markup, /Set Your Herbal-Ai Password/);
  assert.match(markup, /Save Herbal-Ai Password/);
  assert.match(markup, /does not change your Google password/);
  assert.match(markup, /still sign in with Google/);
  assert.match(markup, /signs you out on all devices/);
  assert.equal((markup.match(/type="password"/g) || []).length, 2);
  assert.equal((markup.match(/autoComplete="new-password"/gi) || []).length, 2);
  assert.doesNotMatch(markup, /contributor panel|verification terminal/);
});

test('copy clarification does not enable a password form with a missing token', () => {
  const component = load(resetCompiled, React, {}, undefined, pageOverrides());
  const markup = renderToStaticMarkup(React.createElement(component));
  assert.match(markup, /Invalid reset link. Token is missing/);
  assert.equal((markup.match(/disabled=""/g) || []).length, 3);
  assert.match(markup, /href="\/signin"/);
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

const dialogFixture = () => {
  const listeners = new Map();
  const owner = {
    activeElement: null, body: { style: { overflow: 'auto' } },
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name, listener) => { if (listeners.get(name) === listener) listeners.delete(name); },
  };
  const element = (visible = true) => ({
    isConnected: true, disabled: false,
    getClientRects: () => visible ? [{}] : [],
    focus() { owner.activeElement = this; },
  });
  const previous = element();
  previous.focus();
  const controls = [element(), element(), element()];
  const panel = {
    ownerDocument: owner, focus() { owner.activeElement = this; },
    contains: target => target === panel || controls.includes(target),
    querySelectorAll: () => controls.filter(control => !control.disabled),
  };
  let closes = 0;
  const cleanup = dialogExports.activateDialog(panel, () => { closes++; }, previous);
  const key = (value, shiftKey = false) => {
    let prevented = false;
    listeners.get('keydown')({ key: value, shiftKey, preventDefault() { prevented = true; }, stopPropagation() {} });
    return prevented;
  };
  return { owner, previous, panel, controls, listeners, cleanup, key, closes: () => closes };
};

test('dialog takes focus and locks background scrolling, then restores both on cleanup', () => {
  const instance = dialogFixture();
  assert.equal(instance.owner.activeElement, instance.panel);
  assert.equal(instance.owner.body.style.overflow, 'hidden');
  instance.cleanup();
  assert.equal(instance.owner.activeElement, instance.previous);
  assert.equal(instance.owner.body.style.overflow, 'auto');
  assert.equal(instance.listeners.size, 0);
});

test('Tab from the last control wraps to the first instead of the library behind the dialog', () => {
  const instance = dialogFixture();
  instance.controls.at(-1).focus();
  assert.equal(instance.key('Tab'), true);
  assert.equal(instance.owner.activeElement, instance.controls[0]);
  instance.cleanup();
});

test('Shift+Tab from the first control wraps to the last', () => {
  const instance = dialogFixture();
  instance.controls[0].focus();
  assert.equal(instance.key('Tab', true), true);
  assert.equal(instance.owner.activeElement, instance.controls.at(-1));
  instance.cleanup();
});

test('Tab from the panel or an accidentally focused background control enters the dialog', () => {
  const instance = dialogFixture();
  assert.equal(instance.key('Tab'), true);
  assert.equal(instance.owner.activeElement, instance.controls[0]);
  instance.previous.focus();
  assert.equal(instance.key('Tab', true), true);
  assert.equal(instance.owner.activeElement, instance.controls.at(-1));
  instance.cleanup();
});

test('disabled and hidden controls do not become keyboard wrap targets', () => {
  const instance = dialogFixture();
  instance.controls[0].disabled = true;
  instance.controls.at(-1).getClientRects = () => [];
  assert.equal(instance.key('Tab'), true);
  assert.equal(instance.owner.activeElement, instance.controls[1]);
  instance.cleanup();
});

test('an empty or busy dialog keeps focus on its panel', () => {
  const instance = dialogFixture();
  instance.controls.splice(0);
  instance.previous.focus();
  assert.equal(instance.key('Tab'), true);
  assert.equal(instance.owner.activeElement, instance.panel);
  instance.cleanup();
});

test('Escape closes once while ordinary typing is not intercepted', () => {
  const instance = dialogFixture();
  assert.equal(instance.key('a'), false);
  assert.equal(instance.closes(), 0);
  assert.equal(instance.key('Escape'), true);
  assert.equal(instance.closes(), 1);
  instance.cleanup();
});

test('cleanup does not try to focus a removed account-menu trigger', () => {
  const instance = dialogFixture();
  instance.previous.isConnected = false;
  instance.cleanup();
  assert.equal(instance.owner.activeElement, instance.panel);
});
