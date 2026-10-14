import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const read = path => readFile(new URL(`../herbalaifrontend/${path}`, import.meta.url), 'utf8');
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const adminSource = (await Promise.all([
  'src/features/admin/useAdminWorkspace.ts',
  'src/features/admin/actions/review-actions.ts',
  'src/features/admin/actions/herb-actions.ts',
  'src/features/admin/actions/knowledge-base-actions.ts',
  'src/features/admin/actions/user-actions.ts',
].map(read))).join('\n');
const adminSections = Object.fromEntries(await Promise.all(
  ['UsersSection', 'HerbsSection', 'KnowledgeBaseSection', 'AuditLogsSection'].map(async name =>
    [name, await read(`src/features/admin/sections/${name}.tsx`)])));
const suggestionSource = [
  await read('src/features/suggestions/SuggestHerbScreen.tsx'),
  await read('src/features/suggestions/useSuggestionSubmission.ts'),
].join('\n');
const signupSource = await read('src/features/auth/SignUpScreen.tsx');
const suggestionReview = {};
new Function('exports', compile(await read('src/features/suggestions/suggestion-review.ts')))(suggestionReview);
const sourcePolicy = {};
new Function('exports', compile(await read('src/features/admin/knowledge-source.ts')))(sourcePolicy);
const names = {};
new Function('exports', compile(await read('src/validation/registration-name.ts')))(names);

const initializer = (source, name) => {
  const parsed = ts.createSourceFile('review.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result;
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === name) result = node.initializer.getText(parsed);
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.ok(result, `Missing implementation: ${name}`);
  return result;
};
const loadHandler = (source, name, context) => new Function(...Object.keys(context),
  compile(`const handler = ${initializer(source, name)};`) + '; return handler;')(...Object.values(context));

const usersEffectSource = () => {
  const parsed = ts.createSourceFile('admin.tsx', adminSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result;
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'useEffect'
      && node.arguments[0]?.getText(parsed).includes('const fetchUsers')) result = node.arguments[0].getText(parsed);
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.ok(result, 'Missing global users fetch effect');
  return result;
};

const usersFixture = (overrides = {}, get) => {
  const values = {};
  const requests = [];
  const context = {
    loading: false, isAuthenticated: true, sessionUnavailable: false, user: { role: 'admin' }, activeTab: 'users',
    usersPage: 2, trimmedUserSearch: 'needle', debouncedUserSearch: 'needle', userRoleFilter: 'admin', userStatusFilter: 'BANNED',
    api: { get: async (url, config) => {
      requests.push({ url, config });
      return get ? get() : { data: { status: 'success', data: { users: [{ id: 'off-first-page' }], total: 1, allTotal: 32, page: 1 } } };
    } },
    ...Object.fromEntries(['UsersLoading', 'UsersLoadFailed', 'UsersList', 'UsersTotal', 'UsersAllTotal', 'UsersPage', 'Error']
      .map(name => [`set${name}`, value => { values[name] = value; }])),
    getErrorMessage: (_error, fallback) => fallback, ...overrides,
  };
  const effect = new Function(...Object.keys(context), compile(`const effect = ${usersEffectSource()};`) + '; return effect;')(...Object.values(context));
  return { effect, values, requests };
};

test('users fetch sends global search/role/status and accepts filtered counts and clamped page', async () => {
  const fixture = usersFixture();
  const cleanup = fixture.effect();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(fixture.requests, [{ url: '/auth/users', config: { params: {
    page: 2, limit: 25, search: 'needle', role: 'admin', status: 'BANNED',
  } } }]);
  assert.deepEqual(fixture.values.UsersList, [{ id: 'off-first-page' }]);
  assert.equal(fixture.values.UsersTotal, 1);
  assert.equal(fixture.values.UsersAllTotal, 32);
  assert.equal(fixture.values.UsersPage, 1);
  assert.equal(fixture.values.UsersLoading, false);
  cleanup();
});

for (const guard of [{ loading: true }, { isAuthenticated: false }, { sessionUnavailable: true },
  { user: { role: 'contributor' } }, { activeTab: 'dashboard' }, { trimmedUserSearch: 'still typing' }]) {
  test(`users fetch makes no API call while guarded: ${JSON.stringify(guard)}`, async () => {
    const fixture = usersFixture(guard);
    fixture.effect();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(fixture.requests.length, 0);
  });
}

