import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadHeldExpansionPlans } from '../prisma/load-herb-expansion-plans.js';
import { buildExpansionDraftImportPlan, stageExpansionDrafts } from '../src/content/herb-expansion-draft-import.js';
import { educationalDoseBoundary, releaseEducationalDrafts, validateEducationalRelease } from '../src/content/herb-expansion-educational-release.js';
import { preparationDigest, validatePreparationConnectionUrl } from '../src/content/herb-preparation-update.js';

const connectionUrl = process.env['HERBALAI_TEST_DATABASE_URL'] ?? '';
const connection = validatePreparationConnectionUrl(connectionUrl);
if (connection.hostname !== '127.0.0.1' || connection.pathname !== '/herbalai_test') throw new Error('Isolated loopback test database required.');
const schema = `qa_publish_${randomUUID().replaceAll('-', '')}`;
const pool = new pg.Pool({ connectionString: connectionUrl, max: 2, options: `-c search_path=${schema},public` });
const target = { host: connection.hostname, database: 'herbalai_test' };
let directory: string;
let plan: ReturnType<typeof validateEducationalRelease>;
const options = () => ({ connectionUrl, reviewedPlanSha256: preparationDigest(plan), reviewerId: 'qa-import-admin',
  backupFile: path.join(directory, `publish-${randomUUID()}.json`) });
const execute = async () => { const client = await pool.connect(); try { return await releaseEducationalDrafts(client, plan, options()); } finally { client.release(); } };

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'herbalai-educational-publish-'));
  await pool.query(`CREATE SCHEMA "${schema}"`);
  await pool.query(await readFile(new URL('./fixtures/herb-expansion-import.sql', import.meta.url), 'utf8'));
});
beforeEach(async () => {
  await pool.query('TRUNCATE "HerbSource", "Herb", "AuditLog", "SuggestedHerb", "User" RESTART IDENTITY CASCADE');
  await pool.query('INSERT INTO "User" (id, role) VALUES ($1, $2)', ['qa-import-admin', 'admin']);
  const { queue, plans } = await loadHeldExpansionPlans();
  const draft = buildExpansionDraftImportPlan(queue, plans, target);
  const client = await pool.connect();
  try { await stageExpansionDrafts(client, draft, { connectionUrl, independentlyConfirmedTarget: target,
    reviewedPlanSha256: preparationDigest(draft), backupFile: path.join(directory, `stage-${randomUUID()}.json`), reviewerId: 'qa-import-admin' }); }
  finally { client.release(); }
  const ids = draft.rows.slice(0, 10).map(row => row.proposedData.id);
  const herbs = (await pool.query('SELECT to_jsonb(herb) AS herb FROM "Herb" herb WHERE id = ANY($1::text[])', [ids])).rows.map(row => row.herb);
  const sources = (await pool.query('SELECT to_jsonb(source) AS source FROM "HerbSource" source WHERE "herbId" = ANY($1::text[]) ORDER BY id', [ids])).rows.map(row => row.source);
  const media = JSON.parse(await readFile(new URL('../../Docs/research/HERB_FIRST_TEN_PHOTOS_2026-10-05.json', import.meta.url), 'utf8'));
  plan = validateEducationalRelease({ status: 'SOURCE_LIMITED_EDUCATIONAL_RELEASE', target, preparedAt: new Date().toISOString(),
    clinicalValidation: false, medicinalInstructionsCleared: false, records: draft.rows.slice(0, 10).map(row => {
      const photo = media.photos.find((value: { candidateId: string }) => value.candidateId === row.candidateId);
      const photoId = Number(new URL(photo.assetUrl).pathname.split('/')[2]);
      return { before: herbs.find(herb => herb.id === row.proposedData.id), sources: sources.filter(source => source.herbId === row.proposedData.id),
        category: 'Food-use descriptions', dosage: educationalDoseBoundary, identityEvidenceFile: 'HERB_FIRST_TEN_REVIEW_2026-10-05.json',
        mediaEvidenceFile: 'HERB_FIRST_TEN_PHOTOS_2026-10-05.json', acceptedIdentityChecked: true, sourceLimitedFoodDescriptionChecked: true,
        identityAliases: { scientificSynonyms: queue.candidates.find(candidate => candidate.id === row.candidateId)!.scientificSynonyms,
          localAliases: queue.candidates.find(candidate => candidate.id === row.candidateId)!.localAliases },
        reviewNote: 'Isolated test fixture. Descriptive food use, not medical validation.', freshPhotoCheck: {
          checkedAt: new Date().toISOString(), scientificName: row.proposedData.scientificName, observationId: photo.observationId,
          photoId, taxon: row.proposedData.scientificName, rank: 'species', quality: 'research', license: 'cc0', passed: true, candidateId: row.candidateId,
        } };
    }) });
});
afterAll(async () => {
  try { await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); }
  finally { await pool.end(); await rm(directory, { recursive: true, force: true }); }
});

