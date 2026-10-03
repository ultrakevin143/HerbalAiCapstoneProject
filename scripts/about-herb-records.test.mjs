import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const pagePath = new URL('../herbalaifrontend/app/about/page.tsx', import.meta.url);

test('About uses the shared reviewed repository rather than an independent medical dataset', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.ok(source.includes('cachedApiGet'));
  assert.ok(source.includes('isDohApproved=true'));
  assert.ok(source.includes('HerbReferences'));
});

const requireFrontend = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const compile = async path => {
  const result = ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    reportDiagnostics: true,
  });
  assert.deepEqual(result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error), [], `Syntax error in ${path}`);
  return result.outputText;
};
const recordsModule = {};
new Function('exports', await compile('../herbalaifrontend/lib/about-herb-records.ts'))(recordsModule);
const { aboutHerbRecords } = recordsModule;
const record = (overrides = {}) => ({
  id: 'TEST-herb', localName: 'Lagundi', scientificName: 'TEST reviewed identity', cebuanoName: 'TEST regional name',
  category: 'TEST category', medicinalUses: 'TEST reviewed uses', preparationMethod: 'TEST reviewed preparation',
  dosage: 'TEST reviewed dosage', warnings: 'TEST reviewed safety', imageUrl: '/images/herbs/lagundi.jpg',
  publicationStatus: 'PUBLISHED', isDohApproved: true,
  sources: [{ id: 1, title: 'TEST reference', supports: ['medicinalUses'], url: 'https://example.invalid/study' }],
  ...overrides,
});
const payload = records => ({ status: 'success', data: { herbs: records } });

test('canonical text, taxonomy, images and references are preserved rather than substituted', () => {
  const [herb] = aboutHerbRecords(payload([record()]));
  assert.equal(herb.scientificName, 'TEST reviewed identity');
  assert.equal(herb.englishName, 'TEST regional name');
  assert.deepEqual(herb.indications, ['TEST reviewed uses']);
  assert.equal(herb.preparation, 'TEST reviewed preparation Dosage notes: TEST reviewed dosage');
  assert.equal(herb.safetyNotes, 'TEST reviewed safety');
  assert.equal(herb.sources[0].url, 'https://example.invalid/study');
  assert.equal(herb.image, '/images/herbs/lagundi.jpg');
});

test('directory retains its existing order, omits unknown plants and deduplicates names', () => {
  const herbs = aboutHerbRecords(payload([record({ id: 'TEST-sambong', localName: 'Sambong' }), record(), record(), record({ localName: 'Other plant' })]));
  assert.deepEqual(herbs.map(herb => herb.name), ['Lagundi', 'Sambong']);
});

for (const invalid of [null, {}, { data: { herbs: [] } }, { status: 'error', data: { herbs: [record()] } }, { status: 'success', data: { herbs: {} } }]) {
  test(`malformed directory payload is safe: ${JSON.stringify(invalid)}`, () => {
    assert.deepEqual(aboutHerbRecords(invalid), []);
  });
}

test('unpublished, unlisted and incomplete records cannot supply About medical content', () => {
  assert.deepEqual(aboutHerbRecords(payload([
    null, 42, record({ isDohApproved: false }), record({ isDohApproved: 'true' }),
    record({ publicationStatus: 'DRAFT' }), record({ medicinalUses: null }), record({ dosage: ' ' }),
  ])), []);
});

test('malformed references are filtered and absent safety does not imply safe use', () => {
  const [herb] = aboutHerbRecords(payload([record({
    warnings: null, cebuanoName: null, imageUrl: null,
    sources: [null, {}, { id: 2, title: 'TEST invalid', supports: [42] }, { id: 3, title: 'TEST valid', supports: ['warnings'] }],
  })]));
  assert.equal(herb.englishName, 'TEST category');
  assert.equal(herb.image, '');
  assert.match(herb.safetyNotes, /not a guarantee/);
  assert.equal(herb.sources.length, 1);
});

const pageCompiled = await compile('../herbalaifrontend/app/about/page.tsx');
const fixture = getRecords => {
  const state = [[], null, true, null, 0];
  const effects = [];
  const writes = [];
  const requests = [];
  let cursor = 0;
  const react = { ...React, useState: () => {
    const index = cursor++;
    return [state[index], value => {
      state[index] = typeof value === 'function' ? value(state[index]) : value;
      writes.push(index);
    }];
  }, useEffect: callback => effects.push(callback) };
  const exports = {};
  const dependency = name => {
    if (name === 'react') return react;
    if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
    if (name === '../../context/AuthContext') return { useAuth: () => ({ isAuthenticated: false }) };
    if (name === '../../lib/about-herb-records') return recordsModule;
    if (name === '../../lib/request-cache') return { cachedApiGet: (...args) => { requests.push(args); return getRecords(); } };
    if (name === 'next/link') return { __esModule: true, default: props => React.createElement('a', props) };
    if (name.startsWith('../../components/')) return { __esModule: true, default: () => null };
    return requireFrontend(name);
  };
  new Function('require', 'exports', pageCompiled)(dependency, exports);
  const render = () => { cursor = 0; effects.length = 0; return exports.default(); };
  return { render, state, effects, writes, requests };
};
const settle = () => new Promise(resolve => setImmediate(resolve));
const findButton = (element, label) => {
  if (!React.isValidElement(element)) return undefined;
  if (element.type === 'button' && renderToStaticMarkup(element).includes(label)) return element;
  let found;
  React.Children.forEach(element.props.children, child => {
    if (!found) found = findButton(child, label);
  });
  return found;
};

