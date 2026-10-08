import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { expansionQueueSchema, findIdentityConflicts } from '../src/content/herb-expansion-review.js';
import { genericPreparation, preparationDigest, preparationPlanSchema } from '../src/content/herb-preparation-update.js';
import { herbSourceAccessedAt } from '../src/content/built-in-herb-fields.js';

const snapshot = JSON.parse(readFileSync(new URL('../../Docs/research/NEON_HERB_IDENTITY_SNAPSHOT_2026-10-06.json', import.meta.url), 'utf8'));
const review = JSON.parse(readFileSync(new URL('../../Docs/research/HERB_PREPARATION_PUBLIC_FIELD_REVIEW_2026-10-06.json', import.meta.url), 'utf8'));
const batch = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-02.json', import.meta.url), 'utf8'));
const rawQueue = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-03.review.json', import.meta.url), 'utf8'));
const queue = expansionQueueSchema.parse(rawQueue);

interface IdentityRow {
  recordType: string;
  id: string;
  localName: string;
  scientificName: string;
  sourceScientificName: string | null;
  cebuanoName: string | null;
  status: string;
  isVerified: boolean | null;
}

const rows: IdentityRow[] = snapshot.rows.map((row: unknown[]) => Object.fromEntries(snapshot.columns.map((column: string, index: number) => [column, row[index]])));
const identities = rows.map(row => ({
  id: row.id, localName: row.localName, scientificName: row.scientificName,
  sourceScientificName: row.sourceScientificName,
  localAliases: (row.cebuanoName ?? '').split(/[,/]/).map(value => value.trim()).filter(Boolean),
}));