describe('educational publication transactions', () => {
  it('publishes exactly ten, retains forty drafts and all original preparation/source text', async () => {
    await expect(execute()).resolves.toEqual({ published: 10, clinicalValidation: false, embeddingsGenerated: 0 });
    const counts = (await pool.query(`SELECT COUNT(*) FILTER (WHERE "publicationStatus" = 'PUBLISHED')::int AS published,
      COUNT(*) FILTER (WHERE "publicationStatus" = 'DRAFT')::int AS drafts, COUNT(*) FILTER (WHERE embedding IS NOT NULL)::int AS embedded FROM "Herb"`)).rows[0];
    expect(counts).toEqual({ published: 10, drafts: 40, embedded: 0 });
    for (const row of plan.records) expect((await pool.query('SELECT "preparationMethod" FROM "Herb" WHERE id = $1', [row.before.id])).rows[0].preparationMethod).toBe(row.before.preparationMethod);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "HerbSource"')).rows[0].count).toBe(193);
  });
  it('rejects a second publication without changing its sources or audit history', async () => {
    await execute(); await expect(execute()).rejects.toThrow('changed');
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "AuditLog"')).rows[0].count).toBe(60);
  });
  it('rejects changed content and source provenance', async () => {
    await pool.query('UPDATE "HerbSource" SET title = $1 WHERE id = $2', ['changed reference', plan.records[0]!.sources[0]!.id]);
    await expect(execute()).rejects.toThrow('changed');
    expect((await pool.query(`SELECT COUNT(*)::int AS count FROM "Herb" WHERE "publicationStatus" = 'PUBLISHED'`)).rows[0].count).toBe(0);
  });
  it('rejects inactive administrators and conflicts in rejected suggestions', async () => {
    await pool.query('UPDATE "User" SET "isBanned" = true'); await expect(execute()).rejects.toThrow('administrator');
    await pool.query('UPDATE "User" SET "isBanned" = false');
    await pool.query('INSERT INTO "SuggestedHerb" ("localName", "scientificName", status) VALUES ($1, $2, $3)', ['Another label', 'Syzygium cumini', 'Rejected']);
    await expect(execute()).rejects.toThrow('Conflicting');
  });
  it('rolls back publication when the audit write fails', async () => {
    await pool.query(`ALTER TABLE "AuditLog" ADD CONSTRAINT block_publication CHECK (action <> 'PUBLISH_EDUCATIONAL_HERB')`);
    try { await expect(execute()).rejects.toThrow('block_publication'); }
    finally { await pool.query('ALTER TABLE "AuditLog" DROP CONSTRAINT block_publication'); }
    expect((await pool.query(`SELECT COUNT(*)::int AS count FROM "Herb" WHERE "publicationStatus" = 'PUBLISHED'`)).rows[0].count).toBe(0);
  });
});
