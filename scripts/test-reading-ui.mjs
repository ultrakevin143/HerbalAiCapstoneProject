import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const baseURL = process.env.UI_TEST_URL || 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Use a local test server');
const output = fileURLToPath(new URL('../.demo-logs/reading-ui/', import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
const herb = {
  id: 'ui-test-herb', localName: 'Lagundi', scientificName: 'Vitex negundo', category: 'Antifungal / Dermatological',
  medicinalUses: 'Test reference text for layout review.', preparationMethod: 'Test preparation reference.\nCheck the original source.',
  dosage: 'Test dosage reference, not a treatment recommendation.', warnings: 'Test precaution: consult a qualified professional.',
  imageUrl: '/images/lagundi.png', isDohApproved: true, createdAt: '2026-01-01T00:00:00Z',
};
const user = { id: 'ui-test-user', name: 'Reader', role: 'contributor', email: 'reader@example.invalid', avatar: null };
const errors = [];
let authenticated = true;

function luminance(hex) {
  const value = hex.trim().replace('#', '');
  const expanded = value.length === 3 ? [...value].map(channel => channel + channel).join('') : value;
  const channels = expanded.match(/../g).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function assertContrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((first, second) => second - first);
  assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `Text contrast: ${foreground} on ${background}`);
}

try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.addCookies([{ name: 'accessToken', value: 'local-ui-fixture-only', url: baseURL }]);
  await context.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const headers = { 'access-control-allow-origin': baseURL, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type,accept' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (pathname.endsWith('/chat/stream')) {
      const text = 'Test response. Check the library references.\n\n' + Array(24).fill('Long reference text used only to verify conversation scrolling.').join('\n\n');
      return route.fulfill({ headers, contentType: 'text/event-stream', body: `event: chunk\ndata: ${JSON.stringify({ text })}\n\nevent: done\ndata: {"sources":[],"history":[]}\n\n` });
    }
    const data = pathname.endsWith('/auth/me') ? { user: authenticated ? user : null } : pathname.endsWith('/herbs') ? { herbs: [herb] } : { comments: [], notifications: [], unreadCount: 0, posts: [], users: [], conversations: [] };
    return route.fulfill({ headers, json: { status: 'success', data } });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));

  async function assertFits(label) {
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scroll <= dimensions.width + 1, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
  }

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.goto(baseURL);
      const accountMenu = page.getByRole('button', { name: 'Account menu', exact: true });
      await accountMenu.waitFor();
      await accountMenu.click();
      await page.getByRole('button', { name: 'Edit profile', exact: true }).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await accountMenu.getAttribute('aria-expanded'), 'false');
      assert.ok(await accountMenu.evaluate(element => element === document.activeElement), 'Escape returns focus to the account menu');
      await accountMenu.click();
      await page.locator('.display-menu > summary').click();
      assert.equal(await accountMenu.getAttribute('aria-expanded'), 'false', 'Display closes the account menu');
      await page.waitForFunction(() => document.querySelector('.reading-toolbar button')?.getAttribute('aria-pressed') === String(document.documentElement.dataset.theme === 'dark'));
      const themeButton = page.getByRole('button', { name: 'Dark theme', exact: true });
      if ((await themeButton.getAttribute('aria-pressed')) !== String(theme === 'dark')) await themeButton.click();
      await page.getByLabel('Text size', { exact: true }).selectOption('extra-large');
      await page.waitForFunction(({ theme }) => document.documentElement.dataset.theme === theme && document.documentElement.dataset.textSize === 'extra-large', { theme });
      await assertFits(`${width} ${theme} home`);
      const palette = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return Object.fromEntries(['ink', 'muted', 'panel', 'canvas', 'brand', 'warning-ink', 'warning-surface', 'error-ink', 'error-surface'].map(token => [token, styles.getPropertyValue(`--ui-${token}`)]));
      });
      assertContrast(palette.ink, palette.panel);
      assertContrast(palette.muted, palette.canvas);
      assertContrast('#172008', palette.brand);
      assertContrast(palette['warning-ink'], palette['warning-surface']);
      assertContrast(palette['error-ink'], palette['error-surface']);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundImage), 'none');
      await page.locator('.display-menu > summary').click();
      await page.reload();
      await page.waitForFunction(({ theme }) => document.documentElement.dataset.theme === theme && document.documentElement.dataset.textSize === 'extra-large', { theme });
      await page.screenshot({ path: `${output}/${width}-${theme}-home.png`, fullPage: true });

      await page.goto(`${baseURL}/library`);
      const card = page.getByRole('button', { name: 'Read about Lagundi', exact: true });
      await card.waitFor();
      await assertFits(`${width} ${theme} library`);
      await card.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Lagundi details', exact: true });
      await dialog.waitFor();
      assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Dialog must not overflow horizontally');
      assert.ok(await page.getByRole('heading', { name: 'Before you use this plant' }).evaluate(element => Boolean(element.compareDocumentPosition([...document.querySelectorAll('h3')].find(heading => heading.textContent === 'Preparation method')) & Node.DOCUMENT_POSITION_FOLLOWING)), 'Warnings must precede preparation');
      for (let count = 0; count < 12; count += 1) {
        await page.keyboard.press('Tab');
        assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'Dialog traps keyboard focus');
      }
      await page.getByRole('button', { name: 'Enlarge image of Lagundi' }).click();
      assert.equal(await page.locator('dialog[open]').count(), 2);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('dialog[open]').count(), 1);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.ok(await card.evaluate(element => element === document.activeElement), 'Focus returns to the opening card');
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');

      await page.goto(`${baseURL}/chat`);
      const question = page.getByLabel('Type message', { exact: true });
      await question.waitFor();
      assert.equal(await question.getAttribute('maxlength'), '1000');
      await question.fill('Test'.repeat(300));
      assert.equal((await question.inputValue()).length, 1000);
      await question.fill('Test herbal question');
      await page.getByRole('button', { name: 'Send message', exact: true }).click();
      await page.getByText('Test response. Check the library references.', { exact: true }).waitFor();
      await assertFits(`${width} ${theme} chat`);
      const chatLayout = await page.evaluate(() => {
        const input = document.querySelector('#chat-question').getBoundingClientRect();
        const composer = document.querySelector('.chat-composer').getBoundingClientRect();
        return { height: innerHeight, scrollHeight: document.documentElement.scrollHeight, inputTop: input.top, inputBottom: input.bottom, composerBottom: composer.bottom };
      });
      assert.ok(chatLayout.scrollHeight <= chatLayout.height + 1, `Chat page must not scroll: ${JSON.stringify(chatLayout)}`);
      assert.ok(chatLayout.inputTop >= 0 && chatLayout.composerBottom <= chatLayout.height + 1, 'Composer stays visible');
      assert.ok(await page.locator('.chat-messages').evaluate(element => element.scrollHeight > element.clientHeight), 'Long answers scroll inside the conversation');
      assert.ok(await page.locator('.chat-messages p').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize) >= 18));
      await page.screenshot({ path: `${output}/${width}-${theme}-chat.png`, fullPage: true });
      console.log(`PASS ${width}px ${theme}: persisted preferences, layout, modal focus/Escape, chat submission`);
    }
  }

  for (const path of ['/signin', '/signup', '/about', '/forgot-password', '/reset-password', '/verify-email']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseURL}${path}`);
    await page.getByRole('heading').first().waitFor();
    await assertFits(`dark extra-large ${path}`);
  }
  await page.goto(`${baseURL}/chat`);
  await page.getByLabel('Type message', { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 420 });
  await page.waitForFunction(() => document.querySelector('#chat-question').getBoundingClientRect().bottom <= innerHeight);
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), 'Keyboard-sized viewport must not scroll the page');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  await page.getByRole('button', { name: 'Account menu', exact: true }).waitFor();
  await page.locator('.display-menu > summary').click();
  await page.getByLabel('Text size', { exact: true }).selectOption('normal');
  const normalTheme = page.getByRole('button', { name: 'Dark theme', exact: true });
  if ((await normalTheme.getAttribute('aria-pressed')) === 'true') await normalTheme.click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light' && document.documentElement.dataset.textSize === 'normal');
  for (const path of ['/', '/about', '/library', '/chat']) {
    await page.goto(`${baseURL}${path}`);
    await page.getByRole('heading').first().waitFor();
    if (path === '/library') {
      await page.getByRole('button', { name: 'Read about Lagundi', exact: true }).waitFor();
      assert.ok(await page.locator('.herb-figma-badge').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize) <= 12), 'Herb categories stay compact');
    }
    await page.screenshot({ path: `${output}/normal-${path.replaceAll('/', '') || 'home'}.png` });
  }
  authenticated = false;
  await page.goto(baseURL);
  await page.getByRole('link', { name: 'Sign In', exact: true }).waitFor();
  await page.getByRole('region', { name: 'Dr. Ai conversation preview' }).waitFor();
  await assertFits('guest desktop home');
  await page.screenshot({ path: `${output}/guest-home.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  const navigationMenu = page.getByRole('button', { name: 'Navigation menu', exact: true });
  await navigationMenu.click();
  await page.locator('#site-menu').getByRole('link', { name: 'Library', exact: true }).click();
  assert.equal(await navigationMenu.getAttribute('aria-expanded'), 'false', 'Following a menu link closes it');
  await assertFits('guest mobile library');
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('PASS public/auth routes, zero runtime errors. API responses were mocked; no real accounts or AI calls.');
} finally {
  await browser.close();
}