describe('dated live preparation public-field review', () => {
  it('keeps a complete, table-qualified identity snapshot without credentials', () => {
    expect(snapshot.scope).toBe('ALL_HERB_AND_SUGGESTION_STATES_IDENTITY_ONLY');
    expect(snapshot.columns).toHaveLength(8);
    expect(snapshot.rows.every((row: unknown[]) => row.length === snapshot.columns.length)).toBe(true);
    expect(rows).toHaveLength(55);
    expect(rows.filter(row => row.recordType === 'Herb')).toHaveLength(38);
    expect(rows.filter(row => row.recordType === 'SuggestedHerb')).toHaveLength(17);
    expect(new Set(rows.map(row => `${row.recordType}:${row.id}`)).size).toBe(55);
    expect(rows.filter(row => row.recordType === 'Herb').every(row => row.status === 'PUBLISHED' && row.isVerified)).toBe(true);
    expect(snapshot).toMatchObject({ database: 'neondb', writesPerformed: 0, stagingAllowed: false, publicationAllowed: false });
    expect(snapshot.provider.configuredDatabaseHost).toBe(`${snapshot.provider.computeEndpointId}-pooler.c-8.us-east-1.aws.neon.tech`);
    expect(snapshot.provider.configuredDatabasePath).toBe('/neondb');
    expect(snapshot.provider).toMatchObject({ targetIndependentlyReconfirmed: true, credentialsRecorded: false, variableChanged: false, connectionValuesRehidden: true });
    expect(JSON.stringify(snapshot)).not.toMatch(/postgres(?:ql)?:\/\//i);
  });

  it('recomputes the recorded-name check over all states rather than just published herbs', () => {
    expect(queue.candidates).toHaveLength(50);
    expect(findIdentityConflicts(queue, identities)).toEqual([]);
    expect(review.expansionIdentityComparison).toMatchObject({
      candidateCount: 50, catalogRows: 55, scope: snapshot.scope, conflicts: [],
      allBotanicalSynonymsReconciled: false, stagingTransactionCheckPerformed: false,
      queueSha256: preparationDigest(rawQueue),
    });
    expect(review.identitySnapshot.sha256).toBe(preparationDigest(snapshot));
  });

  it('retains source synonyms and catches an added candidate synonym instead of trusting a saved pass', () => {
    const record = identities.find(identity => identity.id === 'builtin-makabuhay')!;
    expect(record.sourceScientificName).toBe('Tinospora rumphii');
    const modifiedQueue = structuredClone(queue);
    modifiedQueue.candidates[0]!.scientificSynonyms.push(record.sourceScientificName!);
    expect(findIdentityConflicts(modifiedQueue, identities)).toContainEqual({
      candidateId: modifiedQueue.candidates[0]!.id, recordId: record.id, reasons: ['scientific name or synonym'],
    });
  });

  it('cannot be mistaken for an executable plan or original embedding backup', () => {
    expect(review).toMatchObject({ status: 'PUBLIC_FIELD_REVIEW_ONLY_NOT_AN_EXECUTABLE_PLAN', writesPerformed: 0, credentialsRecorded: false, publicationAllowed: false, applyAllowed: false });
    expect(preparationPlanSchema.safeParse(review).success).toBe(false);
    expect(review.liveApi).toMatchObject({ httpStatus: 200, total: 38, blankPreparations: 0, genericPreparations: 20, allPublishedIdentitiesMatchSql: true });
    expect(review.batch.sha256).toBe(preparationDigest(batch));
    expect(new Set(review.records.map((record: { id: string }) => record.id)).size).toBe(20);
    expect(review.records.map((record: { id: string }) => record.id).sort()).toEqual(batch.herbs.map((herb: { id: string }) => herb.id).sort());
    expect(JSON.stringify(review)).not.toMatch(/postgres(?:ql)?:\/\//i);
  });

  for (const record of review.records) {
    it(`limits ${record.id} to sourced fields and preserves its public identity/media/review values`, () => {
      const proposal = batch.herbs.find((herb: { id: string }) => herb.id === record.id);
      expect(record.originalPublicFields.preparationMethod).toBe(genericPreparation);
      expect(record.proposedPublicFields.preparationMethod).toBe(proposal.preparationMethod);
      expect(record.protectedPublicValues).toMatchObject({ id: record.id, localName: proposal.localName, scientificName: proposal.scientificName, provenance: 'BUILT_IN', publicationStatus: 'PUBLISHED', isVerified: true });
      expect(preparationDigest(record.protectedPublicValues)).toBe(record.protectedPublicValuesSha256);
      expect(Object.keys(record.protectedPublicValues).sort()).toEqual([...review.protectedFields].sort());
      expect(record.protectedPublicValues).not.toHaveProperty('embedding');
      expect(record.missingPrivateBackupFields).toEqual(['embedding']);
      expect(record.retainedReviewGaps).toEqual(proposal.reviewGaps);
      const fields = Object.keys(record.proposedPublicFields);
      expect(fields.every(field => ['preparationMethod', 'dosage', 'warnings'].includes(field))).toBe(true);
      for (const field of fields) {
        expect(proposal.fieldSources[field]?.length).toBeGreaterThan(0);
        expect(record.proposedPublicFields[field]).toBe(proposal[field]);
        expect(record.sourceAdditions.filter((source: { supports: string[] }) => source.supports.includes(field)).map((source: { sourceKey: string }) => source.sourceKey).sort()).toEqual([...proposal.fieldSources[field]].sort());
      }
      for (const source of record.sourceAdditions) {
        const original = batch.sources[source.sourceKey];
        expect(source).toMatchObject({ herbId: record.id, title: original.title, publisher: original.publisher, url: original.url, citation: original.retrievalNote });
        const url = new URL(source.url);
        expect(url.protocol).toBe('https:');
        expect(url.username + url.password).toBe('');
        expect(source.accessedAt).toBe(herbSourceAccessedAt(original.accessedAt ? { accessedAt: original.accessedAt } : {}, batch.preparedAt).toISOString());
        expect(source.supports.every((field: string) => fields.includes(field))).toBe(true);
      }
      for (const difference of record.unmappedDifferences) {
        expect(record.proposedPublicFields).not.toHaveProperty(difference.field);
        expect(difference.current).toBe(record.originalPublicFields[difference.field]);
        expect(difference.excludedProposal).toBe(proposal[difference.field]);
        expect(proposal.fieldSources[difference.field] ?? []).toEqual([]);
      }
    });
  }

  it('records the Mangosteen attribution repair without claiming the warning is already live', () => {
    const record = review.records.find((entry: { id: string }) => entry.id === 'builtin-mangosteen');
    expect(record.unmappedDifferences).toEqual([]);
    expect(record.proposedPublicFields.warnings).toContain('do not delay care');
    expect(record.sourceAdditions.find((source: { sourceKey: string }) => source.sourceKey === 'who-dengue-2025')?.supports).toEqual(['warnings']);
    expect(record.originalPublicFields.warnings).not.toBe(record.proposedPublicFields.warnings);
    expect(review.revision).toBe(2);
    expect(review.revisionHistory[0].summary).toMatchObject({ warningUpdates: 3, sourceAdditions: 21, unmappedDifferencesRetained: 1 });
    expect(review.findings[0].status).toBe('RESOLVED_IN_LOCAL_PROPOSAL');
    expect(review.findings.map((finding: { id: string }) => finding.id)).toContain('PREP_REVIEW_UNMAPPED_MANGOSTEEN_WARNING');
    expect(review.summary).toMatchObject({ methodUpdates: 20, dosageUpdates: 1, warningUpdates: 4, sourceAdditions: 22, unmappedDifferencesRetained: 0 });
    expect(review.summary.classes).toEqual({ REPORTED_TRADITIONAL_USE_NOT_VALIDATED: 12, PHARMACOPOEIAL_EXTERNAL_TRADITIONAL_USE: 1, FOOD_ONLY_DESCRIPTION: 5, ORAL_PREPARATION_WITHHELD: 2 });
  });

  it('retains the initial tool-failure history and records independently successful source recovery', () => {
    expect(review.sourceRechecks.scope).toBe('TARGETED_PRIMARY_SOURCE_RECHECK_NOT_ALL_CITATIONS');
    const failures = review.sourceRechecks.observations.filter((source: { result: string }) => source.result === 'CURRENT_WEB_TOOL_RETRIEVAL_FAILED');
    expect(failures.map((source: { sourceKey: string }) => source.sourceKey).sort()).toEqual(['cavite-preparations-2021', 'ust-oregano']);
    expect(review.sourceResolution.directHttpSources.map((source: { sourceKey: string }) => source.sourceKey).sort()).toEqual(['cavite-preparations-2021', 'ust-oregano']);
    expect(review.sourceResolution.directHttpSources.every((source: { httpStatus: number; sha256: string }) => source.httpStatus === 200 && /^[a-f0-9]{64}$/.test(source.sha256))).toBe(true);
    expect(review.sourceResolution).toMatchObject({ caviteRetainedOriginalMatchesDownloadedBytes: true, cavitePdfPages: 9, liveContentChanged: false });
    expect(review.sourceResolution.whoWarningSource.supports).toEqual(['warnings']);
    expect(review.remainingGates.join(' ')).toMatch(/recovery backup outside Git/);
    expect(review.remainingGates.join(' ')).toMatch(/Dr\. Ai retrieval/);
  });
});
