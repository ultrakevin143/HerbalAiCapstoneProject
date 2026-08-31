import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { ENV } from '../config/env.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const pool = new pg.Pool({ connectionString: ENV.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  });
}

export const prisma = prismaInstance;

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
