import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { adminEditDatabaseBoundary } from './helpers/admin-edit-database-boundary.js';

const state = vi.hoisted(() => ({ client: null as PrismaClient | null }));
vi.mock('../src/lib/prisma.js', () => ({ get prisma() { return state.client; } }));
import { findAuditLogs } from '../src/repositories/audit.repository.js';

const connectionUrl = process.env['HERBALAI_TEST_DATABASE_URL'];
const enabled = adminEditDatabaseBoundary(connectionUrl, process.env['DATABASE_URL'], Boolean(process.env['CI']));
const schema = `qa_audit_${randomUUID().replaceAll('-', '')}`;
let pool: pg.Pool;

describe.skipIf(!enabled)('Read-only audit paging and search against isolated PostgreSQL', () => {
  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: connectionUrl!, options: `-c search_path=${schema},public`, max: 4 });
    await pool.query(`CREATE SCHEMA "${schema}"`);
    await pool.query('CREATE TABLE "User" (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, username TEXT NOT NULL, avatar TEXT)');
    await pool.query('CREATE TABLE "AuditLog" (id SERIAL PRIMARY KEY, "adminId" TEXT NOT NULL REFERENCES "User"(id), action TEXT NOT NULL, "targetType" TEXT NOT NULL, "targetId" TEXT NOT NULL, details JSONB, "createdAt" TIMESTAMP(3) NOT NULL)');
    await pool.query(`INSERT INTO "User" VALUES ('qa-admin', 'Tester One', 'audit@example.invalid', 'qa_admin', NULL)`);
    await pool.query(`INSERT INTO "AuditLog" ("adminId", action, "targetType", "targetId", details, "createdAt")
      SELECT 'qa-admin', 'APPROVE_TEST', 'Herb', CASE WHEN n = 1 THEN 'oldest-target' ELSE 'record-' || n END,
      CASE WHEN n = 2 THEN '{"note":"literal 50%_done","nested":{"value":"needle"}}'::jsonb ELSE NULL END,
      '2026-10-15 00:00:00'::timestamp FROM generate_series(1, 155) n`);
    state.client = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  });

  afterAll(async () => {
    if (state.client) await state.client.$disconnect();
    if (pool) { try { await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } finally { await pool.end(); } }
  });

  it('reaches all 155 records with no duplicate or skipped IDs when timestamps tie', async () => {
    const ids: number[] = [];
    for (const offset of [0, 50, 100, 150]) {
      const page = await findAuditLogs(50, offset);
      expect(page.total).toBe(155);
      expect(page.logs).toHaveLength(offset === 150 ? 5 : 50);
      ids.push(...page.logs.map(log => log.id));
    }
    expect(ids).toEqual(Array.from({ length: 155 }, (_, i) => 155 - i));
    expect(new Set(ids).size).toBe(155);
  });

  it('finds a target beyond the newest 50 records and preserves actor field selection', async () => {
    const result = await findAuditLogs(50, 0, '  OLDEST-TARGET  ');
    expect(result.total).toBe(1);
    expect(result.logs.map(log => log.id)).toEqual([1]);
    expect(Object.keys(result.logs[0]!.admin).sort()).toEqual(['avatar', 'email', 'id', 'name', 'username']);
  });

  it.each(['APPROVE_TEST', 'hErB', 'tEsTeR OnE', 'audit@example.invalid', 'qa_admin'])('searches action, target and actor across the history: %s', async query => {
    const result = await findAuditLogs(50, 100, query);
    expect(result.total).toBe(155);
    expect(result.logs.map(log => log.id)).toEqual(Array.from({ length: 50 }, (_, i) => 55 - i));
  });

  it.each(['50%_done', '%', 'needle'])('preserves literal and nested JSON detail matching: %s', async query => {
    const result = await findAuditLogs(50, 0, query);
    expect(result.total).toBe(1);
    expect(result.logs.map(log => log.id)).toEqual([2]);
  });

  it('treats SQL-looking text as text and leaves all records unchanged', async () => {
    expect(await findAuditLogs(50, 0, "' OR 1=1 --")).toEqual({ logs: [], total: 0 });
    expect((await pool.query('SELECT COUNT(*)::int AS total FROM "AuditLog"')).rows[0].total).toBe(155);
    expect(await findAuditLogs(50, 200, 'approve_test')).toEqual({ logs: [], total: 155 });
  });
});
