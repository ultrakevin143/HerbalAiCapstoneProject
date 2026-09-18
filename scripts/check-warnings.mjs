import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});

const context = await browser.newContext();
const page = await context.newPage();

const warnings = [];
const errors = [];

page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'warning') {
    warnings.push({ url: page.url(), text });
  } else if (type === 'error') {
    errors.push({ url: page.url(), text });
  }
});

page.on('pageerror', (err) => {
  errors.push({ url: page.url(), text: err.message, stack: err.stack });
});

const routes = [
  '/',
  '/signup',
  '/signin',
  '/library',
  '/chat',
  '/about',
  '/community',
  '/suggest',
];

for (const route of routes) {
  try {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'load', timeout: 10000 });
    await page.waitForTimeout(1000);
  } catch (err) {
    errors.push({ url: route, text: `Navigation error: ${err.message}` });
  }
}

await browser.close();

console.log('=== CONSOLE WARNINGS ===');
console.log(JSON.stringify(warnings, null, 2));

console.log('=== CONSOLE ERRORS ===');
console.log(JSON.stringify(errors, null, 2));
