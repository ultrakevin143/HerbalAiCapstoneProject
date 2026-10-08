import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { builtInHerbEmbeddingText, herbSourceAccessedAt } from '../src/content/built-in-herb-fields.js';

const batch = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-02.json', import.meta.url), 'utf8')) as {
  preparedAt: string;
  sources: Record<string, { accessedAt?: string }>;
  herbs: Array<Parameters<typeof builtInHerbEmbeddingText>[0]>;
};

const sourceReviewDate = (sourceId: string) => {
  const source = batch.sources[sourceId];
  if (!source) throw new Error(`Missing source date fixture: ${sourceId}`);
  return herbSourceAccessedAt(source, batch.preparedAt).toISOString();
};

describe('built-in preparation embedding and citation dates', () => {
  it('embeds current preparations, safety text and botanical aliases', () => {
    for (const herb of batch.herbs) {
      const text = builtInHerbEmbeddingText(herb);
      for (const field of [herb.scientificName, herb.preparationMethod, herb.dosage, herb.warnings, herb.sourceScientificName]) {
        if (field) expect(text).toContain(field);
      }
      expect(text).not.toContain('undefined');
      expect(text).not.toContain(' null ');
    }
  });

  it('keeps later source review dates rather than backdating them to the original batch', () => {
    for (const sourceId of ['ust-oregano', 'cavite-preparations-2021', 'who-dengue-2025']) {
      expect(sourceReviewDate(sourceId)).toBe('2026-10-06T00:00:00.000Z');
    }
    expect(sourceReviewDate('tinospora-hepatitis-2014')).toBe('2026-10-05T00:00:00.000Z');
  });

  it('preserves the original batch date when no later access date was recorded', () => {
    expect(herbSourceAccessedAt({}, '2026-09-17').toISOString()).toBe('2026-09-17T00:00:00.000Z');
  });

  it.each(['', 'yesterday', '2026-02-30', '2026-13-01', '2026-10-05T00:00:00Z'])('rejects invalid source date %s', accessedAt => {
    expect(() => herbSourceAccessedAt({ accessedAt }, batch.preparedAt)).toThrow('valid YYYY-MM-DD');
  });

  it('also validates the fallback date', () => {
    expect(() => herbSourceAccessedAt({}, 'not a date')).toThrow('valid YYYY-MM-DD');
  });
});
