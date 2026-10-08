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
const policy = {};
new Function('exports', await compile('../herbalaifrontend/lib/user-ban.ts'))(policy);
const componentSource = await compile('../herbalaifrontend/components/UserBanDialog.tsx');
const target = { id: 'TEST-ban-target', name: 'TEST QA', username: 'TEST_QA', isBanned: false };
const find = (element, predicate) => {
  if (!React.isValidElement(element)) return undefined;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props.children)) {
    const result = find(child, predicate);
    if (result) return result;
  }
};
const fixture = (values = {}, post = async () => ({ data: { status: 'success', data: { user: { ...target, isBanned: true } } } })) => {
  const state = [values.type ?? 'temporary', values.duration ?? '17', values.unit ?? 'minutes', values.reason ?? ' TEST ONLY moderation ', values.confirmed ?? true, false, ''];
  const lock = { current: false };
  const requests = [];
  const saved = [];
  let closes = 0;
  let cursor = 0;
  const hooks = { ...React, useRef: () => lock, useState: () => {
    const position = cursor++;
    return [state[position], value => { state[position] = value; }];
  } };
  const dependency = name => {
    if (name === 'react') return hooks;
    if (name === '../lib/user-ban') return policy;
    if (name === '../lib/axios') return { __esModule: true, default: { post: async (...args) => { requests.push(args); return post(...args); } } };
    if (name === './AccessibleDialog') return { __esModule: true, default: ({ children, label }) => React.createElement('section', { 'aria-label': label }, children) };
    if (name === './ui/button') return { Button: props => React.createElement('button', props) };
    return requireFrontend(name);
  };
  const exports = {};
  new Function('require', 'exports', componentSource)(dependency, exports);
  const render = () => {
    cursor = 0;
    return exports.default({ user: values.user ?? target, onSaved: user => saved.push(user), onClose: () => { closes++; } });
  };
  return { state, requests, saved, lock, render, closes: () => closes,
    submit: () => find(render(), element => element.type === 'form').props.onSubmit({ preventDefault() {} }),
  };
};

for (const [unit, duration] of [['minutes', '17'], ['hours', '5'], ['days', '12']]) {
  test(`sends an administrator-entered ${unit} duration and trimmed reason`, async () => {
    const form = fixture({ unit, duration });
    await form.submit();
    assert.deepEqual(form.requests, [[`/auth/users/${target.id}/ban`, { type: 'temporary', reason: 'TEST ONLY moderation', duration: Number(duration), unit }]]);
    assert.equal(form.saved.length, 1);
  });
}

test('indefinite ban does not send hidden duration fields', async () => {
  const form = fixture({ type: 'indefinite', duration: '' });
  await form.submit();
  assert.deepEqual(form.requests[0][1], { type: 'indefinite', reason: 'TEST ONLY moderation' });
});

test('unban uses the explicit unban endpoint and does not require a new reason', async () => {
  const form = fixture({ user: { ...target, isBanned: true }, reason: '' }, async () => ({ data: { status: 'success', data: { user: target } } }));
  await form.submit();
  assert.deepEqual(form.requests, [[`/auth/users/${target.id}/unban`, {}]]);
});

test('requires confirmation before sending any moderation request', async () => {
  const form = fixture({ confirmed: false });
  await form.submit();
  assert.equal(form.requests.length, 0);
  assert.equal(find(form.render(), element => element.props.type === 'submit').props.disabled, true);
});

for (const values of [{ duration: '' }, { duration: '0' }, { duration: '-1' }, { duration: '1.5' }, { duration: '525601' }, { reason: ' ' }, { reason: 'x'.repeat(501) }]) {
  test(`blocks invalid custom input ${JSON.stringify(values).slice(0, 75)}`, async () => {
    const form = fixture(values);
    await form.submit();
    assert.equal(form.requests.length, 0);
    assert.ok(form.state[6]);
  });
}

test('shows errors above the action button and preserves entered values on failure', async () => {
  const form = fixture({}, async () => { throw { isAxiosError: true, response: { data: { message: 'TEST account changed; refresh' } } }; });
  await form.submit();
  const html = renderToStaticMarkup(form.render());
  assert.ok(html.indexOf('TEST account changed; refresh') < html.indexOf('Confirm ban'));
  assert.equal(form.state[1], '17');
  assert.equal(form.state[3], ' TEST ONLY moderation ');
  assert.equal(form.saved.length, 0);
  assert.equal(form.state[5], false);
});

test('blocks duplicate submissions and closing while the request is pending', async () => {
  let finish;
  const form = fixture({}, () => new Promise(resolve => { finish = resolve; }));
  const pending = form.submit();
  await form.submit();
  assert.equal(form.requests.length, 1);
  const dialog = form.render();
  dialog.props.onClose();
  assert.equal(form.closes(), 0);
  assert.equal(find(dialog, element => element.props.type === 'submit').props.disabled, true);
  finish({ data: { status: 'success', data: { user: { ...target, isBanned: true } } } });
  await pending;
});

test('does not report success for a malformed or wrong-account response', async () => {
  const form = fixture({}, async () => ({ data: { status: 'success', data: { user: { id: 'TEST-other', isBanned: true } } } }));
  await form.submit();
  assert.equal(form.saved.length, 0);
  assert.match(form.state[6], /could not be confirmed/);
});

test('renders two ban options, custom inputs, reason and audit confirmation', () => {
  const html = renderToStaticMarkup(fixture().render());
  for (const label of ['Temporary ban', 'Indefinite ban', 'Duration unit', 'Minutes', 'Hours', 'Days', 'Reason shown to the user', 'audit log']) assert.ok(html.includes(label));
  assert.ok(html.includes('type="number"'));
});

test('renders reason, end time and non-restored sessions for an unban confirmation', () => {
  const html = renderToStaticMarkup(fixture({ user: { ...target, isBanned: true, banReason: 'TEST prior reason', banExpiresAt: '2026-10-09T04:00:00Z' } }).render());
  assert.ok(html.includes('TEST prior reason'));
  assert.ok(html.includes('revoked sessions stay revoked'));
  assert.ok(!html.includes('type="number"'));
});

test('frontend ban status expires at the boundary and preserves legacy/invalid-date bans', () => {
  const expires = '2026-10-09T04:00:00Z';
  assert.equal(policy.isActiveUserBan({ isBanned: true, banExpiresAt: expires }, Date.parse(expires) - 1), true);
  assert.equal(policy.isActiveUserBan({ isBanned: true, banExpiresAt: expires }, Date.parse(expires)), false);
  assert.equal(policy.isActiveUserBan({ isBanned: true, banExpiresAt: 'invalid' }), true);
  assert.equal(policy.isActiveUserBan({ isBanned: true }), true);
  assert.equal(policy.isActiveUserBan({ isBanned: false }), false);
});

test('admin page uses the confirmed dialog, returned account state and cache invalidation', async () => {
  const source = await readFile(new URL('../herbalaifrontend/app/admin/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /<UserBanDialog user=\{banTarget\}/);
  assert.match(source, /invalidateApiGetCache\('\/auth\/users'\)/);
  assert.match(source, /invalidateApiGetCache\('\/admin\/audit-logs'\)/);
  assert.match(source, /isActiveUserBan\(account, banClock\)/);
  assert.doesNotMatch(source, /handleToggleBan/);
});
