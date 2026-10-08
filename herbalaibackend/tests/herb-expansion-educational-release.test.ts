import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PoolClient } from 'pg';
import { educationalDoseBoundary, releaseEducationalDrafts, validateEducationalRelease } from '../src/content/herb-expansion-educational-release.js';
import { preparationDigest } from '../src/content/herb-preparation-update.js';

export const releaseFixture = () => ({ status: 'SOURCE_LIMITED_EDUCATIONAL_RELEASE',
  target: { host: '127.0.0.1', database: 'herbalai_test' }, preparedAt: new Date().toISOString(),
  clinicalValidation: false, medicinalInstructionsCleared: false, records: [{
    before: { id: 'builtin-expansion-03-pardo-098', localName: 'Duhat', scientificName: 'Syzygium cumini',
      category: 'Uncategorized', medicinalUses: 'Historical reports, not established treatment.',
      preparationMethod: 'Culinary use, not treatment: fruit is consumed as food.', dosage: 'No dose established in this review.',
      warnings: 'Food descriptions do not establish medicinal safety.', regionFound: 'Philippines, introduced listing.',
      imageUrl: 'https://res.cloudinary.com/dclqw6at7/image/upload/duhat.jpg',
      imageSourceUrl: 'https://www.inaturalist.org/observations/334663067', imageLicense: 'CC0 1.0',
      imageLicenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', publicationStatus: 'DRAFT',
      evidenceClass: 'UNASSESSED', isVerified: false, isDohApproved: false, reviewedAt: null, reviewedById: null, embedding: null },
    sources: [{ id: 1, herbId: 'builtin-expansion-03-pardo-098', title: 'Historical reference', url: 'https://www.gutenberg.org/files/26393/26393-h/26393-h.htm', supports: ['medicinalUses'] },
      { id: 2, herbId: 'builtin-expansion-03-pardo-098', title: 'Botanical food description', url: 'https://www.nparks.gov.sg/florafaunaweb/flora/3/1/3158', supports: ['identity', 'preparationMethod', 'warnings', 'regionFound'] }],
    category: 'Food-use descriptions', dosage: educationalDoseBoundary,
    identityEvidenceFile: 'HERB_FIRST_TEN_REVIEW_2026-10-05.json', mediaEvidenceFile: 'HERB_FIRST_TEN_PHOTOS_2026-10-05.json',
    identityAliases: { scientificSynonyms: ['Eugenia jambolana'], localAliases: ['Duhat'] },
    reviewNote: 'Source-limited educational content, not clinical clearance; no medicinal dose supplied.',
    acceptedIdentityChecked: true, sourceLimitedFoodDescriptionChecked: true,
    freshPhotoCheck: { checkedAt: new Date().toISOString(), scientificName: 'Syzygium cumini',
      observationId: 334663067, photoId: 607793783, taxon: 'Syzygium cumini', rank: 'species', quality: 'research',
      license: 'cc0', passed: true, candidateId: 'research-pardo-098' },
  }] });

describe('source-limited educational draft release', () => {
  it('retains sources without falsely tagging a medicinal dose or claiming clinical clearance', () => {
    const checked = validateEducationalRelease(releaseFixture());
    expect(checked.clinicalValidation).toBe(false);
    expect(checked.records[0]!.sources.some(source => source.supports.includes('dosage'))).toBe(false);
  });
  it.each(['publicationStatus', 'isVerified', 'isDohApproved', 'embedding', 'reviewedById'])('rejects already changed %s', field => {
    const raw = releaseFixture();
    (raw.records[0]!.before as Record<string, unknown>)[field] = field === 'isVerified' || field === 'isDohApproved' ? true : 'changed';
    expect(() => validateEducationalRelease(raw)).toThrow();
  });
  it('rejects invented medicinal doses, expired snapshots and altered photo identities', () => {
    const raw = releaseFixture();
    raw.records[0]!.dosage = 'Take 10 ml';
    expect(() => validateEducationalRelease(raw)).toThrow();
    const expired = releaseFixture(); expired.preparedAt = '2020-01-01T00:00:00.000Z';
    expect(() => validateEducationalRelease(expired)).toThrow('expired');
    const photo = releaseFixture(); photo.records[0]!.freshPhotoCheck.taxon = 'Another species';
    expect(() => validateEducationalRelease(photo)).toThrow('mismatch');
  });
  it('rejects missing source coverage, ownership conflicts and repeated record IDs', () => {
    const raw = releaseFixture(); raw.records[0]!.sources[1]!.supports = ['identity'];
    expect(() => validateEducationalRelease(raw)).toThrow('sources');
    const duplicate = releaseFixture(); duplicate.records.push(structuredClone(duplicate.records[0]!));
    expect(() => validateEducationalRelease(duplicate)).toThrow('Duplicate');
    const ownership = releaseFixture(); ownership.records[0]!.sources[0]!.herbId = 'builtin-expansion-03-pardo-005';
    expect(() => validateEducationalRelease(ownership)).toThrow('ownership');
  });
  it('requires the reviewed target and digest before any SQL', async () => {
    const plan = releaseFixture(); const query = vi.fn();
    await expect(releaseEducationalDrafts({ query } as unknown as PoolClient, plan, {
      connectionUrl: 'postgresql://test@127.0.0.1/herbalai_test', reviewedPlanSha256: 'changed', backupFile: 'backup.json', reviewerId: 'qa',
    })).rejects.toThrow('digest');
    expect(query).not.toHaveBeenCalled();
  });
  it('backs up exact rows and sources, commits once and rolls back when audit fails', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'educational-release-'));
    try {
      for (const failAudit of [false, true]) {
        const plan = releaseFixture(); const row = plan.records[0]!;
        const query = vi.fn(async (sql: string) => {
          if (sql.includes('current_database')) return { rows: [{ database: 'herbalai_test' }], rowCount: 1 };
          if (sql.includes('FROM "User"')) return { rows: [{ id: 'qa' }], rowCount: 1 };
          if (sql.includes('to_jsonb(herb)')) return { rows: [{ herb: row.before }], rowCount: 1 };
          if (sql.includes('to_jsonb(source)')) return { rows: row.sources.map(source => ({ source })), rowCount: 2 };
          if (sql.includes('UNION ALL')) return { rows: [], rowCount: 0 };
          if (sql.includes('WITH changes')) return { rows: [{ id: row.before.id }], rowCount: 1 };
          if (failAudit && sql.includes('INSERT INTO "AuditLog"')) throw new Error('audit failed');
          return { rows: [], rowCount: 0 };
        });
        const backupFile = path.join(directory, `backup-${failAudit}.json`);
        const result = releaseEducationalDrafts({ query } as unknown as PoolClient, plan, {
          connectionUrl: 'postgresql://test@127.0.0.1/herbalai_test', reviewedPlanSha256: preparationDigest(plan), backupFile, reviewerId: 'qa',
        });
        if (failAudit) await expect(result).rejects.toThrow('audit failed');
        else await expect(result).resolves.toMatchObject({ published: 1, clinicalValidation: false, embeddingsGenerated: 0 });
        expect(JSON.parse(await readFile(backupFile, 'utf8')).records).toEqual([row.before]);
        expect(query.mock.calls.some(([sql]) => sql === (failAudit ? 'ROLLBACK' : 'COMMIT'))).toBe(true);
      }
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
