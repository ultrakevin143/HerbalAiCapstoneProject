import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../herbalaifrontend/lib/pwa-install.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createInstallNotice, INSTALL_NOTICE_DELAY, INSTALL_NOTICE_COOLDOWN, INSTALL_NOTICE_STORAGE_KEY } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((success, failure) => { resolve = success; reject = failure; });
  return { promise, resolve, reject };
};
const harness = ({ navigator = {}, stored = null, blockedStorage = false, standalone = false } = {}) => {
  const events = new Map();
  const mediaEvents = new Map();
  const timers = new Map();
  const writes = [];
  const snapshots = [];
  const media = { matches: standalone, addEventListener: (name, callback) => mediaEvents.set(name, callback), removeEventListener: name => mediaEvents.delete(name) };
  const browser = {
    navigator: { userAgent: 'Chrome', platform: 'Win32', maxTouchPoints: 0, ...navigator },
    matchMedia: () => media,
    localStorage: {
      getItem: () => { if (blockedStorage) throw new Error('Denied'); return stored; },
      setItem: (...args) => { if (blockedStorage) throw new Error('Denied'); writes.push(args); },
    },
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: name => events.delete(name),
    setTimeout: (callback, delay) => { timers.set(1, { callback, delay }); return 1; },
    clearTimeout: timer => timers.delete(timer),
  };
  const controller = createInstallNotice(browser, state => snapshots.push(state));
  controller.start();
  const ready = () => { const timer = timers.get(1); timers.delete(1); timer?.callback(); };
  let calls = 0;
  let prevented = 0;
  const prompt = (outcome = 'accepted', failure = null, choice = null) => {
    events.get('beforeinstallprompt')?.({ preventDefault: () => prevented++, prompt: () => { calls++; return failure ? Promise.reject(failure) : Promise.resolve(); }, userChoice: choice ?? Promise.resolve({ outcome, platform: 'web' }) });
  };
  return { controller, events, mediaEvents, media, timers, writes, snapshots, ready, prompt, calls: () => calls, prevented: () => prevented, state: () => snapshots.at(-1) };
};

