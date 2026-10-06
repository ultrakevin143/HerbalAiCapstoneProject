import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));

import { AskAIService, createDrAiStream, withoutPediatricQuantities } from '../src/services/ai/chat/ask-ai-service.js';
import { DR_AI_SYSTEM_PROMPT } from '../src/config/drAiSystemPrompt.js';

interface PublicRecord {
  id: string;
  localName: string;
  scientificName: string;
  preparationMethod: string;
  dosage: string;
  warnings: string;
  sources: Array<{ title: string; url: string | null; supports: string[] }>;
}
const snapshot = JSON.parse(readFileSync(new URL('../../Docs/research/HERB_BEGINNER_GUIDE_PUBLIC_SNAPSHOT_2026-10-06.json', import.meta.url), 'utf8')) as {
  status: number;
  productionWritesPerformed: boolean;
  records: PublicRecord[];
};
const centella = snapshot.records.find(herb => herb.scientificName === 'Centella asiatica')!;

describe('beginner preparation context (dated public data, mocked AI; not live generation)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.catalog.mockResolvedValue({ herbs: snapshot.records });
    mocks.herbs.mockResolvedValue([]);
    mocks.kb.mockResolvedValue([]);
    mocks.exactKb.mockResolvedValue([]);
    mocks.embed.mockResolvedValue([0.1]);
    mocks.answer.mockResolvedValue('Mocked generated response.');
    mocks.stream.mockImplementation(async function* () { yield 'Mocked generated response.'; });
  });

  it.each([
    'Walk me through Centella asiatica step by step.',
    'Give a beginner guide for Centella asiatica.',
    'Give a beginner\'s guide for Centella asiatica.',
    'How do I make the Centella asiatica preparation?',
    'Paano ihanda ang Centella asiatica?',
    'Unsaon pag-andam sa Centella asiatica?',
  ])('retains recorded amounts and frequency for: %s', async question => {
    await AskAIService(question);
    expect(mocks.answer.mock.calls[0]?.[1]).toContain(centella.dosage);
  });

  it('retains recorded amounts and frequency for streamed beginner wording', async () => {
    const response = await createDrAiStream('Walk me through Centella asiatica step-by-step.');
    for await (const chunk of response.chunks) expect(chunk).toBe('Mocked generated response.');
    expect(mocks.stream.mock.calls[0]?.[1]).toContain(centella.dosage);
  });

  it('records all 38 actual public entries without calling them 38 validated recipes', () => {
    expect(snapshot.status).toBe(200);
    expect(snapshot.productionWritesPerformed).toBe(false);
    expect(snapshot.records).toHaveLength(38);
    expect(new Set(snapshot.records.map(herb => herb.id)).size).toBe(38);
    expect(snapshot.records.filter(herb => !herb.preparationMethod.trim())).toEqual([]);
    expect(snapshot.records.filter(herb => !herb.sources.some(source => source.supports.includes('preparationMethod'))).map(herb => herb.localName)).toEqual(['Indian Heliotrope', 'Tanglad']);
  });

  it.each(snapshot.records)('$localName retrieves current wording and citations by local and scientific name', async herb => {
    for (const name of [herb.localName, herb.scientificName]) {
      await AskAIService(`Explain the preparation of ${name} for a beginner.`);
      const context = mocks.answer.mock.calls.at(-1)?.[1];
      expect(context).toContain(withoutPediatricQuantities(herb.preparationMethod));
      expect(context).toContain(withoutPediatricQuantities(herb.dosage));
      expect(context).toContain(herb.warnings);
      for (const source of herb.sources) expect(context).toContain(source.title);
    }
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it.each(snapshot.records)('$localName retains its preparation and warnings on the streaming path', async herb => {
    const response = await createDrAiStream(`Explain ${herb.scientificName} preparation step by step.`);
    for await (const chunk of response.chunks) expect(chunk).toBe('Mocked generated response.');
    const context = mocks.stream.mock.calls[0]?.[1];
    expect(context).toContain(withoutPediatricQuantities(herb.preparationMethod));
    expect(context).toContain(withoutPediatricQuantities(herb.dosage));
    expect(context).toContain(herb.warnings);
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('does not turn a child-related beginner follow-up into adult directions', async () => {
    const response = await AskAIService('Walk me through Centella asiatica step by step.', [{ role: 'user', parts: [{ text: 'Can my child use Centella asiatica?' }] }]);
    expect(response.data?.answer).toContain('cannot provide child-specific preparation');
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it('keeps uncited preparation metadata explicit rather than inventing support tags', async () => {
    await AskAIService('Explain Tanglad preparation step by step.');
    expect(mocks.answer.mock.calls[0]?.[1]).toContain('NO_FIELD_SPECIFIC_REFERENCE');
  });

  it('retains a real preparation reference without claiming clinical proof', async () => {
    await AskAIService('Walk me through Centella asiatica step by step.');
    expect(mocks.answer.mock.calls[0]?.[1]).toContain('FIELD_SPECIFIC_REFERENCE_RECORDED');
    expect(mocks.answer.mock.calls[0]?.[1]).toContain('not proof of a complete or safe household recipe');
  });

  it('does not add dosage context to a botanical beginner question', async () => {
    await AskAIService('What is the scientific name of Takip-kohol? I am a beginner.');
    expect(mocks.answer.mock.calls[0]?.[1]).not.toContain('dosageField');
  });

  it('allows a new explicitly adult preparation question after a child-related question', async () => {
    await AskAIService('Walk me through Centella asiatica preparation for an adult.', [{ role: 'user', parts: [{ text: 'Can my child use Centella asiatica?' }] }]);
    expect(mocks.answer.mock.calls[0]?.[1]).toContain(centella.dosage);
  });

  it.each(['Anonas', 'Indian Heliotrope', 'Makabuhay', 'Tanglad'])('keeps %s withholding or formulation limits when generation fails', async name => {
    const herb = snapshot.records.find(record => record.localName === name)!;
    mocks.answer.mockRejectedValue(new Error('mock provider failure'));
    const response = await AskAIService(`Walk me through ${name} preparation step by step.`);
    expect(response.data?.answer).toContain(herb.preparationMethod);
    expect(response.data?.answer).toContain(herb.warnings);
    expect(response.data?.answer).toContain('cannot synthesize a dose');
  });

  it('does not retrieve an unpublished beginner-preparation fixture', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...centella, publicationStatus: 'DRAFT', isVerified: true }] });
    const response = await AskAIService('Walk me through Centella asiatica preparation step by step.');
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(response.data?.sources).toEqual([]);
    expect(response.data?.answer).not.toContain(centella.preparationMethod);
  });

  it('requires sourced steps, alternatives kept separate and incomplete guides labeled', () => {
    expect(DR_AI_SYSTEM_PROMPT).toContain('Every numbered action must be traceable to the retrieved preparation text');
    expect(DR_AI_SYSTEM_PROMPT).toContain('Keep alternative preparations in separate lists');
    expect(DR_AI_SYSTEM_PROMPT).toContain('Incomplete documented method');
  });
});
