import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { ENV } from '../src/config/env.js';

const pool = new pg.Pool({ connectionString: ENV.DATABASE_URL, max: 1, connectionTimeoutMillis: ENV.DB_POOL_CONNECTION_TIMEOUT_MS });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool), transactionOptions: { maxWait: ENV.DB_TRANSACTION_MAX_WAIT_MS } });
const metrics = () => ({ total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount });

try {
  for (const phase of ['cold', 'warm']) {
    const started = performance.now();
    await prisma.$transaction(async (transaction) => transaction.$queryRaw`SELECT 1`);
    console.log(JSON.stringify({ phase, elapsedMs: Math.round(performance.now() - started), ...metrics() }));
  }

  const connection = await pool.connect();
  let entered = false;
  try {
    await assert.rejects(prisma.$transaction(async () => { entered = true; }, { maxWait: 2000 }),
      (error: unknown) => error instanceof Error && error.message.includes('Unable to start a transaction in the given time'));
    assert.equal(entered, false);
    console.log(JSON.stringify({ phase: 'held-connection-reproduced-timeout', ...metrics() }));
  } finally {
    connection.release();
  }

  await prisma.$queryRaw`SELECT 1`;
  const heldConnection = await pool.connect();
  let released = false;
  const release = () => { if (!released) { released = true; heldConnection.release(); } };
  const timer = setTimeout(release, 2500);
  try {
    const started = performance.now();
    await prisma.$transaction(async (transaction) => transaction.$queryRaw`SELECT 1`);
    console.log(JSON.stringify({ phase: 'configured-wait-after-contention', maxWaitMs: ENV.DB_TRANSACTION_MAX_WAIT_MS, elapsedMs: Math.round(performance.now() - started), ...metrics() }));
  } finally {
    clearTimeout(timer);
    release();
  }

  const suspectHerbs = await prisma.herb.findMany({ where: { OR: [{ localName: 'awdsawd' }, { scientificName: 'awds' }] }, select: { id: true, localName: true, scientificName: true, publicationStatus: true, provenance: true, sourceSuggestionId: true } });
  console.log(JSON.stringify({ phase: 'existing-content-inspection', herbs: suspectHerbs }));
} finally {
  await prisma.$disconnect();
  await pool.end();
}
