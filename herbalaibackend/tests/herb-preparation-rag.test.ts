import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));

import { AskAIService, createDrAiStream } from '../src/services/ai/chat/ask-ai-service.js';
import { DR_AI_SYSTEM_PROMPT } from '../src/config/drAiSystemPrompt.js';

const batch = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-02.json', import.meta.url), 'utf8')) as {
  sources: Record<string, { title: string; url: string }>;
  herbs: Array<{ id: string; slug: string; localName: string; scientificName: string; sourceScientificName: string | null; preparationMethod: string; medicinalUses: string; dosage: string; warnings: string; fieldSources: Record<string, string[]> }>;
};
const foodBatch = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-01.json', import.meta.url), 'utf8')) as typeof batch;
const foodReview = JSON.parse(readFileSync(new URL('../../Docs/research/HERB_PREPARATION_SOURCE_FOLLOW_UP_2026-10-05.json', import.meta.url), 'utf8')) as {
  sources: Record<string, { title: string; url: string }>;
  proposals: Array<{ recordId: string; localName: string; scientificName: string; proposedPreparationMethod: string; preparationSourceIds: string[] }>;
};
const sourceCatalog = { ...foodBatch.sources, ...batch.sources, ...foodReview.sources };
const getSource = (sourceId: string) => {
  const source = sourceCatalog[sourceId];
  if (!source) throw new Error(`Missing preparation source fixture: ${sourceId}`);
  return source;
};
const fixture = (slug: string) => {
  const herb = batch.herbs.find(item => item.slug === slug) ?? foodBatch.herbs.find(item => item.slug === slug);
  if (!herb) throw new Error(`Missing herb fixture: ${slug}`);
  return {
    ...herb,
    publicationStatus: 'PUBLISHED',
    isVerified: true,
    cebuanoName: null as string | null,
    evidenceClass: 'DOCUMENTED_TRADITIONAL_USE',
    sources: [...new Set(['preparationMethod', 'dosage', 'warnings'].flatMap(field => herb.fieldSources[field] ?? []))]
      .map(sourceId => ({ ...getSource(sourceId), supports: ['preparationMethod', 'dosage', 'warnings'].filter(field => herb.fieldSources[field]?.includes(sourceId)) })),
  };
};

