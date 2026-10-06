import { PGlite } from '@electric-sql/pglite';
import { Role } from '@prisma/client';
import { vector } from '@electric-sql/pglite/vector';
import { mkdtemp, readFile, rmdir, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applySourceTagRelease, buildSourceTagReleasePlan, prepareSourceTagRelease, readSourceTagSnapshots, writeSourceTagBackup,
  SourceTagOutcomeUncertainError,
} from '../src/content/herb-preparation-source-tag-release.js';
import type { SourceTagApproval, SourceTagClient, SourceTagReleasePlan } from '../src/content/herb-preparation-source-tag-release.js';
import { preparationDigest } from '../src/content/herb-preparation-update.js';
import { fixtureTimestamp, initializeSourceTagFixture, resetSourceTagFixture, sourceTagIds, sourceTagReview } from './helpers/source-tag-fixture.js';

const projectRoot = path.resolve(import.meta.dirname, '..', '..');
const target = { host: '127.0.0.1', database: 'postgres', port: 5432 };
let database: PGlite;
let client: SourceTagClient;
let directory: string;
let plan: SourceTagReleasePlan;
let approval: SourceTagApproval;
const backups: string[] = [];

beforeAll(async () => {
  database = await PGlite.create({ extensions: { vector } });
  client = { connectionParameters: target, query: async (sql, values) => {
    const result = await database.query<Record<string, unknown>>(sql, values);
    return { rows: result.rows, rowCount: result.affectedRows ?? null };
  } };
  directory = await mkdtemp(path.join(os.tmpdir(), 'herbalai-source-tags-'));
  await client.query('CREATE EXTENSION vector');
  await initializeSourceTagFixture(client, true);
}, 60_000);

beforeEach(async () => {
  await resetSourceTagFixture(client, true);
  plan = buildSourceTagReleasePlan(sourceTagReview, await readSourceTagSnapshots(client, sourceTagIds), target, fixtureTimestamp);
  const backupFile = path.join(directory, `backup-${backups.length}.json`);
  backups.push(backupFile);
  await writeSourceTagBackup(projectRoot, backupFile, plan);
  approval = { connectionUrl: 'postgresql://test:test@127.0.0.1:5432/postgres', independentlyConfirmedTarget: target,
    reviewedPlanSha256: preparationDigest(plan), projectRoot, backupFile, reviewerId: 'qa-admin', now: fixtureTimestamp };
});

afterAll(async () => {
  if (database) await database.close();
  for (const filename of backups) await unlink(filename).catch(error => { if (error.code !== 'ENOENT') throw error; });
  if (directory) await rmdir(directory);
});

const assertUnchanged = async () => {
  expect(await readSourceTagSnapshots(client, sourceTagIds)).toEqual(plan.snapshots);
  expect((await client.query('SELECT count(*)::int AS total FROM "AuditLog"')).rows[0]?.total).toBe(0);
};
const wrappedClient = (intercept: SourceTagClient['query']): SourceTagClient => ({ connectionParameters: target, query: intercept });

