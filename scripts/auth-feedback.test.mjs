import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const requireFrontend = createRequire(new URL('../herbalaifrontend/package.json', import.meta.url));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const baseline = process.env.AUTH_FEEDBACK_BASELINE_REF;
if (baseline && !/^[a-f0-9]{40}$/i.test(baseline)) throw new Error('Baseline must be an exact commit SHA');
const readSource = path => baseline
  ? execFileSync('git', ['show', `${baseline}:${path}`], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
  : readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const sources = {};
for (const surface of ['signin', 'signup', 'verify-email']) {
  sources[surface] = compile(await readSource(`herbalaifrontend/app/${surface}/page.tsx`));
}
const feedback = {};
new Function('exports', compile(await readSource('herbalaifrontend/lib/request-feedback.ts')))(feedback);
const contextText = await readSource('herbalaifrontend/context/AuthContext.tsx');
const contextTree = ts.createSourceFile('AuthContext.tsx', contextText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let signupDeclaration;
const visitContext = node => {
  if (ts.isVariableDeclaration(node) && node.name.getText(contextTree) === 'signup' && ts.isArrowFunction(node.initializer)) signupDeclaration = node;
  ts.forEachChild(node, visitContext);
};
visitContext(contextTree);
assert.ok(signupDeclaration, 'test must invoke the actual AuthContext signup implementation');
const signupCompiled = compile(`const signup = ${signupDeclaration.initializer.getText(contextTree)};`);
const children = element => React.isValidElement(element) ? React.Children.toArray(element.props.children) : [];
const find = (element, predicate) => {
  if (!React.isValidElement(element)) return undefined;
  if (predicate(element)) return element;
  for (const child of children(element)) {
    const match = find(child, predicate);
    if (match) return match;
  }
};
const fixture = (surface, operation, token = 'TEST-only-verification-token') => {
  const state = surface === 'signin' ? ['TEST-user', 'TEST-password', null, false]
    : surface === 'signup' ? ['TEST', 'User', 'test_user', 'test@example.invalid', 'TEST-password', false, null, false, null, false, false, false, false, null]
    : surface === 'resend' ? ['test@example.invalid', false, null] : [];
  let cursor = 0;
  let refCursor = 0;
  let effects = [];
  const refs = [];
  const requests = [];
  const pending = [];
  const routes = [];
  const logged = [];
  const hooks = { ...React,
    useState: initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = value; }];
    },
    useRef: initial => refs[refCursor++] ?? (refs[refCursor - 1] = { current: initial }),
    useEffect: effect => { effects.push(effect); },
  };
  const request = (...args) => {
    requests.push(args);
    const response = Promise.resolve().then(() => operation(...args));
    pending.push(response);
    return response;
  };
  const api = { post: request, get: request };
  const signup = new Function('api', 'setLoading', 'responseMessage', `${signupCompiled}\nreturn signup;`)(api, () => {}, feedback.responseMessage);
  const exports = {};
  const dependency = name => {
    if (name === 'react') return hooks;
    if (name === 'lucide-react') return new Proxy({}, { get: () => props => React.createElement('svg', props) });
    if (name === 'next/link') return { __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) };
    if (name === 'next/navigation') return { useRouter: () => ({ push: route => routes.push(route) }), useSearchParams: () => new URLSearchParams(token ? { token } : {}) };
    if (name === '../../components/AuthBrandPanel') return { __esModule: true, default: () => null };
    if (name === '../../components/DisplayPreferences') return { ThemeToggle: () => null };
    if (name === '../../context/AuthContext') return { useAuth: () => ({ login: request, signup }) };
    if (name === '../../lib/axios') return { __esModule: true, default: api };
    if (name === '../../lib/request-feedback') return feedback;
    if (name === '../../lib/auth-redirect') return { safeAuthCallback: () => null };
    return requireFrontend(name);
  };
  const suffix = surface === 'verify' ? '\nexports.default = VerifyEmailContent;'
    : surface === 'resend' ? '\nexports.default = ResendVerificationForm;' : '';
  new Function('require', 'exports', 'console', sources[surface === 'verify' || surface === 'resend' ? 'verify-email' : surface] + suffix)(dependency, exports, { error: caught => logged.push(caught) });
  const render = () => {
    cursor = 0;
    refCursor = 0;
    effects = [];
    return exports.default();
  };
  return {
    state, requests, routes, logged, render,
    submit: () => find(render(), element => element.type === 'form').props.onSubmit({ preventDefault() {} }),
    resend: () => find(render(), element => element.type === 'button' && typeof element.props.onClick === 'function').props.onClick(),
    verify: async () => { render(); for (const effect of effects) effect(); await Promise.allSettled(pending); await Promise.resolve(); },
    markup: () => renderToStaticMarkup(render()),
  };
};
const signupResponse = message => ({ data: { message, data: { verificationRequired: true, verificationEmailSent: false } } });

