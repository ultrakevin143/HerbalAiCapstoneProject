import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const output = fileURLToPath(new URL('../.demo-logs/accessibility/', import.meta.url));
const axePath = fileURLToPath(new URL('../herbalaifrontend/node_modules/axe-core/axe.min.js', import.meta.url));
await mkdir(output, { recursive: true });
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
process.env.NODE_ENV = 'production';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const { generateAccessToken } = await import('../herbalaibackend/dist/utils/jwt.js');
let browser;
const users = [];
const results = [];
try {
  for (const role of ['contributor', 'admin']) users.push(await prisma.user.create({ data: {
    username: randomUUID(), email: `${randomUUID()}@loadtest.invalid`, password: randomUUID(),
    name: 'TEST Accessibility', role, emailVerified: new Date(),
  } }));
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  for (const width of [320, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const path of ['/', '/library', '/about', '/signin', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/chat', '/community', '/messenger', '/suggest', '/admin']) {
      await context.clearCookies();
      if (['/chat', '/community', '/messenger', '/suggest', '/admin'].includes(path)) {
        const user = users[path === '/admin' ? 1 : 0];
        await context.addCookies([{ name: 'accessToken', value: generateAccessToken({ userId: user.id, role: user.role }), domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
      }
      await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
      assert.equal(new URL(page.url()).pathname, path);
      await page.addScriptTag({ path: axePath });
      const audit = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
        return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), incomplete: r.incomplete.map(v => v.id), passedRules: r.passes.length, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      results.push({ path, width, ...audit });
      console.log(JSON.stringify({ path, width, violations: audit.violations.map(v => v.id), overflow: audit.overflow }));
      if (width === 390 && ['/', '/admin'].includes(path)) {
        const labels = path === '/' ? ['Dr. Ai conversation preview'] : ['Herb category counts', 'Console logs and health'];
        for (const label of labels) {
          let reached = false;
          for (let step = 0; step < 100; step++) {
            await page.keyboard.press('Tab');
            if (await page.evaluate(label => document.activeElement?.getAttribute('aria-label') === label, label)) { reached = true; break; }
          }
          assert.ok(reached, `Keyboard cannot reach ${label}`);
          const region = page.getByRole('region', { name: label, exact: true });
          const before = await region.evaluate(el => ({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight, outline: getComputedStyle(el).outlineStyle }));
          assert.notEqual(before.outline, 'none', 'Focused region needs a visible outline');
          if (before.max > 0) {
            await page.keyboard.press('End');
            await page.waitForFunction(label => [...document.querySelectorAll('[role="region"]')].find(el => el.getAttribute('aria-label') === label)?.scrollTop > 0, label);
          }
        }
        console.log(`PASS keyboard focus and scrolling: ${path}`);
      }
      if (width === 390 && ['/', '/admin', '/signin'].includes(path)) await page.screenshot({ path: `${output}/${path.replaceAll('/', '') || 'home'}.png`, fullPage: true });
    }
    await context.close();
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  await browser?.close();
  for (const user of users) await prisma.user.delete({ where: { id: user.id } });
  await closeDatabasePool();
}
assert.ok(results.every(r => !r.overflow && r.violations.length === 0), 'Accessibility findings require review; see .demo-logs/accessibility/results.json');
