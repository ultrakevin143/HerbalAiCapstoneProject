import { performance } from 'node:perf_hooks';

const sampleCount = Number.parseInt(process.env.STAGING_PERF_SAMPLES || '10', 10);
const targets = [
  { name: 'Frontend homepage', url: 'https://herbal-ai-staging.vercel.app/', expectedStatus: 200 },
  { name: 'Backend health', url: 'https://herbalaicapstoneproject-staging.up.railway.app/api/test', expectedStatus: 200 },
  { name: 'Public herb catalog', url: 'https://herbalaicapstoneproject-staging.up.railway.app/api/herbs?page=1&limit=12', expectedStatus: 200 },
];

const percentile = (values, fraction) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
};

const measure = async (target) => {
  await fetch(target.url, { headers: { 'User-Agent': 'Herbal-Ai-defense-readiness-check' } });
  const samples = [];
  let errors = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const startedAt = performance.now();
    try {
      const response = await fetch(target.url, {
        headers: {
          Accept: 'application/json,text/html;q=0.9',
          'User-Agent': 'Herbal-Ai-defense-readiness-check',
        },
      });
      await response.arrayBuffer();
      samples.push(performance.now() - startedAt);
      if (response.status !== target.expectedStatus) errors += 1;
    } catch {
      samples.push(performance.now() - startedAt);
      errors += 1;
    }
  }

  return {
    name: target.name,
    samples: samples.length,
    errors,
    errorRate: errors / samples.length,
    p50: percentile(samples, 0.5),
    p95: percentile(samples, 0.95),
    maximum: Math.max(...samples),
  };
};

const results = [];
for (const target of targets) {
  results.push(await measure(target));
}

console.log(`Staging performance check (${sampleCount} measured requests per target)`);
for (const result of results) {
  console.log(`${result.name}: p50=${result.p50.toFixed(1)}ms p95=${result.p95.toFixed(1)}ms max=${result.maximum.toFixed(1)}ms errors=${result.errors}/${result.samples}`);
}

if (results.some((result) => result.errorRate > 0)) {
  process.exitCode = 1;
}
