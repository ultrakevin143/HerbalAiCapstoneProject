import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

// Defaults to a disposable invalid address. For inbox testing, set REHEARSAL_EMAIL
// to a fresh alias explicitly allowed by the local server's email allowlist.
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
const email = process.env.REHEARSAL_EMAIL || `browser-${randomUUID()}@loadtest.invalid`;
const password = `Old!${randomUUID()}`;
const replacement = `New!${randomUUID()}`;
let browser;
let createdUserId;
const errors = [];
try {
  assert.equal(await prisma.user.count({ where: { email } }), 0, 'Refusing to use an existing account for a recovery rehearsal');
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const go = path => page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
  async function submit(endpoint, label, status) {
    const pending = page.waitForResponse(r => r.url().endsWith(`/api/auth/${endpoint}`) && r.request().method() === 'POST');
    pending.catch(() => {});
    await page.getByRole('button', { name: label, exact: true }).click();
    const response = await pending;
    assert.ok([].concat(status).includes(response.status()), `${endpoint}: HTTP ${response.status()}`);
    return endpoint === 'signup' ? response.json() : undefined;
  }
  async function login(secret, status) {
    await go('/signin');
    await page.locator('#identifier').fill(email);
    await page.locator('#password').fill(secret);
    await submit('login', 'Log In', status);
    if (status === 200) await page.waitForURL('http://localhost:3000/');
    else await page.getByRole('alert').filter({ hasText: status === 403 ? /verify your email/i : /Invalid email\/username or password/i }).waitFor();
  }
  await go('/signup');
  await page.locator('#firstName').fill('Recovery');
  await page.locator('#lastName').fill('Testa');
  await page.locator('#username').fill(`browser_${randomUUID().replaceAll('-', '').slice(0, 18)}`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  const signup = await submit('signup', 'Create Account', [201, 202]);
  createdUserId = signup.data.user.id;
  assert.equal(signup.data.verificationRequired, true);
  if (process.env.REHEARSAL_EMAIL) assert.equal(signup.data.verificationEmailSent, true, 'Verification provider did not accept the test message');
  await page.getByRole('alert').filter({ hasText: /Account created/i }).waitFor();
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  assert.equal(user.emailVerified, null);
  await login(password, 403);
  console.log('PASS browser signup and unverified login rejection');
  const verification = await prisma.token.findFirstOrThrow({ where: { userId: user.id, type: 'EMAIL_VERIFY', revokedAt: null } });
  await go(`/verify-email?token=${encodeURIComponent(verification.token)}`);
  await page.getByRole('status').getByRole('link', { name: 'Sign in', exact: true }).waitFor();
  await go(`/verify-email?token=${encodeURIComponent(verification.token)}`);
  await page.getByText('Invalid or expired verification token.', { exact: true }).waitFor();
  await login(password, 200);
  await context.clearCookies();
  console.log('PASS browser verification, single use, and verified login');
  await go('/forgot-password');
  await page.locator('#email').fill(email);
  await submit('forgot-password', 'Email a Password Link', 200);
  await page.getByRole('alert').filter({ hasText: 'If this account' }).waitFor();
  const reset = await prisma.token.findFirst({ where: { userId: user.id, type: 'PASSWORD_RESET', revokedAt: null } });
  if (process.env.REHEARSAL_EMAIL) assert.ok(reset, 'Password reset delivery failed or left no active token');
  if (reset) {
  await go(`/reset-password?token=${encodeURIComponent(reset.token)}`);
  await page.locator('#password').fill(replacement);
  await page.locator('#confirmPassword').fill(password);
  await page.getByRole('button', { name: 'Set password', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Passwords do not match.' }).waitFor();
  await page.locator('#confirmPassword').fill(replacement);
  await submit('reset-password', 'Set password', 200);
  await page.getByRole('alert').filter({ hasText: /Password reset successful/i }).waitFor();
  await login(password, 401);
  await login(replacement, 200);
  await context.clearCookies();
  await go(`/reset-password?token=${encodeURIComponent(reset.token)}`);
  await page.locator('#password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await submit('reset-password', 'Set password', 400);
  await page.getByRole('alert').filter({ hasText: 'Invalid or expired' }).waitFor();
  console.log('PASS browser reset, mismatch validation, success state, changed-password login and single use');
  } else {
    console.log('PASS suppressed reset delivery leaves no usable reset token; password reset redemption was not exercised');
  }
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
  if (createdUserId) {
    const cleanup = await prisma.user.deleteMany({ where: { id: createdUserId, email } });
    assert.equal(cleanup.count, 1);
  }
  await closeDatabasePool();
  console.log('Temporary recovery account cleaned up. Confirm inbox receipt separately; provider acceptance alone is not delivery proof.');
}
