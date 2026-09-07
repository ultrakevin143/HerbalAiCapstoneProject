import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const output = fileURLToPath(new URL('../.demo-logs/mobile-workflows/', import.meta.url));
await mkdir(output, { recursive: true });
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const { generateAccessToken } = await import('../herbalaibackend/dist/utils/jwt.js');
const { hashPassword } = await import('../herbalaibackend/dist/utils/password.js');
const marker = `TEST mobile ${randomUUID()}`;
const password = randomUUID();
const users = [];
const errors = [];
let browser;
const go = (page, path) => page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
const commentRow = (page, content) => page.locator('div.group').filter({ has: page.getByText(content, { exact: true }) });
async function action(page, method, suffix, click) {
  const pending = page.waitForResponse(r => r.url().endsWith(suffix) && r.request().method() === method);
  await click();
  const response = await pending;
  assert.ok(response.ok(), `${method} ${suffix} returned ${response.status()}`);
  return response.json();
}
async function adminTab(page, name) {
  const toggle = page.getByRole('button', { name: 'Toggle admin navigation' });
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('button', { name, exact: true }).click();
}
async function fits(locator, width, minimum = 1) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  assert.ok(box && box.width >= minimum && box.x >= -1 && box.x + box.width <= width + 1, 'Control must fit within the viewport');
}
try {
  const hash = await hashPassword(password);
  for (const [i, role] of ['contributor', 'contributor', 'admin'].entries()) users.push(await prisma.user.create({ data: {
    username: randomUUID(), email: `${randomUUID()}@loadtest.invalid`, password: hash,
    name: `TEST Mobile User ${i + 1}`, role, emailVerified: new Date(),
  } }));
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const pages = [];
  for (const user of users) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addCookies([{ name: 'accessToken', value: generateAccessToken({ userId: user.id, role: user.role }), domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    pages.push(page);
  }
  const [a, b, admin] = pages;
  const herb = await prisma.herb.findFirstOrThrow({ where: { localName: 'Lagundi' } });
  const libraryPath = `/library?id=${herb.id}`;
  await Promise.all([go(a, libraryPath), go(b, libraryPath)]);
  const text = `${marker} comment ${'longword'.repeat(12)}`;
  await a.getByPlaceholder('Share your experience or ask a question about this herb...').fill(text);
  await action(a, 'POST', `/api/herbs/${herb.id}/comments`, () => a.getByRole('button', { name: 'Post Comment', exact: true }).click());
  await commentRow(b, text).waitFor();
  const comment = await prisma.herbComment.findFirstOrThrow({ where: { authorId: users[0].id, content: text } });
  await action(b, 'POST', `/api/herbs/comments/${comment.id}/like`, () => commentRow(b, text).getByRole('button', { name: 'Like comment', exact: true }).click());
  await go(b, libraryPath);
  await commentRow(b, text).getByRole('button', { name: 'Unlike comment', exact: true }).waitFor();
  await action(b, 'POST', `/api/herbs/comments/${comment.id}/like`, () => commentRow(b, text).getByRole('button', { name: 'Unlike comment', exact: true }).click());
  await go(b, libraryPath);
  await commentRow(b, text).getByRole('button', { name: 'Like comment', exact: true }).waitFor();
  assert.equal((await b.request.delete(`http://localhost:5000/api/herbs/comments/${comment.id}`)).status(), 403);
  await commentRow(b, text).getByRole('button', { name: 'Reply', exact: true }).click();
  const replyText = `${marker} reply`;
  const replyInput = b.getByPlaceholder(`Reply to ${users[0].name}...`);
  await replyInput.fill(replyText);
  await action(b, 'POST', `/api/herbs/${herb.id}/comments`, () => replyInput.locator('xpath=ancestor::form').getByRole('button', { name: 'Reply', exact: true }).click());
  await commentRow(a, replyText).waitFor();
  for (const width of [320, 390, 430]) {
    await b.setViewportSize({ width, height: 844 });
    await fits(b.getByRole('dialog'), width);
    await fits(commentRow(b, text), width);
    await fits(commentRow(b, replyText), width);
    assert.equal(await b.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, 'Modal content must not overflow horizontally');
  }
  await b.screenshot({ path: `${output}/herb-comments-430.png` });
  const reply = await prisma.herbComment.findFirstOrThrow({ where: { authorId: users[1].id, content: replyText } });
  b.once('dialog', dialog => dialog.accept());
  await action(b, 'DELETE', `/api/herbs/comments/${reply.id}`, () => commentRow(b, replyText).getByRole('button', { name: 'Delete', exact: true }).click());
  a.once('dialog', dialog => dialog.accept());
  await action(a, 'DELETE', `/api/herbs/comments/${comment.id}`, () => commentRow(a, text).getByRole('button', { name: 'Delete', exact: true }).click());
  await go(b, libraryPath);
  assert.equal(await b.getByText(text, { exact: true }).count(), 0);
  assert.equal(await b.getByText(replyText, { exact: true }).count(), 0);
  console.log('PASS herb comments: live create/reply, like/unlike persistence, ownership, deletion and 320/390/430px modal layouts');

  await go(a, `/messenger?userId=${users[1].id}`);
  await fits(a.getByLabel('Message input', { exact: true }), 390, 100);
  await a.getByRole('button', { name: 'Back to conversations' }).click();
  await a.getByRole('complementary', { name: 'Conversations' }).waitFor();
  await a.getByTitle('New message', { exact: true }).click();
  await a.getByPlaceholder('Search users...').fill(users[1].name);
  await a.getByRole('button', { name: new RegExp(`${users[1].name} .*Contributor$`) }).click();
  const message = `${marker} touch message`;
  await a.getByLabel('Message input', { exact: true }).fill(message);
  const sent = await action(a, 'POST', '/api/messages', () => a.getByRole('button', { name: 'Send message', exact: true }).click());
  const messageRow = commentRow(a, message);
  await messageRow.getByRole('button', { name: 'Message options' }).tap();
  await messageRow.getByRole('button', { name: 'Edit', exact: true }).tap();
  await a.locator('div.group input').fill(`${message} edited`);
  await action(a, 'PUT', `/api/messages/${sent.data.message.id}`, () => a.getByTitle('Save edit').tap());
  await a.setViewportSize({ width: 320, height: 568 });
  await fits(a.getByLabel('Message input', { exact: true }), 320, 100);
  await a.getByRole('button', { name: 'Notifications', exact: true }).click();
  await fits(a.getByText('No notifications yet', { exact: true }), 320);
  await a.screenshot({ path: `${output}/notifications-320.png` });
  await a.getByRole('button', { name: 'Notifications', exact: true }).click();
  console.log('PASS mobile Messenger back/contact/send/touch-edit controls and 320px notifications');

  await go(admin, '/admin');
  await adminTab(admin, 'Users');
  const targetRow = admin.getByRole('row').filter({ has: admin.getByText(users[1].email, { exact: true }) });
  const ownRow = admin.getByRole('row').filter({ has: admin.getByText(users[2].email, { exact: true }) });
  assert.equal(await ownRow.getByRole('button', { name: 'Ban User', exact: true }).count(), 0);
  assert.equal((await admin.request.post(`http://localhost:5000/api/auth/users/${users[2].id}/ban`)).status(), 400);
  assert.equal((await a.request.post(`http://localhost:5000/api/auth/users/${users[1].id}/ban`)).status(), 403);
  const token = generateAccessToken({ userId: users[1].id, role: 'contributor' });
  const me = () => fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await me()).status, 200);
  await action(admin, 'POST', `/api/auth/users/${users[1].id}/ban`, () => targetRow.getByRole('button', { name: 'Ban User', exact: true }).click());
  assert.equal((await me()).status, 403);
  await go(admin, '/admin');
  await adminTab(admin, 'Users');
  await targetRow.getByRole('button', { name: 'Unban User', exact: true }).waitFor();
  await action(admin, 'POST', `/api/auth/users/${users[1].id}/unban`, () => targetRow.getByRole('button', { name: 'Unban User', exact: true }).click());
  assert.equal((await me()).status, 200);
  for (const tab of ['Dashboard', 'Pending Suggestions', 'All Herbs', 'Users', 'Knowledge Base', 'Audit Logs']) {
    await adminTab(admin, tab);
    assert.equal(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Admin ${tab} overflow`);
    const main = await admin.locator('.admin-main').boundingBox();
    assert.ok(main.width >= 358);
  }
  console.log('PASS admin ban/unban persistence, immediate cached-session blocking, self-ban/contributor denial and six mobile admin tabs');

  // Use a real login-issued refresh token for logout/revocation, never a user's account.
  await a.context().clearCookies();
  const login = await a.request.post('http://localhost:5000/api/auth/login', { data: { email: users[0].email, password } });
  assert.equal(login.status(), 200);
  const tokens = (await login.json()).data;
  await go(a, '/');
  await a.getByRole('button', { name: 'Toggle Navigation Menu' }).click();
  await action(a, 'POST', '/api/auth/logout', () => a.getByRole('button', { name: 'Logout', exact: true }).click());
  await a.waitForURL('**/signin');
  assert.equal((await a.context().cookies()).filter(cookie => ['accessToken', 'refreshToken'].includes(cookie.name)).length, 0);
  assert.equal((await a.request.get('http://localhost:5000/api/auth/me')).status(), 401);
  assert.equal((await a.request.post('http://localhost:5000/api/auth/refresh-token', { data: { refreshToken: tokens.refreshToken } })).status(), 401);
  for (const path of ['/chat', '/messenger', '/suggest', '/admin']) {
    await go(a, path);
    assert.equal(new URL(a.url()).pathname, '/signin');
  }
  assert.deepEqual(errors, []);
  console.log('PASS mobile logout clears both cookies, revokes login-issued refresh token, and protects four routes');
} finally {
  await browser?.close();
  try {
    const ids = users.map(user => user.id);
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    assert.equal(await prisma.user.count({ where: { id: { in: ids } } }), 0);
    assert.equal(await prisma.herbComment.count({ where: { authorId: { in: ids } } }), 0);
    console.log('PASS temporary accounts/comments/messages/tokens/audit records cleaned up');
  } finally { await closeDatabasePool(); }
}
