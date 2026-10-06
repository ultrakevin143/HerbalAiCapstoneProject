import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Source { url: string; reviewCoverage: string }
interface Herb {
  id: string; scientificName: string; publicationStatus: string; isVerified: boolean;
  preparationMethod: string; dosage: string; warnings: string; fieldSources: Record<string, string[]>;
}
const batch = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-01.json', import.meta.url), 'utf8')) as {
  herbs: Herb[]; sources: Record<string, Source>;
};
const review = JSON.parse(readFileSync(new URL('../../Docs/research/HERB_PREPARATION_SOURCE_FOLLOW_UP_2026-10-05.json', import.meta.url), 'utf8')) as {
  status: string; productionWritesPerformed: boolean; coverageDocument: string;
  sources: Record<string, Source>;
  proposals: Array<{ recordId: string; scientificName: string; proposedPreparationMethod: string; preparationSourceIds: string[]; action: string }>;
  socialSearch: { sourcesAdoptedForMedicinalInstructions: number; facebook: { result: string }; reddit: Array<{ url: string; disposition: string }> };
  localCanonicalEnrichments: Array<{ id: string; contentFile: string }>;
};
const baseline = JSON.parse(readFileSync(new URL('../../Docs/research/LIVE_LIBRARY_PREPARATION_FOLLOW_UP_2026-10-05.json', import.meta.url), 'utf8')) as {
  records: Array<{ id: string; scientificName: string }>;
};
const getHerb = (id: string) => {
  const herb = batch.herbs.find(record => record.id === id);
  if (!herb) throw new Error(`Missing food preparation: ${id}`);
  return herb;
};

describe('food preparation and social-source follow-up boundaries', () => {
  it('retains the complete 38-identity audit and does not publish or insert research', () => {
    expect(baseline.records).toHaveLength(38);
    expect(review).toMatchObject({ status: 'RESEARCH_ONLY_NOT_IMPORTABLE', productionWritesPerformed: false });
    expect(review.coverageDocument).toBe('Docs/research/PUBLISHED_HERB_PREPARATION_COVERAGE_2026-10-05.json');
    const reviewedIds = [...review.localCanonicalEnrichments.map(record => record.id), ...review.proposals.map(record => record.recordId)];
    expect(new Set(reviewedIds).size).toBe(5);
    for (const id of reviewedIds) expect(baseline.records.some(record => record.id === id)).toBe(true);
  });

  it.each(['builtin-luya', 'builtin-luyang-dilaw', 'builtin-malunggay'])('%s has food citations without altering research or safety classification', id => {
    const herb = getHerb(id);
    expect(herb).toMatchObject({ publicationStatus: 'DRAFT', isVerified: false });
    expect(herb.preparationMethod).toMatch(/^Food preparation only:/);
    expect(herb.dosage).toMatch(/^No (?:home-treatment|general lactation) dose/);
    expect(herb.warnings.length).toBeGreaterThan(40);
    for (const sourceId of herb.fieldSources.preparationMethod ?? []) {
      const source = batch.sources[sourceId];
      expect(source).toBeDefined();
      expect(new URL(source!.url).protocol).toBe('https:');
      expect(new URL(source!.url).hostname).not.toMatch(/(?:reddit|facebook)\.com$/);
    }
    expect(herb.scientificName).toBe(baseline.records.find(record => record.id === id)?.scientificName);
  });

  it('keeps the original food yield and measurements rather than adding a treatment frequency', () => {
    const herb = getHerb('builtin-luya');
    expect(herb.fieldSources.preparationMethod).toContain('salabat-food-bittman');
    expect(herb.preparationMethod).toContain('four servings');
    expect(herb.preparationMethod).toContain('1 quart water');
    expect(herb.preparationMethod).toContain('10 minutes');
    expect(herb.preparationMethod).toContain('not medicinal doses');
    expect(herb.preparationMethod).not.toMatch(/daily|times per day|cures|safe for pregnancy/i);
  });

  it('does not convert turmeric food into supplements or malunggay leaves into other plant parts', () => {
    expect(getHerb('builtin-luyang-dilaw').preparationMethod).toContain('not interchangeable');
    expect(getHerb('builtin-luyang-dilaw').preparationMethod).toContain('Curcuma longa rhizome');
    expect(getHerb('builtin-malunggay').preparationMethod).toContain('does not supply a leaf amount or cooking duration');
    expect(getHerb('builtin-malunggay').preparationMethod).not.toMatch(/roots|seeds|blood sugar|increase milk/i);
    expect(getHerb('builtin-malunggay').fieldSources.preparationMethod).toContain('fnri-malunggay-food');
  });

  it('keeps the stalk-food proposal separate from the essential-oil clinical formulation and updater', () => {
    expect(review.proposals).toHaveLength(1);
    const proposal = review.proposals[0]!;
    expect(proposal.action).toBe('SEPARATE_EXISTING_RECORD_REVIEW_REQUIRED');
    expect(proposal.scientificName).toBe('Cymbopogon citratus');
    expect(proposal.proposedPreparationMethod).toMatch(/^Food preparation only: crush.*stalk/);
    expect(proposal.proposedPreparationMethod).toContain('do not support a reproducible home preparation');
    expect(proposal.proposedPreparationMethod).not.toMatch(/\d|drink essential oil|treat cuts/i);
    for (const sourceId of proposal.preparationSourceIds) expect(review.sources[sourceId]).toBeDefined();
  });

  it('records social leads without treating them as validated medicinal instructions', () => {
    expect(review.socialSearch.sourcesAdoptedForMedicinalInstructions).toBe(0);
    expect(review.socialSearch.facebook.result).toBe('NO_VERIFIABLE_FACEBOOK_POST_RETURNED');
    expect(review.socialSearch.reddit).toHaveLength(2);
    for (const lead of review.socialSearch.reddit) expect(lead.disposition).toBe('LEAD_ONLY_NOT_MEDICINAL_EVIDENCE');
  });
});
