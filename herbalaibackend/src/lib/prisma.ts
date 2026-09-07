import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { ENV } from '../config/env.js';

type PoolMetrics = {
  total: number;
  idle: number;
  waiting: number;
  connected: number;
  removed: number;
  errors: number;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  databasePool?: pg.Pool;
  databasePoolCounters?: Pick<PoolMetrics, 'connected' | 'removed' | 'errors'>;
};

let prismaInstance: PrismaClient;
let databasePool: pg.Pool;
let poolCounters: Pick<PoolMetrics, 'connected' | 'removed' | 'errors'>;

if (globalForPrisma.prisma && globalForPrisma.databasePool && globalForPrisma.databasePoolCounters) {
  prismaInstance = globalForPrisma.prisma;
  databasePool = globalForPrisma.databasePool;
  poolCounters = globalForPrisma.databasePoolCounters;
} else {
  databasePool = new pg.Pool({
    connectionString: ENV.DATABASE_URL,
    min: Math.min(ENV.DB_POOL_MIN, ENV.DB_POOL_MAX),
    max: ENV.DB_POOL_MAX,
    idleTimeoutMillis: ENV.DB_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: ENV.DB_POOL_CONNECTION_TIMEOUT_MS,
    maxLifetimeSeconds: ENV.DB_POOL_MAX_LIFETIME_SECONDS,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });
  poolCounters = { connected: 0, removed: 0, errors: 0 };
  databasePool.on('connect', () => { poolCounters.connected += 1; });
  databasePool.on('remove', () => { poolCounters.removed += 1; });
  databasePool.on('error', (error) => {
    poolCounters.errors += 1;
    console.error(JSON.stringify({ event: 'database_pool_error', message: error.message }));
  });

  const adapter = new PrismaPg(databasePool);
  prismaInstance = new PrismaClient({
    adapter,
    log: ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  });
}

export const prisma = prismaInstance;

export const getDatabasePoolMetrics = (): PoolMetrics => ({
  total: databasePool.totalCount,
  idle: databasePool.idleCount,
  waiting: databasePool.waitingCount,
  ...poolCounters,
});

export const warmDatabasePool = async (): Promise<void> => {
  const connectionCount = Math.min(ENV.DB_POOL_MIN, ENV.DB_POOL_MAX);
  if (connectionCount === 0) return;
  const connections = await Promise.allSettled(Array.from({ length: connectionCount }, () => databasePool.connect()));
  for (const connection of connections) {
    if (connection.status === 'fulfilled') connection.value.release();
  }
  const failedConnection = connections.find(connection => connection.status === 'rejected');
  if (failedConnection?.status === 'rejected') throw failedConnection.reason;
  // Initialize Prisma's adapter/query path too; opening sockets alone does not
  // remove the first ORM request penalty with a remote PostgreSQL database.
  await prisma.$queryRawUnsafe('SELECT 1');
};

export const closeDatabasePool = async () => {
  await prisma.$disconnect();
  await databasePool.end();
};

if (ENV.DB_POOL_METRICS_INTERVAL_MS > 0) {
  const metricsTimer = setInterval(() => {
    console.info(JSON.stringify({ event: 'database_pool_metrics', ...getDatabasePoolMetrics() }));
  }, ENV.DB_POOL_METRICS_INTERVAL_MS);
  metricsTimer.unref();
}

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.databasePool = databasePool;
  globalForPrisma.databasePoolCounters = poolCounters;
}
