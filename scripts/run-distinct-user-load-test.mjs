import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(path.join(projectRoot, 'herbalaibackend'));
process.env.NODE_ENV ||= 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS ||= '0';

const [{ prisma, closeDatabasePool }, { generateAccessToken }] = await Promise.all([
  import('../herbalaibackend/dist/lib/prisma.js'),
  import('../herbalaibackend/dist/utils/jwt.js'),
]);

const baseUrl = process.env.LOAD_BASE_URL || 'http://localhost:5000';
const timeoutMs = Number(process.env.LOAD_TIMEOUT_MS || 15_000);
const stages = (process.env.LOAD_STAGES || '10,50,100,250,500')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0 && value <= 500);

if (stages.length === 0) throw new Error('LOAD_STAGES must contain integers from 1 to 500.');

const userCount = Math.max(...stages);
const runId = randomUUID().replaceAll('-', '').slice(0, 16);
const emailPrefix = `load-${runId}-`;
let createdUserIds = [];

const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
};

const requestProfile = async (token, expectedUserId) => {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await response.json();
    const identityValid = !response.ok || (body.data?.user?.id === expectedUserId && !('password' in body.data.user));
    const rawAppMs = response.headers.get('x-response-time');
    const appMs = rawAppMs === null ? NaN : Number.parseFloat(rawAppMs);
    return { ok: response.ok && identityValid, status: response.status, identityValid, durationMs: performance.now() - started, appMs: Number.isFinite(appMs) ? appMs : null };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: performance.now() - started,
      error: error instanceof Error ? error.name : 'UnknownError',
      // Codes only: do not dump tokens, request headers or connection URLs.
      causeCode: typeof error?.cause?.code === 'string' ? error.cause.code : null,
    };
  }
};

try {
  await prisma.user.createMany({
    data: Array.from({ length: userCount }, (_, index) => ({
      username: `${emailPrefix}${index}`,
      email: `${emailPrefix}${index}@loadtest.invalid`,
      password: `not-login-enabled-${runId}`,
      name: `Load Test User ${index + 1}`,
      role: 'contributor',
      emailVerified: new Date(),
    })),
  });

  const users = await prisma.user.findMany({
    where: { email: { startsWith: emailPrefix } },
    select: { id: true },
    orderBy: { email: 'asc' },
  });
  createdUserIds = users.map(({ id }) => id);
  if (createdUserIds.length !== userCount) {
    throw new Error(`Expected ${userCount} temporary users, found ${createdUserIds.length}.`);
  }

  const tokens = createdUserIds.map((userId) => generateAccessToken({ userId, role: 'contributor' }));
  const preflight = await requestProfile(tokens[0], createdUserIds[0]);
  if (!preflight.ok) throw new Error(`Authenticated preflight failed: HTTP ${preflight.status}`);

  for (const concurrency of stages) {
    const started = performance.now();
    const results = await Promise.all(tokens.slice(0, concurrency).map((token, index) => requestProfile(token, createdUserIds[index])));
    const elapsedMs = performance.now() - started;
    const durations = results.map(({ durationMs }) => durationMs);
    const failures = results.filter(({ ok }) => !ok);
    const appDurations = results.map(result => result.appMs).filter(value => typeof value === 'number');
    const failureTypes = failures.reduce((counts, result) => {
      const key = result.identityValid === false ? 'PROFILE_IDENTITY_OR_FIELD_MISMATCH' : result.status ? `HTTP_${result.status}` : result.causeCode || result.error || 'UnknownError';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    console.log(JSON.stringify({
      runId,
      endpoint: '/api/auth/me',
      distinctUsers: concurrency,
      successes: results.length - failures.length,
      errors: failures.length,
      errorRatePercent: Number((failures.length / results.length * 100).toFixed(2)),
      p50Ms: Number(percentile(durations, 0.5).toFixed(1)),
      p95Ms: Number(percentile(durations, 0.95).toFixed(1)),
      appTimingSamples: appDurations.length,
      appP95Ms: appDurations.length ? Number(percentile(appDurations, 0.95).toFixed(1)) : null,
      maxMs: Number(Math.max(...durations).toFixed(1)),
      throughputPerSecond: Number((results.length / (elapsedMs / 1000)).toFixed(1)),
      failureTypes,
    }));
    if (failures.length / results.length > 0.05 || percentile(durations, 0.95) >= timeoutMs) {
      console.log(JSON.stringify({ runId, stoppedEarly: true, reason: 'Error rate exceeded 5% or p95 reached the request timeout' }));
      process.exitCode = 1;
      break;
    }
  }
} finally {
  try {
    // Also clean up if the read following createMany failed before IDs were captured.
    const where = { email: { in: Array.from({ length: userCount }, (_, index) => `${emailPrefix}${index}@loadtest.invalid`) } };
    const deleted = await prisma.user.deleteMany({ where });
    if (await prisma.user.count({ where })) throw new Error('Temporary load-test account cleanup is incomplete');
    console.log(JSON.stringify({ runId, cleanup: true, deletedTemporaryUsers: deleted.count }));
  } finally { await closeDatabasePool(); }
}