for (const surface of ['signin', 'signup', 'verify']) {
  for (const message of [{ detail: 'TEST malformed response' }, 42, true, '   ']) {
    test(`${surface} error remains renderable for ${JSON.stringify(message)}`, async () => {
      const instance = fixture(surface, async () => { throw { response: { status: 400, data: { message } } }; });
      if (surface === 'verify') await instance.verify(); else await instance.submit();
      assert.match(instance.markup(), /Invalid email\/username or password|Registration failed|Verification failed/);
      if (surface !== 'verify') assert.equal(instance.state[surface === 'signin' ? 3 : 9], false);
    });
  }
}

for (const message of [{ detail: 'TEST invalid acknowledgement' }, 42, true, '   ']) {
  test(`signup normalizes its actual AuthContext acknowledgement for ${JSON.stringify(message)}`, async () => {
    const instance = fixture('signup', async () => signupResponse(message));
    await instance.submit();
    assert.equal(typeof instance.state[8], 'string');
    assert.match(instance.markup(), /Account created.*check your email/);
    assert.equal(instance.state[12], true);
    assert.equal(instance.state[11], true);
    assert.deepEqual(instance.routes, []);
  });
}

for (const response of [{}, { data: null }, { data: { message: { detail: 'TEST malformed acknowledgement' } } }, { data: { message: '   ' } }]) {
  test(`verification acknowledgement remains renderable for ${JSON.stringify(response)}`, async () => {
    const instance = fixture('verify', async () => response);
    await instance.verify();
    assert.equal(instance.state[0], 'success');
    assert.match(instance.markup(), /Your email address has been verified successfully/);
  });
  for (const surface of ['signup', 'resend']) {
    test(`${surface} resend acknowledgement remains renderable for ${JSON.stringify(response)}`, async () => {
      const instance = fixture(surface, async () => response);
      if (surface === 'signup') { instance.state[11] = true; await instance.resend(); } else await instance.submit();
      assert.match(instance.markup(), /If this account is unverified, a new link has been sent/);
      assert.equal(instance.state[surface === 'signup' ? 10 : 1], false);
    });
  }
}

for (const surface of ['signin', 'signup', 'verify', 'resend']) {
  test(`${surface} timeout returns usable feedback instead of leaving pending state`, async () => {
    const instance = fixture(surface, async () => { throw Object.assign(new Error('TEST timeout'), { code: 'ECONNABORTED' }); });
    if (surface === 'verify') await instance.verify(); else await instance.submit();
    assert.match(instance.markup(), surface === 'signin' ? /Unable to sign in/ : surface === 'signup' ? /could not confirm your signup/ : surface === 'verify' ? /Verification failed/ : /could not send a new link/);
    if (surface === 'signup') assert.equal(instance.state[7], true);
    if (surface !== 'verify') assert.equal(instance.state[surface === 'signin' ? 3 : surface === 'signup' ? 9 : 1], false);
  });
}

for (const status of [502, 504, 503, 409]) {
  test(`signup preserves its ${status} uncertain/unavailable/unverified-account recovery`, async () => {
    const instance = fixture('signup', async () => { throw { response: { status, data: { message: 'TEST existing unverified account', verificationRequired: true } } }; });
    await instance.submit();
    assert.match(instance.markup(), [502, 504].includes(status) ? /could not confirm your signup/ : status === 503 ? /temporarily unavailable/ : /TEST existing unverified account/);
    assert.equal(instance.state[7], [502, 504].includes(status));
    assert.equal(instance.state[11], status === 409);
    assert.equal(instance.state[12], false);
  });
}

test('signin keeps genuine credential rejection and does not navigate', async () => {
  const instance = fixture('signin', async () => { throw { response: { status: 401, data: { message: 'Invalid email/username or password.' } } }; });
  await instance.submit();
  assert.match(instance.markup(), /Invalid email\/username or password\./);
  assert.deepEqual(instance.routes, []);
});

test('signup keeps validation detail without asserting account creation', async () => {
  const instance = fixture('signup', async () => { throw { response: { status: 422, data: { errors: [{ message: 'TEST username is not available' }] } } }; });
  await instance.submit();
  assert.match(instance.markup(), /TEST username is not available/);
  assert.equal(instance.state[12], false);
});