describe('source-tag release with isolated PostgreSQL WASM SQL', () => {
  it('uses the application Role enum rather than a permissive text-role fixture', async () => {
    const result = await client.query('SELECT enum_range(null::"Role")::text[] AS roles');
    expect(result.rows[0]?.roles).toEqual(Object.values(Role));
  });

  it.each(['prepare', 'apply'] as const)('closes the transaction after a lost %s BEGIN acknowledgement', async mode => {
    const faulty = wrappedClient(async (sql, values) => {
      const result = await client.query(sql, values);
      if (sql.startsWith('BEGIN')) throw new Error('Simulated BEGIN acknowledgement loss');
      return result;
    });
    try {
      const operation = mode === 'prepare'
        ? prepareSourceTagRelease(faulty, sourceTagReview, target, fixtureTimestamp)
        : applySourceTagRelease(faulty, plan, approval);
      await expect(operation).rejects.toThrow('BEGIN acknowledgement loss');
      expect((await client.query('SHOW transaction_isolation')).rows[0]?.transaction_isolation).toBe('read committed');
      expect((await client.query('SHOW transaction_read_only')).rows[0]?.transaction_read_only).toBe('off');
      await assertUnchanged();
    } finally { await client.query('ROLLBACK'); }
  });

  it.each(['prepare', 'apply'] as const)('requires reconciliation after lost %s BEGIN and ROLLBACK acknowledgements', async mode => {
    const query = vi.fn(async (sql: string, values?: unknown[]) => {
      const result = await client.query(sql, values);
      if (sql.startsWith('BEGIN') || sql === 'ROLLBACK') throw new Error('Simulated transaction acknowledgement loss');
      return result;
    });
    try {
      const operation = mode === 'prepare'
        ? prepareSourceTagRelease(wrappedClient(query), sourceTagReview, target, fixtureTimestamp)
        : applySourceTagRelease(wrappedClient(query), plan, approval);
      await expect(operation).rejects.toMatchObject({ reconciliationRequired: true });
      expect(query.mock.calls.map(call => call[0])).toHaveLength(2);
      expect(query.mock.calls.at(-1)![0]).toBe('ROLLBACK');
    } finally { await client.query('ROLLBACK'); }
    await assertUnchanged();
  });

  it('captures a complete consistent read-only plan and leaves the connection outside a transaction', async () => {
    const query = vi.fn(client.query);
    expect(await prepareSourceTagRelease(wrappedClient(query), sourceTagReview, target, fixtureTimestamp)).toEqual(plan);
    expect(query.mock.calls[0]![0]).toBe('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    expect(query.mock.calls.at(-1)![0]).toBe('ROLLBACK');
    await assertUnchanged();
  });

  it('PostgreSQL rejects an attempted write during snapshot preparation', async () => {
    const faulty = wrappedClient(async (sql, values) => {
      if (sql.startsWith('SELECT current_database')) await client.query('UPDATE "HerbSource" SET supports = ARRAY[\'warnings\'] WHERE id = 21');
      return client.query(sql, values);
    });
    await expect(prepareSourceTagRelease(faulty, sourceTagReview, target, fixtureTimestamp)).rejects.toThrow('read-only');
    await assertUnchanged();
  });

  it('commits exactly three additive tags and two attributable audits, preserving all other fixture columns', async () => {
    const result = await applySourceTagRelease(client, plan, approval);
    expect(result.sourceCount).toBe(3);
    expect(result.auditIds).toHaveLength(2);
    const expected = structuredClone(plan.snapshots);
    for (const herb of expected) for (const source of herb.sources) if ([19, 20, 21].includes(source.id)) source.supports.push('preparationMethod');
    expect(await readSourceTagSnapshots(client, sourceTagIds)).toEqual(expected);
    const logs = await client.query('SELECT * FROM "AuditLog" ORDER BY id');
    for (const log of logs.rows) {
      expect(log.adminId).toBe('qa-admin');
      expect(log.action).toBe('UPDATE_HERB');
      expect(log.details).toMatchObject({ operation: 'PREPARATION_SOURCE_TAGS', changedFields: ['sourceSupports'], embeddingRefreshed: false });
    }
    expect(expected.flatMap(herb => herb.sources).find(source => source.id === 22)?.supports).toEqual(['warnings']);
    await expect(applySourceTagRelease(client, plan, approval)).rejects.toThrow('baseline changed');
    await expect(Promise.resolve().then(() => buildSourceTagReleasePlan(sourceTagReview, expected, target, fixtureTimestamp))).rejects.toThrow('already present');
    expect((await client.query('SELECT count(*)::int AS total FROM "AuditLog"')).rows[0]?.total).toBe(2);
  });

  it('rolls back every tag and the first audit when the second audit hits a real SQL error', async () => {
    let audits = 0;
    const faulty = wrappedClient(async (sql, values) => {
      if (sql.startsWith('INSERT INTO "AuditLog"') && ++audits === 2) return client.query('SELECT 1 / 0');
      return client.query(sql, values);
    });
    await expect(applySourceTagRelease(faulty, plan, approval)).rejects.toThrow('division by zero');
    await assertUnchanged();
  });

  it('rolls back earlier updates if a later conditional update affects zero rows', async () => {
    let updates = 0;
    const faulty = wrappedClient(async (sql, values) => {
      if (sql.startsWith('UPDATE "HerbSource"') && ++updates === 2) return client.query(sql, [values![0], -1, values![2], values![3]]);
      return client.query(sql, values);
    });
    await expect(applySourceTagRelease(faulty, plan, approval)).rejects.toThrow('exactly one');
    await assertUnchanged();
  });

  it.each([
    ['dosage', 'Changed dosage'], ['warnings', 'Changed warnings'], ['imageUrl', 'https://example.org/changed.jpg'],
    ['embedding', `[${Array(768).fill(0.9).join(',')}]`], ['cebuanoName', 'Changed alias'], ['imageLicense', 'Changed license'],
    ['updatedAt', '2026-10-06 08:30:00'],
  ])('rejects a stale full baseline after %s changes', async (field, value) => {
    await client.query(`UPDATE "Herb" SET "${field}" = $1 WHERE id = $2`, [value, sourceTagIds[0]]);
    const current = await readSourceTagSnapshots(client, sourceTagIds);
    await expect(applySourceTagRelease(client, plan, approval)).rejects.toThrow('baseline changed');
    expect(await readSourceTagSnapshots(client, sourceTagIds)).toEqual(current);
  });

  it.each(['title', 'citation', 'url', 'supports'])('rejects concurrent source %s edits before applying', async field => {
    await client.query(`UPDATE "HerbSource" SET "${field}" = $1 WHERE id = 21`, [field === 'supports' ? ['warnings'] : 'Changed reference']);
    const current = await readSourceTagSnapshots(client, sourceTagIds);
    await expect(applySourceTagRelease(client, plan, approval)).rejects.toThrow('baseline changed');
    expect(await readSourceTagSnapshots(client, sourceTagIds)).toEqual(current);
  });

  it('detects and rolls back a real trigger changing protected herb content', async () => {
    await client.query(`CREATE FUNCTION mutate_source_tag_fixture() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN UPDATE "Herb" SET dosage = 'Unexpected trigger rewrite' WHERE id = NEW."herbId"; RETURN NEW; END $$`);
    await client.query('CREATE TRIGGER mutate_source_tag_fixture AFTER UPDATE ON "HerbSource" FOR EACH ROW EXECUTE FUNCTION mutate_source_tag_fixture()');
    try {
      await expect(applySourceTagRelease(client, plan, approval)).rejects.toThrow('Protected');
      await assertUnchanged();
    } finally {
      await client.query('DROP TRIGGER mutate_source_tag_fixture ON "HerbSource"');
      await client.query('DROP FUNCTION mutate_source_tag_fixture()');
    }
  });

  it.each([['contributor', false], ['admin', true]])('rejects inactive reviewer role=%s banned=%s', async (role, banned) => {
    await client.query('UPDATE "User" SET role = $1, "isBanned" = $2', [role, banned]);
    await expect(applySourceTagRelease(client, plan, approval)).rejects.toThrow('active administrator');
    await assertUnchanged();
  });

  it.each([
    { ...target, host: 'localhost' }, { ...target, database: 'other' }, { ...target, port: 5433 },
  ])('rejects an independently confirmed target mismatch before BEGIN: %j', async changed => {
    const query = vi.fn(client.query);
    await expect(applySourceTagRelease(wrappedClient(query), plan, { ...approval, independentlyConfirmedTarget: changed })).rejects.toThrow('target');
    expect(query).not.toHaveBeenCalled();
  });

  it('binds the actual client, not just the supplied URL', async () => {
    const query = vi.fn(client.query);
    await expect(applySourceTagRelease({ connectionParameters: { ...target, port: 5433 }, query }, plan, approval)).rejects.toThrow('target');
    expect(query).not.toHaveBeenCalled();
  });

  it('checks the SQL database identity inside the transaction', async () => {
    const faulty = wrappedClient(async (sql, values) => sql.startsWith('SELECT current_database')
      ? { rows: [{ database: 'other' }], rowCount: 1 } : client.query(sql, values));
    await expect(applySourceTagRelease(faulty, plan, approval)).rejects.toThrow('database identity');
    await assertUnchanged();
  });

  it.each([-1, 15 * 60_000 + 1])('rejects future/stale plans (age %s)', async age => {
    await expect(applySourceTagRelease(client, plan, { ...approval, now: new Date(fixtureTimestamp.getTime() + age) })).rejects.toThrow('stale');
    await assertUnchanged();
  });

  it('rejects a tampered plan even if an obsolete digest is supplied', async () => {
    const changed = structuredClone(plan);
    changed.snapshots[0]!.dosage = 'Tampered dosage';
    await expect(applySourceTagRelease(client, changed, approval)).rejects.toThrow('digest');
    await assertUnchanged();
  });

  it('rejects a tampered recovery file', async () => {
    const backup = JSON.parse(await readFile(approval.backupFile, 'utf8'));
    backup.plan.snapshots[0].dosage = 'Tampered backup';
    await writeFile(approval.backupFile, JSON.stringify(backup));
    await expect(applySourceTagRelease(client, plan, approval)).rejects.toThrow('Recovery backup');
    await assertUnchanged();
  });

  it('refuses overwrite and in-repository recovery exports', async () => {
    await expect(writeSourceTagBackup(projectRoot, approval.backupFile, plan)).rejects.toThrow();
    await expect(writeSourceTagBackup(projectRoot, path.join(projectRoot, 'never-written-backup.json'), plan)).rejects.toThrow('outside');
    await assertUnchanged();
  });

  it('reports uncertain outcome if COMMIT succeeds but its acknowledgement is lost; never replays', async () => {
    const faulty = wrappedClient(async (sql, values) => {
      const result = await client.query(sql, values);
      if (sql === 'COMMIT') throw new Error('Simulated acknowledgement loss');
      return result;
    });
    await expect(applySourceTagRelease(faulty, plan, approval)).rejects.toBeInstanceOf(SourceTagOutcomeUncertainError);
    expect((await client.query('SELECT count(*)::int AS total FROM "AuditLog"')).rows[0]?.total).toBe(2);
    await expect(applySourceTagRelease(client, plan, approval)).rejects.toThrow('baseline changed');
  });

  it('requires reconciliation if rollback cannot be confirmed', async () => {
    const faulty = wrappedClient(async (sql, values) => {
      if (sql.startsWith('INSERT INTO "AuditLog"')) return client.query('SELECT 1 / 0');
      if (sql === 'ROLLBACK') throw new Error('Simulated rollback transport loss');
      return client.query(sql, values);
    });
    try {
      await expect(applySourceTagRelease(faulty, plan, approval)).rejects.toBeInstanceOf(SourceTagOutcomeUncertainError);
    } finally { await client.query('ROLLBACK'); }
    await assertUnchanged();
  });
});
