import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadHeldExpansionPlans } from '../prisma/load-herb-expansion-plans.js';
import { buildExpansionDraftImportPlan, buildExpansionDraftStageSql, expansionIdentitySnapshotSql,
  stageExpansionDrafts } from '../src/content/herb-expansion-draft-import.js';
import type { ExpansionDraftImportPlan } from '../src/content/herb-expansion-draft-import.js';
import { preparationDigest, validatePreparationConnectionUrl } from '../src/content/herb-preparation-update.js';

const connectionUrl = process.env['HERBALAI_TEST_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '';
const connection = validatePreparationConnectionUrl(connectionUrl);
if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname) || connection.pathname !== '/herbalai_test') {
  throw new Error('Draft import database tests require isolated loopback herbalai_test; never a provider database.');
}
const schema = `qa_expansion_${randomUUID().replaceAll('-', '')}`;
const pool = new pg.Pool({ connectionString: connectionUrl, max: 4, connectionTimeoutMillis: 2000,
  options: `-c search_path=${schema},public` });
const target = { host: connection.hostname, database: 'herbalai_test' };
let directory: string;
let plan: ExpansionDraftImportPlan;
const options = () => ({ connectionUrl, independentlyConfirmedTarget: target,
  reviewedPlanSha256: preparationDigest(plan), backupFile: path.join(directory, `backup-${randomUUID()}.json`),
  reviewerId: 'qa-import-admin' });
const counts = async () => {
  const result = await pool.query(`SELECT (SELECT COUNT(*)::int FROM "Herb") herbs,
    (SELECT COUNT(*)::int FROM "HerbSource") sources, (SELECT COUNT(*)::int FROM "AuditLog") audits`);
  return result.rows[0];
};

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'herbalai-draft-import-'));
  const { queue, plans } = await loadHeldExpansionPlans();
  plan = buildExpansionDraftImportPlan(queue, plans, target);
  await pool.query(`CREATE SCHEMA "${schema}"`);
  await pool.query(await readFile(new URL('./fixtures/herb-expansion-import.sql', import.meta.url), 'utf8'));
});
beforeEach(async () => {
  await pool.query('TRUNCATE "HerbSource", "Herb", "AuditLog", "SuggestedHerb", "User" RESTART IDENTITY CASCADE');
  await pool.query('INSERT INTO "User" (id, role) VALUES ($1, $2)', ['qa-import-admin', 'admin']);
});
afterAll(async () => {
  try { await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); }
  finally {
    await pool.end();
    if (directory && path.dirname(path.resolve(directory)) === path.resolve(tmpdir())
      && path.basename(directory).startsWith('herbalai-draft-import-')) await rm(directory, { recursive: true, force: true });
  }
});

