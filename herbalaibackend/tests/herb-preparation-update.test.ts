import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import type { PoolClient } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyPreparationPlan, assertPreparationTarget, buildPreparationPlan, genericPreparation,
  preparationDigest, preparationEmbeddingText, writePreparationBackup,
} from '../src/content/herb-preparation-update.js';

const batch = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-02.json', import.meta.url), 'utf8')) as {
  herbs: Array<{ id: string; localName: string; scientificName: string }>;
};
const target = { host: 'localhost', database: 'herbalai_test' };
const connectionUrl = 'postgresql://localhost/herbalai_test';
const now = new Date('2026-10-05T12:30:00.000Z');
const snapshots = () => batch.herbs.map(herb => ({
  ...herb, provenance: 'BUILT_IN', publicationStatus: 'PUBLISHED', isVerified: true,
  preparationMethod: genericPreparation, dosage: 'Original dosage note', warnings: 'Original safety warning',
  updatedAt: now.toISOString(), embedding: null, sources: [], imageUrl: '/images/qa-preserve.jpg',
  cebuanoName: 'Existing regional name', reviewedById: 'existing-reviewer', reviewedAt: now.toISOString(),
  evidenceClass: 'DOCUMENTED_TRADITIONAL_USE', category: 'TEST ONLY', medicinalUses: 'TEST ONLY no clinical claims',
}));
const plan = () => buildPreparationPlan(batch, snapshots(), target, now);
const directories: string[] = [];
const preparedRun = async () => {
  const reviewed = plan();
  const directory = await mkdtemp(path.join(tmpdir(), 'herbalai-prep-unit-'));
  directories.push(directory);
  const backupFile = path.join(directory, 'backup.json');
  await writePreparationBackup(reviewed, backupFile);
  const current = snapshots();
  const query = vi.fn(async (sql: string) => {
    if (sql.startsWith('SELECT id FROM "User"')) return { rowCount: 1, rows: [{ id: 'qa-reviewer' }] };
    if (sql.includes('to_jsonb(herb)')) return { rowCount: current.length, rows: current.map(({ sources: _sources, ...document }) => ({ document })) };
    if (sql.includes('to_jsonb(source)')) return { rowCount: current.flatMap(record => record.sources).length,
      rows: current.flatMap(record => record.sources.map(document => ({ document }))) };
    if (sql.includes('INSERT INTO "HerbSource"')) return { rowCount: 1, rows: [{ id: 101 }] };
    return { rowCount: 1, rows: [] };
  });
  const vectors = new Map(reviewed.records.map(record => [record.before.id, Array.from({ length: 768 }, () => 0.01)]));
  const options = { connectionUrl, independentlyConfirmedTarget: target, reviewedPlanSha256: preparationDigest(reviewed),
    backupFile, reviewerId: 'qa-reviewer', now };
  return { reviewed, current, query, client: { query } as unknown as PoolClient, vectors, options };
};

afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });

