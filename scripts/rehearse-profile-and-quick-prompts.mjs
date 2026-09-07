import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const output = fileURLToPath(new URL('../.demo-logs/profile-quick-prompts/', import.meta.url));
await mkdir(output, { recursive: true });
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const { generateAccessToken } = await import('../herbalaibackend/dist/utils/jwt.js');

const marker = randomUUID();
const original = {
  id: `profile-browser-${marker}`,
  username: `profile_${marker.replaceAll('-', '')}`,
  email: `${marker}@profile-browser.invalid`,
  name: 'TEST Browser Profile',
  role: 'contributor',
};
const updated = {
  name: 'TEST Updated Herbalist',
  avatar: '🌱',
  bio: `Temporary browser profile ${marker}`,
};
let browser;
const browserErrors = [];

try {
  await prisma.user.create({ data: {
    ...original,
    password: 'not-used-by-this-test',
    emailVerified: new Date(),
  } });

  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{
    name: 'accessToken',
    value: generateAccessToken({ userId: original.id, role: original.role }),
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  const page = await context.newPage();
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit profile' });
  await dialog.getByLabel('Display name').fill(updated.name);
  await dialog.getByLabel('Avatar URL or emoji').fill(updated.avatar);
  await dialog.getByLabel('Bio').fill(updated.bio);
  assert.equal(await dialog.getByText(`Username: ${original.username}`, { exact: true }).count(), 1);
  assert.equal(await dialog.getByText(`Email: ${original.email}`, { exact: true }).count(), 1);
  assert.equal(await dialog.locator('input').count(), 2, 'Protected username/email fields must not be editable inputs');

  const updateResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/me') && response.request().method() === 'PATCH');
  await dialog.getByRole('button', { name: 'Save profile', exact: true }).click();
  assert.equal((await updateResponse).status(), 200);
  await dialog.getByRole('status').filter({ hasText: 'Profile saved.' }).waitFor();
  await dialog.getByRole('button', { name: 'Close profile editor' }).click();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).filter({ hasText: updated.name }).waitFor();

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  assert.equal(await dialog.getByLabel('Display name').inputValue(), updated.name);
  assert.equal(await dialog.getByLabel('Avatar URL or emoji').inputValue(), updated.avatar);
  assert.equal(await dialog.getByLabel('Bio').inputValue(), updated.bio);
  await dialog.getByLabel('Display name').fill('x');
  assert.equal(await dialog.getByRole('button', { name: 'Save profile', exact: true }).isDisabled(), true);

  await page.setViewportSize({ width: 320, height: 568 });
  await dialog.getByRole('button', { name: 'Close profile editor' }).click();
  await page.getByRole('button', { name: 'Toggle Navigation Menu' }).click();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  const box = await dialog.boundingBox();
  assert.ok(box && box.x >= -1 && box.x + box.width <= 321, 'Profile editor must fit a 320px viewport');
  assert.equal(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), true);
  await page.screenshot({ path: `${output}/profile-editor-320.png` });

  const protectedAttempt = await context.request.patch('http://localhost:5000/api/auth/me', {
    data: { name: 'Should Not Apply', role: 'admin', email: 'attacker@example.invalid', isBanned: true },
  });
  assert.equal(protectedAttempt.status(), 400);
  const stored = await prisma.user.findUniqueOrThrow({ where: { id: original.id } });
  assert.deepEqual(
    { name: stored.name, email: stored.email, username: stored.username, role: stored.role, isBanned: stored.isBanned },
    { name: updated.name, email: original.email, username: original.username, role: original.role, isBanned: false },
  );
  console.log('PASS profile editing: allowed fields persist, validation works, protected fields reject, and 320px modal fits');

  let submittedPayload;
  await page.route('**/api/chat/stream', async (route) => {
    submittedPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        'event: sources\ndata: {"sources":[{"type":"herb","title":"Lagundi"}]}\n\n',
        'event: chunk\ndata: {"text":"Lagundi is traditionally used for cough support. "}\n\n',
        'event: chunk\ndata: {"text":"Follow the verified preparation record and consult a professional when symptoms persist."}\n\n',
        'event: done\ndata: {"history":[],"sources":[{"type":"herb","title":"Lagundi"}]}\n\n',
      ].join(''),
    });
  });
  await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle' });
  const quickPrompts = page.getByRole('group', { name: 'Quick prompts' });
  const labels = [
    'What are the medicinal uses of Lagundi?',
    'How is Sambong traditionally prepared?',
    'What safety warnings apply to Bayabas leaves?',
  ];
  for (const label of labels) await quickPrompts.getByRole('button', { name: label, exact: true }).waitFor();
  await quickPrompts.getByRole('button', { name: labels[0], exact: true }).click();
  await page.locator('[data-message-role="user"]').getByText(labels[0], { exact: true }).waitFor();
  await page.locator('[data-message-role="model"]').getByText(/Lagundi is traditionally used for cough support/).waitFor();
  assert.deepEqual(submittedPayload, { message: labels[0], history: [] });
  await page.getByText('Sources Cited:', { exact: true }).waitFor();
  await page.getByText(/This content relies on traditional Philippine medicinal plant archives/).waitFor();
  assert.equal(await quickPrompts.evaluate((element) => element.scrollWidth >= element.clientWidth), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  assert.equal(await page.evaluate(() => window.scrollY), 0, 'Chat auto-scroll must stay inside the conversation panel');
  await page.screenshot({ path: `${output}/quick-prompts-320.png` });
  console.log('PASS Dr. Ai quick prompts: three choices render, selected text submits exactly, stream renders, source/disclaimer remain, and 320px layout fits');

  assert.deepEqual(browserErrors, []);
} finally {
  await browser?.close();
  try {
    await prisma.user.deleteMany({ where: { id: original.id } });
    assert.equal(await prisma.user.count({ where: { id: original.id } }), 0);
    console.log('PASS temporary profile account and related records cleaned up');
  } finally {
    await closeDatabasePool();
  }
}