describe('real PostgreSQL draft import transactions', () => {
  it('executes the credential-free SQL-editor script with the same private-draft restrictions', async () => {
    const identities = (await pool.query(expansionIdentitySnapshotSql)).rows[0].identities;
    const script = buildExpansionDraftStageSql(plan, { target, capturedAt: new Date().toISOString(), identities }, 'qa-import-admin');
    const result = await pool.query(script);
    const results = Array.isArray(result) ? result : [result];
    expect(results.at(-1)?.rows[0]).toEqual({ staged_drafts: 50, unexpectedly_published: 0, unexpectedly_embedded: 0 });
    expect((await counts()).herbs).toBe(50);
    expect((await counts()).audits).toBe(50);
  });

  it('rejects SQL-editor execution if the identity catalog changes after snapshot capture', async () => {
    const identities = (await pool.query(expansionIdentitySnapshotSql)).rows[0].identities;
    const script = buildExpansionDraftStageSql(plan, { target, capturedAt: new Date().toISOString(), identities }, 'qa-import-admin');
    await pool.query('INSERT INTO "SuggestedHerb" ("localName", "scientificName", status) VALUES ($1, $2, $3)',
      ['QA unrelated change', 'Testus fixture', 'Pending']);
    const client = await pool.connect();
    try { await expect(client.query(script)).rejects.toThrow('identity snapshot changed'); }
    finally { await client.query('ROLLBACK'); client.release(); }
    expect(await counts()).toEqual({ herbs: 0, sources: 0, audits: 0 });
  });

  it('treats quotes, backslashes and dollar-quote text as data, not executable SQL', async () => {
    const changed = structuredClone(plan);
    changed.rows[0]!.proposedData.preparationMethod += " QA literal ' \\ $herbalai_import_guard$ ; SELECT 1 / 0;";
    const identities = (await pool.query(expansionIdentitySnapshotSql)).rows[0].identities;
    await pool.query(buildExpansionDraftStageSql(changed, { target, capturedAt: new Date().toISOString(), identities }, 'qa-import-admin'));
    expect((await pool.query('SELECT "preparationMethod" FROM "Herb" WHERE id = $1', [changed.rows[0]!.proposedData.id])).rows[0].preparationMethod)
      .toBe(changed.rows[0]!.proposedData.preparationMethod);
  });

  it('rejects a saved SQL script when its snapshot expires before execution', async () => {
    const identities = (await pool.query(expansionIdentitySnapshotSql)).rows[0].identities;
    const capturedAt = '2020-01-01T00:00:00.000Z';
    const script = buildExpansionDraftStageSql(plan, { target, capturedAt, identities }, 'qa-import-admin', new Date(capturedAt));
    const client = await pool.connect();
    try { await expect(client.query(script)).rejects.toThrow('snapshot expired'); }
    finally { await client.query('ROLLBACK'); client.release(); }
    expect(await counts()).toEqual({ herbs: 0, sources: 0, audits: 0 });
  });

  it('inserts all fifty as private drafts with their exact preparation, source tags and audit gaps', async () => {
    const client = await pool.connect();
    const approval = options();
    try {
      await expect(stageExpansionDrafts(client, plan, approval)).resolves.toEqual({ staged: 50, published: 0,
        existingRecordsUpdated: 0, embeddingsGenerated: 0 });
    } finally { client.release(); }
    expect(await counts()).toEqual({ herbs: 50, sources: plan.rows.reduce((total, row) => total + row.proposedSources.length, 0), audits: 50 });
    const records = await pool.query('SELECT * FROM "Herb" ORDER BY id');
    for (const row of plan.rows) {
      const stored = records.rows.find(record => record.id === row.proposedData.id);
      expect(stored).toMatchObject({ preparationMethod: row.proposedData.preparationMethod, publicationStatus: 'DRAFT',
        evidenceClass: 'UNASSESSED', isVerified: false, isDohApproved: false, embedding: null,
        reviewedById: null, reviewedAt: null, regionFound: row.proposedData.regionFound ?? null });
    }
    const backup = JSON.parse(await readFile(approval.backupFile, 'utf8'));
    expect(backup.before).toEqual([]);
    expect(backup.plannedIds).toHaveLength(50);
  });

  it('rejects a repeat import without replacing records, sources or audit rows', async () => {
    const client = await pool.connect();
    try {
      await stageExpansionDrafts(client, plan, options());
      const before = await counts();
      await expect(stageExpansionDrafts(client, plan, options())).rejects.toThrow('conflicts');
      expect(await counts()).toEqual(before);
    } finally { client.release(); }
  });

  it('rolls back herbs, sources and audit rows after a real SQL error on the second herb', async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    let writes = 0;
    const failingClient = new Proxy(client, { get(original, property) {
      if (property !== 'query') return Reflect.get(original, property);
      return async (sql: string, parameters?: unknown[]) => sql.startsWith('INSERT INTO "Herb"') && ++writes === 2
        ? query('SELECT 1 / 0') : query(sql, parameters);
    } });
    try { await expect(stageExpansionDrafts(failingClient, plan, options())).rejects.toMatchObject({ code: '22012' }); }
    finally { client.release(); }
    expect(writes).toBe(2);
    expect(await counts()).toEqual({ herbs: 0, sources: 0, audits: 0 });
  });

  it('allows only one concurrent importer to insert the same fifty candidates', async () => {
    const clients = await Promise.all([pool.connect(), pool.connect()]);
    try {
      const results = await Promise.allSettled(clients.map(client => stageExpansionDrafts(client, plan, options())));
      expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    } finally { clients.forEach(client => client.release()); }
    expect((await counts()).herbs).toBe(50);
    expect((await counts()).audits).toBe(50);
  });

  it.each(['Pending', 'Rejected', 'Approved', 'ChangesRequested'])('detects conflicting suggestions in %s state before any insert', async status => {
    await pool.query('INSERT INTO "SuggestedHerb" ("localName", "scientificName", status) VALUES ($1, $2, $3)',
      ['QA alias', plan.rows[0]!.proposedData.scientificName, status]);
    const client = await pool.connect();
    try { await expect(stageExpansionDrafts(client, plan, options())).rejects.toThrow('conflicts'); }
    finally { client.release(); }
    expect(await counts()).toEqual({ herbs: 0, sources: 0, audits: 0 });
  });

  it('rejects a banned administrator and preserves the empty database', async () => {
    await pool.query('UPDATE "User" SET "isBanned" = true WHERE id = $1', ['qa-import-admin']);
    const client = await pool.connect();
    try { await expect(stageExpansionDrafts(client, plan, options())).rejects.toThrow('active administrator'); }
    finally { client.release(); }
    expect(await counts()).toEqual({ herbs: 0, sources: 0, audits: 0 });
  });

  it('rejects a changed digest or target before beginning database writes', async () => {
    const client = await pool.connect();
    try {
      await expect(stageExpansionDrafts(client, plan, { ...options(), reviewedPlanSha256: '0'.repeat(64) })).rejects.toThrow('digest changed');
      await expect(stageExpansionDrafts(client, plan, { ...options(), independentlyConfirmedTarget: { ...target, database: 'wrong' } })).rejects.toThrow();
    } finally { client.release(); }
    expect(await counts()).toEqual({ herbs: 0, sources: 0, audits: 0 });
  });

  it('aborts if the backup path already exists rather than replacing backup evidence', async () => {
    const client = await pool.connect();
    const approval = options();
    try {
      await stageExpansionDrafts(client, plan, approval);
      await pool.query('TRUNCATE "HerbSource", "Herb", "AuditLog" RESTART IDENTITY CASCADE');
      await expect(stageExpansionDrafts(client, plan, approval)).rejects.toMatchObject({ code: 'EEXIST' });
    } finally { client.release(); }
    expect(await counts()).toEqual({ herbs: 0, sources: 0, audits: 0 });
  });
});
