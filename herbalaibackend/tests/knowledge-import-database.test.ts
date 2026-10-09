import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminEditDatabaseBoundary } from './helpers/admin-edit-database-boundary.js';

const state = vi.hoisted(() => ({ client: null as PrismaClient | null }));
vi.mock('../src/lib/prisma.js', () => ({ get prisma() { return state.client; } }));
import { upsertKB, upsertKBBatch } from '../src/repositories/knowledgebase.repository.js';

const connectionUrl = process.env['HERBALAI_TEST_DATABASE_URL'];
const enabled = adminEditDatabaseBoundary(connectionUrl, process.env['DATABASE_URL'], Boolean(process.env['CI']));
const schema = `qa_kb_import_${randomUUID().replaceAll('-', '')}`;
const adminId = 'TEST-batch-admin';
const firstQuestion = 'TEST first batch question';
const secondQuestion = 'TEST second batch question';
const facts = [
  { question: firstQuestion, answer: 'TEST revised first answer', tags: ['test'], metadata: { fixture: true } },
  { question: secondQuestion, answer: 'TEST new second answer', tags: ['test'], metadata: { fixture: true } },
];
let pool: pg.Pool;
const assertRolledBack = async () => {
  expect((await pool.query('SELECT id, question, answer, tags, metadata FROM "KnowledgeBase" ORDER BY question')).rows).toEqual([
    { id: 'TEST-existing', question: firstQuestion, answer: 'TEST original answer', tags: ['baseline'], metadata: { baseline: true } },
  ]);
  expect((await pool.query('SELECT COUNT(*)::int AS count FROM "AuditLog"')).rows[0].count).toBe(0);
};

describe.skipIf(!enabled)('knowledge batch record/audit rollback on isolated PostgreSQL', () => {
  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: connectionUrl, options: `-c search_path=${schema}` });
    const target = (await pool.query('SELECT current_database() AS database, inet_server_addr()::text AS host, inet_server_port() AS port')).rows[0];
    expect(target.database).toBe('herbalai_test');
    expect(target.host).toMatch(/^127\.0\.0\.1(?:\/32)?$/);
    expect(Number(target.port)).toBe(Number(new URL(connectionUrl!).port || '5432'));
    await pool.query(`CREATE SCHEMA "${schema}"`);
    await pool.query('CREATE TABLE "User" (id TEXT PRIMARY KEY)');
    await pool.query('CREATE TABLE "KnowledgeBase" (id TEXT PRIMARY KEY, question TEXT NOT NULL UNIQUE, answer TEXT NOT NULL, category TEXT, tags TEXT[] NOT NULL, metadata JSONB, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW())');
    await pool.query('CREATE TABLE "AuditLog" (id SERIAL PRIMARY KEY, "adminId" TEXT NOT NULL REFERENCES "User"(id), action TEXT NOT NULL, "targetType" TEXT NOT NULL, "targetId" TEXT NOT NULL, details JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW())');
    state.client = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  });
  beforeEach(async () => {
    await pool.query('ALTER TABLE "KnowledgeBase" DROP CONSTRAINT IF EXISTS test_record_failure');
    await pool.query('ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS test_audit_failure');
    await pool.query('TRUNCATE "AuditLog", "KnowledgeBase", "User"');
    await pool.query('INSERT INTO "User" (id) VALUES ($1)', [adminId]);
    await pool.query('INSERT INTO "KnowledgeBase" (id, question, answer, tags, metadata) VALUES ($1, $2, $3, $4, $5)', ['TEST-existing', firstQuestion, 'TEST original answer', ['baseline'], { baseline: true }]);
  });
  afterAll(async () => {
    if (state.client) await state.client.$disconnect();
    if (pool) { try { await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } finally { await pool.end(); } }
  });

  it('rolls back the first update when the second record is rejected by PostgreSQL', async () => {
    await pool.query('ALTER TABLE "KnowledgeBase" ADD CONSTRAINT test_record_failure CHECK (answer <> \'TEST new second answer\')');
    await expect(upsertKBBatch(facts, adminId)).rejects.toThrow();
    await assertRolledBack();
  });

  it('rolls back both records and the first audit when the second audit is rejected', async () => {
    await pool.query('ALTER TABLE "AuditLog" ADD CONSTRAINT test_audit_failure CHECK ((details->>\'question\') IS DISTINCT FROM \'TEST second batch question\')');
    await expect(upsertKBBatch(facts, adminId)).rejects.toThrow();
    await assertRolledBack();
  });

  it('commits the complete retry with one audit per record and correct result counts', async () => {
    await pool.query('ALTER TABLE "AuditLog" ADD CONSTRAINT test_audit_failure CHECK ((details->>\'question\') IS DISTINCT FROM \'TEST second batch question\')');
    await expect(upsertKBBatch(facts, adminId)).rejects.toThrow();
    await assertRolledBack();
    await pool.query('ALTER TABLE "AuditLog" DROP CONSTRAINT test_audit_failure');
    const results = await upsertKBBatch(facts, adminId);
    expect(results.map(result => result.created)).toEqual([false, true]);
    expect((await pool.query('SELECT question, answer FROM "KnowledgeBase" ORDER BY question')).rows).toEqual(facts.map(({ question, answer }) => ({ question, answer })));
    const audits = (await pool.query('SELECT "adminId", action, "targetType", details FROM "AuditLog" ORDER BY id')).rows;
    expect(audits).toHaveLength(2);
    expect(audits.map(audit => audit.details.question)).toEqual([firstQuestion, secondQuestion]);
    expect(audits.every(audit => audit.adminId === adminId && audit.action === 'IMPORT_KNOWLEDGE_BASE' && audit.targetType === 'KnowledgeBase')).toBe(true);
  });

  it('preserves the standalone audited upsert and its rollback on missing administrator', async () => {
    await expect(upsertKB(facts[0]!, 'TEST-missing-admin')).rejects.toThrow();
    await assertRolledBack();
    expect(await upsertKB(facts[0]!, adminId)).toMatchObject({ id: 'TEST-existing', created: false });
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "AuditLog"')).rows[0].count).toBe(1);
  });

  it('handles the API maximum of fifty records and fifty audits in one batch', async () => {
    const batch = Array.from({ length: 50 }, (_, index) => ({ question: `TEST ONLY fifty-record batch ${index}`, answer: 'TEST ONLY batch capacity answer', tags: ['test'] }));
    const results = await upsertKBBatch(batch, adminId);
    expect(results).toHaveLength(50);
    expect(results.every(result => result.created)).toBe(true);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "KnowledgeBase"')).rows[0].count).toBe(51);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "AuditLog"')).rows[0].count).toBe(50);
  }, 40000);
});
