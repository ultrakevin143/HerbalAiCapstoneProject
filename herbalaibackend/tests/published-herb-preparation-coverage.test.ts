import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const audit = JSON.parse(readFileSync(new URL('../../Docs/research/PUBLISHED_HERB_PREPARATION_COVERAGE_2026-10-05.json', import.meta.url), 'utf8')) as {
  productionWritesPerformed: boolean;
  counts: { published: number; placeholderPreparations: number; localReplacementEntries: number };
  records: Array<{ id: string; localName: string; scientificName: string; action: string; disposition: string; liveBlankDisplayFields: string[]; liveHasGenericPreparationPlaceholder: boolean; proposed: null | { contentFile: string; recordId: string; preparationSourceIds: string[] } }>;
};
const batch = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-02.json', import.meta.url), 'utf8')) as {
  herbs: Array<{ id: string; scientificName: string; preparationMethod: string; dosage: string; warnings: string; fieldSources: Record<string, string[]> }>;
};

describe('dated public catalog preparation coverage, not proof of deployment', () => {
  it('accounts for all 38 inspected published identities without claiming a production write', () => {
    expect(audit.productionWritesPerformed).toBe(false);
    expect(audit.records).toHaveLength(audit.counts.published);
    expect(new Set(audit.records.map(herb => herb.id)).size).toBe(38);
    expect(new Set(audit.records.map(herb => herb.scientificName)).size).toBe(38);
    expect(audit.records.filter(herb => herb.liveHasGenericPreparationPlaceholder)).toHaveLength(20);
  });

  it.each(batch.herbs)('$id resolves its proposed existing-record update and field references', herb => {
    const record = audit.records.find(item => item.id === herb.id);
    expect(record?.scientificName).toBe(herb.scientificName);
    expect(record?.action).toBe('SELECTIVE_CONTENT_UPDATE_PENDING');
    expect(record?.proposed).toMatchObject({ contentFile: 'herbalaibackend/content/herbs/expansion-batch-02.json', recordId: herb.id });
    expect(record?.proposed?.preparationSourceIds).toEqual(herb.fieldSources.preparationMethod);
    expect(herb.preparationMethod.trim()).not.toBe('');
    expect(herb.dosage.trim()).not.toBe('');
    expect(herb.warnings.trim()).not.toBe('');
  });

  it('keeps all food-only and safety exclusions visible instead of fabricating treatment doses', () => {
    expect(audit.records.filter(herb => herb.disposition === 'FOOD_ONLY')).toHaveLength(5);
    expect(audit.records.filter(herb => herb.disposition === 'SAFETY_WITHHOLD').map(herb => herb.localName)).toEqual(['Anonas', 'Indian Heliotrope', 'Makabuhay']);
    for (const herb of audit.records.filter(herb => herb.proposed)) {
      expect(herb.proposed?.preparationSourceIds.length).toBeGreaterThan(0);
    }
  });

  it('retains the actual missing image and citation-metadata gaps as pending work', () => {
    expect(audit.records.filter(herb => herb.liveBlankDisplayFields.length).map(herb => [herb.localName, herb.liveBlankDisplayFields])).toEqual([['Kalingag', ['imageUrl']]]);
    expect(audit.records.filter(herb => herb.action === 'PREPARATION_SOURCE_SUPPORT_METADATA_PENDING').map(herb => herb.localName)).toEqual(['Indian Heliotrope', 'Tanglad']);
  });
});
