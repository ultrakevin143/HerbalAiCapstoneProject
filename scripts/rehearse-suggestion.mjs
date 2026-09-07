import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

// Run only against the local demo with EMAIL_DELIVERY_MODE=log.
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const { generateAccessToken } = await import('../herbalaibackend/dist/utils/jwt.js');
const marker = `Rehearsal ${randomUUID()}`;
const rejection = process.env.REHEARSAL_REJECT === '1';
const users = [];
let browser;
let staffToken;
const api = async (path, token, method = 'GET') => {
  const res = await fetch(`http://localhost:5000/api${path}`, { method, headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(60000) });
  assert.ok(res.ok, `${method} ${path}: HTTP ${res.status}`);
  return res.json();
};
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const pages = [];
  for (const role of ['contributor', 'admin']) {
    const user = await prisma.user.create({ data: { username: `${role}-${randomUUID()}`, email: `${randomUUID()}@loadtest.invalid`, password: randomUUID(), name: `TEST ${role}`, role, emailVerified: new Date() } });
    users.push(user.id);
    const token = generateAccessToken({ userId: user.id, role });
    if (role === 'admin') staffToken = token;
    const context = await browser.newContext();
    await context.addCookies([{ name: 'accessToken', value: token, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
    pages.push(await context.newPage());
  }
  const [contributor, admin] = pages;
  await contributor.goto('http://localhost:3000/suggest', { waitUntil: 'networkidle' });
  await contributor.locator('#localName').fill(marker);
  await contributor.locator('#scientificName').fill(`Test only ${marker}`);
  await contributor.locator('#category').selectOption({ index: 1 });
  for (const id of ['medicinalUses', 'preparationMethod', 'dosage', 'warnings', 'informationSource']) {
    await contributor.locator(`#${id}`).fill('TEST RECORD ONLY. Not a medicinal plant. Do not use or consume. Temporary workflow rehearsal.');
  }
  const submitted = contributor.waitForResponse(r => r.url().endsWith('/api/suggest') && r.request().method() === 'POST');
  await contributor.getByRole('button', { name: 'Submit Suggestion for Review' }).click();
  const submittedResponse = await submitted;
  assert.equal(submittedResponse.status(), 201);
  const suggestion = (await submittedResponse.json()).data.suggestion;
  console.log('PASS contributor browser submission');
  const denied = await fetch(`http://localhost:5000/api/suggest/${suggestion.id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${generateAccessToken({ userId: users[0], role: 'contributor' })}` } });
  assert.equal(denied.status, 403);
  console.log('PASS contributor cannot approve');
  if (rejection) {
    await prisma.notification.create({ data: { userId: users[0], title: 'TEST existing unread', message: marker, type: 'SUGGESTION_UPDATE' } });
    await prisma.notification.create({ data: { userId: users[1], title: 'TEST other account unread', message: marker, type: 'SUGGESTION_UPDATE' } });
    await contributor.reload({ waitUntil: 'networkidle' });
  }
  await contributor.getByRole('button', { name: 'Notifications', exact: true }).filter({ visible: true }).click();
  await admin.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await admin.getByRole('button', { name: /Pending Suggestions/ }).click();
  const action = rejection ? 'Reject' : 'Approve & Publish';
  const card = admin.locator('div').filter({ has: admin.getByRole('button', { name: action, exact: true }) }).filter({ hasText: marker });
  // Select the smallest enclosing suggestion card, not a page-wide container.
  const approve = card.last().getByRole('button', { name: action, exact: true });
  const approved = admin.waitForResponse(r => r.url().endsWith(`/suggest/${suggestion.id}/${rejection ? 'reject' : 'approve'}`), { timeout: 120000 });
  await approve.click();
  const approval = await approved;
  assert.equal(approval.status(), 200);
  if (rejection) {
    assert.equal((await approval.json()).data.suggestion.status, 'Rejected');
    assert.equal((await prisma.suggestedHerb.findUnique({ where: { id: suggestion.id } })).status, 'Rejected');
    assert.equal(await prisma.herb.count({ where: { localName: marker } }), 0);
    assert.ok(await prisma.auditLog.findFirst({ where: { adminId: users[1], targetId: String(suggestion.id), action: 'REJECT_SUGGESTION' } }));
    await contributor.getByText(`Your submitted suggestion for "${marker}"`, { exact: false }).waitFor({ timeout: 15000 });
    assert.equal(await prisma.notification.count({ where: { userId: users[0], isRead: false } }), 2);
    console.log('PASS rejection saved, no herb published, audit recorded and live rejection notification received');
    const repeated = await fetch(`http://localhost:5000/api/suggest/${suggestion.id}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${staffToken}` } });
    assert.equal(repeated.status, 400);
    const readAll = contributor.waitForResponse(r => r.url().endsWith('/notifications/read-all') && r.request().method() === 'PATCH');
    await contributor.getByRole('button', { name: 'Mark all read', exact: true }).click();
    assert.equal((await readAll).status(), 200);
    assert.equal(await prisma.notification.count({ where: { userId: users[0], isRead: false } }), 0);
    assert.equal(await prisma.notification.count({ where: { userId: users[1], isRead: false } }), 1);
    await contributor.reload({ waitUntil: 'networkidle' });
    await contributor.getByRole('button', { name: 'Notifications', exact: true }).filter({ visible: true }).click();
    await contributor.getByText('TEST existing unread', { exact: true }).waitFor();
    assert.equal(await contributor.getByRole('button', { name: 'Mark all read', exact: true }).count(), 0);
    console.log('PASS duplicate rejection blocked; mark-all-read persisted after reload and left other account untouched');
  } else {
  const herb = (await approval.json()).data.herb;
  assert.equal(herb.localName, marker);
  assert.equal((await prisma.suggestedHerb.findUnique({ where: { id: suggestion.id } })).status, 'Approved');
  assert.ok(await prisma.auditLog.findFirst({ where: { adminId: users[1], targetId: String(suggestion.id), action: 'APPROVE_SUGGESTION' } }));
  console.log('PASS admin browser approval, published herb, status and audit record');
  const notice = await prisma.notification.findFirst({ where: { userId: users[0], message: { contains: marker } } });
  assert.ok(notice);
  assert.equal(notice.link, `/library?id=${encodeURIComponent(herb.id)}`);
  const link = contributor.locator(`a[href="${notice.link}"]`);
  await link.waitFor({ state: 'visible', timeout: 15000 });
  console.log('PASS live notification appeared without reloading contributor page');
  await link.click();
  await contributor.getByRole('button', { name: 'Close modal', exact: true }).waitFor();
  assert.equal(new URL(contributor.url()).searchParams.get('id'), herb.id);
  await contributor.getByRole('heading', { name: marker, exact: true }).last().waitFor();
  assert.equal((await prisma.notification.findUnique({ where: { id: notice.id } })).isRead, true);
  console.log('PASS notification opens correct herb details and marks read');
  }
} finally {
  await browser?.close();
  try {
    const herbs = await prisma.herb.findMany({ where: { localName: marker }, select: { id: true } });
    for (const herb of herbs) await api(`/herbs/${herb.id}`, staffToken, 'DELETE');
    await prisma.suggestedHerb.deleteMany({ where: { localName: marker, submitterId: { in: users } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    assert.equal(await prisma.herb.count({ where: { localName: marker } }), 0);
    assert.equal(await prisma.suggestedHerb.count({ where: { localName: marker } }), 0);
    assert.equal(await prisma.user.count({ where: { id: { in: users } } }), 0);
    console.log('PASS cleanup: temporary herbs, suggestions, users and cascading notifications/audits removed');
  } finally {
    await closeDatabasePool();
  }
}