test('unsupported browsers do not show a misleading Add control', () => {
  const view = harness();
  view.ready();
  assert.equal(view.snapshots.length, 0);
});
test('eligible native prompt waits seven seconds and never automatically installs', () => {
  const view = harness();
  assert.equal(view.timers.get(1).delay, INSTALL_NOTICE_DELAY);
  view.prompt();
  assert.equal(view.state().visible, false);
  assert.equal(view.prevented(), 1);
  view.ready();
  assert.equal(view.state().visible, true);
  assert.equal(view.calls(), 0);
});
test('late browser eligibility still reveals the notification', () => {
  const view = harness();
  view.ready();
  view.prompt();
  assert.equal(view.state().visible, true);
});
test('Add opens the saved native prompt once and hides after acceptance', async () => {
  const view = harness();
  view.prompt();
  view.ready();
  await view.controller.add();
  await view.controller.add();
  assert.equal(view.calls(), 1);
  assert.equal(view.state().visible, false);
  assert.equal(view.state().pending, false);
});
test('rapid repeated Add clicks cannot duplicate installation prompts', async () => {
  const choice = deferred();
  const view = harness();
  view.prompt('accepted', null, choice.promise);
  view.ready();
  const first = view.controller.add();
  await view.controller.add();
  assert.equal(view.calls(), 1);
  choice.resolve({ outcome: 'accepted' });
  await first;
});
test('browser cancellation hides and records a dismissal, not installation', async () => {
  const view = harness();
  view.prompt('dismissed');
  view.ready();
  await view.controller.add();
  assert.equal(view.state().visible, false);
  assert.equal(view.writes[0][0], INSTALL_NOTICE_STORAGE_KEY);
  view.prompt();
  assert.equal(view.state().visible, false);
});
test('Not now suppresses repeat events and stores the cooldown', () => {
  const view = harness();
  view.prompt();
  view.ready();
  view.controller.dismiss();
  view.prompt();
  assert.equal(view.state().visible, false);
  assert.equal(view.writes.length, 1);
});
test('reload during the seven-day cooldown does not show the prompt', () => {
  const view = harness({ stored: String(Date.now() - 60_000) });
  view.prompt();
  view.ready();
  assert.equal(view.state().visible, false);
});
test('expired or malformed dismissal permits an eligible prompt', () => {
  for (const stored of ['not-a-date', String(Date.now() - INSTALL_NOTICE_COOLDOWN - 1000)]) {
    const view = harness({ stored });
    view.prompt();
    view.ready();
    assert.equal(view.state().visible, true);
  }
});
test('blocked storage cannot crash installation or dismissal', () => {
  const view = harness({ blockedStorage: true });
  view.prompt();
  view.ready();
  assert.doesNotThrow(() => view.controller.dismiss());
  view.prompt();
  assert.equal(view.state().visible, false);
});
test('standalone and iOS home-screen launches suppress the notification', () => {
  for (const options of [{ standalone: true }, { navigator: { standalone: true } }]) {
    const view = harness(options);
    view.prompt();
    view.ready();
    assert.equal(view.state().visible, false);
  }
});
test('installation and display-mode changes hide an already visible prompt', () => {
  for (const nativeEvent of [true, false]) {
    const view = harness();
    view.prompt();
    view.ready();
    if (nativeEvent) view.events.get('appinstalled')();
    else { view.media.matches = true; view.mediaEvents.get('change')(); }
    assert.equal(view.state().visible, false);
  }
});
test('iPhone and touch-based iPad Safari show manual steps without pretending to install', async () => {
  for (const navigator of [{ userAgent: 'iPhone Version/18 Safari' }, { userAgent: 'Version/18 Safari', platform: 'MacIntel', maxTouchPoints: 5 }]) {
    const view = harness({ navigator });
    view.ready();
    assert.equal(view.state().mode, 'ios');
    assert.equal(view.state().visible, true);
    await view.controller.add();
    assert.equal(view.state().instructions, true);
    assert.equal(view.calls(), 0);
  }
});
test('non-Safari iOS and desktop Safari do not receive incorrect Safari instructions', () => {
  for (const navigator of [{ userAgent: 'iPhone CriOS Safari' }, { userAgent: 'iPhone FxiOS Safari' }, { userAgent: 'Version/18 Safari', platform: 'MacIntel' }]) {
    const view = harness({ navigator });
    view.ready();
    assert.equal(view.snapshots.length, 0);
  }
});
test('prompt errors are visible and handled without replaying a consumed event', async () => {
  const view = harness();
  view.prompt('accepted', new Error('NotAllowedError'));
  view.ready();
  await view.controller.add();
  assert.match(view.state().error, /could not open installation/);
  assert.equal(view.state().pending, false);
  await view.controller.add();
  assert.equal(view.calls(), 1);
});
test('disposal cleans listeners and timer, and ignores async completion', async () => {
  const choice = deferred();
  const view = harness();
  view.prompt('accepted', null, choice.promise);
  const pending = view.controller.add();
  view.controller.dispose();
  const snapshots = view.snapshots.length;
  choice.resolve({ outcome: 'accepted' });
  await pending;
  assert.equal(view.snapshots.length, snapshots);
  assert.equal(view.events.size, 0);
  assert.equal(view.mediaEvents.size, 0);
  assert.equal(view.timers.size, 0);
});
test('one global compact non-modal notice replaces the mobile navigation button', async () => {
  const component = await readFile(new URL('../herbalaifrontend/components/PwaInstall.tsx', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../herbalaifrontend/app/layout.tsx', import.meta.url), 'utf8');
  const navbar = await readFile(new URL('../herbalaifrontend/components/Navbar.tsx', import.meta.url), 'utf8');
  assert.equal((layout.match(/<PwaInstallNotice\s*\/>/g) ?? []).length, 1);
  assert.doesNotMatch(navbar, /PwaInstallButton|Install Herbal-Ai/);
  assert.match(component, /<aside/);
  assert.match(component, /max-w-sm/);
  assert.match(component, /min-h-11/);
  assert.match(component, /safe-area-inset-bottom/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /Not now/);
  assert.doesNotMatch(component, /aria-modal|role="dialog"|backdrop/);
});
