import { chromium } from '../herbalaifrontend/node_modules/playwright-core/index.mjs';

const runs = Number(process.env.PAINT_RUNS || 5);
if (!Number.isInteger(runs) || runs < 1 || runs > 20) throw new Error('PAINT_RUNS must be an integer from 1 to 20');
const mode = {
  javaScript: process.env.PAINT_NO_JS !== '1',
  blurOverride: process.env.PAINT_NO_BLUR === undefined ? 'none' : process.env.PAINT_NO_BLUR === '1' ? 'disabled' : 'control',
  warmRenderer: process.env.PAINT_WARM_RENDERER === '1',
  trace: process.env.PAINT_TRACE === '1',
  minimalControl: process.env.PAINT_MINIMAL === '1',
  deferSections: process.env.PAINT_DEFER_SECTIONS === '1',
};
console.log(JSON.stringify({ configuration: { runs, ...mode, viewport: '1440x900', frontend: process.env.FRONTEND_URL || 'http://localhost:3001' } }));
// Separate cold contexts: no login, email, or AI requests are needed.
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
try {
  for (let run = 1; run <= runs; run++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: process.env.PAINT_NO_JS !== '1' });
    const page = await context.newPage();
    if (mode.minimalControl) {
      await page.route(process.env.FRONTEND_URL || 'http://localhost:3001/', route => route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Herbal AI diagnostic control</title><h1>Herbal AI</h1><p>Minimal browser paint control; not the application.</p>',
      }));
    }
    if (process.env.PAINT_WARM_RENDERER === '1') {
      // Initialize Chrome graphics without fetching any Herbal AI resources.
      await page.setContent('<!doctype html><p>Browser graphics readiness check</p>');
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.waitForTimeout(1000);
    }
    if (process.env.PAINT_NO_BLUR !== undefined || mode.deferSections) {
      await page.route('**/*.css', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: `${await response.text()}\n${process.env.PAINT_NO_BLUR === '1' ? '* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }' : ''}\n${mode.deferSections ? 'main > section:not(:first-child) { content-visibility: auto; contain-intrinsic-size: auto 600px; }' : ''}` });
      });
    }
    const trace = [];
    const cdp = process.env.PAINT_TRACE === '1' ? await context.newCDPSession(page) : null;
    if (cdp) {
      cdp.on('Tracing.dataCollected', ({ value }) => trace.push(...value));
      await cdp.send('Tracing.start', { categories: 'devtools.timeline,blink,cc,gpu', transferMode: 'ReportEvents' });
    }
    await page.addInitScript(() => {
      window.paintEntries = [];
      window.longTasks = [];
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }).observe({ type: 'longtask', buffered: true });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          window.paintEntries.push({ time: entry.startTime, tag: entry.element?.tagName,
            element: entry.element?.className, url: entry.url });
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    const response = await page.goto(process.env.FRONTEND_URL || 'http://localhost:3001', { waitUntil: 'networkidle' });
    if (!response?.ok()) throw new Error(`Homepage HTTP failure: ${response?.status()}`);
    if (!(await page.title()).includes('Herbal AI')) throw new Error('Wrong application: expected Herbal AI');
    if (mode.javaScript) {
      // Do not silently report an empty LCP array when the first paint is late.
      await page.waitForFunction(() => window.paintEntries?.length > 0, undefined, { timeout: 15000 });
    }
    await page.waitForTimeout(1500);
    console.log(JSON.stringify(await page.evaluate(run => ({
      run, paints: performance.getEntriesByType('paint').map(p => ({ name: p.name, time: p.startTime })),
      lcp: window.paintEntries,
      longTasks: window.longTasks,
      navigation: performance.getEntriesByType('navigation').map(n => ({ ttfb: n.responseStart, responseEnd: n.responseEnd, domContentLoaded: n.domContentLoadedEventEnd, load: n.loadEventEnd })),
      heading: { font: getComputedStyle(document.querySelector('h1')).fontFamily, visible: document.querySelector('h1').getBoundingClientRect().height > 0 },
      resources: performance.getEntriesByType('resource').filter(r => ['css', 'link'].includes(r.initiatorType) || /woff|css/.test(r.name))
        .map(r => ({ url: r.name, start: r.startTime, end: r.responseEnd, duration: r.duration })),
    }), run)));
    if (cdp) {
      const finished = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
      await cdp.send('Tracing.end');
      await finished;
      console.log(JSON.stringify({ traceLongest: trace.filter(e => e.ph === 'X' && e.dur > 10000)
        .sort((a, b) => b.dur - a.dur).slice(0, 25).map(e => ({ name: e.name, timestampUs: e.ts, ms: e.dur / 1000, process: e.pid, thread: e.tid, data: e.args?.data })) }));
    }
    await context.close();
  }
} finally {
  await browser.close();
}
