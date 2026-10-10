import type { ChatTurn } from '../src/services/chat.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));

import { AskAIService, createDrAiStream } from '../src/services/ai/chat/ask-ai-service.js';

const herb = {
  id: 'isolated-fever-record', localName: 'Fixture herb', scientificName: 'Fixture species',
  publicationStatus: 'PUBLISHED', isVerified: true, medicinalUses: 'Traditional fever use is reported; clinical efficacy is not established.',
  preparationMethod: 'No complete preparation is documented.', dosage: 'No established treatment dose.',
  warnings: 'Do not substitute this report for medical care.', evidenceClass: 'DOCUMENTED_TRADITIONAL_USE', sources: [], distance: 0.12,
};
const question = 'mag suggest ka nga nang gamot para sa lagnat';
const questions = [question, 'Anong halamang gamot para sa lagnat?', 'May gamot ba sa lagnat?', 'Unsay tanom para sa hilanat?', 'What documented herbal uses mention fever?'];
const previousHerb = { ...herb, id: 'previous-herb', localName: 'Bayabas', scientificName: 'Psidium guajava', medicinalUses: 'Traditional wound care.' };
const history: ChatTurn[] = [
  { role: 'user', parts: [{ text: 'Are there any warnings for bayabas leaves?' }] },
  { role: 'model', parts: [{ text: 'Review the warnings in the Bayabas record.' }] },
];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.catalog.mockResolvedValue({ herbs: [herb] });
  mocks.herbs.mockResolvedValue([herb]);
  mocks.kb.mockResolvedValue([]);
  mocks.exactKb.mockResolvedValue([]);
  mocks.embed.mockResolvedValue([0.1]);
  mocks.answer.mockResolvedValue('Grounded fixture answer, not a prescription.');
  mocks.stream.mockImplementation(async function* () { yield 'Grounded fixture answer, not a prescription.'; });
});

const run = async (streaming: boolean, message: string, turns: ChatTurn[] = []) => {
  if (!streaming) {
    const result = await AskAIService(message, turns);
    expect(result.status).toBe('success');
    return { reply: result.data?.answer, sources: result.data?.sources };
  }
  const result = await createDrAiStream(message, turns);
  for await (const chunk of result.chunks) expect(typeof chunk).toBe('string');
  return result.getResult();
};

describe.each([false, true])('local-language relevance (streaming=%s)', streaming => {
  it.each(questions)('accepts a close English source for the equivalent query: %s', async message => {
    const result = await run(streaming, message);
    expect(result.sources).toEqual([{ type: 'herb', title: herb.localName, distance: herb.distance }]);
    expect(result.reply).toContain('Grounded fixture answer');
    expect(mocks.embed).toHaveBeenCalledWith(message, {});
    const generation = streaming ? mocks.stream : mocks.answer;
    expect(generation).toHaveBeenCalledWith(message, expect.stringContaining(herb.medicinalUses), [], {});
  });

  it('retains the original question/history without carrying Bayabas into the new fever question', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [herb, previousHerb] });
    const result = await run(streaming, question, history);
    expect(result.sources?.map(source => source.title)).toEqual([herb.localName]);
    const generation = streaming ? mocks.stream : mocks.answer;
    expect(generation).toHaveBeenCalledWith(question, expect.not.stringContaining('Psidium guajava'), history, {});
  });

  it('also matches a close fever FAQ without fabricated herb citations', async () => {
    mocks.herbs.mockResolvedValue([]);
    mocks.kb.mockResolvedValue([{ id: 'fixture-faq', question: 'What does the fever record document?', answer: 'Evidence limitations are recorded.', category: 'fixture', tags: [], metadata: {}, distance: 0.12 }]);
    const result = await run(streaming, question);
    expect(result.sources).toEqual([{ type: 'kb', title: 'What does the fever record document?', distance: 0.12 }]);
  });

  it('does not waive the semantic-distance threshold for a translated keyword', async () => {
    mocks.herbs.mockResolvedValue([{ ...herb, distance: 0.9 }]);
    const result = await run(streaming, question);
    expect(result.sources).toEqual([]);
    expect(result.reply).toContain('could not find a verified');
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('does not treat conversational filler as evidence for an unrelated record', async () => {
    mocks.herbs.mockResolvedValue([{ ...herb, medicinalUses: 'Traditional wound care.', warnings: 'Review skin safety.' }]);
    const result = await run(streaming, question);
    expect(result.sources).toEqual([]);
    expect(result.reply).toContain('could not find a verified');
  });

  it('does not translate a substring into a fever match', async () => {
    const result = await run(streaming, 'gamot para sa lagnatinxyz');
    expect(result.sources).toEqual([]);
  });

  it('preserves pediatric recipe/dose restrictions after language matching', async () => {
    const result = await run(streaming, 'gamot para sa lagnat ng bata');
    expect(result.sources?.map(source => source.title)).toEqual([herb.localName]);
    expect(result.reply).toContain('cannot provide child-specific preparation or dosing guidance');
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('retains only repository wording when generation is unavailable', async () => {
    mocks.answer.mockRejectedValue(new Error('isolated provider failure'));
    mocks.stream.mockImplementation(async function* () { throw new Error('isolated provider failure'); });
    const result = await run(streaming, question);
    expect(result.sources?.map(source => source.title)).toEqual([herb.localName]);
    expect(result.reply).toContain(herb.medicinalUses);
    expect(result.reply).toContain(herb.preparationMethod);
    expect(result.reply).toContain('translation and synthesis are unavailable');
  });

  it('does not claim successful source retrieval when embedding fails', async () => {
    mocks.embed.mockRejectedValue(new Error('isolated embedding failure'));
    const result = await run(streaming, question);
    expect(result.sources).toEqual([]);
    expect(result.reply).toContain('could not check the Herbal-Ai sources');
    expect(mocks.herbs).not.toHaveBeenCalled();
  });
});
