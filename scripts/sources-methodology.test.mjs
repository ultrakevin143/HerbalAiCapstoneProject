import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const requireFrontend = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const link = props => {
  const anchorProps = { ...props };
  delete anchorProps.prefetch;
  return React.createElement('a', anchorProps);
};
const loadComponent = async relativePath => {
  const compiled = ts.transpileModule(await readFile(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    reportDiagnostics: true,
  });
  assert.deepEqual(compiled.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error), []);
  const exports = {};
  const require = name => {
    if (name === 'next/link') return link;
    if (name === './BrandMark') return () => React.createElement('svg', { 'aria-hidden': true });
    if (name.endsWith('/Navbar') || name.endsWith('/Footer')) return () => null;
    return requireFrontend(name);
  };
  new Function('exports', 'require', compiled.outputText)(exports, require);
  return exports;
};

const page = await loadComponent('../herbalaifrontend/app/sources/page.tsx');
const footer = await loadComponent('../herbalaifrontend/components/Footer.tsx');

test('sources route has metadata, Library navigation and historical-source limitations', () => {
  const html = renderToStaticMarkup(React.createElement(page.default));
  assert.equal(page.metadata.title, 'Sources & Methodology | Herbal-Ai');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /href="\/library"/);
  assert.match(html, /href="https:\/\/powo.science.kew.org\/"/);
  assert.match(html, /href="https:\/\/www.gutenberg.org\/files\/26393\/26393-h\/26393-h.htm"/);
  assert.match(html, /not current treatment recommendations/);
  assert.match(html, /does not clear a plant for publication/);
  assert.doesNotMatch(html, /<img|<video|<iframe|<script/);
});

test('footer exposes an accessible sources link and preserves existing conditional photo attribution', () => {
  const html = renderToStaticMarkup(React.createElement(footer.default));
  assert.match(html, /href="\/sources"/);
  assert.match(html, /Sources &amp; methodology/);
  assert.match(html, /min-h-11/);
  assert.match(html, /focus-visible:outline/);
  assert.doesNotMatch(html, /Mount Isarog photo/);
  const withHero = renderToStaticMarkup(React.createElement(footer.default, { showHeroPhotoCredit: true }));
  assert.match(withHero, /Mount Isarog photo/);
  assert.match(withHero, /creativecommons.org\/licenses\/by-sa\/4.0/);
});
