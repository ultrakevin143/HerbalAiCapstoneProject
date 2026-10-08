import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));

import { AskAIService, createDrAiStream } from '../src/services/ai/chat/ask-ai-service.js';

const review = JSON.parse(readFileSync(new URL('../../Docs/research/PREPARATION_SOURCE_CORRECTIONS_2026-10-08.json', import.meta.url), 'utf8')) as {
  records: Array<{ id: string; scientificName: string; expectedPreparationMethod: string; preparationMethod: string; source: { url: string; title: string; citation: string; supports: string[] } }>;
};
const fixtures = review.records.map(record => ({
  id: record.id, localName: record.scientificName === 'Ocimum gratissimum' ? 'Lokoloko' : 'Abutilon indicum',
  scientificName: record.scientificName, sourceScientificName: record.scientificName,
  publicationStatus: 'PUBLISHED', isVerified: true, evidenceClass: 'DOCUMENTED_TRADITIONAL_USE',
  medicinalUses: 'Reported traditional use, not species-specific clinical efficacy.',
  preparationMethod: record.preparationMethod, category: 'Traditional use',
  dosage: 'No medicinal dose is cleared by this review.',
  warnings: 'A traditional description is not a validated household treatment recipe.',
  sources: [{ title: record.source.title, url: record.source.url, citation: record.source.citation, supports: record.source.supports }],
}));

describe('reviewed Abutilon and Lokoloko preparation retrieval (isolated fixtures)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.catalog.mockResolvedValue({ herbs: fixtures });
    mocks.herbs.mockResolvedValue([]);
    mocks.kb.mockResolvedValue([]);
    mocks.exactKb.mockResolvedValue([]);
    mocks.embed.mockResolvedValue([0.1]);
    mocks.answer.mockResolvedValue('Grounded test response.');
    mocks.stream.mockImplementation(async function* () { yield 'Grounded test response.'; });
  });

  it.each(fixtures.flatMap(herb => [...new Set([herb.localName, herb.scientificName])].map(name => ({ name, herb }))))('retrieves the corrected preparation and reference for $name', async ({ name, herb }) => {
    await AskAIService(`What preparation is recorded for ${name}?`);
    const context = mocks.answer.mock.calls[0]?.[1];
    expect(context).toContain(herb.preparationMethod);
    expect(context).toContain(herb.sources[0]!.url);
    expect(context).not.toContain('Gling.html');
    expect(context).not.toContain('5 to 10 minutes');
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it.each(fixtures)('retains $scientificName limitations when the provider fails', async herb => {
    mocks.answer.mockRejectedValue(new Error('isolated provider failure'));
    const result = await AskAIService(`What preparation is recorded for ${herb.scientificName}?`);
    expect(result.data?.answer).toContain(herb.preparationMethod);
    expect(result.data?.answer).toContain('cannot synthesize a dose');
    expect(result.data?.answer).not.toContain('5 to 10 minutes');
  });

  it.each(fixtures)('uses the corrected $scientificName record in streaming', async herb => {
    const result = await createDrAiStream(`What preparation is recorded for ${herb.scientificName}?`);
    for await (const chunk of result.chunks) expect(chunk).toBe('Grounded test response.');
    expect(mocks.stream.mock.calls[0]?.[1]).toContain(herb.preparationMethod);
    expect(mocks.stream.mock.calls[0]?.[1]).toContain(herb.sources[0]!.url);
  });

  it.each(fixtures)('does not convert $scientificName documentation into a child recipe', async herb => {
    const result = await AskAIService(`How do I prepare ${herb.scientificName} for my child?`);
    expect(result.data?.answer).toContain('cannot provide child-specific preparation');
    expect(mocks.answer).not.toHaveBeenCalled();
  });
});
