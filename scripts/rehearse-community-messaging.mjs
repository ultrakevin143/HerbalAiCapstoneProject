import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const { generateAccessToken } = await import('../herbalaibackend/dist/utils/jwt.js');
await import('../herbalaibackend/dist/services/cloudinary.service.js');
const cloudinary = createRequire(new URL('../herbalaibackend/package.json', import.meta.url))('cloudinary').v2;
const marker = `TEST rehearsal ${randomUUID()}`;
const users = [];
const uploadedUrls = new Set();
const pageErrors = [];
let browser;
const go = (page, path) => page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
async function action(page, method, suffix, click) {
  const pending = page.waitForResponse(r => r.url().endsWith(suffix) && r.request().method() === method);
  await click();
  const response = await pending;
  assert.ok(response.ok(), `${method} ${suffix}: ${response.status()}`);
  return response.json();
}
async function contact(page, name) {
  await go(page, '/messenger');
  await page.getByTitle('New message', { exact: true }).click();
  await page.getByPlaceholder('Search users...').fill(name);
  await page.getByRole('button', { name: new RegExp(`${name} .*Contributor$`) }).click();
  await page.getByRole('button', { name: 'Load older messages', exact: true }).waitFor();
}
const row = (page, content) => page.locator('div.group').filter({ has: page.getByText(content, { exact: true }) });
async function removeMessage(page, content, id) {
  const message = row(page, content);
  await message.hover();
  await message.getByRole('button', { name: 'Message options' }).click();
  page.once('dialog', dialog => dialog.accept());
  await action(page, 'DELETE', `/api/messages/${id}`, () => message.getByRole('button', { name: 'Delete', exact: true }).click());
}
try {
  for (const suffix of ['A', 'B']) users.push(await prisma.user.create({ data: {
    username: randomUUID(), email: `${randomUUID()}@loadtest.invalid`, password: randomUUID(),
    name: `${marker} ${suffix}`, role: 'contributor', emailVerified: new Date(),
  } }));
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const pages = [];
  for (const user of users) {
    const context = await browser.newContext();
    await context.addCookies([{ name: 'accessToken', value: generateAccessToken({ userId: user.id, role: user.role }), domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    pages.push(page);
  }
  const [a, b] = pages;
  if (process.env.MESSAGING_ONLY !== '1') {
  await go(a, '/community/new');
  await a.locator('#title').fill(marker);
  await a.locator('#category').selectOption({ index: 1 });
  await a.locator('#content').fill('Temporary browser workflow test. Not medical information.');
  await action(a, 'POST', '/api/forum/threads', () => a.getByRole('button', { name: 'Publish Discussion' }).click());
  const thread = await prisma.thread.findFirstOrThrow({ where: { authorId: users[0].id, title: marker } });
  await go(b, `/community/${thread.id}`);
  await action(b, 'POST', `/api/forum/threads/${thread.id}/like`, () => b.getByRole('button', { name: '❤️ 0 Like', exact: true }).click());
  await b.reload({ waitUntil: 'networkidle' });
  await b.getByRole('button', { name: '❤️ 1 Liked', exact: true }).waitFor();
  await action(b, 'POST', `/api/forum/threads/${thread.id}/like`, () => b.getByRole('button', { name: '❤️ 1 Liked', exact: true }).click());
  await b.reload({ waitUntil: 'networkidle' });
  await b.getByRole('button', { name: '❤️ 0 Like', exact: true }).waitFor();
  console.log('PASS community topic creation, second-user like/unlike and reload persistence');
  const reply = `${marker} reply`;
  await b.locator('#comment').fill(reply);
  await action(b, 'POST', `/api/forum/threads/${thread.id}/comments`, () => b.getByRole('button', { name: 'Submit Comment' }).click());
  const comment = await prisma.threadComment.findFirstOrThrow({ where: { authorId: users[1].id, threadId: thread.id } });
  await go(a, `/community/${thread.id}`);
  await a.getByText(reply, { exact: true }).waitFor();
  await action(a, 'POST', `/api/forum/comments/${comment.id}/like`, () => a.getByRole('button', { name: '❤️ 0 likes', exact: true }).click());
  await a.reload({ waitUntil: 'networkidle' });
  await a.getByRole('button', { name: '❤️ 1 liked', exact: true }).waitFor();
  await action(a, 'POST', `/api/forum/comments/${comment.id}/like`, () => a.getByRole('button', { name: '❤️ 1 liked', exact: true }).click());
  await a.reload({ waitUntil: 'networkidle' });
  await a.getByRole('button', { name: '❤️ 0 likes', exact: true }).waitFor();
  assert.equal((await b.request.delete(`http://localhost:5000/api/forum/threads/${thread.id}`)).status(), 403);
  assert.equal((await a.request.delete(`http://localhost:5000/api/forum/comments/${comment.id}`)).status(), 403);
  b.once('dialog', dialog => dialog.accept());
  await action(b, 'DELETE', `/api/forum/comments/${comment.id}`, () => b.getByRole('button', { name: 'Delete', exact: true }).click());
  await b.reload({ waitUntil: 'networkidle' });
  await b.getByText('[This reply has been deleted by the author or moderator.]', { exact: true }).waitFor();
  assert.equal(await b.getByText(reply, { exact: true }).count(), 0);
  const publicDetail = await fetch(`http://localhost:5000/api/forum/threads/${thread.id}`);
  assert.equal(JSON.stringify(await publicDetail.json()).includes(reply), false);
  a.once('dialog', dialog => dialog.accept());
  await action(a, 'DELETE', `/api/forum/threads/${thread.id}`, () => a.getByRole('button', { name: 'Delete Topic', exact: true }).click());
  assert.equal((await prisma.thread.findUniqueOrThrow({ where: { id: thread.id } })).isDeleted, true);
  console.log('PASS reply creation, like/unlike persistence, owner-only reply/topic deletion');
  }

  const history = Array.from({ length: 55 }, (_, i) => ({ senderId: users[i % 2].id, receiverId: users[(i + 1) % 2].id, content: `${marker} history ${String(i).padStart(2, '0')}`, time: new Date(Date.now() - 120000 + i * 1000) }));
  await prisma.chatMessage.createMany({ data: history });
  await Promise.all([contact(a, users[1].name), contact(b, users[0].name)]);
  assert.equal(await row(a, history[0].content).count(), 0);
  await row(a, history[54].content).waitFor();
  await a.getByRole('button', { name: 'Load older messages', exact: true }).click();
  await row(a, history[0].content).waitFor();
  const displayed = await a.locator('div.group').allTextContents();
  assert.equal(displayed.length, 55);
  history.forEach((entry, index) => assert.ok(displayed[index].includes(entry.content)));
  assert.equal(await a.getByRole('button', { name: 'Load older messages', exact: true }).count(), 0);
  console.log('PASS 50-message initial page and 55-message ordered, duplicate-free pagination');

  const text = `${marker} message`;
  await a.getByLabel('Message input', { exact: true }).fill(text);
  const sent = await action(a, 'POST', '/api/messages', () => a.getByRole('button', { name: 'Send message', exact: true }).click());
  const id = sent.data.message.id;
  await row(b, text).waitFor();
  assert.equal((await b.request.put(`http://localhost:5000/api/messages/${id}`, { data: { content: 'unauthorized test' } })).status(), 403);
  assert.equal((await b.request.delete(`http://localhost:5000/api/messages/${id}`)).status(), 403);
  await row(a, text).hover();
  await row(a, text).getByRole('button', { name: 'Message options' }).click();
  await row(a, text).getByRole('button', { name: 'Edit', exact: true }).click();
  const edited = `${text} edited`;
  await a.locator('div.group input[type="text"]').fill(edited);
  await action(a, 'PUT', `/api/messages/${id}`, () => a.getByTitle('Save edit').click());
  await row(b, edited).waitFor();
  await contact(b, users[0].name);
  await row(b, edited).waitFor();
  await removeMessage(a, edited, id);
  await row(b, 'This message was deleted').waitFor();
  await contact(b, users[0].name);
  await row(b, 'This message was deleted').waitFor();
  assert.equal((await prisma.chatMessage.findUniqueOrThrow({ where: { id } })).isDeleted, true);
  console.log('PASS text send/edit/delete, live receiver updates, reload persistence and ownership protection');

  const fixture = { name: 'test-pixel.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK9sAAAAASUVORK5CYII=', 'base64') };
  const input = a.locator('input[type="file"]');
  await input.setInputFiles(fixture);
  await a.getByAltText('Upload preview').waitFor();
  await a.getByAltText('Upload preview').locator('..').getByRole('button').click();
  assert.equal(await a.getByAltText('Upload preview').count(), 0);
  assert.equal(await input.evaluate(el => el.files.length), 0);
  await input.setInputFiles(fixture);
  const caption = `${marker} image`;
  await a.getByLabel('Message input', { exact: true }).fill(caption);
  const uploaded = await action(a, 'POST', '/api/messages', () => a.getByRole('button', { name: 'Send message', exact: true }).click());
  const imageMessage = uploaded.data.message;
  uploadedUrls.add(imageMessage.imageUrl);
  await row(b, caption).waitFor();
  await b.waitForFunction(() => { const img = document.querySelector('img[alt="Sent attachment"]'); return img?.complete && img.naturalWidth > 0; });
  const popupPending = b.waitForEvent('popup');
  await b.getByAltText('Sent attachment').click();
  const popup = await popupPending;
  await popup.waitForLoadState();
  assert.equal(popup.url(), imageMessage.imageUrl);
  await popup.close();
  await contact(b, users[0].name);
  await b.getByAltText('Sent attachment').waitFor();
  await removeMessage(a, caption, imageMessage.id);
  await b.getByAltText('Sent attachment').waitFor({ state: 'detached' });
  await contact(b, users[0].name);
  assert.equal(await b.getByAltText('Sent attachment').count(), 0);
  assert.equal((await prisma.chatMessage.findUniqueOrThrow({ where: { id: imageMessage.id } })).isDeleted, true);
  assert.deepEqual(pageErrors, [], 'Unexpected uncaught browser errors');
  console.log('PASS image preview/remove/reselect, upload, live delivery, open, persistence and deletion');
} finally {
  await browser?.close();
  try {
    const ids = users.map(user => user.id);
    const attachments = await prisma.chatMessage.findMany({ where: { senderId: { in: ids }, receiverId: { in: ids }, imageUrl: { not: null } }, select: { imageUrl: true } });
    for (const { imageUrl } of attachments) uploadedUrls.add(imageUrl);
    for (const imageUrl of uploadedUrls) {
      const url = new URL(imageUrl);
      assert.equal(url.hostname, 'res.cloudinary.com');
      const match = url.pathname.match(/\/image\/upload\/v\d+\/(herbal_ai_messages\/[^/]+)\.[a-z0-9]+$/i);
      assert.ok(match, 'Refusing cleanup of unexpected asset path');
      const result = await cloudinary.uploader.destroy(match[1], { invalidate: true });
      assert.ok(['ok', 'not found'].includes(result.result));
    }
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    assert.equal(await prisma.user.count({ where: { id: { in: ids } } }), 0);
    assert.equal(await prisma.thread.count({ where: { authorId: { in: ids } } }), 0);
    assert.equal(await prisma.threadComment.count({ where: { authorId: { in: ids } } }), 0);
    assert.equal(await prisma.chatMessage.count({ where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] } }), 0);
    console.log('PASS temporary accounts, threads, replies, messages and uploaded assets cleaned up');
  } finally { await closeDatabasePool(); }
}
