import assert from 'node:assert/strict';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const baseURL = process.env.UI_TEST_URL || 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let sources = [
      { id: 1, title: 'Research reference', publisher: 'Test publisher', url: 'https://example.org/study', supports: ['humanEvidence', 'limitations'], publishedAt: '2024' },
      { id: 2, title: 'Unsafe URL reference', url: 'javascript:alert(1)', supports: ['warnings'] },
      { id: 3, title: 'Print reference', citation: 'Printed bibliography', supports: [] },
    ];
    await context.route('**/api/**', async route => {
      const headers = { 'access-control-allow-origin': baseURL, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type,accept' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const herb = { id: 'reference-fixture', localName: 'Test herb', scientificName: 'Test species', category: 'Test', medicinalUses: 'Recorded use.', preparationMethod: 'Not supplied.', dosage: 'Not supplied.', sources, isDohApproved: false, evidenceClass: 'EVIDENCE_SUPPORTED_PHILIPPINE_USE' };
      const pathname = new URL(route.request().url()).pathname;
      return route.fulfill({ headers, json: { status: 'success', data: pathname.endsWith('/herbs') ? { herbs: [herb] } : { user: null, comments: [], notifications: [] } } });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseURL}/library`);
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.getByRole('button', { name: 'Read about Test herb', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Test herb details', exact: true });
    const summary = dialog.locator('summary');
    assert.equal(await summary.textContent(), 'Sources & references (3)');
    assert.equal(await dialog.getByRole('link', { name: /Research reference/ }).isVisible(), false);
    await summary.focus();
    await page.keyboard.press('Enter');
    const link = dialog.getByRole('link', { name: /Research reference/ });
    await link.waitFor();
    assert.equal(await link.getAttribute('href'), 'https://example.org/study');
    assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(await dialog.locator('a[href^="javascript:"]').count(), 0);
    await dialog.getByText('Supports: Human research, Study limitations', { exact: true }).waitFor();
    await dialog.getByText('Printed bibliography', { exact: true }).waitFor();
    assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
    sources = [];
    await page.reload();
    await page.getByRole('button', { name: 'Read about Test herb', exact: true }).click();
    await dialog.locator('summary').click();
    await dialog.getByText(/No references are attached/).waitFor();
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Herb reference checks passed: links, unsafe URLs, print citations, empty state, keyboard access, mobile light/dark layout.');
} finally {
  await browser.close();
}
