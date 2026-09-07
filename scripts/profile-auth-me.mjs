import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import { verifyAccessToken } from '../herbalaibackend/dist/utils/jwt.js';
import { findUserById } from '../herbalaibackend/dist/repositories/user.repository.js';
import { prisma } from '../herbalaibackend/dist/lib/prisma.js';
import { ENV } from '../herbalaibackend/dist/config/env.js';

const require = createRequire(new URL('../herbalaibackend/package.json', import.meta.url));
const { Pool } = require('pg');

const accessToken = process.env.PROFILE_ACCESS_TOKEN;
const userId = process.env.PROFILE_USER_ID;
const baseUrl = process.env.PROFILE_BASE_URL || 'http://localhost:5000';

if (!accessToken || !userId) {
  throw new Error('PROFILE_ACCESS_TOKEN and PROFILE_USER_ID are required.');
}

// The development Prisma client logs every SQL statement. Suppress those logs so
// this bounded profiler produces one stable, machine-readable result line.
const writeResult = console.log.bind(console);
console.log = () => {};

const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
};

const summarize = (name, values) => ({
  name,
  samples: values.length,
  minMs: Number(Math.min(...values).toFixed(3)),
  p50Ms: Number(percentile(values, 0.5).toFixed(3)),
  p95Ms: Number(percentile(values, 0.95).toFixed(3)),
  maxMs: Number(Math.max(...values).toFixed(3)),
});

const jwtDurations = [];
for (let index = 0; index < 10_000; index += 1) {
  const started = performance.now();
  const payload = verifyAccessToken(accessToken);
  jwtDurations.push(performance.now() - started);
  if (!payload?.userId) throw new Error('Access token verification failed.');
}

const dbSequential = [];
for (let index = 0; index < 10; index += 1) {
  const started = performance.now();
  const user = await findUserById(userId);
  dbSequential.push(performance.now() - started);
  if (!user) throw new Error('Profile user was not found.');
}

const connectionDurations = [];
const warmRoundTripDurations = [];
for (let index = 0; index < 3; index += 1) {
  const pool = new Pool({ connectionString: ENV.DATABASE_URL, max: 1 });
  const connectStarted = performance.now();
  const client = await pool.connect();
  connectionDurations.push(performance.now() - connectStarted);
  try {
    for (let queryIndex = 0; queryIndex < 5; queryIndex += 1) {
      const queryStarted = performance.now();
      await client.query('SELECT 1');
      warmRoundTripDurations.push(performance.now() - queryStarted);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

const runConcurrentDb = async (concurrency) => {
  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, () => findUserById(userId)));
  return performance.now() - started;
};

const dbConcurrent = [];
for (const concurrency of [10, 50, 100]) {
  dbConcurrent.push({
    concurrency,
    batchMs: Number((await runConcurrentDb(concurrency)).toFixed(1)),
  });
}

const httpDurations = [];
const serverDurations = [];
for (let index = 0; index < 10; index += 1) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });
  await response.arrayBuffer();
  httpDurations.push(performance.now() - started);
  const serverHeader = response.headers.get('x-response-time');
  if (serverHeader) serverDurations.push(Number.parseFloat(serverHeader));
  if (!response.ok) throw new Error(`Profile request failed with HTTP ${response.status}.`);
}

writeResult(`PROFILE_RESULT=${JSON.stringify({
  jwt: summarize('JWT verification', jwtDurations),
  databaseConnections: summarize('Fresh PostgreSQL connection', connectionDurations),
  databaseWarmRoundTrips: summarize('Warm PostgreSQL SELECT 1', warmRoundTripDurations),
  databaseSequential: summarize('Prisma findUserById', dbSequential),
  databaseConcurrentBatches: dbConcurrent,
  httpSequential: summarize('HTTP /api/auth/me', httpDurations),
  serverReported: summarize('Server X-Response-Time', serverDurations),
})}`);

await prisma.$disconnect();
