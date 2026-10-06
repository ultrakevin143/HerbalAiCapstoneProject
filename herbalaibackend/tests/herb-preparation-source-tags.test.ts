import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { planPreparationSourceTags } from '../src/content/herb-preparation-source-tags.js';
import { preparationDigest } from '../src/content/herb-preparation-update.js';

const readJson = (name: string) => JSON.parse(readFileSync(new URL(`../../Docs/research/${name}`, import.meta.url), 'utf8'));
const review = readJson('HERB_PREPARATION_SOURCE_TAG_REVIEW_2026-10-06.json');
const baseline = readJson('HERB_PREPARATION_SOURCE_TAG_BASELINE_2026-10-06.json');
const plan = () => planPreparationSourceTags(review, baseline);

describe('reviewed preparation source-tag plan (read-only, not a live repair)', () => {
  it('plans only three additive source changes for the two existing herbs', () => {
    const result = plan();
    expect(result).toMatchObject({ status: 'SOURCE_TAG_PLAN_NOT_EXECUTABLE', writeAllowed: false, publicationAllowed: false, productionWritesPerformed: false });
    expect(result.changes.map(change => change.sourceId)).toEqual([21, 19, 20]);
    expect(new Set(result.changes.map(change => change.herbId)).size).toBe(2);
    for (const change of result.changes) {
      expect(change.proposedSupports).toEqual([...change.sourceBefore.supports, 'preparationMethod']);
      expect(change.sourceBeforeSha256).toBe(preparationDigest(change.sourceBefore));
    }
    expect(result.unchangedFields).toContain('preparationMethod');
    expect(result.unchangedFields).toContain('embedding');
    expect(result.releaseGates).toContain('Isolated PostgreSQL rollback/concurrency tests before live writes');
  });

  it('keeps WHO general toxin evidence as warnings-only, not species-specific preparation evidence', () => {
    expect(plan().changes.some(change => change.sourceId === 22)).toBe(false);
  });

  it('preserves safety withholding and research formulation restrictions', () => {
    const result = plan();
    expect(result.changes[0]?.fieldPurpose).toBe('SAFETY_WITHHOLDING');
    expect(result.changes[0]?.expectedPreparationMethod).toContain('does not recommend preparing or consuming');
    expect(result.changes.slice(1).every(change => change.fieldPurpose === 'STUDY_FORMULATION_LIMITS')).toBe(true);
    expect(result.changes[1]?.expectedPreparationMethod).toContain('do not support a reproducible home preparation');
  });

  it('does not mutate the baseline or reviewed ledger', () => {
    const before = JSON.stringify({ review, baseline });
    plan();
    expect(JSON.stringify({ review, baseline })).toBe(before);
  });

  it('reproduces the saved source-tag proposal exactly', () => {
    expect(readJson('HERB_PREPARATION_SOURCE_TAG_PLAN_2026-10-06.json')).toEqual(plan());
  });

  it('does not add the same tag again after the selected amendments', () => {
    const updated = structuredClone(baseline);
    for (const change of plan().changes) {
      const source = updated.records.flatMap((record: { sources: Array<{ id: number; supports: string[] }> }) => record.sources).find((source: { id: number }) => source.id === change.sourceId);
      source.supports = change.proposedSupports;
    }
    expect(planPreparationSourceTags(review, updated).changes).toEqual([]);
  });

  it.each(['id', 'localName', 'scientificName', 'preparationMethod'])('rejects changed baseline %s', field => {
    const changed = structuredClone(baseline);
    changed.records[0][field] += ' changed';
    expect(() => planPreparationSourceTags(review, changed)).toThrow('current herb identity and preparation');
  });

  it('detects an exact preparation whitespace change without silently normalizing it away', () => {
    const changed = structuredClone(baseline);
    changed.records[0].preparationMethod += ' ';
    expect(() => planPreparationSourceTags(review, changed)).toThrow('current herb identity and preparation');
  });

  it.each(['publicationStatus', 'isVerified'])('rejects an unpublished or unverified baseline: %s', field => {
    const changed = structuredClone(baseline);
    changed.records[0][field] = field === 'publicationStatus' ? 'DRAFT' : false;
    expect(() => planPreparationSourceTags(review, changed)).toThrow();
  });

  it.each(['species', 'missing', 'duplicate-reference', 'duplicate-definition', 'unbound', 'duplicate-url'])('rejects invalid source binding: %s', variant => {
    const changed = structuredClone(review);
    if (variant === 'species') changed.sources[0].scientificName = 'Cymbopogon citratus';
    if (variant === 'missing') changed.records[0].sourceIds = ['missing'];
    if (variant === 'duplicate-reference') changed.records[0].sourceIds.push(changed.records[0].sourceIds[0]);
    if (variant === 'duplicate-definition') changed.sources.push(changed.sources[0]);
    if (variant === 'unbound') changed.sources.push({ ...changed.sources[0], id: 'unbound' });
    if (variant === 'duplicate-url') changed.sources[2].url = changed.sources[1].url;
    expect(() => planPreparationSourceTags(changed, baseline)).toThrow();
  });

  it.each(['source-owner', 'missing-url', 'ambiguous-url', 'duplicate-id', 'duplicate-herb'])('rejects unsafe baseline source selection: %s', variant => {
    const changed = structuredClone(baseline);
    if (variant === 'source-owner') changed.records[0].sources[0].herbId = changed.records[1].id;
    if (variant === 'missing-url') changed.records[0].sources[0].url = 'https://example.org/unreviewed';
    if (variant === 'ambiguous-url') changed.records[0].sources.push({ ...changed.records[0].sources[0], id: 1000 });
    if (variant === 'duplicate-id') changed.records[0].sources.push(changed.records[0].sources[0]);
    if (variant === 'duplicate-herb') changed.records.push(changed.records[0]);
    expect(() => planPreparationSourceTags(review, changed)).toThrow();
  });

  it.each(['http://example.org/source', 'https://user:secret@example.org/source', 'https://example.org/source#fragment'])('rejects unsafe citation URLs: %s', url => {
    const changed = structuredClone(review);
    changed.sources[0].url = url;
    expect(() => planPreparationSourceTags(changed, baseline)).toThrow();
  });

  it('rejects recipe content or unreviewed tags in a metadata-only ledger', () => {
    const changed = structuredClone(review);
    changed.records[0].newPreparationMethod = 'An invented recipe';
    expect(() => planPreparationSourceTags(changed, baseline)).toThrow();
    delete changed.records[0].newPreparationMethod;
    changed.sources[0].supports = ['dosage'];
    expect(() => planPreparationSourceTags(changed, baseline)).toThrow();
  });

  it('runs the CLI without database configuration or provider credentials', () => {
    const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/plan-herb-source-tags.ts', '--snapshot', '../Docs/research/HERB_PREPARATION_SOURCE_TAG_BASELINE_2026-10-06.json'], {
      encoding: 'utf8', timeout: 15_000, env: { ...process.env, DATABASE_URL: '', DIRECT_URL: '', GEMINI_API_KEY: '' },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(plan());
  });

  it('rejects an apply flag without attempting a database connection', () => {
    const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/plan-herb-source-tags.ts', '--apply'], {
      encoding: 'utf8', timeout: 15_000, env: { ...process.env, DATABASE_URL: '', DIRECT_URL: '', GEMINI_API_KEY: '' },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no database writes were performed');
  });
});