test('cancelled users fetch cannot overwrite a newer filter result or clear its loading state', async () => {
  let finish;
  const fixture = usersFixture({}, () => new Promise(resolve => { finish = resolve; }));
  const cleanup = fixture.effect();
  cleanup();
  finish({ data: { status: 'success', data: { users: [{ id: 'stale' }], total: 1, page: 2 } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(fixture.values.UsersList, []);
  assert.equal(fixture.values.UsersTotal, undefined);
  assert.equal(fixture.values.UsersLoading, true);
});

test('users provider failures are not reported as a successful empty search', async () => {
  for (const get of [async () => { throw new Error('Isolated API failure'); }, async () => ({ data: { status: 'error' } })]) {
    const fixture = usersFixture({}, get);
    fixture.effect();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(fixture.values.UsersLoadFailed, true);
    assert.equal(fixture.values.UsersLoading, false);
    assert.equal(fixture.values.UsersTotal, undefined);
    assert.match(fixture.values.Error, /Unable to load users/);
  }
});

test('all Users filter interactions reset pagination without altering the server-returned list', () => {
  const parsed = ts.createSourceFile('UsersSection.tsx', adminSections.UsersSection, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const handlers = [];
  const visit = node => {
    if (ts.isJsxAttribute(node) && ['onChange', 'onClick'].includes(node.name.getText(parsed))) {
      const text = node.initializer?.getText(parsed) || '';
      if (text.includes('setUserSearch(') || text.includes('setUserRoleFilter(') || text.includes('setUserStatusFilter(')) handlers.push(text);
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.equal(handlers.length, 6);
  for (const handler of handlers) assert.ok(handler.includes('setUsersPage(1)'), handler);
  assert.equal(initializer(adminSource, 'filteredUsersList'), 'usersWithBanStatus');
  assert.match(adminSource, /setDebouncedUserSearch\(trimmedUserSearch\), 350/);
  assert.match(initializer(adminSource, 'handleBanSaved'), /setUsersRefresh/);
  assert.match(adminSections.UsersSection, /usersLoadFailed \? 'Retry' : 'Clear search & filters'/);
});

const approval = (selection, status = 'UNASSESSED') => {
  const requests = [];
  const errors = [];
  const pending = [];
  const handler = loadHandler(adminSource, 'handleApprove', {
    actioningId: null,
    evidenceClassById: selection ? { 7: selection } : {},
    reviewNotesById: {}, suggestions: [{ id: 7, revision: 3, evidenceClass: status }],
    setActioningId: value => pending.push(value), setError: value => errors.push(value), setSuccessMsg() {},
    api: { post: async (url, payload) => { requests.push({ url, payload }); return { data: { status: 'mock_no_mutation' } }; } },
  });
  return { handler, requests, errors, pending };
};

for (const storedClass of ['UNASSESSED', 'DOCUMENTED_TRADITIONAL_USE', 'DOH_PITAHC_LISTED']) {
  test(`requires explicit evidence selection even if stored classification is ${storedClass}`, async () => {
    const fixture = approval('', storedClass);
    await fixture.handler(7);
    assert.equal(fixture.requests.length, 0);
    assert.match(fixture.errors.at(-1), /Select an evidence classification/);
    assert.equal(fixture.pending.at(-1), null);
  });
}

test('submits exactly the reviewer-selected evidence and revision', async () => {
  const fixture = approval('EVIDENCE_SUPPORTED_PHILIPPINE_USE');
  await fixture.handler(7);
  assert.equal(fixture.requests.length, 1);
  assert.equal(fixture.requests[0].payload.evidenceClass, 'EVIDENCE_SUPPORTED_PHILIPPINE_USE');
  assert.equal(fixture.requests[0].payload.revision, 3);
});

test('new KB editor starts with no inferred source attribution', () => {
  const values = {};
  const setters = Object.fromEntries(['EditingKbItem', 'KbQuestion', 'KbAnswer', 'KbCategory', 'KbTags',
    'KbSourceTitle', 'KbSourcePublisher', 'KbSourceUrl', 'IsKbModalOpen'].map(name => [`set${name}`, value => { values[name] = value; }]));
  loadHandler(adminSource, 'openKbModal', setters)(null);
  assert.equal(values.KbSourceTitle, '');
  assert.equal(values.KbSourcePublisher, '');
  assert.equal(values.KbSourceUrl, '');
  assert.equal(values.IsKbModalOpen, true);
});

test('existing KB editor keeps its actual source rather than substituting PITAHC', () => {
  const values = {};
  const setters = Object.fromEntries(['EditingKbItem', 'KbQuestion', 'KbAnswer', 'KbCategory', 'KbTags',
    'KbSourceTitle', 'KbSourcePublisher', 'KbSourceUrl', 'IsKbModalOpen'].map(name => [`set${name}`, value => { values[name] = value; }]));
  loadHandler(adminSource, 'openKbModal', setters)({ question: 'TEST WHO fact', answer: 'TEST ONLY', tags: [], metadata: {
    sources: [{ title: 'WHO source', publisher: 'WHO', url: 'https://www.who.int/' }],
  } });
  assert.equal(values.KbSourcePublisher, 'WHO');
  assert.equal(values.KbSourceUrl, 'https://www.who.int/');
});

test('KB refresh sends global filters and accepts clamped page and global categories', async () => {
  const requests = [];
  const values = {};
  const handler = loadHandler(adminSource, 'refreshKbPage', {
    kbPage: 2, debouncedKbSearch: 'care', kbCategoryFilter: 'coordinated-care', kbStatusFilter: 'INACTIVE',
    api: { get: async (url, config) => { requests.push({ url, config }); return { data: { status: 'success', data: {
      items: [{ id: 'TEST-matching' }], total: 2, page: 1, categories: ['coordinated-care', 'herbal-safety'],
    } } }; } },
    setKbList: value => { values.items = value; }, setKbTotal: value => { values.total = value; },
    setKbPage: value => { values.page = value; }, setAvailableKbCategories: value => { values.categories = value; },
  });
  await handler();
  assert.deepEqual(requests[0], { url: '/knowledge-base/page', config: { params: {
    page: 2, limit: 3, search: 'care', category: 'coordinated-care', status: 'INACTIVE',
  } } });
  assert.equal(values.page, 1);
  assert.equal(values.total, 2);
  assert.deepEqual(values.categories, ['coordinated-care', 'herbal-safety']);
});

test('unavailable source retains citation note but cannot become an active link', () => {
  const historical = { title: 'Directory', publisher: 'PITAHC', url: 'https://pitahc.gov.ph/herbs-directory/',
    availability: { status: 'unavailable', originalUrl: 'https://pitahc.gov.ph/herbs-directory/', note: 'HTTP 404. Historical citation retained.' } };
  const metadata = { sources: [historical] };
  const snapshot = JSON.stringify(metadata);
  const result = sourcePolicy.getKnowledgePrimarySource(metadata);
  assert.equal(result.url, '');
  assert.equal(result.unavailable, true);
  assert.equal(result.availabilityNote, historical.availability.note);
  assert.equal(JSON.stringify(metadata), snapshot);
  assert.match(adminSections.KnowledgeBaseSection, /primarySource\.availabilityNote/);
});

test('available source retains its supporting link and unsafe URL schemes are not linked', () => {
  assert.equal(sourcePolicy.getKnowledgePrimarySource({ sources: [{ url: 'https://www.who.int/' }] }).url, 'https://www.who.int/');
  assert.equal(sourcePolicy.getKnowledgePrimarySource({ sources: [{ url: 'javascript:alert(1)' }] }).url, '');
  assert.equal(sourcePolicy.getKnowledgePrimarySource(null), null);
});

test('registration validation counts Unicode letters rather than combining marks', () => {
  for (const valid of ['Maria', 'Santos', 'Émilie', 'Mari\u0301a', 'Μαρία']) assert.equal(names.registrationNameError(valid, 'First name'), null);
  for (const invalid of ['Ana', 'Jose\u0301', '12345', 'Maria5', 'Maria Jane', 'Maria-Jane', 'a'.repeat(51)]) {
    assert.ok(names.registrationNameError(invalid, 'First name'));
  }
});

test('submission edit links preserve their exact target through sign-in without external redirects', () => {
  assert.equal(suggestionReview.submissionEditId('?edit=7'), 7);
  assert.equal(suggestionReview.submissionSignInPath('?edit=7'), '/signin?callbackUrl=%2Fsuggest%3Fedit%3D7');
  for (const search of ['?edit=0', '?edit=-1', '?edit=1.5', '?edit=2147483648', '?edit=https://evil.invalid', '?edit=07']) {
    assert.equal(suggestionReview.submissionEditId(search), null);
    assert.equal(suggestionReview.submissionSignInPath(search), '/signin?callbackUrl=%2Fsuggest');
  }
});

test('linked revision loader opens only the requested record while changes remain requested', async () => {
  const submission = { id: 7, status: 'ChangesRequested', reviewNotes: 'QA requested changes' };
  assert.deepEqual(await suggestionReview.loadRevisionSubmission(7, async () => ({ data: { status: 'success', data: { suggestion: submission } } })), submission);
  for (const record of [{ ...submission, id: 8 }, { ...submission, status: 'Pending' }, { ...submission, status: 'Approved' }]) {
    await assert.rejects(suggestionReview.loadRevisionSubmission(7, async () => ({ data: { status: 'success', data: { suggestion: record } } })));
  }
  await assert.rejects(suggestionReview.loadRevisionSubmission(7, async () => ({ data: { status: 'error' } })));
});

test('request-changes feedback distinguishes provider acceptance, suppression and failure', () => {
  assert.match(suggestionReview.requestChangesFeedback({ emailStatus: 'provider_accepted' }), /Inbox delivery is not yet confirmed/);
  assert.match(suggestionReview.requestChangesFeedback({ emailStatus: 'unavailable', inAppStatus: 'unavailable' }), /review notes remain/);
  assert.match(suggestionReview.requestChangesFeedback({ emailStatus: 'suppressed' }), /suppressed/);
  assert.match(suggestionReview.requestChangesFeedback(null), /not confirmed/);
});

const revisionEffectSource = () => {
  const parsed = ts.createSourceFile('suggest.tsx', suggestionSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result;
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'useEffect'
      && node.arguments[0]?.getText(parsed).includes('loadRevisionSubmission<Submission>')) result = node.arguments[0].getText(parsed);
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.ok(result, 'Missing linked-submission integration');
  return result;
};

test('exact edit-link effect fetches the owner endpoint and initializes the existing editor', async () => {
  const changes = {};
  const submission = { id: 7, status: 'ChangesRequested' };
  const context = {
    isAuthenticated: true, linkedSearch: 'edit=7',
    submissionEditId: suggestionReview.submissionEditId, loadRevisionSubmission: suggestionReview.loadRevisionSubmission,
    api: { get: async path => { changes.path = path; return { data: { status: 'success', data: { suggestion: submission } } }; } },
    setEditingSubmission: value => { changes.current = value; }, setLinkedSubmissionLoading: value => { changes.loading = value; },
    handleReset: () => { changes.current = null; },
    editSubmission: value => { changes.edited = value; }, setError: value => { changes.error = value; },
    requestError: (_error, fallback) => fallback,
  };
  const effect = new Function(...Object.keys(context), compile(`const effect = ${revisionEffectSource()};`) + ';return effect;')(...Object.values(context));
  const cleanup = effect();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(changes.path, '/suggest/7');
  assert.deepEqual(changes.edited, submission);
  assert.equal(changes.loading, false);
  assert.equal(changes.error, undefined);
  cleanup();
});

test('leaving the page cancels a pending edit-link result rather than overwriting another session', async () => {
  let resolveRequest;
  const edits = [];
  const context = {
    isAuthenticated: true, linkedSearch: 'edit=7',
    submissionEditId: suggestionReview.submissionEditId, loadRevisionSubmission: suggestionReview.loadRevisionSubmission,
    api: { get: () => new Promise(resolve => { resolveRequest = resolve; }) },
    setEditingSubmission() {}, setLinkedSubmissionLoading() {}, editSubmission: value => edits.push(value),
    handleReset() {},
    setError: value => edits.push(value), requestError: (_error, fallback) => fallback,
  };
  const effect = new Function(...Object.keys(context), compile(`const effect = ${revisionEffectSource()};`) + ';return effect;')(...Object.values(context));
  const cleanup = effect();
  cleanup();
  resolveRequest({ data: { status: 'success', data: { suggestion: { id: 7, status: 'ChangesRequested' } } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(edits, []);
});

test('admin searches have explicit labels and audit loading cannot claim an empty history', () => {
  assert.match(adminSections.HerbsSection, /aria-label="Search herbs"/);
  assert.match(adminSections.KnowledgeBaseSection, /aria-label="Search knowledge base facts"/);
  assert.match(adminSections.AuditLogsSection, /aria-label="Filter audit logs"/);
  assert.match(adminSource, /\[kbLoading, setKbLoading\] = useState\(true\)/);
  assert.match(adminSource, /\[auditLoading, setAuditLoading\] = useState\(true\)/);
  assert.match(adminSections.AuditLogsSection, /auditLoading \|\| auditLoadFailed \|\| auditLogs.length === 0/);
  assert.match(adminSections.AuditLogsSection, /Loading audit logs…/);
  assert.match(adminSections.AuditLogsSection, /Audit logs could not be loaded/);
});

test('revision editor observes in-page query navigation within a production-safe Suspense boundary', () => {
  assert.match(suggestionSource, /const linkedSearch = useSearchParams\(\).toString\(\)/);
  assert.match(suggestionSource, /\[isAuthenticated, user\?\.id, editSubmission, handleReset, linkedSearch\]/);
  assert.match(suggestionSource, /<Suspense fallback=\{null\}><SuggestHerbContent \/><\/Suspense>/);
  assert.match(adminSource, /!successMsg.startsWith\('Changes requested and review notes saved\.'\)/);
});

test('invalid or removed edit-link target clears the previous editor without fetching a different record', async () => {
  for (const linkedSearch of ['edit=bad', '']) {
    const observed = { resets: 0, requests: 0 };
    const context = {
      isAuthenticated: true, linkedSearch, handleReset: () => { observed.resets += 1; },
      submissionEditId: suggestionReview.submissionEditId, loadRevisionSubmission: suggestionReview.loadRevisionSubmission,
      api: { get: async () => { observed.requests += 1; } }, setLinkedSubmissionLoading() {}, editSubmission() {},
      setError: value => { observed.error = value; }, requestError: (_error, fallback) => fallback,
    };
    const effect = new Function(...Object.keys(context), compile(`const effect = ${revisionEffectSource()};`) + ';return effect;')(...Object.values(context));
    const cleanup = effect();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(observed.resets, 1);
    assert.equal(observed.requests, 0);
    if (linkedSearch) assert.match(observed.error, /Invalid submission link/);
    cleanup();
  }
});

test('request-changes acknowledgement remains truthful if the subsequent list refresh fails', async () => {
  const messages = {};
  let calls = 0;
  const handler = loadHandler(adminSource, 'handleRequestChanges', {
    actioningId: null, reviewNotesById: { 7: 'Please add a documented source.' }, suggestions: [{ id: 7, revision: 2 }],
    api: { post: async () => { calls += 1; return { data: { status: 'success', data: { notificationDelivery: { emailStatus: 'provider_accepted' } } } }; } },
    setActioningId: value => { messages.busy = value; }, setError: value => { messages.error = value; },
    setSuccessMsg: value => { messages.success = value; }, requestChangesFeedback: suggestionReview.requestChangesFeedback,
    refreshSuggestions: async () => { throw new Error('QA list unavailable'); }, setDashboardStats() {},
    getErrorMessage: (_error, fallback) => fallback,
  });
  await handler(7);
  assert.equal(calls, 1);
  assert.match(messages.success, /review notes saved/);
  assert.match(messages.error, /Changes were saved, but the review list could not refresh/);
  assert.equal(messages.busy, null);
});

test('unconfirmed request-changes transport errors advise refresh rather than a blind repeat', async () => {
  let feedback;
  const handler = loadHandler(adminSource, 'handleRequestChanges', {
    actioningId: null, reviewNotesById: { 7: 'Please add a documented source.' }, suggestions: [{ id: 7, revision: 2 }],
    api: { post: async () => { throw new Error('QA timeout'); } }, setActioningId() {}, setError: value => { feedback = value; },
    setSuccessMsg() {}, requestChangesFeedback: suggestionReview.requestChangesFeedback, refreshSuggestions() {}, setDashboardStats() {},
    getErrorMessage: (_error, fallback) => fallback,
  });
  await handler(7);
  assert.match(feedback, /Refresh the submission before retrying/);
});

test('registration names enforce the 5–10-letter range for both fields', () => {
  for (const label of ['First name', 'Last name']) {
    for (const length of [5, 10]) assert.equal(names.registrationNameError('a'.repeat(length), label), null);
    for (const length of [4, 11, 50]) assert.ok(names.registrationNameError('a'.repeat(length), label));
    assert.equal(names.registrationNameError('a'.repeat(11), label), `${label} must contain at most 10 letters.`);
    assert.equal(names.registrationNameError('𐐀'.repeat(10), label), null);
    assert.equal(names.registrationNameError('q\u0301'.repeat(10), label), null);
    assert.ok(names.registrationNameError('𐐀'.repeat(11), label));
  }
});

test('signup inputs advertise and enforce the new maximum without changing layout', () => {
  const parsed = ts.createSourceFile('signup.tsx', signupSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fields = [];
  const visit = node => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(parsed) === 'input') {
      const attributes = Object.fromEntries(node.attributes.properties
        .filter(attribute => ts.isJsxAttribute(attribute))
        .map(attribute => [attribute.name.getText(parsed), attribute.initializer?.getText(parsed)]));
      if (['"firstName"', '"lastName"'].includes(attributes.id)) fields.push(attributes);
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.equal(fields.length, 2);
  for (const field of fields) {
    assert.equal(field.minLength, '{5}');
    assert.equal(field.maxLength, '{50}');
    assert.match(field.title, /5–10/);
    assert.match(field.onChange, /registrationNameInput/);
  }
});

test('name input blocks an eleventh letter and pasted invalid names without counting accents twice', () => {
  for (const valid of ['', 'Maria', 'a'.repeat(10), '𐐀'.repeat(10), 'q\u0301'.repeat(10)]) {
    assert.equal(names.registrationNameInput(valid), valid.normalize('NFC'));
  }
  for (const invalid of ['a'.repeat(11), '𐐀'.repeat(11), 'Maria5', 'Maria Jane', 'Maria-Jane']) {
    assert.equal(names.registrationNameInput(invalid), null);
  }
});

const historyEffect = () => {
  const parsed = ts.createSourceFile('suggest.tsx', suggestionSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result;
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'useEffect'
      && node.arguments[0]?.getText(parsed).includes('const loadSubmissions')) result = node.arguments[0].getText(parsed);
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.ok(result);
  return result;
};

test('clicking the current submission tab cannot leave the list stuck loading', () => {
  const calls = [];
  const handler = loadHandler(suggestionSource, 'handleTabChange', {
    submissionsTab: 'all', submissionsPage: 1,
    setSubmissionsTab: value => calls.push(value), setSubmissionsPage: value => calls.push(value),
    setSubmissionsLoading: value => calls.push(value),
  });
  handler('all');
  assert.deepEqual(calls, []);
});

for (const view of ['active', 'history', 'all']) {
  test(`submission ${view} uses server eligibility/counts, owner scope and pagination`, async () => {
    const requests = [];
    const values = {};
    const listeners = {};
    let interval;
    let cleared;
    const reviewed = { id: 7, status: 'Approved', historyEligibleAt: '2026-10-13T00:00:00Z' };
    const page = { suggestions: view === 'history' ? [] : [reviewed], total: view === 'history' ? 0 : 1,
      counts: { active: 1, history: 0, all: 1 } };
    const context = {
      isAuthenticated: true, submissionsTab: view, submissionsPage: 1, SUBMISSIONS_PER_PAGE: 5,
      api: { get: async (url, config) => { requests.push({ url, config }); return { data: { status: 'success', data: page } }; } },
      setSubmissionsLoading: value => { values.loading = value; }, setSubmissionsError: value => { values.error = value; },
      setSubmissionsPage: value => { values.page = value; }, setSubmissions: value => { values.items = value; },
      setSubmissionsTotal: value => { values.total = value; }, setSubmissionsCounts: value => { values.counts = value; },
      window: { addEventListener: (event, listener) => { listeners[event] = listener; }, removeEventListener: event => { delete listeners[event]; },
        setInterval: (callback, delay) => { interval = { callback, delay }; return 7; }, clearInterval: id => { cleared = id; } },
      document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    };
    const effect = new Function(...Object.keys(context), compile(`const effect = ${historyEffect()};`) + ';return effect;')(...Object.values(context));
    const cleanup = effect();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(requests[0], { url: '/suggest', config: { params: { view, scope: 'mine', page: 1, limit: 5 } } });
    assert.deepEqual(values.items, page.suggestions);
    assert.deepEqual(values.counts, page.counts);
    assert.equal(values.loading, false);
    assert.equal(interval.delay, 60_000);
    interval.callback();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requests.length, 2);
    cleanup();
    assert.equal(cleared, 7);
    assert.equal(listeners.focus, undefined);
  });
}
