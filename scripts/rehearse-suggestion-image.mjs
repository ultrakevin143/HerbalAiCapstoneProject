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
const marker = `Image rehearsal ${randomUUID()}`;
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK9sAAAAASUVORK5CYII=', 'base64');
let user;
let browser;
try {
  user = await prisma.user.create({ data: { username: randomUUID(), email: `${randomUUID()}@loadtest.invalid`, password: randomUUID(), name: 'TEST image contributor', role: 'contributor', emailVerified: new Date() } });
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'accessToken', value: generateAccessToken({ userId: user.id, role: 'contributor' }), domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
  const page = await context.newPage();
  await page.goto('http://localhost:3000/suggest', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Submit Suggestion for Review' }).click();
  assert.equal(await page.locator('#localName').evaluate(el => el.validity.valueMissing), true);
  assert.equal(await prisma.suggestedHerb.count({ where: { submitterId: user.id } }), 0);
  console.log('PASS empty form blocked without creating a record');
  const input = page.locator('#image');
  await input.setInputFiles({ name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('test') });
  await page.getByText('Invalid file format.', { exact: false }).waitFor();
  assert.equal(await input.evaluate(el => el.files.length), 0);
  await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await page.getByText('File size too large.', { exact: false }).waitFor();
  assert.equal(await input.evaluate(el => el.files.length), 0);
  console.log('PASS browser rejects invalid format and oversized file, clearing selection');
  const fixture = { name: 'test-pixel.png', mimeType: 'image/png', buffer: png };
  await input.setInputFiles(fixture);
  await page.waitForFunction(() => { const img = document.querySelector('img[alt="Herb upload preview"]'); return img?.complete && img.naturalWidth > 0; });
  await page.getByRole('button', { name: 'Remove Photo' }).click();
  assert.equal(await page.getByAltText('Herb upload preview').count(), 0);
  assert.equal(await input.evaluate(el => el.files.length), 0);
  await input.setInputFiles(fixture);
  console.log('PASS valid PNG preview, removal and reselection');
  await page.locator('#localName').fill(marker);
  await page.locator('#scientificName').fill(`Test only ${marker}`);
  await page.locator('#category').selectOption({ index: 1 });
  for (const id of ['medicinalUses', 'preparationMethod', 'dosage']) await page.locator(`#${id}`).fill('Test record only. Not medicinal information. Do not consume.');
  const pending = page.waitForResponse(r => r.url().endsWith('/api/suggest') && r.request().method() === 'POST', { timeout: 90000 });
  await page.getByRole('button', { name: 'Submit Suggestion for Review' }).click();
  const res = await pending;
  assert.equal(res.status(), 201);
  const suggestion = (await res.json()).data.suggestion;
  assert.ok(suggestion.imageUrl?.startsWith('https://res.cloudinary.com/'));
  await page.waitForFunction(() => { const img = document.querySelector('img[alt="Submitted Herb Preview"]'); return img?.complete && img.naturalWidth > 0; });
  assert.equal((await prisma.suggestedHerb.findUnique({ where: { id: suggestion.id } })).imageUrl, suggestion.imageUrl);
  console.log('PASS valid upload, displayed submitted image and persisted URL');
} finally {
  await browser?.close();
  try {
    if (user) {
      const suggestions = await prisma.suggestedHerb.findMany({ where: { submitterId: user.id, localName: marker } });
      for (const suggestion of suggestions) {
        if (suggestion.imageUrl) {
          const url = new URL(suggestion.imageUrl);
          assert.equal(url.hostname, 'res.cloudinary.com');
          const match = url.pathname.match(/\/image\/upload\/v\d+\/(herbal_ai_suggestions\/[^/]+)\.[a-z0-9]+$/i);
          assert.ok(match, 'Refusing cleanup of an unexpected asset path');
          const result = await cloudinary.uploader.destroy(match[1], { invalidate: true });
          assert.ok(['ok', 'not found'].includes(result.result));
          console.log('PASS temporary Cloudinary asset removed');
        }
      }
      await prisma.user.delete({ where: { id: user.id } });
      assert.equal(await prisma.suggestedHerb.count({ where: { submitterId: user.id } }), 0);
      console.log('PASS temporary account and suggestion removed');
    }
  } finally { await closeDatabasePool(); }
}
