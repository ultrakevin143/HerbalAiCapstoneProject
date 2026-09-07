import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

// Run the local demo with EMAIL_DELIVERY_MODE=log. Never uses a real mailbox.
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const email = `browser-${randomUUID()}@loadtest.invalid`;
const password = `Old!${randomUUID()}`;
const replacement = `New!${randomUUID()}`;
let browser;
const errors = [];
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const go = path => page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
  async function submit(endpoint, label, status) {
    const pending = page.waitForResponse(r => r.url().endsWith(`/api/auth/${endpoint}`) && r.request().method() === 'POST');
    await page.getByRole('button', { name: label, exact: true }).click();
    assert.equal((await pending).status(), status, endpoint);
  }
  async function login(secret, status) {
    await go('/signin');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(secret);
    await submit('login', 'Sign In', status);
    if (status === 200) await page.waitForURL('http://localhost:3000/');
    else await page.getByRole('alert').filter({ hasText: status === 403 ? 'verify your email' : 'Invalid email or password' }).waitFor();
  }
  await go('/signup');
  await page.locator('#firstName').fill('Recovery');
  await page.locator('#lastName').fill('Test');
  await page.locator('#username').fill(`browser_${randomUUID().replaceAll('-', '').slice(0, 18)}`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await submit('signup', 'Sign Up', 201);
  await page.getByRole('alert').filter({ hasText: 'Signup successful!' }).waitFor();
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  assert.equal(user.emailVerified, null);
  await login(password, 403);
  console.log('PASS browser signup and unverified login rejection');
  const verification = await prisma.token.findFirstOrThrow({ where: { userId: user.id, type: 'EMAIL_VERIFY', revokedAt: null } });
  await go(`/verify-email?token=${encodeURIComponent(verification.token)}`);
  await page.getByRole('link', { name: 'Sign In Now', exact: true }).waitFor();
  await go(`/verify-email?token=${encodeURIComponent(verification.token)}`);
  await page.getByText('Invalid or expired verification token.', { exact: true }).waitFor();
  await login(password, 200);
  await context.clearCookies();
  console.log('PASS browser verification, single use, and verified login');
  await go('/forgot-password');
  await page.locator('#email').fill(email);
  await submit('forgot-password', 'Send Reset Link', 200);
  await page.getByRole('alert').filter({ hasText: 'If an account' }).waitFor();
  const reset = await prisma.token.findFirstOrThrow({ where: { userId: user.id, type: 'PASSWORD_RESET', revokedAt: null } });
  await go(`/reset-password?token=${encodeURIComponent(reset.token)}`);
  await page.locator('#password').fill(replacement);
  await page.locator('#confirmPassword').fill(password);
  await page.getByRole('button', { name: 'Reset Password', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Passwords do not match.' }).waitFor();
  await page.locator('#confirmPassword').fill(replacement);
  await submit('reset-password', 'Reset Password', 200);
  await page.waitForURL('**/signin');
  await login(password, 401);
  await login(replacement, 200);
  await context.clearCookies();
  await go(`/reset-password?token=${encodeURIComponent(reset.token)}`);
  await page.locator('#password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await submit('reset-password', 'Reset Password', 400);
  await page.getByRole('alert').filter({ hasText: 'Invalid or expired' }).waitFor();
  console.log('PASS browser reset, mismatch validation, redirect, changed password and single use');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/signup', '/signin', '/forgot-password', '/reset-password', '/verify-email']) {
      await go(route);
      if (route === '/reset-password' || route === '/verify-email') await page.getByText('Invalid ' + (route === '/reset-password' ? 'reset' : 'verification') + ' link. Token is missing.').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} overflows at ${width}`);
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS missing-token states and 15 recovery-page viewport checks; no uncaught browser errors');
} finally {
  await browser?.close();
  await prisma.user.deleteMany({ where: { email } });
  assert.equal(await prisma.user.count({ where: { email } }), 0);
  await closeDatabasePool();
  console.log('Temporary recovery account cleaned up. Real inbox delivery NOT tested.');
}
