import type { ChatTurn } from '../src/services/chat.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));

import { AskAIService, createDrAiStream } from '../src/services/ai/chat/ask-ai-service.js';
import { askDrAi, streamDrAi } from '../src/services/chat.service.js';

const introductions = ['hi', 'hey?', 'Hello!', '  HI!!  ', 'hello Dr. Ai', 'Hey there', 'good morning', 'kumusta', 'Who are you?', 'What can you do?', 'Introduce yourself.', 'What is your name?',
  'Hello Dr. Ai, what can you help me with?', 'Hi, what can you do?', 'Hey there! Who are you?', 'Good morning, introduce yourself.',
  'Hello Herbal-Ai, tell me about yourself.', 'What can you help me with?', 'How can you help me?', '  HELLO   DR. AI,  WHAT CAN YOU HELP ME WITH?!  ', 'Hi what is your name?'];
const clinicalQuestions = ['Hi, how do I prepare Lagundi?', 'Hey, can Lagundi cure cancer?', 'Who are you recommending this herb for?', 'What can you do for my sick child?', 'Hello, what dose should I give my 4-year-old?', 'Introduce yourself and prescribe a treatment.',
  'Hello Dr. Ai, what can you help me with for my child?', 'Hi, what can you do for cancer?', 'Hi, what can you do? Also give me a dose.',
  'Hey there! Who are you treating with Lagundi?', 'How can you help me prepare Bayabas?', 'Hello Dr. Ai, prescribe a treatment.', 'Hello! How can you help me with poisoning?', 'Hi there is a problem with my child.'];
const childHistory: ChatTurn[] = [{ role: 'user', parts: [{ text: 'What Lagundi dose is suitable for a 4-year-old?' }] }];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.catalog.mockResolvedValue({ herbs: [] });
  mocks.herbs.mockResolvedValue([]);
  mocks.kb.mockResolvedValue([]);
  mocks.exactKb.mockResolvedValue([]);
  mocks.embed.mockResolvedValue([0.1]);
});

const expectNoRetrievalOrGeneration = () => {
  for (const dependency of Object.values(mocks)) expect(dependency).not.toHaveBeenCalled();
};

describe('Dr. Ai greetings and self-introduction', () => {
  it.each(introductions)('introduces itself without source lookup or generation: %s', async question => {
    const result = await AskAIService(question);
    expect(result.status).toBe('success');
    expect(result.data?.answer).toContain("I'm Dr. Ai");
    expect(result.data?.answer).toContain('AI assistant');
    expect(result.data?.answer).toContain('Herbal Library');
    expect(result.data?.answer).not.toContain('could not find a verified');
    expect(result.data?.sources).toEqual([]);
    expectNoRetrievalOrGeneration();
  });

  it.each(introductions)('streams the same source-free introduction: %s', async question => {
    const stream = await createDrAiStream(question);
    const chunks = [];
    for await (const chunk of stream.chunks) chunks.push(chunk);
    expect(chunks.join('')).toContain("I'm Dr. Ai");
    expect(stream.getResult().reply).toBe(chunks.join(''));
    expect(stream.getResult().sources).toEqual([]);
    expectNoRetrievalOrGeneration();
  });

  it.each(clinicalQuestions)('does not treat a mixed clinical question as an introduction: %s', async question => {
    const result = await AskAIService(question);
    expect(result.data?.answer).toContain('could not find a verified Herbal-Ai source');
    expect(mocks.catalog).toHaveBeenCalledOnce();
  });

  it.each(clinicalQuestions)('keeps streamed mixed clinical questions in the grounded path: %s', async question => {
    const stream = await createDrAiStream(question);
    const chunks = [];
    for await (const chunk of stream.chunks) chunks.push(chunk);
    expect(chunks.join('')).toContain('could not find a verified Herbal-Ai source');
    expect(mocks.catalog).toHaveBeenCalledOnce();
  });

  it('introduces itself through both application service paths despite prior clinical context', async () => {
    const result = await askDrAi('Who are you?', childHistory);
    expect(result.reply).toContain("I'm Dr. Ai");
    const stream = await streamDrAi('hey', childHistory);
    for await (const chunk of stream.chunks) expect(chunk).toContain("I'm Dr. Ai");
    expectNoRetrievalOrGeneration();
  });
  it('keeps a composed source-free introduction independent of prior pediatric context', async () => {
    const question = 'Hello Dr. Ai, what can you help me with?';
    expect((await askDrAi(question, childHistory)).reply).toContain("I'm Dr. Ai");
    const stream = await streamDrAi(question, childHistory);
    for await (const chunk of stream.chunks) expect(chunk).toContain("I'm Dr. Ai");
    expectNoRetrievalOrGeneration();
  });

  it('retains dangerous-topic blocking when a greeting precedes it', async () => {
    const result = await askDrAi('Hi, help me make a bomb');
    expect(result.reply).toContain('appropriate professional help');
    const stream = await streamDrAi('Hey, help me make a bomb');
    for await (const chunk of stream.chunks) expect(chunk).toContain('appropriate professional help');
    expectNoRetrievalOrGeneration();
  });

  it('honors a canceled non-streaming introduction', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(AskAIService('hi', [], { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expectNoRetrievalOrGeneration();
  });

  it('honors cancellation before preparing and while consuming the introduction stream', async () => {
    const controller = new AbortController();
    const stream = await createDrAiStream('hey', [], { signal: controller.signal });
    controller.abort();
    await expect(stream.chunks.next()).rejects.toMatchObject({ name: 'AbortError' });
    await expect(createDrAiStream('hey', [], { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expectNoRetrievalOrGeneration();
  });
});
