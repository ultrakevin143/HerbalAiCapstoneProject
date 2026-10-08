import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const requireFrontend = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const React = requireFrontend('react');
const source = await readFile(new URL('../herbalaifrontend/app/admin/page.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const banPolicy = {};
new Function('exports', ts.transpileModule(await readFile(new URL('../herbalaifrontend/lib/user-ban.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(banPolicy);
const children = element => React.isValidElement(element) ? React.Children.toArray(element.props.children) : [];
const find = (element, predicate) => {
  if (!React.isValidElement(element)) return undefined;
  if (predicate(element)) return element;
  for (const child of children(element)) {
    const match = find(child, predicate);
    if (match) return match;
  }
};
const text = element => typeof element === 'string' ? element : children(element).map(text).join('');
const deferred = () => {
  let resolve;
  const promise = new Promise(complete => { resolve = complete; });
  return { promise, resolve };
};
const fixture = ({ logout = async () => {}, role = 'admin', loading = false } = {}) => {
  const states = new Map();
  const refs = new Map();
  const navigations = [];
  let stateCursor = 0;
  let refCursor = 0;
  let calls = 0;
  const hooks = {
    ...React,
    useEffect() {},
    useCallback: callback => callback,
    useState(initial) {
      const index = stateCursor++;
      if (!states.has(index)) states.set(index, typeof initial === 'function' ? initial() : initial);
      return [states.get(index), value => states.set(index, typeof value === 'function' ? value(states.get(index)) : value)];
    },
    useRef(initial) {
      const index = refCursor++;
      if (!refs.has(index)) refs.set(index, { current: initial });
      return refs.get(index);
    },
  };
  const wrapper = props => React.createElement('div', props, props.children);
  const dependency = name => {
    if (name === 'react') return hooks;
    if (name === 'next/navigation') return { useRouter: () => ({ push: path => navigations.push(path) }) };
    if (name === 'next/dynamic') return () => wrapper;
    if (name === '../../context/AuthContext') return { useAuth: () => ({
      user: { id: 'TEST-admin', name: 'TEST admin', role },
      loading, isAuthenticated: true, sessionUnavailable: false, checkSession: async () => {},
      logout: async () => { calls++; return logout(); },
    }) };
    if (name === '../../lib/axios') return {};
    if (name === '../../lib/user-ban') return banPolicy;
    if (name === '../../lib/request-cache') return { cachedApiGet: async () => {}, invalidateApiGetCache() {} };
    if (name === '../../components/DisplayPreferences') return { ThemeToggle: wrapper };
    if (name === '../../components/ui/button') return { Button: props => React.createElement('button', props, props.children) };
    if (name === '../../components/ui/card') return { Card: wrapper, CardContent: wrapper, CardHeader: wrapper, CardTitle: wrapper };
    if (name.startsWith('../../components/')) return wrapper;
    if (name === 'lucide-react') return new Proxy({}, { get: () => props => React.createElement('svg', props) });
    return requireFrontend(name);
  };
  const exports = {};
  new Function('require', 'exports', compiled)(dependency, exports);
  const render = () => {
    stateCursor = 0;
    refCursor = 0;
    return exports.default();
  };
  const button = () => {
    const footer = find(render(), element => element.props.className === 'admin-sidebar-footer');
    return find(footer, element => element.type === 'button' && element.props['aria-busy'] !== undefined);
  };
  return { render, button, calls: () => calls, navigations };
};

test('administrator footer exposes a theme-compatible, non-submit Log out button', () => {
  const instance = fixture();
  const button = instance.button();
  assert.ok(button);
  assert.equal(text(button), 'Log out');
  assert.equal(button.props.type, 'button');
  assert.equal(button.props.disabled, false);
  assert.equal(button.props['aria-busy'], false);
  assert.match(button.props.className, /admin-nav-link subtle/);
  assert.ok(find(button, element => element.props['aria-hidden'] === 'true'));
});

test('logout calls the shared authentication action instead of navigating without revocation', async () => {
  const instance = fixture();
  await instance.button().props.onClick();
  assert.equal(instance.calls(), 1);
  assert.deepEqual(instance.navigations, []);
  assert.equal(instance.button().props.disabled, false);
});

test('pending logout has a busy label and rejects rapid duplicate clicks before rerender', async () => {
  const gate = deferred();
  const instance = fixture({ logout: () => gate.promise });
  const staleButton = instance.button();
  const pending = staleButton.props.onClick();
  await staleButton.props.onClick();
  assert.equal(instance.calls(), 1);
  assert.equal(instance.button().props.disabled, true);
  assert.equal(instance.button().props['aria-busy'], true);
  assert.equal(text(instance.button()), 'Logging out…');
  gate.resolve();
  await pending;
  assert.equal(instance.button().props.disabled, false);
});

test('network failure keeps the page available, announces retry feedback and releases the lock', async () => {
  let fail = true;
  const instance = fixture({ logout: async () => { if (fail) throw new Error('TEST network outage'); } });
  await instance.button().props.onClick();
  const alert = find(instance.render(), element => element.props.role === 'alert');
  assert.equal(text(alert), 'Unable to log out. Please try again.');
  assert.equal(instance.button().props.disabled, false);
  assert.deepEqual(instance.navigations, []);
  fail = false;
  await instance.button().props.onClick();
  assert.equal(instance.calls(), 2);
  assert.equal(find(instance.render(), element => element.props.role === 'alert'), undefined);
});

test('backend logout errors are handled without an unhandled promise rejection', async () => {
  const axios = requireFrontend('axios');
  const error = new axios.AxiosError('TEST failure', undefined, undefined, undefined, { data: { message: 'TEST logout temporarily unavailable' } });
  const instance = fixture({ logout: async () => { throw error; } });
  await instance.button().props.onClick();
  assert.equal(text(find(instance.render(), element => element.props.role === 'alert')), 'TEST logout temporarily unavailable');
  assert.equal(instance.button().props['aria-busy'], false);
});

test('loading and non-admin sessions do not expose the administrator footer', () => {
  assert.equal(fixture({ loading: true }).button(), undefined);
  assert.equal(fixture({ role: 'contributor' }).button(), undefined);
});

test('access-denied account switching also handles shared logout failures', async () => {
  const instance = fixture({ role: 'contributor', logout: async () => { throw new Error('TEST failure'); } });
  const switchAccount = find(instance.render(), element => element.type === 'button' && text(element) === 'Sign Out & Switch Account');
  await switchAccount.props.onClick();
  assert.equal(instance.calls(), 1);
  assert.equal(instance.button(), undefined);
  assert.equal(text(find(instance.render(), element => element.props.role === 'alert')), 'Unable to log out. Please try again.');
});
