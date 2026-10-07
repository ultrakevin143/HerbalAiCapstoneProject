import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const footerPath = fileURLToPath(new URL('../components/Footer.tsx', import.meta.url));
const require = createRequire(footerPath);

function loadComponent(filename) {
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const compiledModule = { exports: {} };
  const localRequire = name => name === './BrandMark'
    ? loadComponent(fileURLToPath(new URL('../components/BrandMark.tsx', import.meta.url)))
    : require(name);
  new Function('require', 'module', 'exports', compiled.outputText)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const Footer = loadComponent(footerPath).default;
const render = props => renderToStaticMarkup(React.createElement(Footer, props));

test('renders semantic quick links and the existing SVG brand', () => {
  const markup = render();
  assert.match(markup, /aria-label="Footer quick links"/);
  for (const href of ['/', '/library', '/chat', '/community', '/suggest', '/about', '/sources', '/privacy']) {
    assert.ok(markup.includes(`href="${href}"`), `Missing ${href}`);
  }
  assert.match(markup, /aria-label="Herbal-Ai home"/);
  assert.match(markup, /<svg/);
  assert.doesNotMatch(markup, /<img/);
});

test('external references identify new tabs and use safe link attributes', () => {
  const markup = render();
  const external = [...markup.matchAll(/<a\b[^>]*href="https:[^"]+"[^>]*>/g)];
  assert.equal(external.length, 4);
  for (const [anchor] of external) {
    assert.match(anchor, /target="_blank"/);
    assert.match(anchor, /rel="noopener noreferrer"/);
  }
  assert.equal((markup.match(/opens in a new tab/g) ?? []).length, 4);
  for (const name of ['PITAHC', 'TKDL Philippines', 'Kew Science', 'StuartXchange']) assert.ok(markup.includes(name));
});

test('retains educational, endorsement and copyright limitations', () => {
  const markup = render();
  assert.ok(markup.includes(String(new Date().getFullYear())));
  assert.ok(markup.includes('not medical advice'));
  assert.ok(markup.includes('do not imply institutional endorsement'));
  assert.ok(markup.includes('Sources &amp; methodology'));
});

test('preserves optional hero-photo attribution without showing it on other pages', () => {
  assert.doesNotMatch(render(), /Irvin Parco/);
  const markup = render({ showHeroPhotoCredit: true });
  assert.ok(markup.includes('Irvin Parco Sto. Tomas'));
  assert.ok(markup.includes('creativecommons.org/licenses/by-sa/4.0/'));
  assert.ok(markup.includes('Mount_Isarog_National_Park'));
});
