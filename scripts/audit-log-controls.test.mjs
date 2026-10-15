import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../herbalaifrontend/src/features/admin/useAdminWorkspace.ts', import.meta.url), 'utf8');
const syntax = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
const inspect = node => {
  if (ts.isCallExpression(node) && node.expression.getText(syntax) === 'useEffect'
    && node.arguments[0]?.getText(syntax).includes("api.get('/admin/audit-logs'")) callback = node.arguments[0];
  ts.forEachChild(node, inspect);
};
inspect(syntax);
assert.ok(callback, 'exercise the actual admin data-loading effect');
const compiled = ts.transpileModule(`const setup = ${callback.getText(syntax)};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText + '\nreturn setup;';
const drain = async () => { for (let index = 0; index < 20; index++) await Promise.resolve(); };
const result = (logs = [{ id: 155 }], total = 155) => ({ data: { status: 'success', data: { logs, total } } });
const deferred = () => { let resolve; const promise = new Promise(accept => { resolve = accept; }); return { promise, resolve }; };
const fixture = (options = {}) => {
  const state = { logs: [], total: 0, loading: false, failed: false, error: null, requests: [], redirects: [] };
  const context = {
    activeTab: 'audit', auditPage: options.page ?? 1, auditPageSize: 50,
    trimmedAuditSearch: options.search ?? '', debouncedAuditSearch: options.debounced ?? options.search ?? '',
    loading: false, isAuthenticated: true, sessionUnavailable: false, user: { role: options.role ?? 'admin' },
    router: { push: path => state.redirects.push(path) },
    api: { get: (...args) => { state.requests.push(args); return options.get?.(...args) ?? Promise.resolve(result()); } },
    setError: value => { state.error = value; }, getErrorMessage: (_error, fallback) => fallback,
    setAuditLoading: value => { state.loading = value; }, setAuditLoadFailed: value => { state.failed = value; },
    setAuditLogs: value => { state.logs = value; }, setAuditTotal: value => { state.total = value; },
  };
  return { state, setup: new Function(...Object.keys(context), compiled)(...Object.values(context)) };
};

test('audit page four requests the last records and uses the server-wide count', async () => {
  const { state, setup } = fixture({ page: 4, get: async () => result([{ id: 5 }], 155) });
  const cleanup = setup(); await drain();
  assert.deepEqual(state.requests, [['/admin/audit-logs', { params: { limit: 50, offset: 150, search: undefined } }]]);
  assert.deepEqual(state.logs, [{ id: 5 }]); assert.equal(state.total, 155); assert.equal(state.loading, false);
  cleanup();
});

test('target and detail queries go to the server instead of filtering only loaded rows', async () => {
  const { state, setup } = fixture({ search: 'oldest-target', get: async () => result([{ id: 1 }], 1) });
  const cleanup = setup(); await drain();
  assert.equal(state.requests[0][1].params.search, 'oldest-target');
  assert.deepEqual(state.logs, [{ id: 1 }]); assert.equal(state.total, 1); cleanup();
});

test('a search still being debounced cannot issue a request for the previous query', async () => {
  const { state, setup } = fixture({ search: 'new', debounced: 'old' }); setup(); await drain();
  assert.deepEqual(state.requests, []);
});

test('a stale response cannot overwrite the next page or clear its loading state', async () => {
  const response = deferred(); const { state, setup } = fixture({ get: () => response.promise });
  const cleanup = setup(); cleanup(); response.resolve(result([{ id: 99 }], 99)); await drain();
  assert.deepEqual(state.logs, []); assert.equal(state.total, 0); assert.equal(state.loading, true);
});

test('no matches clears the previous list and count', async () => {
  const { state, setup } = fixture({ search: 'absent', get: async () => result([], 0) });
  const cleanup = setup(); await drain();
  assert.deepEqual(state.logs, []); assert.equal(state.total, 0); assert.equal(state.failed, false); cleanup();
});

test('an unavailable audit API exposes failure and releases the loading state', async () => {
  const { state, setup } = fixture({ get: async () => { throw new Error('offline'); } });
  const cleanup = setup(); await drain();
  assert.equal(state.failed, true); assert.equal(state.loading, false); assert.ok(state.error); cleanup();
});

test('contributors cannot start administrator audit requests', async () => {
  const { state, setup } = fixture({ role: 'contributor' }); const cleanup = setup(); await drain();
  assert.deepEqual(state.requests, []); cleanup();
});

const requireFrontend = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const sectionSource = await readFile(new URL('../herbalaifrontend/src/features/admin/sections/AuditLogsSection.tsx', import.meta.url), 'utf8');
const sectionExports = {};
new Function('exports', 'require', ts.transpileModule(sectionSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText)(sectionExports, name => name === 'lucide-react'
  ? new Proxy({}, { get: () => attributes => React.createElement('svg', attributes) }) : requireFrontend(name));
const renderSection = overrides => sectionExports.default({
  auditSearch: '', trimmedAuditSearch: '', auditPage: 1, auditTotal: 155, auditPageSize: 50,
  auditLogs: [], auditLoading: false, auditLoadFailed: false,
  setAuditSearch() {}, setAuditPage() {}, setAuditLoading() {}, ...overrides,
});
const findButton = (element, label) => {
  if (!React.isValidElement(element)) return undefined;
  const children = React.Children.toArray(element.props.children);
  if (element.type === 'button' && children.join('') === label) return element;
  return children.map(child => findButton(child, label)).find(Boolean);
};

test('live audit presentation reaches the incomplete final page and locks page boundaries', () => {
  for (const [page, previousDisabled, nextDisabled, range] of [[1, true, false, '1–50'], [4, false, true, '151–155']]) {
    const tree = renderSection({ auditPage: page });
    assert.match(renderToStaticMarkup(tree), new RegExp(`Showing ${range} of 155`));
    assert.equal(findButton(tree, 'Previous').props.disabled, previousDisabled);
    assert.equal(findButton(tree, 'Next').props.disabled, nextDisabled);
  }
  const loading = renderSection({ auditLoading: true, auditPage: 2 });
  assert.equal(findButton(loading, 'Previous').props.disabled, true);
  assert.equal(findButton(loading, 'Next').props.disabled, true);
});

test('unmatched audit searches show zero results and Clear search resets page and loading', () => {
  const calls = [];
  const tree = renderSection({ auditSearch: 'absent', trimmedAuditSearch: 'absent', auditTotal: 0,
    setAuditSearch: value => calls.push(['search', value]), setAuditPage: value => calls.push(['page', value]),
    setAuditLoading: value => calls.push(['loading', value]),
  });
  const html = renderToStaticMarkup(tree);
  assert.match(html, /No audit records match this search\./);
  assert.match(html, /Showing 0–0 of 0 matching records/);
  findButton(tree, 'Clear search').props.onClick();
  assert.deepEqual(calls, [['search', ''], ['page', 1], ['loading', true]]);
});
