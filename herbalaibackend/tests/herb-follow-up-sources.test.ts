import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Content } from '@google/generative-ai';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));
import { AskAIService, createDrAiStream } from '../src/services/ai/chat/ask-ai-service.js';

const snapshot = JSON.parse(readFileSync(new URL('../../Docs/research/HERB_BEGINNER_GUIDE_PUBLIC_SNAPSHOT_2026-10-06.json', import.meta.url), 'utf8')) as { records: Array<{ id: string; localName: string; scientificName: string; preparationMethod: string }> };
const oregano = snapshot.records.find(record => record.localName === 'Oregano');
if (!oregano) throw new Error('Dated public Oregano fixture missing.');
const history: Content[] = [{ role: 'user', parts: [{ text: 'Explain Coleus amboinicus preparation.' }] }];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.catalog.mockResolvedValue({ herbs: [oregano] });
  mocks.herbs.mockResolvedValue([]);
  mocks.kb.mockResolvedValue([]);
  mocks.exactKb.mockResolvedValue([]);
  mocks.embed.mockResolvedValue([0.1]);
  mocks.answer.mockResolvedValue('Documented Oregano guidance.');
  mocks.stream.mockImplementation(async function* () { yield 'Documented Oregano guidance.'; });
});

const unrelated = [
  'For an educational adult beginner guide, show the sourced preparation for Fictionalia testensis. If that plant is not in the Library, say so and do not invent a preparation or dose.',
  'Show the preparation for Fictionalia testensis if it is in the library.',
];
describe('unambiguous herb follow-up source attribution', () => {
  it.each(unrelated)('does not inherit a prior herb from a later conditional: %s', async question => {
    const response = await AskAIService(question, history);
    expect(response.data?.sources).toEqual([]);
    expect(response.data?.answer).toContain('could not find a verified Herbal-Ai source');
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(mocks.exactKb).not.toHaveBeenCalled();
  });
  it.each(unrelated)('does not stream or cite the prior herb for a new unknown topic: %s', async question => {
    const response = await createDrAiStream(question, history);
    for await (const chunk of response.chunks) expect(chunk).toContain('could not find a verified Herbal-Ai source');
    expect(response.getResult().sources).toEqual([]);
    expect(mocks.stream).not.toHaveBeenCalled();
  });
  it.each(['How is it prepared?', 'Then walk me through its preparation step by step.'])('retains a direct non-streaming follow-up: %s', async question => {
    const response = await AskAIService(question, history);
    expect(response.data?.sources).toContainEqual({ type: 'herb', title: 'Oregano', distance: 0 });
    expect(mocks.answer.mock.calls[0]?.[1]).toContain(oregano.preparationMethod);
    expect(mocks.embed).not.toHaveBeenCalled();
  });
  it.each(['How is it prepared?', 'Then walk me through its preparation step by step.'])('retains a direct streaming follow-up: %s', async question => {
    const response = await createDrAiStream(question, history);
    for await (const chunk of response.chunks) expect(chunk).toBe('Documented Oregano guidance.');
    expect(response.getResult().sources).toContainEqual({ type: 'herb', title: 'Oregano', distance: 0 });
    expect(mocks.embed).not.toHaveBeenCalled();
  });
});
