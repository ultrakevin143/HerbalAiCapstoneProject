import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../herbalaifrontend/app/library/page.tsx', import.meta.url), 'utf8');
const syntax = ts.createSourceFile('library.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let card;
const inspect = node => {
  if (ts.isJsxOpeningElement(node)) {
    const classes = node.attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(syntax) === 'className');
    if (classes?.initializer && ts.isStringLiteral(classes.initializer) && classes.initializer.text.includes('library-herb-card')) card = node;
  }
  ts.forEachChild(node, inspect);
};
inspect(syntax);
assert.ok(card, 'the rendered herb card exists');

const attribute = name => card.attributes.properties.find(property => ts.isJsxAttribute(property) && property.name.getText(syntax) === name);
const expression = name => {
  const initializer = attribute(name)?.initializer;
  assert.ok(initializer && ts.isJsxExpression(initializer) && initializer.expression, `${name} has an executable expression`);
  return initializer.expression.getText(syntax);
};
const execute = (name, herb, setSelectedHerb) => {
  const compiled = ts.transpileModule(`const handler = ${expression(name)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  return new Function('herb', 'setSelectedHerb', compiled + '\nreturn handler;')(herb, setSelectedHerb);
};

test('library cards expose a named, focusable dialog action without changing their container', () => {
  assert.equal(card.tagName.getText(syntax), 'div');
  assert.equal(attribute('role')?.initializer?.text, 'button');
  assert.equal(expression('tabIndex'), '0');
  assert.equal(attribute('aria-haspopup')?.initializer?.text, 'dialog');
  const name = new Function('herb', `return ${expression('aria-label')};`)({ localName: 'TEST Lagundi' });
  assert.equal(name, 'View TEST Lagundi details');
  assert.match(attribute('className').initializer.text, /focus-visible:outline/);
});

for (const key of ['Enter', ' ']) {
  test(`library card opens the selected herb on ${JSON.stringify(key)} and prevents page scrolling`, () => {
    const herb = { id: 'TEST-herb', localName: 'TEST Lagundi' };
    const selected = [];
    let prevented = 0;
    execute('onKeyDown', herb, value => selected.push(value))({ key, preventDefault() { prevented++; } });
    assert.deepEqual(selected, [herb]);
    assert.equal(prevented, 1);
  });
}

test('ordinary keyboard navigation does not open a herb or prevent default navigation', () => {
  const selected = [];
  let prevented = 0;
  const handler = execute('onKeyDown', { id: 'TEST-herb' }, value => selected.push(value));
  for (const key of ['Tab', 'Escape', 'ArrowDown', 'a']) handler({ key, preventDefault() { prevented++; } });
  assert.deepEqual(selected, []);
  assert.equal(prevented, 0);
});

test('pointer activation still opens the same selected herb', () => {
  const herb = { id: 'TEST-herb' };
  const selected = [];
  execute('onClick', herb, value => selected.push(value))();
  assert.deepEqual(selected, [herb]);
});
