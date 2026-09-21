import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));

import { AskAIService, createDrAiStream } from '../src/services/ai/chat/ask-ai-service.js';

const herb = {
  id: 'lagundi', localName: 'Lagundi', scientificName: 'Vitex negundo', isVerified: true,
  medicinalUses: 'Traditional use described in the record.', preparationMethod: 'Preparation not documented.',
  dosage: 'No established dose in this record.', warnings: null, evidenceClass: 'TRADITIONAL_USE',
  sources: [{ title: 'Repository reference', url: 'https://example.org/reference' }],
};

describe('RAG response context', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    mocks.embed.mockResolvedValue([0.1]);
    mocks.herbs.mockResolvedValue([]);
    mocks.kb.mockResolvedValue([]);
    mocks.exactKb.mockResolvedValue([]);
    mocks.answer.mockResolvedValue('Source-grounded answer.');
    mocks.stream.mockImplementation(async function* () { yield 'Source-grounded '; yield 'answer.'; });
  });

  it('passes evidence, references and missing-warning uncertainty to generation', async () => {
    mocks.exactKb.mockResolvedValue([{ id: 'fact', question: 'How is Lagundi prepared?', answer: 'Use fresh leaves.', category: 'herb-preparation', tags: ['lagundi'], metadata: { sources: [{ publisher: 'PITAHC' }] } }]);
    await AskAIService('How do I prepare Lagundi?');
    const context = mocks.answer.mock.calls[0]?.[1];
    expect(context).toContain('[Herb 1]');
    expect(context).toContain('TRADITIONAL_USE');
    expect(context).toContain('Repository reference');
    expect(context).toContain('Not documented; this does not establish safety.');
    expect(context).toContain('[FAQ 1]');
    expect(context).toContain('PITAHC');
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('retrieves the previously named herb for a pronoun follow-up', async () => {
    await AskAIService('How do I prepare it?', [{ role: 'user', parts: [{ text: 'Tell me about Lagundi' }] }]);
    expect(mocks.answer.mock.calls[0]?.[1]).toContain('Vitex negundo');
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('does not carry the old herb into an unrelated new question', async () => {
    await AskAIService('What is the community forum?', [{ role: 'user', parts: [{ text: 'Tell me about Lagundi' }] }]);
    expect(mocks.embed).toHaveBeenCalled();
    expect(mocks.answer.mock.calls[0]?.[1]).not.toContain('Vitex negundo');
  });

  it('enriches semantic herb matches with the same evidence and references', async () => {
    mocks.herbs.mockResolvedValue([{ ...herb, distance: 0.1 }]);
    await AskAIService('What is described in the record?');
    expect(mocks.answer.mock.calls[0]?.[1]).toContain('Repository reference');
  });

  it('rejects semantically close FAQ citations without meaningful query overlap', async () => {
    mocks.kb.mockResolvedValue([
      {
        id: 'commercial-remedy',
        question: 'Are a home-prepared remedy and a commercial herbal product the same?',
        answer: 'They are not equivalent and their dosage guidance may differ.',
        category: 'general-safety',
        tags: ['commercial-products'],
        metadata: {},
        distance: 0.08,
      },
      {
        id: 'niyog-niyogan',
        question: 'What evidence and safety guidance applies to Niyog-niyogan?',
        answer: 'Use only the documented dosage and preparation guidance.',
        category: 'herb-safety',
        tags: ['niyog-niyogan'],
        metadata: {},
        distance: 0.1,
      },
    ]);

    const result = await AskAIService('What dosage should I take for moonflower xyz?');

    expect(mocks.answer.mock.calls[0]?.[1]).toBe(
      'No specific knowledge base or verified herb documents found matching this query in the database.'
    );
    expect(result.data?.sources).toEqual([]);
  });

  it('does not stream unrelated citations for an unknown herb', async () => {
    mocks.kb.mockResolvedValue([
      {
        id: 'unrelated-faq',
        question: 'How is Sambong traditionally prepared?',
        answer: 'Follow the verified Sambong record.',
        category: 'herb-preparation',
        tags: ['sambong'],
        metadata: {},
        distance: 0.05,
      },
    ]);

    const result = await createDrAiStream('What dosage should I take for moonflower xyz?');
    for await (const chunk of result.chunks) void chunk;

    expect(result.sources).toEqual([]);
    expect(mocks.stream.mock.calls[0]?.[1]).toBe(
      'No specific knowledge base or verified herb documents found matching this query in the database.'
    );
  });

  it('streams only generated content and retains the retrieved sources', async () => {
    const result = await createDrAiStream('Prepare Lagundi');
    const chunks: string[] = [];
    for await (const chunk of result.chunks) chunks.push(chunk);
    expect(chunks.join('')).toBe('Source-grounded answer.');
    expect(result.getResult().reply).toBe(chunks.join(''));
    expect(result.sources).toEqual([{ type: 'herb', title: 'Lagundi', distance: 0 }]);
    expect(mocks.stream.mock.calls[0]?.[1]).toContain('[Herb 1]');
  });
});