test('CI includes the reviewed About regressions', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(workflow, /run: node --test \.\.\/scripts\/about-herb-records\.test\.mjs/);
});

test('page loads reviewed records through the shared cache and links the exact herb identity', async () => {
  const context = fixture(async () => ({ data: payload([record()]) }));
  context.render();
  const cleanup = context.effects[0]();
  await settle();
  const html = renderToStaticMarkup(context.render());
  assert.match(html, /TEST reviewed identity/);
  assert.match(html, /TEST reviewed safety/);
  assert.match(html, /library\?id=TEST-herb/);
  assert.deepEqual(context.requests, [['/herbs?isDohApproved=true&limit=20', 60_000, false]]);
  cleanup();
});

test('network failure produces actionable retry instead of old treatment instructions', async () => {
  const context = fixture(async () => { throw new Error('TEST offline'); });
  context.render();
  context.effects[0]();
  await settle();
  const html = renderToStaticMarkup(context.render());
  assert.match(html, /role="alert"/);
  assert.match(html, /Try again/);
  assert.equal(context.state[2], false);
  assert.equal(context.state[0].length, 0);
});

test('late completion after unmount cannot overwrite page state', async () => {
  let complete;
  const context = fixture(() => new Promise(resolve => { complete = resolve; }));
  context.render();
  const cleanup = context.effects[0]();
  const initialWrites = context.writes.length;
  cleanup();
  complete({ data: payload([record()]) });
  await settle();
  assert.equal(context.writes.length, initialWrites);
  assert.equal(context.state[0].length, 0);
});

test('retry forces fresh data and removes the error after recovery', async () => {
  let attempts = 0;
  const context = fixture(async () => {
    if (++attempts === 1) throw new Error('TEST offline');
    return { data: payload([record()]) };
  });
  context.render();
  const cleanup = context.effects[0]();
  await settle();
  findButton(context.render(), 'Try again').props.onClick();
  cleanup();
  context.render();
  context.effects[0]();
  await settle();
  assert.equal(context.state[3], null);
  assert.equal(context.state[2], false);
  assert.equal(context.state[0].length, 1);
  assert.deepEqual(context.requests[1], ['/herbs?isDohApproved=true&limit=20', 60_000, true]);
});

test('plant selection updates the canonical details and exact Library link', async () => {
  const context = fixture(async () => ({ data: payload([
    record(), record({ id: 'TEST-sambong', localName: 'Sambong', warnings: 'TEST Sambong safety' }),
  ]) }));
  context.render();
  context.effects[0]();
  await settle();
  findButton(context.render(), 'Sambong').props.onClick();
  const rendered = context.render();
  const html = renderToStaticMarkup(rendered);
  assert.equal(context.state[1], 'TEST-sambong');
  assert.equal(findButton(rendered, 'Sambong').props['aria-pressed'], true);
  assert.equal(findButton(rendered, 'Lagundi').props['aria-pressed'], false);
  assert.match(html, /TEST Sambong safety/);
  assert.match(html, /library\?id=TEST-sambong/);
});

test('empty reviewed responses show an error without rendering medicinal details', async () => {
  const context = fixture(async () => ({ data: payload([]) }));
  context.render();
  context.effects[0]();
  await settle();
  const html = renderToStaticMarkup(context.render());
  assert.match(html, /Reviewed plant records are temporarily unavailable/);
  assert.doesNotMatch(html, /Dosage notes:/);
  assert.equal(context.state[2], false);
});

test('late rejection after unmount cannot write error or loading state', async () => {
  let fail;
  const context = fixture(() => new Promise((resolve, reject) => { fail = reject; }));
  context.render();
  const cleanup = context.effects[0]();
  const initialWrites = context.writes.length;
  cleanup();
  fail(new Error('TEST delayed failure'));
  await settle();
  assert.equal(context.writes.length, initialWrites);
  assert.equal(context.state[3], null);
});

test('About removes stale plant identities and unsupported independent treatment copy', async () => {
  const source = await readFile(pagePath, 'utf8');
  for (const stale of ['Clinopodium douglasii', 'Yesterday, Today, and Tomorrow', 'chrysoplenol D', '1/3 cup three times a day', 'scientificFact:']) {
    assert.ok(!source.includes(stale), `Stale About copy remains: ${stale}`);
  }
});

test('narrow plant cards can grow and stack without clipping canonical names', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /grid-cols-1 min-\[360px\]:grid-cols-2/);
  assert.match(source, /gap-2 min-h-\[110px\]/);
  assert.doesNotMatch(source, /\s+h-\[110px\]/);
  assert.match(source, /min-w-0 break-words/);
});
