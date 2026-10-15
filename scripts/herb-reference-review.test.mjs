import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const requireFrontend = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const source = await readFile(new URL('../herbalaifrontend/components/HerbReferences.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const exports = {};
new Function('exports', 'require', compiled)(exports, requireFrontend);
const review = JSON.parse(await readFile(new URL('../herbalaibackend/content/herbs/verified-source-links-2026-10-15.json', import.meta.url), 'utf8'));
const render = (item, fields) => renderToStaticMarkup(React.createElement(exports.default, { sources: [{
  id: 1, title: `StuartXchange Philippine Medicinal Plants (${item.scientificName})`,
  publisher: 'StuartXchange / Philippine Ethnobotanical Compendium', supports: ['medicinalUses'], ...fields,
}] }));

test('each verified reference renders its precise page with safe external-link attributes', () => {
  for (const item of review.verified) {
    const html = render(item, { url: item.url, citation: 'Existing citation retained.' });
    assert.ok(html.includes(`href="${item.url}"`), item.scientificName);
    assert.match(html, /target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /Existing citation retained\./);
  }
});

test('each unresolved reference shows its review notice and historical citation without a misleading homepage link', () => {
  for (const item of review.requiresReview) {
    const html = render(item, { url: null, citation: `Original historical citation.\n${review.reviewNotice}` });
    assert.match(html, /Original historical citation\./);
    assert.ok(html.includes(review.reviewNotice), item.scientificName);
    assert.doesNotMatch(html, /<a\b/);
    assert.match(html, /Sources &amp; references \(1\)/);
  }
});
