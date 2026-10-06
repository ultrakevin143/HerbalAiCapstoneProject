import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyPreparationPlan, buildPreparationPlan, genericPreparation, preparationDigest,
  readPreparationSnapshots, validatePreparationConnectionUrl, writePreparationBackup } from '../src/content/herb-preparation-update.js';
import { preparationPoolOptions, readOnlyPreparationPlan } from '../src/content/herb-preparation-release.js';

const connectionUrl = process.env['DATABASE_URL'] ?? '';
const connection = validatePreparationConnectionUrl(connectionUrl);
if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname) || connection.pathname !== '/herbalai_test') {
  throw new Error('Preparation transaction tests require the isolated loopback herbalai_test database; never a provider database.');
}
const pool = new pg.Pool({ ...preparationPoolOptions(connectionUrl), max: 4, connectionTimeoutMillis: 2000 });
const suffix = randomUUID();
const reviewerId = `qa-preparation-${suffix}`;
const target = { host: connection.hostname, database: 'herbalai_test' };
const createdIds: string[] = [];
let directory: string;

const fixture = async () => {
  const id = `builtin-qa-preparation-${randomUUID()}`;
  createdIds.push(id);
  const client = await pool.connect();
  try {
    await client.query(`INSERT INTO "Herb" (id, "localName", "scientificName", category, "medicinalUses", "preparationMethod", dosage, warnings,
      "isVerified", "publicationStatus", provenance, "imageUrl", "cebuanoName", "reviewedById", "reviewedAt", "updatedAt", embedding)
      VALUES ($1, 'TEST ONLY preparation', 'TEST ONLY fixture species', 'QA only', 'No medicinal claims', $2, 'Original dosage', 'Original warning',
      true, 'PUBLISHED', 'BUILT_IN', '/images/qa-preserved.jpg', 'QA regional name', $3, NOW(), NOW(), $4::vector)`,
    [id, genericPreparation, reviewerId, `[${Array(768).fill(0.02).join(',')}]`]);
    await client.query(`INSERT INTO "HerbSource" ("herbId", title, supports) VALUES ($1, 'TEST ONLY original source', ARRAY['identity'])`, [id]);
    const snapshots = await readPreparationSnapshots(client, [id]);
    const batch = { status: 'DRAFT', preparedAt: '2026-10-05',
      sources: { qa: { title: 'TEST ONLY source', publisher: 'QA fixture', url: 'https://example.invalid/qa', retrievalNote: 'No medicinal instructions. Test only.' } },
      herbs: [{ id, localName: 'TEST ONLY preparation', scientificName: 'TEST ONLY fixture species',
        preparationMethod: 'TEST ONLY changed description; no medicinal instructions.', dosage: 'Uncited dosage must remain unchanged',
        warnings: 'Uncited warning must remain unchanged', fieldSources: { preparationMethod: ['qa'] }, reviewGaps: ['TEST ONLY unreviewed fixture'] }] };
    const plan = buildPreparationPlan(batch, snapshots, target);
    const backupFile = path.join(directory, `${id}.json`);
    await writePreparationBackup(plan, backupFile);
    return { id, batch, plan, vectors: new Map([[id, Array(768).fill(0.03)]]), options: { connectionUrl,
      independentlyConfirmedTarget: target, reviewedPlanSha256: preparationDigest(plan), backupFile, reviewerId } };
  } finally { client.release(); }
};