test('verification rejection does not log a request carrying its token', async () => {
  const instance = fixture('verify', async () => { throw { response: { status: 400, data: { message: 'Invalid or expired verification token.' } }, config: { url: '/auth/verify-email?token=TEST-only-sensitive-link' } }; });
  await instance.verify();
  assert.equal(instance.state[0], 'error');
  assert.match(instance.markup(), /Invalid or expired verification token/);
  assert.equal(instance.logged.length, 0);
});

test('missing verification token sends no request and offers ordinary recovery', async () => {
  const instance = fixture('verify', async () => { throw new Error('Unexpected request'); }, null);
  await instance.verify();
  assert.match(instance.markup(), /Token is missing/);
  assert.equal(instance.requests.length, 0);
});

test('verification effect remains single-request when run again', async () => {
  const instance = fixture('verify', async () => ({ data: { message: 'TEST verified' } }));
  await instance.verify();
  await instance.verify();
  assert.equal(instance.requests.length, 1);
  assert.match(instance.markup(), /TEST verified/);
});

for (const data of [null, {}, { verificationRequired: 'true', verificationEmailSent: false }]) {
  test(`signup rejects incomplete verification contract ${JSON.stringify(data)} as uncertain`, async () => {
    const instance = fixture('signup', async () => ({ data: { message: 'TEST incomplete response', data } }));
    await instance.submit();
    assert.equal(instance.state[12], false);
    assert.equal(instance.state[7], true);
    assert.match(instance.markup(), /could not confirm your signup/);
  });
}

for (const surface of ['signup', 'resend']) {
  test(`${surface} resend disables its control while pending and restores it on failure`, async () => {
    let reject;
    const pending = new Promise((resolve, fail) => { reject = fail; });
    const instance = fixture(surface, () => pending);
    if (surface === 'signup') instance.state[11] = true;
    const submission = surface === 'signup' ? instance.resend() : instance.submit();
    assert.equal(instance.state[surface === 'signup' ? 10 : 1], true);
    const button = find(instance.render(), element => element.type === 'button' && (surface === 'resend' || typeof element.props.onClick === 'function'));
    assert.equal(button.props.disabled, true);
    reject(new Error('TEST resend unavailable'));
    await submission;
    assert.equal(instance.state[surface === 'signup' ? 10 : 1], false);
    assert.match(instance.markup(), /could not be sent|could not send a new link/);
  });
}

for (const surface of ['signup', 'resend']) {
  test(`${surface} resend preserves a usable server rate-limit message`, async () => {
    const instance = fixture(surface, async () => { throw { response: { status: 429, data: { message: 'TEST wait an hour before requesting another link.' } } }; });
    if (surface === 'signup') { instance.state[11] = true; await instance.resend(); } else await instance.submit();
    assert.match(instance.markup(), /TEST wait an hour before requesting another link/);
    assert.equal(instance.state[surface === 'signup' ? 10 : 1], false);
  });
}

for (const role of ['admin', 'contributor']) {
  test(`successful ${role} sign-in keeps its existing destination`, async () => {
    const instance = fixture('signin', async () => ({ role }));
    const previousWindow = globalThis.window;
    globalThis.window = { location: { search: '' } };
    try { await instance.submit(); } finally { globalThis.window = previousWindow; }
    assert.deepEqual(instance.routes, [role === 'admin' ? '/admin' : '/']);
    assert.equal(instance.state[2], null);
    assert.equal(instance.state[3], false);
  });
}

for (const verificationRequired of [true, false]) {
  test(`successful signup preserves delayed sign-in navigation when verificationRequired=${verificationRequired}`, async () => {
    const instance = fixture('signup', async () => ({ data: { message: ' TEST account created ', data: { verificationRequired, verificationEmailSent: true } } }));
    const previousTimeout = globalThis.setTimeout;
    const timers = [];
    globalThis.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return 0; };
    try { await instance.submit(); } finally { globalThis.setTimeout = previousTimeout; }
    assert.equal(instance.state[8], 'TEST account created');
    assert.equal(instance.state[12], true);
    assert.equal(instance.state[11], false);
    assert.deepEqual(instance.routes, []);
    assert.equal(timers.length, 1);
    assert.equal(timers[0].delay, 5000);
    timers[0].callback();
    assert.deepEqual(instance.routes, ['/signin']);
  });
}

for (const surface of ['signin', 'signup']) {
  test(`${surface} tolerates a null rejection without another exception`, async () => {
    const instance = fixture(surface, async () => { throw null; });
    await instance.submit();
    assert.match(instance.markup(), surface === 'signin' ? /Unable to sign in/ : /could not confirm your signup/);
    assert.equal(instance.state[surface === 'signin' ? 3 : 9], false);
  });
}
