import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));

import { AskAIService, createDrAiStream, withoutPediatricQuantities } from '../src/services/ai/chat/ask-ai-service.js';

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

  it('does not read the catalog for an already canceled request', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(createDrAiStream('Lagundi', [], { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.catalog).not.toHaveBeenCalled();
  });

  it('stops waiting for catalog retrieval and does not start a later provider call', async () => {
    const controller = new AbortController();
    let release!: (value: unknown) => void;
    mocks.catalog.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const outcome = createDrAiStream('Lagundi', [], { signal: controller.signal }).catch(error => error);
    await vi.waitFor(() => expect(mocks.catalog).toHaveBeenCalledOnce());
    controller.abort();
    expect((await outcome).name).toBe('AbortError');
    release({ herbs: [herb] });
    await Promise.resolve();
    expect(mocks.exactKb).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('does not turn embedding cancellation into a successful retrieval-unavailable fallback', async () => {
    const controller = new AbortController();
    mocks.embed.mockImplementation(async (_question, options) => {
      expect(options.signal).toBe(controller.signal);
      controller.abort();
      throw controller.signal.reason;
    });
    await expect(createDrAiStream('Unknown plant', [], { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.stream).not.toHaveBeenCalled();
    expect(mocks.herbs).not.toHaveBeenCalled();
  });

  it('does not emit a source-only fallback after generation is canceled', async () => {
    const controller = new AbortController();
    mocks.stream.mockImplementation(async function* (_question, _context, _history, options) {
      expect(options.signal).toBe(controller.signal);
      controller.abort();
      throw controller.signal.reason;
    });
    const result = await createDrAiStream('Lagundi', [], { signal: controller.signal });
    await expect(result.chunks.next()).rejects.toMatchObject({ name: 'AbortError' });
    expect(result.getResult().reply).toBe('');
  });

  it('does not include child-age dosage tables for a general evidence question', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...herb, dosage: 'Ages 2–4: 3 leaves; adults: 7 leaves.' }] });
    mocks.exactKb.mockResolvedValue([{
      id: 'lagundi-preparation',
      question: 'How is Lagundi prepared?',
      answer: 'Use crushed fresh leaves. The amount is age-based: 1½ tablespoons for ages 2–6, 3 tablespoons for ages 7–12, and 6 tablespoons for ages 13 and above. The finished-liquid dose is not stated.',
      category: 'herb-preparation',
      tags: ['lagundi'],
      metadata: { sources: [{ title: 'PITAHC Lagundi record' }] },
    }]);

    await AskAIService('What does the Lagundi record say about evidence, preparation, and safety?');

    expect(mocks.answer.mock.calls[0]?.[1]).not.toContain('Ages 2–4');
    expect(mocks.answer.mock.calls[0]?.[1]).not.toContain('1½ tablespoons');
    expect(mocks.answer.mock.calls[0]?.[1]).toContain('finished-liquid dose is not stated');
    expect(mocks.answer.mock.calls[0]?.[1]).toContain('PITAHC Lagundi record');
  });

  it('does not expose a pediatric table when generated answers are unavailable', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...herb, dosage: 'Ages 2–4: 3 leaves; adults: 7 leaves.' }] });
    mocks.exactKb.mockResolvedValue([{
      id: 'lagundi-preparation',
      question: 'How is Lagundi prepared?',
      answer: 'Use crushed fresh leaves. The amount is age-based: 1½ tablespoons for ages 2–6, and 3 tablespoons for ages 7–12. The finished-liquid dose is not stated.',
      category: 'herb-preparation', tags: ['lagundi'], metadata: {},
    }]);
    mocks.answer.mockRejectedValue(new Error('provider unavailable'));

    const result = await AskAIService('What does the Lagundi record say about preparation?');

    expect(result.data?.answer).not.toContain('1½ tablespoons');
    expect(result.data?.answer).toContain('finished-liquid dose is not stated');
  });

  it('omits age-based quantities from the bundled verified FAQ records', async () => {
    const { readFile } = await import('node:fs/promises');
    for (const file of ['lagundi.json', 'pitahc-nine-herbs.json']) {
      const records = JSON.parse(await readFile(new URL(`../content/knowledge-base/${file}`, import.meta.url), 'utf8')) as Array<{ answer: string }>;
      for (const record of records) {
        const cleaned = withoutPediatricQuantities(record.answer);
        if (/for ages? \d/i.test(record.answer)) {
          expect(cleaned).not.toMatch(/for ages? \d/i);
        }
      }
    }
  });

  it('withholds a pediatric age table on separate lines without sentence punctuation', () => {
    const cleaned = withoutPediatricQuantities('Adult preparation: boil fresh leaves.\nChildren 2–4 years: 3 leaves\nKeep away from infants.');
    expect(cleaned).toContain('Adult preparation: boil fresh leaves.');
    expect(cleaned).not.toContain('3 leaves');
    expect(cleaned).toContain('Keep away from infants.');
  });

  it('answers a pediatric question without generating or exposing quantities', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...herb, dosage: 'Ages 2–4: 3 leaves; adults: 7 leaves.' }] });

    const result = await AskAIService('How should I prepare Lagundi for a three-year-old?');

    expect(mocks.answer).not.toHaveBeenCalled();
    expect(result.data?.answer).toContain('licensed clinician');
    expect(result.data?.answer).not.toContain('3 leaves');
  });

  it('withholds pediatric quantities in the streaming response too', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...herb, dosage: 'Ages 2–4: 3 leaves; adults: 7 leaves.' }] });

    const result = await createDrAiStream('Can my child take Lagundi?');
    const chunks: string[] = [];
    for await (const chunk of result.chunks) chunks.push(chunk);

    expect(mocks.stream).not.toHaveBeenCalled();
    expect(chunks.join('')).toContain('licensed clinician');
    expect(chunks.join('')).not.toContain('3 leaves');
  });

  it('recognizes abbreviated child ages and pediatric follow-up questions', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [{ ...herb, dosage: 'Ages 2–4: 3 leaves.' }] });

    const abbreviated = await AskAIService('How much Lagundi for a 3yo?');
    const followUp = await AskAIService('How much should I give it?', [
      { role: 'user', parts: [{ text: 'Can my child use Lagundi?' }] },
    ]);

    expect(mocks.answer).not.toHaveBeenCalled();
    expect(abbreviated.data?.answer).not.toContain('3 leaves');
    expect(followUp.data?.answer).toContain('licensed clinician');
    expect(followUp.data?.answer).not.toContain('3 leaves');
  });

  it('routes a month-old infant question away from generated preparation guidance', async () => {
    const result = await AskAIService('Can I prepare Lagundi for my 6-month-old?');

    expect(mocks.answer).not.toHaveBeenCalled();
    expect(result.data?.answer).toContain('licensed clinician');
  });

  it('retrieves the previously named herb for a pronoun follow-up', async () => {
    await AskAIService('How do I prepare it?', [{ role: 'user', parts: [{ text: 'Tell me about Lagundi' }] }]);
    expect(mocks.answer.mock.calls[0]?.[1]).toContain('Vitex negundo');
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('does not carry the old herb into an unrelated new question', async () => {
    const result = await AskAIService('What is the community forum?', [{ role: 'user', parts: [{ text: 'Tell me about Lagundi' }] }]);
    expect(mocks.embed).toHaveBeenCalled();
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(result.data?.answer).not.toContain('Vitex negundo');
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

    expect(mocks.answer).not.toHaveBeenCalled();
    expect(result.data?.sources).toEqual([]);
    expect(result.data?.answer).toContain('could not find a verified Herbal-Ai source');
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
    expect(mocks.stream).not.toHaveBeenCalled();
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

  it('returns cited repository fields rather than a provider error when generation fails', async () => {
    mocks.answer.mockRejectedValue(new Error('provider unavailable'));

    const result = await AskAIService('Unsa ang gamit sa Lagundi?');

    expect(result.status).toBe('success');
    expect(result.data?.sources).toEqual([{ type: 'herb', title: 'Lagundi', distance: 0 }]);
    expect(result.data?.answer).toContain('Traditional use described in the record.');
    expect(result.data?.answer).toContain('Not documented; this does not establish safety.');
    expect(result.data?.answer).not.toContain('provider unavailable');
  });

  it('provides a source-only streamed fallback for a known herb', async () => {
    mocks.stream.mockImplementation(async function* () { throw new Error('stream interrupted'); });

    const result = await createDrAiStream('How is Lagundi prepared?');
    const chunks: string[] = [];
    for await (const chunk of result.chunks) chunks.push(chunk);

    expect(chunks.join('')).toContain('Preparation not documented.');
    expect(chunks.join('')).not.toContain('stream interrupted');
    expect(result.getResult().reply).toBe(chunks.join(''));
    expect(result.sources[0]?.title).toBe('Lagundi');
  });

  it('refuses an unknown-herb cure claim when generation fails', async () => {
    mocks.stream.mockImplementation(async function* () { throw new Error('model unavailable'); });

    const result = await createDrAiStream('Can Testus nonexistentus cure cancer?');
    const chunks: string[] = [];
    for await (const chunk of result.chunks) chunks.push(chunk);

    expect(result.sources).toEqual([]);
    expect(chunks.join('')).toContain('could not find a verified Herbal-Ai source');
    expect(chunks.join('')).toContain('cannot confirm treatment or cure claims');
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('makes no cure claim when retrieval and generation are unavailable', async () => {
    mocks.embed.mockRejectedValue(new Error('embedding unavailable'));
    mocks.stream.mockImplementation(async function* () { throw new Error('model unavailable'); });

    const result = await createDrAiStream('Can Testus nonexistentus cure cancer?');
    const chunks: string[] = [];
    for await (const chunk of result.chunks) chunks.push(chunk);

    expect(result.sources).toEqual([]);
    expect(chunks.join('')).toContain('could not check the Herbal-Ai sources');
    expect(chunks.join('')).toContain('cannot verify this claim');
    expect(chunks.join('')).not.toContain('model unavailable');
    expect(mocks.stream).not.toHaveBeenCalled();
  });
});
