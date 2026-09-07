import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const output = fileURLToPath(new URL('../.demo-logs/admin-crud-rag/', import.meta.url));
await mkdir(output, { recursive: true });
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const { generateAccessToken } = await import('../herbalaibackend/dist/utils/jwt.js');

const runId = randomUUID();
const suffix = runId.slice(0, 8);
const admin = {
  id: `crud-admin-${runId}`,
  username: `crud_admin_${runId.replaceAll('-', '')}`,
  email: `${runId}@crud-admin.invalid`,
  name: 'TEST CRUD Administrator',
  role: 'admin',
};
const contributor = {
  id: `crud-user-${runId}`,
  username: `crud_user_${runId.replaceAll('-', '')}`,
  email: `${runId}@crud-user.invalid`,
  name: 'TEST CRUD Contributor',
  role: 'contributor',
};
const herb = {
  localName: `Testleaf ${suffix}`,
  scientificName: `Testia browserensis ${suffix}`,
  cebuanoName: `Sulayi ${suffix}`,
  category: 'Other',
  medicinalUses: `Temporary verified browser use ${runId}`,
  preparationMethod: 'For automated testing only; do not consume.',
  dosage: 'No human dosage. Test record only.',
  regionFound: 'Automated test environment',
  warnings: 'Not a real medicinal plant. Never consume.',
  source: 'Automated CRUD rehearsal',
};
const updatedHerb = {
  localName: `Testleaf Updated ${suffix}`,
  medicinalUses: `Updated temporary browser use ${runId}`,
  preparationMethod: 'Updated automated preparation record; do not consume.',
};
const kb = {
  question: `What is the verified rehearsal code for silversage ${suffix}?`,
  answer: `For test record ${runId}, the verified rehearsal code is blue-seven. This is not medical advice.`,
  category: 'Automated rehearsal',
  tags: `silversage, ${suffix}, browser-test`,
};
const updatedKb = {
  question: `What is the updated verified rehearsal code for silversage ${suffix}?`,
  answer: `For test record ${runId}, the updated verified rehearsal code is green-nine. This is not medical advice.`,
  category: 'Automated retrieval rehearsal',
  tags: `silversage, ${suffix}, updated-browser-test`,
};

let browser;
let herbId;
let suggestionId;
let kbId;
const pageErrors = [];

const go = (page, path) => page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle', timeout: 60_000 });
async function adminTab(page, name) {
  const toggle = page.getByRole('button', { name: 'Toggle admin navigation' });
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('button', { name: new RegExp(`^${name}`) }).click();
}
async function action(page, method, suffixToMatch, perform, timeout = 60_000) {
  const pending = page.waitForResponse(
    (response) => response.url().endsWith(suffixToMatch) && response.request().method() === method,
    { timeout },
  );
  await perform();
  const response = await pending;
  const body = await response.json().catch(() => null);
  assert.ok(response.ok(), `${method} ${suffixToMatch} returned ${response.status()}: ${JSON.stringify(body)}`);
  return body;
}
async function createContext(roleUser, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  await context.addCookies([{
    name: 'accessToken',
    value: generateAccessToken({ userId: roleUser.id, role: roleUser.role }),
    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
  }]);
  return context;
}

