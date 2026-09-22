import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';
import assert from 'node:assert/strict';

const base = 'http://localhost:3000';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
let failed = false;
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/', '/library', '/about', '/signin', '/signup', '/forgot-password']) {
      const startErrors = errors.length;
      const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      assert.ok((await page.title()).includes('Herbal-Ai'), 'Wrong app on port 3000');
      const layout = await page.evaluate(() => ({
        viewport: innerWidth, width: document.documentElement.scrollWidth,
        headings: [...document.querySelectorAll('h1')].map(h => h.textContent?.trim()),
      }));
      const result = { path, viewportSize: viewport, status: response.status(), ...layout, errors: errors.slice(startErrors) };
      result.pass = response.ok() && layout.width <= viewport.width + 1 && result.errors.length === 0;
      failed ||= !result.pass;
      console.log(JSON.stringify(result));
    }
    await page.goto(`${base}/library`, { waitUntil: 'networkidle' });
    await page.getByRole('textbox', { name: 'Search herbs by name, scientific name, or medicinal use' }).fill('Lagundi');
    const cards = page.locator('.library-herb-card');
    await page.waitForFunction(() => document.querySelectorAll('.library-herb-card').length === 1);
    assert.match(await cards.first().innerText(), /lagundi/i);
    await cards.first().click();
    const closeDetailsButton = page.getByRole('button', { name: /Close .* details/i });
    await closeDetailsButton.waitFor();
    const modalFits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    failed ||= !modalFits;
    await closeDetailsButton.click();
    console.log(JSON.stringify({ workflow: 'Lagundi search, open and close details', viewport, pass: modalFits }));
    if (viewport.width < 768) {
      await page.getByRole('button', { name: 'Toggle Navigation Menu' }).click();
      await page.getByRole('link', { name: 'About', exact: true }).filter({ visible: true }).click();
      await page.waitForURL(`${base}/about`);
      console.log(JSON.stringify({ workflow: 'mobile navigation to About', viewport, pass: true }));
    }
    for (const path of ['/chat', '/suggest', '/admin', '/messenger']) {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      const pass = new URL(page.url()).pathname === '/signin';
      failed ||= !pass;
      console.log(JSON.stringify({ signedOutRoute: path, viewport, destination: new URL(page.url()).pathname, pass }));
    }
    await context.close();
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
