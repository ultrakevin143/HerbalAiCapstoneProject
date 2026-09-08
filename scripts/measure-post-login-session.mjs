import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(path.join(root, 'herbalaibackend'));
process.env.NODE_ENV = 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';

const [{ prisma, closeDatabasePool }, { hashPassword }] = await Promise.all([
  import('../herbalaibackend/dist/lib/prisma.js'),
  import('../herbalaibackend/dist/utils/password.js'),
]);

const id = randomUUID();
const email = `post-login-${id}@performance.invalid`;
const password = `Test-only-${randomUUID()}!`;
const baseUrl = process.env.LOAD_BASE_URL || 'http://127.0.0.1:5000';
const elapsed = async (action) => {
  const started = performance.now();
  const value = await action();
  return { value, ms: Number((performance.now() - started).toFixed(1)) };
};

try {
  await prisma.user.create({
    data: {
      id,
      email,
      username: `post_login_${id.replaceAll('-', '')}`,
      password: await hashPassword(password),
      name: 'TEST Post-login Session',
      role: 'contributor',
      emailVerified: new Date(),
    },
  });

  const login = await elapsed(() => fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(20_000),
  }));
  const loginBody = await login.value.json();
  assert.equal(login.value.status, 200);
  assert.ok(loginBody.data?.accessToken);
  assert.ok(loginBody.data?.refreshToken);

  const profileTimes = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const profile = await elapsed(() => fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginBody.data.accessToken}` },
      signal: AbortSignal.timeout(10_000),
    }));
    const body = await profile.value.json();
    assert.equal(profile.value.status, 200);
    assert.equal(body.data?.user?.id, id);
    assert.ok(!('password' in body.data.user));
    profileTimes.push({
      endToEndMs: profile.ms,
      appMs: Number.parseFloat(profile.value.headers.get('x-response-time') || 'NaN'),
    });
  }

  await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: loginBody.data.refreshToken }),
    signal: AbortSignal.timeout(10_000),
  });

  console.log(JSON.stringify({ loginMs: login.ms, profileTimes, safeProfile: true }));
} finally {
  try {
    await prisma.token.deleteMany({ where: { userId: id } });
    const deleted = await prisma.user.deleteMany({ where: { id } });
    assert.equal(await prisma.user.count({ where: { id } }), 0);
    console.log(JSON.stringify({ cleanup: true, deletedTemporaryUsers: deleted.count }));
  } finally {
    await closeDatabasePool();
  }
}