try {
  await prisma.user.createMany({ data: [admin, contributor].map((user) => ({
    ...user,
    password: 'not-used-by-this-test',
    emailVerified: new Date(),
  })) });
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const adminContext = await createContext(admin);
  const contributorContext = await createContext(contributor);
  const page = await adminContext.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));

  // Full herb create (submission + approval), public visibility, edit, authorization, and deletion.
  await go(page, '/suggest');
  await page.getByLabel('Local / Filipino Name').fill(herb.localName);
  await page.getByLabel('Scientific Name').fill(herb.scientificName);
  await page.getByLabel('Common Name').fill(herb.cebuanoName);
  await page.getByLabel('Medicinal Category').selectOption(herb.category);
  await page.getByLabel('Medicinal Uses & Key Applications').fill(herb.medicinalUses);
  await page.getByLabel('Boiling & Preparation Instructions').fill(herb.preparationMethod);
  await page.getByLabel('Recommended Dosage & Administration').fill(herb.dosage);
  await page.getByLabel('Primary Region / Habitat / Environment').fill(herb.regionFound);
  await page.getByLabel('Warnings & Contraindications').fill(herb.warnings);
  await page.getByLabel('Source of Healing Knowledge / Documentation').fill(herb.source);
  const submission = await action(page, 'POST', '/api/suggest', () => page.getByRole('button', { name: 'Add Herb to Library' }).click());
  suggestionId = submission.data.suggestion.id;
  await page.getByText('Suggestion Submitted Successfully', { exact: true }).waitFor();

  await go(page, '/admin');
  await adminTab(page, 'Pending Suggestions');
  const suggestionCard = page.locator('main div.rounded-3xl').filter({ has: page.getByRole('heading', { name: herb.localName, exact: true }) });
  const approval = await action(page, 'POST', `/api/suggest/${suggestionId}/approve`, () => suggestionCard.getByRole('button', { name: 'Approve & Publish', exact: true }).click(), 90_000);
  herbId = approval.data.herb.id;
  assert.equal(await prisma.herb.count({ where: { id: herbId, localName: herb.localName } }), 1);

  await go(page, '/library');
  await page.getByPlaceholder('Search by name, scientific name, or uses...').fill(herb.localName);
  await page.getByText(herb.localName, { exact: true }).waitFor();

  await go(page, '/admin');
  await adminTab(page, 'All Herbs');
  await page.getByPlaceholder('Search herbs...').fill(herb.localName);
  let herbRow = page.getByRole('row').filter({ has: page.getByText(herb.localName, { exact: true }) });
  await herbRow.getByRole('button', { name: 'Edit', exact: true }).click();
  const herbDialog = page.getByRole('dialog', { name: 'Edit Herb' });
  await herbDialog.getByLabel('Local Name').fill(updatedHerb.localName);
  await herbDialog.getByLabel('Medicinal Uses').fill(updatedHerb.medicinalUses);
  await herbDialog.getByLabel('Preparation Method').fill(updatedHerb.preparationMethod);
  await page.setViewportSize({ width: 320, height: 568 });
  const herbDialogBox = await herbDialog.boundingBox();
  assert.ok(herbDialogBox && herbDialogBox.x >= -1 && herbDialogBox.x + herbDialogBox.width <= 321);
  assert.equal(await herbDialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), true);
  await page.screenshot({ path: `${output}/herb-editor-320.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  await action(page, 'PUT', `/api/herbs/${herbId}`, () => herbDialog.getByRole('button', { name: 'Save Changes', exact: true }).click());
  const storedHerb = await prisma.herb.findUniqueOrThrow({ where: { id: herbId } });
  assert.equal(storedHerb.localName, updatedHerb.localName);
  assert.equal(storedHerb.medicinalUses, updatedHerb.medicinalUses);
  assert.equal((await contributorContext.request.put(`http://localhost:5000/api/herbs/${herbId}`, { data: { localName: 'Unauthorized Rename' } })).status(), 403);
  assert.equal((await contributorContext.request.delete(`http://localhost:5000/api/herbs/${herbId}`)).status(), 403);

  await go(page, '/library');
  await page.getByPlaceholder('Search by name, scientific name, or uses...').fill(updatedHerb.localName);
  await page.getByText(updatedHerb.localName, { exact: true }).click();
  await page.getByLabel(updatedHerb.localName).getByText(updatedHerb.medicinalUses, { exact: true }).waitFor();

  await go(page, '/admin');
  await adminTab(page, 'All Herbs');
  await page.getByPlaceholder('Search herbs...').fill(updatedHerb.localName);
  herbRow = page.getByRole('row').filter({ has: page.getByText(updatedHerb.localName, { exact: true }) });
  page.once('dialog', (dialog) => dialog.accept());
  await action(page, 'DELETE', `/api/herbs/${herbId}`, () => herbRow.getByRole('button', { name: 'Delete', exact: true }).click());
  assert.equal(await prisma.herb.count({ where: { id: herbId } }), 0);
  console.log('PASS full herb CRUD: create/approve, public visibility, edit persistence, contributor denial, detail update, and delete');

  // Full knowledge-base CRUD, active-state toggle, authorization, audit, and live Dr. Ai retrieval.
  await go(page, '/admin');
  await adminTab(page, 'Knowledge Base');
  await page.getByRole('button', { name: 'Add KB Fact', exact: true }).click();
  let kbDialog = page.getByRole('dialog', { name: 'Create Knowledge Base Entry' });
  await kbDialog.getByLabel('Knowledge question').fill(kb.question);
  await kbDialog.getByLabel('Knowledge answer').fill(kb.answer);
  await kbDialog.getByLabel('Knowledge category').fill(kb.category);
  await kbDialog.getByLabel('Knowledge tags').fill(kb.tags);
  const createdKb = await action(page, 'POST', '/api/knowledge-base/create', () => kbDialog.getByRole('button', { name: 'Publish entry', exact: true }).click(), 90_000);
  kbId = createdKb.data.id;
  await page.getByPlaceholder('Search KB items...').fill(suffix);
  let kbRow = page.getByRole('row').filter({ has: page.getByText(kb.question, { exact: true }) });
  await kbRow.waitFor();

  await kbRow.getByTitle('Edit Entry').click();
  kbDialog = page.getByRole('dialog', { name: 'Edit Knowledge Base Entry' });
  await kbDialog.getByLabel('Knowledge question').fill(updatedKb.question);
  await kbDialog.getByLabel('Knowledge answer').fill(updatedKb.answer);
  await kbDialog.getByLabel('Knowledge category').fill(updatedKb.category);
  await kbDialog.getByLabel('Knowledge tags').fill(updatedKb.tags);
  await page.setViewportSize({ width: 320, height: 568 });
  const kbDialogBox = await kbDialog.boundingBox();
  assert.ok(kbDialogBox && kbDialogBox.x >= -1 && kbDialogBox.x + kbDialogBox.width <= 321);
  assert.equal(await kbDialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), true);
  await page.screenshot({ path: `${output}/knowledge-editor-320.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  await action(page, 'PATCH', `/api/knowledge-base/${kbId}`, () => kbDialog.getByRole('button', { name: 'Save Changes', exact: true }).click(), 90_000);
  await page.getByPlaceholder('Search KB items...').fill(suffix);
  kbRow = page.getByRole('row').filter({ has: page.getByText(updatedKb.question, { exact: true }) });
  await kbRow.waitFor();
  assert.equal((await contributorContext.request.post('http://localhost:5000/api/knowledge-base/create', { data: kb })).status(), 403);
  assert.equal((await contributorContext.request.patch(`http://localhost:5000/api/knowledge-base/${kbId}`, { data: { isActive: false } })).status(), 403);
  assert.equal((await contributorContext.request.delete(`http://localhost:5000/api/knowledge-base/${kbId}`)).status(), 403);

  await action(page, 'PATCH', `/api/knowledge-base/${kbId}`, () => kbRow.getByRole('button', { name: 'Active', exact: true }).click());
  assert.equal((await prisma.knowledgeBase.findUniqueOrThrow({ where: { id: kbId } })).isActive, false);
  await action(page, 'PATCH', `/api/knowledge-base/${kbId}`, () => kbRow.getByRole('button', { name: 'Inactive', exact: true }).click());
  assert.equal((await prisma.knowledgeBase.findUniqueOrThrow({ where: { id: kbId } })).isActive, true);

  await go(page, '/chat');
  await page.getByLabel('Type message').fill(updatedKb.question);
  await action(page, 'POST', '/api/chat/stream', () => page.getByRole('button', { name: 'Send message', exact: true }).click(), 120_000);
  await page.getByText('Sources Cited:', { exact: true }).waitFor({ timeout: 120_000 });
  await page.getByText(updatedKb.question, { exact: true }).last().waitFor();
  await page.locator('[data-message-role="model"]').getByText(/green-nine/i).waitFor({ timeout: 120_000 });
  await page.screenshot({ path: `${output}/knowledge-retrieval.png` });

  await go(page, '/admin');
  await adminTab(page, 'Knowledge Base');
  await page.getByPlaceholder('Search KB items...').fill(suffix);
  kbRow = page.getByRole('row').filter({ has: page.getByText(updatedKb.question, { exact: true }) });
  page.once('dialog', (dialog) => dialog.accept());
  await action(page, 'DELETE', `/api/knowledge-base/${kbId}`, () => kbRow.getByTitle('Delete Entry').click());
  assert.equal(await prisma.knowledgeBase.count({ where: { id: kbId } }), 0);

  const kbAuditActions = await prisma.auditLog.findMany({
    where: { adminId: admin.id, targetId: kbId },
    select: { action: true },
  });
  const actions = new Set(kbAuditActions.map((entry) => entry.action));
  for (const expected of ['CREATE_KNOWLEDGE_BASE', 'UPDATE_KNOWLEDGE_BASE', 'DELETE_KNOWLEDGE_BASE']) {
    assert.ok(actions.has(expected), `Missing ${expected} audit record`);
  }
  console.log('PASS full KB CRUD/RAG: create, edit, active toggle, contributor denial, live grounded retrieval, audit trail, and delete');
  assert.deepEqual(pageErrors, []);
} finally {
  await browser?.close();
  try {
    const kbQuestions = [kb.question, updatedKb.question];
    await prisma.knowledgeBase.deleteMany({ where: { OR: [{ id: kbId || '' }, { question: { in: kbQuestions } }] } });
    await prisma.herb.deleteMany({ where: { OR: [{ id: herbId || '' }, { localName: { in: [herb.localName, updatedHerb.localName] } }] } });
    await prisma.suggestedHerb.deleteMany({ where: { OR: [{ id: suggestionId || -1 }, { localName: herb.localName }] } });
    await prisma.user.deleteMany({ where: { id: { in: [admin.id, contributor.id] } } });
    assert.equal(await prisma.knowledgeBase.count({ where: { question: { in: kbQuestions } } }), 0);
    assert.equal(await prisma.herb.count({ where: { localName: { in: [herb.localName, updatedHerb.localName] } } }), 0);
    assert.equal(await prisma.suggestedHerb.count({ where: { localName: herb.localName } }), 0);
    assert.equal(await prisma.user.count({ where: { id: { in: [admin.id, contributor.id] } } }), 0);
    console.log('PASS exact temporary herbs, KB entries, suggestions, accounts, and cascaded records cleaned up');
  } finally {
    await closeDatabasePool();
  }
}
