import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const output = fileURLToPath(new URL(`../.demo-logs/mobile-${process.env.AUDIT_LABEL || 'before'}/`, import.meta.url));
await mkdir(output, { recursive: true });
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const { generateAccessToken } = await import('../herbalaibackend/dist/utils/jwt.js');
const users = [];
const results = [];
let browser;
try {
  for (const role of ['contributor', 'admin']) users.push(await prisma.user.create({ data: {
    username: randomUUID(), email: `${randomUUID()}@loadtest.invalid`, password: randomUUID(),
    name: `TEST Mobile ${role}`, role, emailVerified: new Date(),
  } }));
  await prisma.chatMessage.create({ data: { senderId: users[1].id, receiverId: users[0].id, content: 'Temporary mobile layout check. Hello from the other test account!' } });
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  for (const width of (process.env.AUDIT_WIDTHS || '390,768').split(',').map(Number)) {
    const context = await browser.newContext({ viewport: { width, height: Number(process.env.AUDIT_HEIGHT || 844) }, isMobile: width < 768, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of (process.env.AUDIT_PAGES?.split(',') || ['/', '/library', '/chat', '/suggest', '/community', `/messenger?userId=${users[1].id}`, '/admin'])) {
      const user = path === '/admin' ? users[1] : users[0];
      await context.addCookies([{ name: 'accessToken', value: generateAccessToken({ userId: user.id, role: user.role }), domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
      await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
      const slug = path.split('?')[0].replaceAll('/', '') || 'home';
      assert.equal(new URL(page.url()).pathname, path.split('?')[0], 'Unexpected route redirect');
      if (slug === 'admin') {
        await page.getByRole('heading', { name: 'Dashboard Overview' }).waitFor();
        const stats = await page.request.get('http://localhost:5000/api/stats/dashboard');
        if ((await stats.json()).data.herbsByCategory.length) await page.locator('.recharts-pie path').first().waitFor();
      }
      if (slug === 'messenger') await page.getByLabel('Message input', { exact: true }).waitFor();
      const metrics = await page.evaluate(() => ({
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        clipped: [...document.querySelectorAll('main, section, aside, nav')].filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
        }).map(el => ({ tag: el.tagName, class: el.className })),
      }));
      results.push({ width, page: slug, ...metrics, errors: [...errors] });
      console.log(JSON.stringify(results.at(-1)));
      await page.screenshot({ path: `${output}/${width}-${slug}.png`, fullPage: true });
      if (process.env.AUDIT_ASSERT === '1') {
        assert.ok(metrics.scrollWidth <= width + 1, `${width} ${slug} document overflow`);
        assert.deepEqual(metrics.clipped, [], `${width} ${slug} clipped layout`);
        assert.deepEqual(errors, []);
        if (slug === 'messenger' || slug === 'chat') {
          const input = page.getByLabel(slug === 'chat' ? 'Type message' : 'Message input', { exact: true });
          const box = await input.boundingBox();
          assert.ok(box && box.width >= 100 && box.x >= 0 && box.x + box.width <= width, 'Chat input must fit on screen');
        }
        if (slug === 'admin' && width < 1024) {
          const box = await page.locator('.admin-main').boundingBox();
          assert.ok(box.width >= width - 32, 'Admin content must use the mobile viewport');
        }
        if (slug === 'home' && width < 1280) {
          await page.getByRole('button', { name: 'Toggle Navigation Menu' }).click();
          const drawer = page.locator('#mobile-navigation');
          const box = await drawer.boundingBox();
          assert.ok(box && box.x >= 0 && box.x + box.width <= width && box.y + box.height <= Number(process.env.AUDIT_HEIGHT || 844), 'Navigation drawer must remain on screen');
          await page.getByRole('button', { name: 'Toggle Navigation Menu' }).click();
          await page.getByRole('button', { name: 'Notifications', exact: true }).click();
          await page.getByText('No notifications yet', { exact: true }).waitFor();
          await page.getByRole('button', { name: 'Notifications', exact: true }).click();
        }
      }
    }
    await context.close();
  }
} finally {
  await browser?.close();
  try {
    await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
    await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
    console.log('Temporary mobile audit accounts/messages cleaned up.');
  } finally { await closeDatabasePool(); }
}
