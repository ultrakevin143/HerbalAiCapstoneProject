import { performance } from 'node:perf_hooks';

const baseUrl = process.env.LOAD_BASE_URL || 'http://localhost:5000';
const timeoutMs = Number(process.env.LOAD_TIMEOUT_MS || 15000);
const stages = (process.env.LOAD_STAGES || '10,50,100,250,500')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0 && value <= 500);

if (stages.length === 0) {
  throw new Error('LOAD_STAGES must contain at least one integer from 1 to 500.');
}

const percentile = (values, fraction) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
};

const request = async (url, headers = {}) => {
  const started = performance.now();
  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.arrayBuffer();
    const rawAppMs = response.headers.get('x-response-time');
    const parsedAppMs = rawAppMs === null ? NaN : Number.parseFloat(rawAppMs);
    return {
      ok: response.ok,
      status: response.status,
      durationMs: performance.now() - started,
      appMs: Number.isFinite(parsedAppMs) ? parsedAppMs : null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: performance.now() - started,
      error: error instanceof Error ? error.name : 'UnknownError',
    };
  }
};

const runStage = async ({ name, path, concurrency, headers = {} }) => {
  const started = performance.now();
  const results = await Promise.all(
    Array.from({ length: concurrency }, () => request(`${baseUrl}${path}`, headers))
  );
  const elapsedMs = performance.now() - started;
  const durations = results.map((result) => result.durationMs);
  const appDurations = results.map(result => result.appMs).filter(value => typeof value === 'number');
  const failures = results.filter((result) => !result.ok);
  const statusCounts = results.reduce((counts, result) => {
    counts[result.status] = (counts[result.status] || 0) + 1;
    return counts;
  }, {});

  return {
    endpoint: name,
    concurrency,
    requests: results.length,
    successes: results.length - failures.length,
    errors: failures.length,
    errorRatePercent: Number(((failures.length / results.length) * 100).toFixed(2)),
    p50Ms: Number(percentile(durations, 0.5)?.toFixed(1)),
    p95Ms: Number(percentile(durations, 0.95)?.toFixed(1)),
    // Application timing excludes socket admission, network transfer and client scheduling.
    appTimingSamples: appDurations.length,
    appP95Ms: appDurations.length ? Number(percentile(appDurations, 0.95).toFixed(1)) : null,
    maxMs: Number(Math.max(...durations).toFixed(1)),
    throughputPerSecond: Number((results.length / (elapsedMs / 1000)).toFixed(1)),
    statusCounts,
  };
};

const endpoints = [
  { name: 'health', path: '/api/test' },
  { name: 'herb-list-cached', path: '/api/herbs?limit=12' },
];

if (process.env.LOAD_TOKEN) {
  endpoints.push({
    name: 'authenticated-session',
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${process.env.LOAD_TOKEN}` },
  });
}

for (const endpoint of endpoints) {
  const warmup = await request(`${baseUrl}${endpoint.path}`, endpoint.headers);
  if (!warmup.ok) throw new Error(`Preflight failed for ${endpoint.name} (HTTP ${warmup.status}). Start a healthy test backend before running load measurements.`);
}

const report = [];
for (const endpoint of endpoints) {
  for (const concurrency of stages) {
    const result = await runStage({ ...endpoint, concurrency });
    report.push(result);
    console.log(JSON.stringify(result));

    if (result.errorRatePercent > 5 || result.p95Ms >= timeoutMs) {
      console.error(`Stopping ${endpoint.name} after stage ${concurrency}: safety threshold exceeded.`);
      break;
    }
  }
}

const totalRequests = report.reduce((sum, result) => sum + result.requests, 0);
const totalErrors = report.reduce((sum, result) => sum + result.errors, 0);
console.log(JSON.stringify({
  summary: true,
  baseUrl,
  timeoutMs,
  stages,
  totalRequests,
  totalErrors,
  errorRatePercent: Number(((totalErrors / totalRequests) * 100).toFixed(2)),
}));
