import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(path.join(projectRoot, 'herbalaibackend'));
process.env.NODE_ENV ||= 'production';
process.env.DB_POOL_METRICS_INTERVAL_MS ||= '0';

const adminPassword = process.env.CACHE_TEST_ADMIN_PASSWORD;
if (!adminPassword) throw new Error('CACHE_TEST_ADMIN_PASSWORD is required.');

const baseUrl = process.env.LOAD_BASE_URL || 'http://localhost:5000';
const [{ prisma, closeDatabasePool }, { generateAccessToken }] = await Promise.all([
  import('../herbalaibackend/dist/lib/prisma.js'),
  import('../herbalaibackend/dist/utils/jwt.js'),
]);

const runId = randomUUID().replaceAll('-', '').slice(0, 16);
let userId;

try {
  const user = await prisma.user.create({
    data: {
      username: `cache-ban-${runId}`,
      email: `cache-ban-${runId}@loadtest.invalid`,
      password: `not-login-enabled-${runId}`,
      name: 'Cache Ban Test',
      role: 'contributor',
      emailVerified: new Date(),
    },
    select: { id: true },
  });
  userId = user.id;
  const userToken = generateAccessToken({ userId, role: 'contributor' });

  const profileHeaders = { Authorization: `Bearer ${userToken}` };
  const firstProfile = await fetch(`${baseUrl}/api/auth/me`, { headers: profileHeaders });
  const cachedProfile = await fetch(`${baseUrl}/api/auth/me`, { headers: profileHeaders });

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.CACHE_TEST_ADMIN_EMAIL || 'admin@herbalai.ph',
      password: adminPassword,
    }),
  });
  const loginBody = await login.json();
  const adminToken = loginBody?.data?.accessToken;
  if (!login.ok || !adminToken) throw new Error(`Administrator login failed with HTTP ${login.status}.`);

  const ban = await fetch(`${baseUrl}/api/auth/users/${userId}/ban`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const afterBan = await fetch(`${baseUrl}/api/auth/me`, { headers: profileHeaders });

  const result = {
    firstProfileStatus: firstProfile.status,
    cachedProfileStatus: cachedProfile.status,
    banStatus: ban.status,
    immediatePostBanProfileStatus: afterBan.status,
    passed: firstProfile.status === 200 && cachedProfile.status === 200 && ban.status === 200 && afterBan.status === 403,
  };
  console.log(JSON.stringify(result));
  if (!result.passed) process.exitCode = 1;
} finally {
  if (userId) await prisma.user.deleteMany({ where: { id: userId } });
  await closeDatabasePool();
}
