import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { adminEditDatabaseBoundary } from './helpers/admin-edit-database-boundary.js';

const review = JSON.parse(await readFile(new URL('../content/herbs/verified-source-links-2026-10-15.json', import.meta.url), 'utf8')) as {
  verified: Array<{ scientificName: string; url: string }>;
  requiresReview: Array<{ scientificName: string }>;
  reviewNotice: string;
};
const migration = await readFile(new URL('../prisma/migrations/20261015140000_precise_stuart_source_links/migration.sql', import.meta.url), 'utf8');
const connectionUrl = process.env['HERBALAI_TEST_DATABASE_URL'];
const enabled = adminEditDatabaseBoundary(connectionUrl, process.env['DATABASE_URL'], Boolean(process.env['CI']));
const publisher = 'StuartXchange / Philippine Ethnobotanical Compendium';
const title = (name: string) => `StuartXchange Philippine Medicinal Plants (${name})`;
const species = [...review.verified, ...review.requiresReview];
const originalCitation = 'Historical citation, retained verbatim.';
let database: pg.Client;

describe('StuartXchange source review manifest', () => {
  it('accounts for every imported reference without overlapping verified and unverified species', () => {
    expect(review.verified).toHaveLength(83);
    expect(review.requiresReview).toHaveLength(17);
    expect(new Set(species.map(item => item.scientificName)).size).toBe(100);
    for (const source of review.verified) {
      const url = new URL(source.url);
      expect(url.protocol).toBe('https:');
      expect(['www.stuartxchange.org', 'stuartxchange.org']).toContain(url.hostname);
      expect(url.pathname).not.toBe('/');
    }
    expect(review.reviewNotice).toContain('not verified');
    expect(review.reviewNotice).toContain('https://www.stuartxchange.org');
  });
});

describe.skipIf(!enabled)('StuartXchange URL migration on disposable PostgreSQL tables', () => {
  beforeAll(async () => {
    database = new pg.Client({ connectionString: connectionUrl });
    await database.connect();
    await database.query('BEGIN');
    await database.query('SET LOCAL search_path TO pg_temp, public');
    await database.query('CREATE TEMP TABLE "Herb" (id TEXT PRIMARY KEY, "scientificName" TEXT NOT NULL, clinical JSONB, flags JSONB) ON COMMIT DROP');
    await database.query('CREATE TEMP TABLE "HerbSource" (id INTEGER PRIMARY KEY, "herbId" TEXT NOT NULL, title TEXT NOT NULL, publisher TEXT, url TEXT, citation TEXT, supports TEXT[], "accessedAt" TIMESTAMPTZ) ON COMMIT DROP');
  });
  beforeEach(async () => {
    await database.query('TRUNCATE pg_temp."Herb", pg_temp."HerbSource"');
    for (const [index, item] of species.entries()) {
      await database.query('INSERT INTO pg_temp."Herb" VALUES ($1,$2,$3,$4)', [
        `TEST-${index}`, item.scientificName,
        { medicinalUses: 'TEST original use', preparationMethod: 'TEST original preparation', dosage: 'TEST original dose', warnings: 'TEST original warning' },
        { publicationStatus: 'PUBLISHED', isVerified: true, evidenceClass: 'DOCUMENTED_TRADITIONAL_USE' },
      ]);
      await database.query('INSERT INTO pg_temp."HerbSource" VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [
        index + 1, `TEST-${index}`, title(item.scientificName), publisher, 'https://www.stuartxchange.org',
        originalCitation, ['medicinalUses', 'preparationMethod', 'dosage'], '2026-10-10',
      ]);
    }
  });
  afterAll(async () => {
    if (!database) return;
    try { await database.query('ROLLBACK'); } finally { await database.end(); }
  });

  it('changes only reference URLs and dated review notes while preserving clinical content and source provenance', async () => {
    const herbsBefore = (await database.query('SELECT * FROM pg_temp."Herb" ORDER BY id')).rows;
    const sourcesBefore = (await database.query('SELECT * FROM pg_temp."HerbSource" ORDER BY id')).rows;
    await database.query(migration);
    const after = (await database.query('SELECT * FROM pg_temp."HerbSource" ORDER BY id')).rows;
    for (const [index, before] of sourcesBefore.entries()) {
      const source = species[index]!;
      const verified = review.verified.find(item => item.scientificName === source.scientificName);
      expect(after[index]).toEqual({ ...before, url: verified?.url ?? null,
        citation: verified ? before.citation : `${originalCitation}\n${review.reviewNotice}` });
    }
    expect((await database.query('SELECT * FROM pg_temp."Herb" ORDER BY id')).rows).toEqual(herbsBefore);
  });

  it('is idempotent without duplicating review notices', async () => {
    await database.query(migration);
    const before = (await database.query('SELECT * FROM pg_temp."HerbSource" ORDER BY id')).rows;
    await database.query(migration);
    expect((await database.query('SELECT * FROM pg_temp."HerbSource" ORDER BY id')).rows).toEqual(before);
  });

  it('preserves precise links, different publishers, different titles, unknown species and historical references', async () => {
    const name = species[0]!.scientificName;
    await database.query('INSERT INTO pg_temp."Herb" VALUES ($1,$2,$3,$4)', ['TEST-other', 'Other species', {}, {}]);
    const records = [
      ['TEST-0', title(name), publisher, 'https://www.stuartxchange.org/already-reviewed-page'],
      ['TEST-0', title(name), 'Different publisher', 'https://www.stuartxchange.org'],
      ['TEST-0', 'Different source title', publisher, 'https://www.stuartxchange.org'],
      ['TEST-other', title('Other species'), publisher, 'https://www.stuartxchange.org'],
      ['TEST-0', 'PITAHC Directory of Herbs', 'PITAHC', null],
    ];
    for (const [index, record] of records.entries()) {
      await database.query('INSERT INTO pg_temp."HerbSource" (id,"herbId",title,publisher,url,citation,supports) VALUES ($1,$2,$3,$4,$5,$6,$7)', [1001 + index, ...record, originalCitation, ['identity']]);
    }
    const before = (await database.query('SELECT * FROM pg_temp."HerbSource" WHERE id>1000 ORDER BY id')).rows;
    await database.query(migration);
    expect((await database.query('SELECT * FROM pg_temp."HerbSource" WHERE id>1000 ORDER BY id')).rows).toEqual(before);
  });

  it.each([null, ''])('records the review reason when an original citation is %s', async citation => {
    const id = review.verified.length + 1;
    await database.query('UPDATE pg_temp."HerbSource" SET citation=$1 WHERE id=$2', [citation, id]);
    await database.query(migration);
    expect((await database.query('SELECT url,citation FROM pg_temp."HerbSource" WHERE id=$1', [id])).rows[0])
      .toEqual({ url: null, citation: review.reviewNotice });
  });

  it('handles reviewed homepage variants and keeps the notice singular', async () => {
    const id = review.verified.length + 1;
    await database.query('UPDATE pg_temp."HerbSource" SET citation=$1,url=$2 WHERE id=$3', [review.reviewNotice, 'https://stuartxchange.org/', id]);
    await database.query('UPDATE pg_temp."HerbSource" SET url=$1 WHERE id=1', ['https://www.stuartxchange.org/']);
    await database.query(migration);
    expect((await database.query('SELECT url,citation FROM pg_temp."HerbSource" WHERE id=$1', [id])).rows[0])
      .toEqual({ url: null, citation: review.reviewNotice });
    expect((await database.query('SELECT url FROM pg_temp."HerbSource" WHERE id=1')).rows[0].url).toBe(review.verified[0]!.url);
  });
});