describe('preparation retrieval regressions (isolated published fixtures, not live publication)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.catalog.mockResolvedValue({ herbs: [fixture('oregano')] });
    mocks.herbs.mockResolvedValue([]);
    mocks.kb.mockResolvedValue([]);
    mocks.exactKb.mockResolvedValue([]);
    mocks.embed.mockResolvedValue([0.1]);
    mocks.answer.mockResolvedValue('Grounded test response.');
    mocks.stream.mockImplementation(async function* () { yield 'Grounded test response.'; });
  });

  it.each(['Oregano', 'Coleus amboinicus', 'Plectranthus amboinicus'])('retrieves the current preparation and citations through %s', async name => {
    const herb = fixture('oregano');
    await AskAIService(`How is ${name} prepared?`);
    expect(mocks.answer.mock.calls[0]?.[1]).toContain(herb.preparationMethod);
    expect(mocks.answer.mock.calls[0]?.[1]).toContain(getSource('ust-oregano').url);
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it.each(batch.herbs.map(herb => herb.slug))('passes current %s wording, limitations and field references without embedding', async slug => {
    const herb = fixture(slug);
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    await AskAIService(`What preparation is recorded for ${herb.localName}?`);
    const context = mocks.answer.mock.calls[0]?.[1];
    expect(context).toContain(herb.preparationMethod);
    expect(context).toContain(herb.warnings);
    for (const source of herb.sources) expect(context).toContain(source.url);
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it.each(['Mangosteen', 'Garcinia mangostana'])('retrieves %s preparation, safety warning and both correctly scoped references', async name => {
    const herb = fixture('mangosteen');
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    await AskAIService(`What preparation is recorded for ${name}?`);
    const context = mocks.answer.mock.calls[0]?.[1];
    expect(context).toContain(herb.preparationMethod);
    expect(context).toContain(herb.warnings);
    expect(context).toContain(batch.sources['who-dengue-2025']!.url);
    expect(context).toContain(batch.sources['cavite-preparations-2021']!.url);
    expect(herb.sources.find(source => source.url.includes('who.int'))?.supports).toEqual(['warnings']);
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('retains the sourced Mangosteen care warning during provider failure without inventing a dose', async () => {
    const herb = fixture('mangosteen');
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    mocks.answer.mockRejectedValue(new Error('test provider unavailable'));
    const result = await AskAIService('How is Garcinia mangostana prepared?');
    expect(result.data?.answer).toContain(herb.preparationMethod);
    expect(result.data?.answer).toContain(herb.warnings);
    expect(result.data?.answer).toContain('cannot synthesize a dose');
  });

  it('keeps an incomplete entry incomplete when a matching preparation source is unavailable', async () => {
    const herb = { ...fixture('mabolo'), preparationMethod: 'No clinically validated home preparation is provided in this entry.', sources: [] };
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    mocks.answer.mockRejectedValue(new Error('test provider unavailable'));
    const result = await AskAIService('How is Mabolo prepared?');
    expect(result.data?.answer).toContain('No clinically validated home preparation is provided in this entry.');
    expect(result.data?.answer).not.toContain('Boil');
  });

  it('recognizes a stored regional name, including a follow-up', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...fixture('oregano'), cebuanoName: 'Kalabo' }] });
    await AskAIService('How is it prepared?', [{ role: 'user', parts: [{ text: 'Tell me about Kalabo.' }] }]);
    expect(mocks.answer.mock.calls[0]?.[1]).toContain(fixture('oregano').preparationMethod);
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('does not match Atis inside hepatitis', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...fixture('oregano'), localName: 'Atis', scientificName: 'Annona squamosa', sourceScientificName: null }] });
    const result = await AskAIService('Can plants cure hepatitis?');
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(result.data?.sources).toEqual([]);
  });

  it.each(['DRAFT', 'ARCHIVED'])('does not use a %s record even if incorrectly marked verified', async publicationStatus => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...fixture('oregano'), publicationStatus }] });
    await AskAIService('How is Oregano prepared?');
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it('does not substitute Philippine oregano for another scientific species', async () => {
    const result = await AskAIService('How is Origanum vulgare prepared?');
    expect(result.data?.sources).toEqual([]);
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it('retains a close semantic match when the relevant term occurs only in preparation', async () => {
    const herb = fixture('mayana');
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    mocks.herbs.mockResolvedValue([{ ...herb, distance: 0.1 }]);
    await AskAIService('Which record describes a poultice?');
    expect(mocks.answer.mock.calls[0]?.[1]).toContain(herb.preparationMethod);
    expect(mocks.answer.mock.calls[0]?.[1]).toContain(getSource('la-union-preparations').url);
  });

  it('returns the recorded preparation without synthesizing a new dose when generation fails', async () => {
    mocks.answer.mockRejectedValue(new Error('test provider unavailable'));
    const result = await AskAIService('How is Plectranthus amboinicus prepared?');
    expect(result.data?.answer).toContain(fixture('oregano').preparationMethod);
    expect(result.data?.answer).toContain('cannot synthesize a dose');
  });

  it('retrieves the same current record for streaming and non-streaming answers', async () => {
    const response = await createDrAiStream('How is Plectranthus amboinicus prepared?');
    for await (const chunk of response.chunks) expect(chunk).toBe('Grounded test response.');
    expect(mocks.stream.mock.calls[0]?.[1]).toContain(fixture('oregano').preparationMethod);
    expect(response.getResult().sources).toContainEqual({ type: 'herb', title: 'Oregano', distance: 0 });
  });

  it.each([
    'What preparation does the repository document for Takip-kohol?',
    'How is Centella asiatica prepared?',
    'How do I prepare Takip-kohol?',
    'What preparations are documented for Takip-kohol?',
  ])('includes recorded adult frequency and duration for preparation question: %s', async question => {
    const herb = fixture('takip-kohol');
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    await AskAIService(question);
    const context = mocks.answer.mock.calls[0]?.[1];
    expect(context).toContain('dosageField');
    expect(context).toContain(herb.dosage);
    expect(context).toContain(herb.warnings);
    expect(context).toContain(getSource('ema-centella-2022').url);
  });

  it('includes recorded frequency in streamed preparation context too', async () => {
    const herb = fixture('takip-kohol');
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    const response = await createDrAiStream('What preparation is recorded for Centella asiatica?');
    for await (const chunk of response.chunks) expect(chunk).toBe('Grounded test response.');
    expect(mocks.stream.mock.calls[0]?.[1]).toContain(herb.dosage);
  });

  it('does not add dosage context to unrelated botanical questions', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [fixture('takip-kohol')] });
    await AskAIService('What is the scientific name of Takip-kohol?');
    expect(mocks.answer.mock.calls[0]?.[1]).not.toContain('dosageField');
  });

  it('keeps adult preparation frequency out of child-specific answers', async () => {
    const herb = fixture('takip-kohol');
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    const result = await AskAIService('How do I prepare Centella asiatica for my child?');
    expect(result.data?.answer).toContain('cannot provide child-specific preparation');
    expect(result.data?.answer).not.toContain(herb.dosage);
    expect(result.data?.answer).not.toContain('0.6');
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it('continues to withhold preparation quantities for a child through a botanical alias', async () => {
    const result = await AskAIService('How do I prepare Plectranthus amboinicus for my child?');
    expect(result.data?.sources).toContainEqual({ type: 'herb', title: 'Oregano', distance: 0 });
    expect(result.data?.answer).toContain('cannot provide child-specific preparation');
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it('keeps descriptive ethnobotany and food preparation out of medicinal recipe synthesis', () => {
    expect(DR_AI_SYSTEM_PROMPT).toContain('A traditional-use description is not a validated home recipe');
    expect(DR_AI_SYSTEM_PROMPT).toContain('Do not turn food preparation into medicinal treatment');
  });

  it.each(['luya', 'luyang-dilaw', 'malunggay', 'tanglad'])('retrieves %s food preparation and its citations without requiring embeddings for a named plant', async slug => {
    const proposal = foodReview.proposals[0]!;
    const herb = slug === 'tanglad' ? {
      ...fixture('luya'), id: proposal.recordId, slug, localName: proposal.localName,
      scientificName: proposal.scientificName, sourceScientificName: null, aliases: [],
      medicinalUses: 'Study formulations are not equivalent to culinary use.',
      preparationMethod: proposal.proposedPreparationMethod, dosage: 'No general medicinal dosage is established.',
      warnings: 'Concentrated essential oil should not be swallowed or applied undiluted.',
      fieldSources: { preparationMethod: proposal.preparationSourceIds },
      sources: proposal.preparationSourceIds.map(sourceId => ({ ...getSource(sourceId), supports: ['preparationMethod'] })),
    } : fixture(slug);
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    await AskAIService(`How is ${herb.scientificName} prepared as food?`);
    const context = mocks.answer.mock.calls[0]?.[1];
    expect(context).toContain(herb.preparationMethod);
    for (const source of herb.sources) expect(context).toContain(source.url);
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('preserves food-versus-treatment limits in the stored fallback when generation fails', async () => {
    const herb = fixture('luya');
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    mocks.answer.mockRejectedValue(new Error('test provider unavailable'));
    const result = await AskAIService('How is Zingiber officinale prepared as food?');
    expect(result.data?.answer).toContain(herb.preparationMethod);
    expect(result.data?.answer).toContain('not medicinal doses');
    expect(result.data?.answer).toContain('cannot synthesize a dose');
  });
});
