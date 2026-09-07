import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(path.join(root, 'herbalaibackend'));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
const require = createRequire(new URL('../herbalaibackend/package.json', import.meta.url));
const { Pool } = require('pg');
const [{ prisma, closeDatabasePool }, { ENV }, { generateAccessToken }] = await Promise.all([
  import('../herbalaibackend/dist/lib/prisma.js'),
  import('../herbalaibackend/dist/config/env.js'),
  import('../herbalaibackend/dist/utils/jwt.js'),
]);

const runId = randomUUID().replaceAll('-', '').slice(0, 16);
const emails = Array.from({ length: 50 }, (_, index) => `diagnostic-${runId}-${index}@loadtest.invalid`);
const elapsed = async action => { const start = performance.now(); const value = await action(); return { ms: performance.now() - start, value }; };
const summarize = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const pick = fraction => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
  return { samples: values.length, minMs: +sorted[0].toFixed(1), p50Ms: +pick(.5).toFixed(1), p95Ms: +pick(.95).toFixed(1), maxMs: +sorted.at(-1).toFixed(1) };
};

try {
  await prisma.user.createMany({ data: emails.map((email, index) => ({
    username: `diagnostic_${runId}_${index}`, email, password: `not-login-enabled-${runId}`,
    name: `TEST Session Diagnostic ${index + 1}`, role: 'contributor', emailVerified: new Date(),
  })) });
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true }, orderBy: { email: 'asc' } });
  assert.equal(users.length, 50);

  const freshConnections = [];
  const warmSelects = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const pool = new Pool({ connectionString: ENV.DATABASE_URL, max: 1, connectionTimeoutMillis: 15_000 });
    const connected = await elapsed(() => pool.connect());
    freshConnections.push(connected.ms);
    try {
      for (let query = 0; query < 5; query++) warmSelects.push((await elapsed(() => connected.value.query('SELECT 1'))).ms);
    } finally { connected.value.release(); await pool.end(); }
  }

  const prismaBatches = [];
  for (const size of [1, 10, 50]) {
    const ids = users.slice(0, size).map(user => user.id);
    const result = await elapsed(() => prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } }));
    assert.equal(result.value.length, size);
    prismaBatches.push({ users: size, ms: +result.ms.toFixed(1) });
  }

  const token = generateAccessToken({ userId: users[0].id, role: 'contributor' });
  const http = [];
  for (let request = 0; request < 12; request++) {
    const result = await elapsed(async () => {
      const response = await fetch('http://127.0.0.1:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data?.user?.id, users[0].id);
      assert.ok(!('password' in body.data.user));
      return Number.parseFloat(response.headers.get('x-response-time') || 'NaN');
    });
    http.push({ endToEndMs: result.ms, appMs: result.value });
  }

  console.log(JSON.stringify({
    runId,
    freshConnections: summarize(freshConnections),
    warmSelects: summarize(warmSelects),
    prismaBatches,
    firstHttp: { endToEndMs: +http[0].endToEndMs.toFixed(1), appMs: +http[0].appMs.toFixed(1) },
    remainingHttp: { endToEnd: summarize(http.slice(1).map(item => item.endToEndMs)), app: summarize(http.slice(1).map(item => item.appMs)) },
  }));
} finally {
  try {
    const deleted = await prisma.user.deleteMany({ where: { email: { in: emails } } });
    assert.equal(await prisma.user.count({ where: { email: { in: emails } } }), 0);
    console.log(JSON.stringify({ cleanup: true, deletedTemporaryUsers: deleted.count }));
  } finally { await closeDatabasePool(); }
}
