import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const frontendUrl = process.env.BROWSER_FRONTEND_URL || 'http://localhost:3000';
const backendUrl = process.env.BROWSER_BACKEND_URL || 'http://localhost:5000';
const adminEmail = process.env.BROWSER_TEST_EMAIL || 'admin@herbalai.ph';
const adminPassword = process.env.BROWSER_TEST_PASSWORD;
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

if (!adminPassword) throw new Error('BROWSER_TEST_PASSWORD is required for the authenticated Dr.Ai measurement.');

const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
};

const summarize = (values) => ({
  samples: values.length,
  minMs: Number(Math.min(...values).toFixed(1)),
  p50Ms: Number(percentile(values, 0.5).toFixed(1)),
  p95Ms: Number(percentile(values, 0.95).toFixed(1)),
  maxMs: Number(Math.max(...values).toFixed(1)),
});

const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
const loginBody = await loginResponse.json();
if (!loginResponse.ok || !loginBody?.data?.accessToken) {
  throw new Error(`Browser test login failed with HTTP ${loginResponse.status}.`);
}

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([
  { name: 'accessToken', value: loginBody.data.accessToken, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
  { name: 'refreshToken', value: loginBody.data.refreshToken, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
]);

try {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.addInitScript(() => {
    window.__herbalAiLcp = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const latest = entries.at(-1);
      if (latest) window.__herbalAiLcp = latest.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  const homepage = [];
  for (let index = 0; index < 5; index += 1) {
    await page.goto(frontendUrl, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(1_000);
    homepage.push(await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paints = Object.fromEntries(performance.getEntriesByType('paint').map((entry) => [entry.name, entry.startTime]));
      return {
        lcpMs: window.__herbalAiLcp,
        firstContentfulPaintMs: paints['first-contentful-paint'] || 0,
        domContentLoadedMs: navigation.domContentLoadedEventEnd,
        loadMs: navigation.loadEventEnd,
      };
    }));
  }

  await page.goto(`${frontendUrl}/library`, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('.library-herb-card', { timeout: 30_000 });
  const librarySearchMs = [];
  for (let index = 0; index < 10; index += 1) {
    const input = page.getByLabel('Search herbs by name, scientific name, or medicinal use');
    await input.fill('');
    await page.waitForFunction(() => document.querySelectorAll('.library-herb-card').length > 1);
    const started = performance.now();
    await input.fill('Lagundi');
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('.library-herb-card')];
      return cards.length === 1 && cards[0].textContent?.toLowerCase().includes('lagundi');
    });
    librarySearchMs.push(performance.now() - started);
  }

  const drAiTotalMs = [];
  const drAiApiResponseStartMs = [];
  const drAiFirstVisibleChunkMs = [];
  const drAiStatuses = [];
  for (let index = 0; index < 3; index += 1) {
    const chatPage = await context.newPage();
    await chatPage.goto(`${frontendUrl}/chat`, { waitUntil: 'networkidle', timeout: 60_000 });
    const messageInput = chatPage.getByLabel('Type message');
    await messageInput.waitFor({ state: 'visible', timeout: 30_000 });
    await messageInput.fill('What is Lagundi used for?');
    const initialModelMessages = await chatPage.locator('[data-message-role="model"]').count();
    const responsePromise = chatPage.waitForResponse(
      (response) => response.url().includes('/api/chat') && response.request().method() === 'POST',
      { timeout: 60_000 }
    );
    const started = performance.now();
    await chatPage.getByLabel('Send message').click();
    const chatResponse = await responsePromise;
    const responseStartedMs = performance.now() - started;
    await chatPage.waitForFunction((initialCount) => {
      const messages = [...document.querySelectorAll('[data-message-role="model"]')];
      return messages.length > initialCount && Boolean(messages.at(-1)?.textContent?.trim());
    }, initialModelMessages, { timeout: 60_000 });
    drAiFirstVisibleChunkMs.push(performance.now() - started);
    await chatResponse.finished();
    await chatPage.waitForFunction(() => {
      const input = document.querySelector('input[aria-label="Type message"]');
      return input && !input.disabled;
    }, null, { timeout: 60_000 });
    drAiTotalMs.push(performance.now() - started);
    drAiApiResponseStartMs.push(responseStartedMs);
    drAiStatuses.push(chatResponse.status());
    await chatPage.close();
  }

  console.log(JSON.stringify({
    environment: { browser: 'Google Chrome (headless)', viewport: '1440x900', frontendUrl, cacheDisabled: true },
    homepage: {
      largestContentfulPaint: summarize(homepage.map(({ lcpMs }) => lcpMs)),
      firstContentfulPaint: summarize(homepage.map(({ firstContentfulPaintMs }) => firstContentfulPaintMs)),
      loadEvent: summarize(homepage.map(({ loadMs }) => loadMs)),
      raw: homepage,
    },
    libraryRenderedSearch: summarize(librarySearchMs),
    drAi: {
      submissionToRenderedResponse: summarize(drAiTotalMs),
      apiTimeToResponseStart: summarize(drAiApiResponseStartMs),
      submissionToFirstVisibleChunk: summarize(drAiFirstVisibleChunkMs),
      statuses: drAiStatuses,
    },
  }));
} finally {
  await context.close();
  await browser.close();
}