describe('existing-record preparation update boundaries', () => {
  it('targets exactly the twenty observed live placeholders, not the eighteen other preparation notes', () => {
    const audit = JSON.parse(readFileSync(new URL('../../Docs/research/LIVE_LIBRARY_PREPARATION_FOLLOW_UP_2026-10-05.json', import.meta.url), 'utf8')) as {
      productionWritesPerformed: boolean; counts: { published: number; genericPlaceholders: number; blankPreparations: number; otherPreparationNotes: number };
      records: Array<{ id: string; localName: string; scientificName: string; preparationMethod: string; genericPlaceholder: boolean; blankPreparation: boolean }>;
    };
    expect(audit.productionWritesPerformed).toBe(false);
    expect(audit.counts).toEqual({ published: 38, genericPlaceholders: 20, blankPreparations: 0, otherPreparationNotes: 18 });
    expect(audit.records).toHaveLength(38);
    const pending = audit.records.filter(record => record.genericPlaceholder);
    expect(pending.map(record => record.id).sort()).toEqual(batch.herbs.map(record => record.id).sort());
    for (const record of pending) {
      expect(record.preparationMethod).toBe(genericPreparation);
      expect(batch.herbs.find(herb => herb.id === record.id)).toMatchObject({ localName: record.localName, scientificName: record.scientificName });
    }
    expect(audit.records.some(record => record.blankPreparation)).toBe(false);
  });

  it('covers the twenty exact existing IDs without proposing publication or image changes', () => {
    const reviewed = plan();
    expect(reviewed.records).toHaveLength(20);
    for (const record of reviewed.records) {
      expect(Object.keys(record.changes).every(field => ['preparationMethod', 'dosage', 'warnings'].includes(field))).toBe(true);
      expect(record.changes.preparationMethod).not.toBe(genericPreparation);
      expect(record.sourceAdditions.some(source => source.supports.includes('preparationMethod'))).toBe(true);
      expect(record.before).toMatchObject({ imageUrl: '/images/qa-preserve.jpg', cebuanoName: 'Existing regional name', reviewedById: 'existing-reviewer' });
    }
  });

  it('does not replace unsupported warning or dosage fields merely because the batch contains text', () => {
    const oregano = plan().records.find(record => record.before.id === 'builtin-oregano')!;
    expect(oregano.changes).not.toHaveProperty('warnings');
    expect(oregano.changes).not.toHaveProperty('dosage');
    expect(preparationEmbeddingText(oregano)).toContain('Original safety warning');
    expect(preparationEmbeddingText(oregano)).toContain('Existing regional name');
    expect(preparationEmbeddingText(oregano)).toContain(oregano.changes.preparationMethod);
  });

  it('includes the sourced Mangosteen warning while keeping WHO support separate from preparation and dosage', () => {
    const mangosteen = plan().records.find(record => record.before.id === 'builtin-mangosteen')!;
    expect(mangosteen.changes.warnings).toContain('Seek immediate medical care');
    expect(mangosteen.changes).not.toHaveProperty('dosage');
    expect(mangosteen.sourceAdditions.find(source => source.url.includes('who.int'))?.supports).toEqual(['warnings']);
    expect(mangosteen.sourceAdditions.find(source => source.url.includes('nopr.niscpr.res.in'))?.supports).toEqual(['preparationMethod', 'warnings']);
    expect(preparationEmbeddingText(mangosteen)).toContain(mangosteen.changes.warnings);
    expect(mangosteen.before.imageUrl).toBe('/images/qa-preserve.jpg');
    expect(mangosteen.before.reviewedById).toBe('existing-reviewer');
  });

  it('refuses missing, duplicate, unpublished, contributor or already-edited records', () => {
    expect(() => buildPreparationPlan(batch, snapshots().slice(1), target, now)).toThrow(/exactly/);
    expect(() => buildPreparationPlan(batch, [...snapshots().slice(1), snapshots()[1]], target, now)).toThrow();
    for (const mutation of [{ publicationStatus: 'HOLD' }, { provenance: 'CONTRIBUTOR_APPROVED' },
      { preparationMethod: 'An administrator edited this.' }, { scientificName: 'Different species' }, { localName: 'Different local name' }]) {
      const current = snapshots();
      Object.assign(current[0]!, mutation);
      expect(() => buildPreparationPlan(batch, current, target, now)).toThrow();
    }
  });

  it('refuses missing citations and invalid source dates', () => {
    const missing = structuredClone(batch) as unknown as { herbs: Array<{ fieldSources: Record<string, string[]> }> };
    missing.herbs[0]!.fieldSources['preparationMethod'] = [];
    expect(() => buildPreparationPlan(missing, snapshots(), target, now)).toThrow(/citations/);
    const invalid = structuredClone(batch) as unknown as { sources: Record<string, { accessedAt: string }> };
    invalid.sources['ust-oregano']!.accessedAt = '2026-02-30';
    expect(() => buildPreparationPlan(invalid, snapshots(), target, now)).toThrow(/valid/);
  });

  it('matches pooled and direct forms of only the confirmed endpoint and database', () => {
    const confirmed = { host: 'ep-confirmed.c-8.us-east-1.aws.neon.tech', database: 'neondb' };
    expect(() => assertPreparationTarget('postgresql://ep-confirmed-pooler.c-8.us-east-1.aws.neon.tech/neondb', confirmed)).not.toThrow();
    expect(() => assertPreparationTarget('postgresql://ep-other.c-8.us-east-1.aws.neon.tech/neondb', confirmed)).toThrow(/target/);
    expect(() => assertPreparationTarget('postgresql://ep-confirmed.c-8.us-east-1.aws.neon.tech/other', confirmed)).toThrow(/target/);
    expect(() => assertPreparationTarget('https://ep-confirmed.c-8.us-east-1.aws.neon.tech/neondb', confirmed)).toThrow(/configuration/);
  });

  it('refuses a connection-string host override accepted by the installed pg parser without connecting', () => {
    const redirected = 'postgresql://localhost/herbalai_test?host=example.invalid';
    expect(new pg.Client({ connectionString: redirected }).host).toBe('example.invalid');
    expect(() => assertPreparationTarget(redirected, target)).toThrow();
  });

  it.each([
    'host', 'hostaddr', 'port', 'database', 'dbname', 'options', 'statement_timeout', 'query_timeout', 'connectionTimeoutMillis',
  ])('refuses query-string overrides of release identity or execution settings: %s', parameter => {
    expect(() => assertPreparationTarget(`postgresql://localhost/herbalai_test?${parameter}=0`, target)).toThrow();
  });

  it('refuses duplicate TLS options and fragments but accepts the normal Neon TLS parameters', () => {
    expect(() => assertPreparationTarget(`${connectionUrl}?sslmode=require&channel_binding=require`, target)).not.toThrow();
    expect(() => assertPreparationTarget(`${connectionUrl}?sslmode=require&sslmode=disable`, target)).toThrow();
    expect(() => assertPreparationTarget(`${connectionUrl}#unexpected`, target)).toThrow();
  });

  it('updates only preparation-related columns and appends sources and audit records inside one transaction', async () => {
    const run = await preparedRun();
    expect(await applyPreparationPlan(run.client, run.reviewed, run.vectors, run.options)).toMatchObject({ updated: 20 });
    const statements = run.query.mock.calls.map(call => call[0]);
    expect(statements[0]).toBe('BEGIN ISOLATION LEVEL SERIALIZABLE');
    expect(statements).toContain('COMMIT');
    expect(statements).not.toContain('ROLLBACK');
    expect(statements.filter(sql => sql.startsWith('UPDATE "Herb"'))).toHaveLength(20);
    for (const sql of statements.filter(sql => sql.startsWith('UPDATE "Herb"'))) {
      expect(sql).not.toMatch(/image|publicationStatus|reviewedById|isVerified|cebuanoName|medicinalUses/);
      expect(sql).toContain('::vector');
    }
    expect(statements.some(sql => /DELETE|TRUNCATE|UPSERT/i.test(sql))).toBe(false);
    expect(statements.filter(sql => sql.includes('INSERT INTO "AuditLog"'))).toHaveLength(20);
    expect(statements.filter(sql => sql.includes('FOR UPDATE'))).toHaveLength(2);
  });

  it('rejects stale, future or edited plans before opening a transaction', async () => {
    const run = await preparedRun();
    for (const date of ['2026-10-05T12:46:00.000Z', '2026-10-05T12:29:59.000Z']) {
      await expect(applyPreparationPlan(run.client, run.reviewed, run.vectors, { ...run.options, now: new Date(date) })).rejects.toThrow(/stale/);
    }
    const altered = structuredClone(run.reviewed);
    altered.records[0]!.changes.preparationMethod = 'An unreviewed replacement';
    await expect(applyPreparationPlan(run.client, altered, run.vectors, run.options)).rejects.toThrow(/reviewed/);
    expect(run.query).not.toHaveBeenCalled();
  });

  it('refuses absent backup or failed, nonfinite, wrong-dimension and fabricated-zero embeddings', async () => {
    const run = await preparedRun();
    await expect(applyPreparationPlan(run.client, run.reviewed, run.vectors, { ...run.options, backupFile: path.join(tmpdir(), 'missing-herbalai-backup.json') })).rejects.toThrow();
    for (const vector of [[], Array(768).fill(NaN), Array(767).fill(0.1), Array(768).fill(0)]) {
      const vectors = new Map(run.vectors);
      vectors.set(run.reviewed.records[0]!.before.id, vector);
      await expect(applyPreparationPlan(run.client, run.reviewed, vectors, run.options)).rejects.toThrow(/embedding/);
    }
    expect(run.query).not.toHaveBeenCalled();
    await expect(writePreparationBackup(run.reviewed, run.options.backupFile)).rejects.toThrow();
  });

  it.each(['preparationMethod', 'imageUrl', 'cebuanoName', 'reviewedById', 'embedding'])('rolls back a concurrent %s edit before any update', async field => {
    const run = await preparedRun();
    Object.assign(run.current[0]!, { [field]: 'Concurrent change' });
    await expect(applyPreparationPlan(run.client, run.reviewed, run.vectors, run.options)).rejects.toThrow(/Concurrent/);
    expect(run.query.mock.calls.some(call => call[0].startsWith('UPDATE'))).toBe(false);
    expect(run.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });

  it('rolls back when the review account is inactive', async () => {
    const run = await preparedRun();
    run.query.mockImplementationOnce(async () => ({ rowCount: 0, rows: [] }));
    run.query.mockImplementationOnce(async () => ({ rowCount: 0, rows: [] }));
    run.query.mockImplementationOnce(async () => ({ rowCount: 0, rows: [] }));
    run.query.mockImplementationOnce(async () => ({ rowCount: 0, rows: [] }));
    await expect(applyPreparationPlan(run.client, run.reviewed, run.vectors, run.options)).rejects.toThrow(/administrator/);
    expect(run.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });

  it('rolls back when a source write fails and never reports success', async () => {
    const run = await preparedRun();
    const original = run.query.getMockImplementation()!;
    run.query.mockImplementation(async sql => {
      if (sql.includes('INSERT INTO "HerbSource"')) throw new Error('TEST ONLY source failure');
      return original(sql);
    });
    await expect(applyPreparationPlan(run.client, run.reviewed, run.vectors, run.options)).rejects.toThrow(/source failure/);
    expect(run.query.mock.calls.some(call => call[0] === 'COMMIT')).toBe(false);
    expect(run.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });

  it('detects an added source and even a whitespace-only warning change after review', async () => {
    for (const mutation of [{ warnings: 'Original safety warning ' },
      { sources: [{ id: 12, herbId: batch.herbs[0]!.id, title: 'Concurrent source', supports: ['identity'] }] }]) {
      const run = await preparedRun();
      Object.assign(run.current[0]!, mutation);
      await expect(applyPreparationPlan(run.client, run.reviewed, run.vectors, run.options)).rejects.toThrow(/Concurrent/);
      expect(run.query.mock.calls.some(call => call[0].startsWith('UPDATE'))).toBe(false);
      expect(run.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    }
  });
});
