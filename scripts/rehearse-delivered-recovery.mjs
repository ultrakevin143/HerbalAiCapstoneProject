import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Use only the explicitly authorized test alias. Does not touch the base Gmail account.
const email = 'kevinmercado987+herbal-recovery-20260906@gmail.com';
const name = 'TEST Delivered Recovery 20260906';
process.chdir(fileURLToPath(new URL('../herbalaibackend/', import.meta.url)));
process.env.DB_POOL_METRICS_INTERVAL_MS = '0';
process.env.NODE_ENV = 'production';
const { prisma, closeDatabasePool } = await import('../herbalaibackend/dist/lib/prisma.js');
try {
  const action = process.argv[2] || 'status';
  if (action === 'prepare') {
    assert.equal(await prisma.user.count({ where: { email } }), 0, 'Alias already exists; inspect status instead of overwriting');
    const signup = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, username: `mail_${randomUUID().replaceAll('-', '').slice(0, 20)}`, password: randomUUID() }),
    });
    assert.equal(signup.status, 201, 'Signup failed');
    const reset = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    });
    assert.equal(reset.status, 200, 'Reset request failed');
    console.log('Requested verification and reset emails for the authorized temporary Gmail alias. API success does not establish delivery.');
  } else {
    assert.ok(['status', 'cleanup'].includes(action), 'Use prepare, status, or cleanup');
    const user = await prisma.user.findUnique({ where: { email }, include: { tokens: true } });
    if (!user) console.log('No temporary delivery-test account remains.');
    else {
      assert.equal(user.name, name, 'Refusing to inspect/delete an unrelated account');
      if (action === 'cleanup') {
        await prisma.user.delete({ where: { id: user.id } });
        console.log('Deleted only the temporary delivery-test account and its cascading tokens.');
      } else console.log(JSON.stringify({ emailVerified: Boolean(user.emailVerified), tokens: user.tokens.map(t => ({ type: t.type, redeemedOrRevoked: Boolean(t.revokedAt), expired: t.expiresAt < new Date() })) }));
    }
  }
} finally { await closeDatabasePool(); }