describe('selective preparation PostgreSQL isolation and rollback', () => {
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'herbalai-prep-db-'));
    await pool.query(`INSERT INTO "User" (id, username, email, password, name, role)
      VALUES ($1, $2, $3, 'TEST ONLY not a login hash', 'TEST ONLY preparation reviewer', 'admin')`,
    [reviewerId, `qa_prep_${suffix}`, `${suffix}@example.invalid`]);
  });
  afterAll(async () => {
    try {
      await pool.query('DELETE FROM "AuditLog" WHERE "adminId" = $1', [reviewerId]);
      await pool.query('DELETE FROM "Herb" WHERE id = ANY($1::text[])', [createdIds]);
      await pool.query('DELETE FROM "User" WHERE id = $1', [reviewerId]);
      if (directory) await rm(directory, { recursive: true, force: true });
    } finally { await pool.end(); }
  });

  it('preserves images, names, reviewers, uncited fields and original sources while refreshing the vector and audit record', async () => {
    const run = await fixture();
    const client = await pool.connect();
    try {
      const outcome = await applyPreparationPlan(client, run.plan, run.vectors, run.options);
      expect(outcome.updated).toBe(1);
      expect(outcome.insertedSourceIds).toHaveLength(1);
      const rows = await client.query('SELECT *, embedding::text AS "vectorText" FROM "Herb" WHERE id = $1', [run.id]);
      expect(rows.rows[0]).toMatchObject({ preparationMethod: run.plan.records[0]!.changes.preparationMethod,
        dosage: 'Original dosage', warnings: 'Original warning', imageUrl: '/images/qa-preserved.jpg', cebuanoName: 'QA regional name',
        reviewedById: reviewerId, provenance: 'BUILT_IN', publicationStatus: 'PUBLISHED', isVerified: true });
      expect(rows.rows[0].vectorText).toBe(`[${Array(768).fill(0.03).join(',')}]`);
      expect((await client.query('SELECT title FROM "HerbSource" WHERE "herbId" = $1 ORDER BY id', [run.id])).rows.map(row => row.title))
        .toEqual(['TEST ONLY original source', 'TEST ONLY source']);
      expect((await client.query('SELECT action FROM "AuditLog" WHERE "targetId" = $1', [run.id])).rows).toEqual([{ action: 'UPDATE_HERB' }]);
    } finally { client.release(); }
  });

  it('rolls back all fields and source inserts when the subsequent audit write fails', async () => {
    const run = await fixture();
    const client = await pool.connect();
    const query = client.query.bind(client);
    try {
      const failingClient = new Proxy(client, { get(original, property) {
        if (property !== 'query') return Reflect.get(original, property);
        return async (sql: string, parameters: unknown[]) => {
          if (sql.includes('INSERT INTO "AuditLog"')) throw new Error('TEST ONLY audit failure');
          return query(sql, parameters);
        };
      } });
      await expect(applyPreparationPlan(failingClient, run.plan, run.vectors, run.options)).rejects.toThrow(/audit failure/);
      const restored = await readPreparationSnapshots(client, [run.id]);
      expect(restored).toEqual([run.plan.records[0]!.before]);
      expect((await client.query('SELECT id FROM "AuditLog" WHERE "targetId" = $1', [run.id])).rowCount).toBe(0);
    } finally { client.release(); }
  });

  it('refuses a source change made after the snapshot without changing preparation', async () => {
    const run = await fixture();
    await pool.query(`INSERT INTO "HerbSource" ("herbId", title, supports) VALUES ($1, 'TEST ONLY concurrent source', ARRAY['warnings'])`, [run.id]);
    const client = await pool.connect();
    try {
      await expect(applyPreparationPlan(client, run.plan, run.vectors, run.options)).rejects.toThrow(/Concurrent/);
      expect((await client.query('SELECT "preparationMethod" FROM "Herb" WHERE id = $1', [run.id])).rows[0].preparationMethod).toBe(genericPreparation);
      expect((await client.query('SELECT id FROM "HerbSource" WHERE "herbId" = $1', [run.id])).rowCount).toBe(2);
    } finally { client.release(); }
  });

  it('allows exactly one of two concurrent applications of the same reviewed snapshot', async () => {
    const run = await fixture();
    const clients = await Promise.all([pool.connect(), pool.connect()]);
    try {
      const outcomes = await Promise.allSettled(clients.map(client => applyPreparationPlan(client, run.plan, run.vectors, run.options)));
      expect(outcomes.filter(outcome => outcome.status === 'fulfilled')).toHaveLength(1);
      expect(outcomes.filter(outcome => outcome.status === 'rejected')).toHaveLength(1);
      expect((await pool.query('SELECT id FROM "AuditLog" WHERE "targetId" = $1', [run.id])).rowCount).toBe(1);
      expect((await pool.query('SELECT id FROM "HerbSource" WHERE "herbId" = $1', [run.id])).rowCount).toBe(2);
    } finally { clients.forEach(client => client.release()); }
  });

  it('rolls back both records and their sources and audit rows after a real PostgreSQL error on the second audit', async () => {
    const runs = await Promise.all([fixture(), fixture()]);
    const first = runs[0]!;
    const plan = buildPreparationPlan({ ...first.batch, herbs: runs.flatMap(run => run.batch.herbs) },
      runs.map(run => run.plan.records[0]!.before), target);
    const backupFile = path.join(directory, `combined-${randomUUID()}.json`);
    await writePreparationBackup(plan, backupFile);
    const vectors = new Map(runs.map(run => [run.id, run.vectors.get(run.id)!]));
    const client = await pool.connect();
    const query = client.query.bind(client);
    let auditWrites = 0;
    try {
      const failingClient = new Proxy(client, { get(original, property) {
        if (property !== 'query') return Reflect.get(original, property);
        return async (sql: string, parameters?: unknown[]) => {
          if (sql.includes('INSERT INTO "AuditLog"') && ++auditWrites === 2) return query('SELECT 1 / 0');
          return query(sql, parameters);
        };
      } });
      await expect(applyPreparationPlan(failingClient, plan, vectors, {
        ...first.options, backupFile, reviewedPlanSha256: preparationDigest(plan),
      })).rejects.toMatchObject({ code: '22012' });
      expect(auditWrites).toBe(2);
      for (const run of runs) {
        expect(await readPreparationSnapshots(client, [run.id])).toEqual([run.plan.records[0]!.before]);
        expect((await query('SELECT id FROM "AuditLog" WHERE "targetId" = $1', [run.id])).rowCount).toBe(0);
      }
    } finally { client.release(); }
  });

  it('refuses a banned reviewer and leaves the reviewed snapshot intact', async () => {
    const run = await fixture();
    const client = await pool.connect();
    try {
      await pool.query('UPDATE "User" SET "isBanned" = true WHERE id = $1', [reviewerId]);
      await expect(applyPreparationPlan(client, run.plan, run.vectors, run.options)).rejects.toThrow(/administrator/);
      expect(await readPreparationSnapshots(client, [run.id])).toEqual([run.plan.records[0]!.before]);
      expect((await client.query('SELECT id FROM "AuditLog" WHERE "targetId" = $1', [run.id])).rowCount).toBe(0);
    } finally {
      client.release();
      await pool.query('UPDATE "User" SET "isBanned" = false WHERE id = $1', [reviewerId]);
    }
  });

  it('keeps the old source and herb state in one real repeatable-read snapshot during a concurrent committed edit', async () => {
    const run = await fixture();
    const client = await pool.connect();
    const query = client.query.bind(client);
    const catalog: Array<{ id: string; localName: string; scientificName: string }> = [];
    let changed = false;
    try {
      const snapshotClient = new Proxy(client, { get(original, property) {
        if (property !== 'query') return Reflect.get(original, property);
        return async (sql: string, parameters?: unknown[]) => {
          const result = await query(sql, parameters);
          if (sql.startsWith('SELECT id,')) catalog.push(...result.rows);
          if (sql.includes('to_jsonb(herb)')) {
            const writer = await pool.connect();
            try {
              await writer.query('BEGIN');
              await writer.query('UPDATE "Herb" SET warnings = $1 WHERE id = $2', ['TEST ONLY concurrent warning', run.id]);
              await writer.query(`INSERT INTO "HerbSource" ("herbId", title, supports) VALUES ($1, 'TEST ONLY concurrent committed source', ARRAY['warnings'])`, [run.id]);
              await writer.query('COMMIT');
              changed = true;
            } catch (error) {
              await writer.query('ROLLBACK');
              throw error;
            } finally { writer.release(); }
          }
          return result;
        };
      } });
      const snapshot = await readOnlyPreparationPlan(snapshotClient, run.batch, target, catalog);
      expect(changed).toBe(true);
      expect(snapshot.records[0]!.before).toEqual(run.plan.records[0]!.before);
      const current = await readPreparationSnapshots(client, [run.id]);
      expect(current[0]).toMatchObject({ warnings: 'TEST ONLY concurrent warning' });
      expect((await client.query('SELECT id FROM "HerbSource" WHERE "herbId" = $1', [run.id])).rowCount).toBe(2);
      expect((await client.query('SELECT id FROM "AuditLog" WHERE "targetId" = $1', [run.id])).rowCount).toBe(0);
    } finally { client.release(); }
  });

  it('enforces READ ONLY in PostgreSQL and leaves the connection usable after rejecting an accidental write', async () => {
    const run = await fixture();
    const client = await pool.connect();
    const query = client.query.bind(client);
    const catalog: Array<{ id: string; localName: string; scientificName: string }> = [];
    try {
      const readOnlyClient = new Proxy(client, { get(original, property) {
        if (property !== 'query') return Reflect.get(original, property);
        return async (sql: string, parameters?: unknown[]) => {
          if (sql.includes('to_jsonb(source)')) await query('UPDATE "Herb" SET warnings = $1 WHERE id = $2', ['TEST ONLY forbidden write', run.id]);
          const result = await query(sql, parameters);
          if (sql.startsWith('SELECT id,')) catalog.push(...result.rows);
          return result;
        };
      } });
      await expect(readOnlyPreparationPlan(readOnlyClient, run.batch, target, catalog)).rejects.toMatchObject({ code: '25006' });
      expect(await readPreparationSnapshots(client, [run.id])).toEqual([run.plan.records[0]!.before]);
    } finally { client.release(); }
  });
});
