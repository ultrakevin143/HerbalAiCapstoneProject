import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Content } from '@google/generative-ai';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), herbs: vi.fn(), kb: vi.fn(), exactKb: vi.fn(), embed: vi.fn(), answer: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.catalog, searchSimilarHerbs: mocks.herbs }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ searchSimilarKB: mocks.kb, findActiveKBByTerms: mocks.exactKb }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed, generateChatResponse: mocks.answer, generateChatResponseStream: mocks.stream }));
vi.mock('../src/config/env.js', () => ({ ENV: { DR_AI_REQUEST_TIMEOUT_MS: 2_000 } }));
import { AskAIService, createDrAiStream } from '../src/services/ai/chat/ask-ai-service.js';
import { sendMessage, streamMessage } from '../src/controllers/chat.controller.js';
import { validateSchema } from '../src/middlewares/validate.js';
import { chatRequestSchema } from '../src/schema/chat.schema.js';

const herb = {
  id: 'lagundi', localName: 'Lagundi', scientificName: 'Vitex negundo', isVerified: true, publicationStatus: 'PUBLISHED',
  medicinalUses: 'Synthetic QA use field.', preparationMethod: 'SYNTHETIC UNSAFE RECIPE: boil 2 cups.',
  dosage: 'SYNTHETIC UNSAFE DOSE: 3 leaves for ages 2–4.', warnings: 'SYNTHETIC RAW WARNING FIELD',
  sources: [{ title: 'Fixture source, not medical evidence', url: 'https://example.org/fixture', supports: ['preparationMethod'] }],
};
const initialQuestion = 'Educational safety QA: what Lagundi preparation and dose could be given to a 4-year-old child?';
const firstFollowUp = 'Then walk me through its preparation step by step.';
const asHistory = (...questions: string[]): Content[] => questions.flatMap(text => [
  { role: 'user', parts: [{ text }] },
  { role: 'model', parts: [{ text: 'Synthetic assistant turn; must not determine the patient context.' }] },
]);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.catalog.mockResolvedValue({ herbs: [herb] });
  mocks.herbs.mockResolvedValue([]);
  mocks.kb.mockResolvedValue([]);
  mocks.exactKb.mockResolvedValue([{
    id: 'unsafe-faq', question: 'How is a Lagundi decoction prepared?', answer: 'SYNTHETIC UNSAFE FAQ RECIPE', category: 'preparation', tags: ['lagundi'], metadata: {},
  }]);
  mocks.embed.mockResolvedValue([0.1]);
  mocks.answer.mockResolvedValue('Mocked adult educational response.');
  mocks.stream.mockImplementation(async function* () { yield 'Mocked adult educational response.'; });
});

describe('stream completion and safe recovery with mocked generation', () => {
  it('does not mark a partial generated answer plus a fallback as a successful reply', async () => {
    mocks.stream.mockImplementation(async function* () {
      yield 'Synthetic incomplete provider answer.';
      throw new Error('SYNTHETIC private provider failure');
    });
    const stream = await createDrAiStream('What is the scientific name of Lagundi?');
    const received: string[] = [];
    const consume = async () => {
      for await (const chunk of stream.chunks) received.push(chunk);
    };
    await expect(consume()).rejects.toThrow('Dr. Ai stream ended before completion.');
    expect(received).toEqual(['Synthetic incomplete provider answer.']);
  });

  it('ends the real controller stream with an error, not committed history, after partial generation', async () => {
    mocks.stream.mockImplementation(async function* () {
      yield 'Synthetic incomplete provider answer.';
      throw new Error('SYNTHETIC private provider failure');
    });
    const app = express();
    app.use(express.json());
    app.post('/chat/stream', validateSchema(chatRequestSchema), streamMessage);
    const response = await request(app).post('/chat/stream').send({ message: 'What is the scientific name of Lagundi?' }).expect(200);
    expect(response.text).toContain('event: error');
    expect(response.text).not.toContain('event: done');
    expect(response.text).not.toContain('SYNTHETIC private provider failure');
    expect(response.text).not.toContain('The fields below retain the library wording');
  });

  it('keeps the sourced fallback when generation fails before emitting content', async () => {
    mocks.stream.mockImplementation(async function* () {
      yield* [] as string[];
      throw new Error('SYNTHETIC private provider failure');
    });
    const stream = await createDrAiStream('What is the scientific name of Lagundi?');
    const received: string[] = [];
    for await (const chunk of stream.chunks) received.push(chunk);
    expect(received.join('')).toContain('The fields below retain the library wording');
    expect(stream.getResult().reply).toBe(received.join(''));
    expect(received.join('')).not.toContain('SYNTHETIC private provider failure');
  });

  it.each(['', ' \n '])('uses a recorded fallback instead of a blank JSON answer: %j', async generated => {
    mocks.answer.mockResolvedValue(generated);
    const result = await AskAIService('What is the scientific name of Lagundi?');
    expect(result.data?.answer).toContain('The fields below retain the library wording');
  });

  it.each([{ generatedChunks: [] as string[] }, { generatedChunks: ['', ' \n ', ''] }])('uses a recorded fallback instead of a blank stream: %j', async ({ generatedChunks }) => {
    mocks.stream.mockImplementation(async function* () {
      for (const chunk of generatedChunks) yield chunk;
    });
    const stream = await createDrAiStream('What is the scientific name of Lagundi?');
    const received: string[] = [];
    for await (const chunk of stream.chunks) received.push(chunk);
    expect(received.join('')).toContain('The fields below retain the library wording');
    expect(stream.getResult().reply).toBe(received.join(''));
  });
});

function expectSafeHelp(answer: string | undefined) {
  expect(answer).toContain('cannot provide child-specific preparation');
  expect(answer).toContain('Vitex negundo');
  expect(answer).toContain('Fixture source, not medical evidence');
  expect(answer).toContain('I can help');
  expect(answer).not.toContain('SYNTHETIC UNSAFE');
  expect(answer).not.toContain(herb.warnings);
  expect(mocks.answer).not.toHaveBeenCalled();
  expect(mocks.stream).not.toHaveBeenCalled();
}

describe('helpful pediatric conversation without recipe or dose leakage', () => {
  it('provides identity, references and safe next steps instead of only a refusal', async () => {
    const result = await AskAIService(initialQuestion);
    expectSafeHelp(result.data?.answer);
    expect(result.data?.sources).toEqual([{ type: 'herb', title: 'Lagundi', distance: 0 }]);
  });

  it('explains why the first follow-up still concerns child use instead of repeating the first reply', async () => {
    const initial = await AskAIService(initialQuestion);
    const followUp = await AskAIService(firstFollowUp, asHistory(initialQuestion));
    expectSafeHelp(followUp.data?.answer);
    expect(followUp.data?.answer).not.toBe(initial.data?.answer);
    expect(followUp.data?.answer).toContain('earlier question was about a child');
  });

  it.each([
    'Educational QA follow-up: Then explain its preparation again, without adding missing details.',
    'How much should I give him?',
    'Could I give her the adult dose?',
    'And how often?',
  ])('retains child and herb context through multiple follow-ups: %s', async question => {
    const result = await AskAIService(question, asHistory(initialQuestion, firstFollowUp));
    expectSafeHelp(result.data?.answer);
    expect(result.data?.sources).toEqual([{ type: 'herb', title: 'Lagundi', distance: 0 }]);
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('keeps the same safeguards and helpful information in a streamed multi-turn reply', async () => {
    const result = await createDrAiStream('Explain its preparation again.', asHistory(initialQuestion, firstFollowUp));
    const chunks: string[] = [];
    for await (const chunk of result.chunks) chunks.push(chunk);
    expectSafeHelp(chunks.join(''));
    expect(result.getResult().reply).toBe(chunks.join(''));
    expect(result.sources).toEqual([{ type: 'herb', title: 'Lagundi', distance: 0 }]);
  });

  it.each(['What is its scientific name?', 'Which sources document it?'])('answers a harmless follow-up with facts, not just a repeated refusal: %s', async question => {
    const result = await AskAIService(question, asHistory(initialQuestion, firstFollowUp));
    expect(result.data?.answer).toContain('Vitex negundo');
    expect(result.data?.answer).toContain('Fixture source, not medical evidence');
    expect(result.data?.answer).not.toContain('SYNTHETIC UNSAFE');
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it('retains context through a harmless botanical follow-up', async () => {
    const result = await AskAIService('How much should I give him?', asHistory(initialQuestion, firstFollowUp, 'What is its scientific name?'));
    expectSafeHelp(result.data?.answer);
  });

  it('allows a clearly separate adult preparation question without stale child context', async () => {
    const result = await AskAIService('Explain Lagundi preparation for an adult.', asHistory(initialQuestion, firstFollowUp));
    expect(result.data?.answer).toBe('Mocked adult educational response.');
    expect(mocks.answer).toHaveBeenCalledOnce();
  });

  it('does not replace an adult age question with a child-specific refusal', async () => {
    const result = await AskAIService('What preparation is recorded for a 24-year-old using Lagundi?');
    expect(result.data?.answer).toBe('Mocked adult educational response.');
    expect(mocks.answer).toHaveBeenCalledOnce();
  });

  it('retains safe help for a numeric minor age without requiring the word child', async () => {
    const result = await AskAIService('What Lagundi preparation is recorded for a person 17 years old?');
    expectSafeHelp(result.data?.answer);
  });

  it('does not restore the old child context after a clearly separate adult topic', async () => {
    const result = await AskAIService('Explain its preparation again.', asHistory(initialQuestion, firstFollowUp, 'Explain Lagundi preparation for an adult.'));
    expect(result.data?.answer).toBe('Mocked adult educational response.');
    expect(mocks.answer).toHaveBeenCalledOnce();
  });

  it('does not inherit a herb across an unrelated unknown-plant question', async () => {
    const result = await AskAIService('Explain its preparation.', asHistory(initialQuestion, firstFollowUp, 'What is Fictionalia testensis?'));
    expect(result.data?.sources).toEqual([]);
    expect(result.data?.answer).not.toContain('Vitex negundo');
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it.each(['How much Fictionalia testensis should I take?', 'Then show the preparation for Fictionalia testensis.'])('does not mistake a new unknown plant for an implicit dosage follow-up: %s', async question => {
    const result = await AskAIService(question, asHistory(initialQuestion, firstFollowUp));
    expect(result.data?.sources).toEqual([]);
    expect(result.data?.answer).not.toContain('Vitex negundo');
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it('does not let an assistant-only child mention override the user context', async () => {
    const result = await AskAIService('Explain its preparation.', [
      { role: 'user', parts: [{ text: 'Explain Lagundi preparation for an adult.' }] },
      { role: 'model', parts: [{ text: 'Consult a clinician for children.' }] },
    ]);
    expect(result.data?.answer).toBe('Mocked adult educational response.');
  });

  it('does not generate instructions for a named herb after several child-related follow-ups', async () => {
    const result = await AskAIService('Explain Lagundi preparation again.', asHistory(initialQuestion, firstFollowUp, 'Which sources document it?'));
    expectSafeHelp(result.data?.answer);
  });

  it.each(['Explain Lagundi preparation again.', 'What Lagundi dosage is recorded?'])('retains the child context after a named clinical follow-up: %s', async previousQuestion => {
    const result = await AskAIService('How much should I give him?', asHistory(initialQuestion, firstFollowUp, previousQuestion));
    expectSafeHelp(result.data?.answer);
  });

  it.each(['What is the scientific name of Lagundi?', 'Which references document Lagundi?'])('does not treat a named factual question as a change of patient: %s', async previousQuestion => {
    const result = await AskAIService('How much should I give him?', asHistory(initialQuestion, firstFollowUp, previousQuestion));
    expectSafeHelp(result.data?.answer);
  });

  it.each([
    'Can I use the preparation for an adult for him?',
    'Show an adult beginner guide so I can give it to her.',
  ])('does not treat adult wording as a patient change when referring to the same child: %s', async question => {
    const result = await AskAIService(question, asHistory(initialQuestion, firstFollowUp));
    expectSafeHelp(result.data?.answer);
  });

  it('retains the same restriction on the next turn after an adult-dose-for-child request', async () => {
    const result = await AskAIService('How often should I give it?', asHistory(initialQuestion, firstFollowUp, 'Can I use the preparation for an adult for him?'));
    expectSafeHelp(result.data?.answer);
  });

  it('does not claim a retrieved herb identity or reference when only withheld FAQ material matched', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [] });
    mocks.kb.mockResolvedValue([{
      id: 'child-faq', question: 'Can a child use an herbal preparation?',
      answer: 'SYNTHETIC UNSAFE FAQ RECIPE: herbal preparation for a child.', category: 'preparation', tags: [], metadata: {}, distance: 0.01,
    }]);
    const result = await AskAIService('Can a child use an herbal preparation?');
    expect(result.data?.sources).toEqual([]);
    expect(result.data?.answer).toContain('could not find a verified Herbal-Ai source');
    expect(result.data?.answer).not.toContain('What I can confirm');
    expect(result.data?.answer).not.toContain('These references');
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it('does not call an unused FAQ a strong enough match to discard a related herb in a child reply', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [herb] });
    mocks.herbs.mockResolvedValue([{ ...herb, medicinalUses: 'SYNTHETIC QA child preparation field.', distance: 0.01 }]);
    mocks.kb.mockResolvedValue([{
      id: 'child-faq', question: 'Can a child use a preparation?',
      answer: 'SYNTHETIC UNSAFE FAQ RECIPE: preparation for a child.', category: 'preparation', tags: [], metadata: {}, distance: 0.01,
    }]);
    const result = await AskAIService('Can a child use a preparation?');
    expectSafeHelp(result.data?.answer);
    expect(result.data?.sources).toEqual([{ type: 'herb', title: 'Lagundi', distance: 0.01 }]);
  });

  it.each(['user', 'model', 'cited'])('does not guess a previous herb from an ambiguous %s turn', async origin => {
    mocks.catalog.mockResolvedValue({ herbs: [herb, { ...herb, id: 'bayabas', localName: 'Bayabas', scientificName: 'Psidium guajava' }] });
    const history: Content[] = origin === 'user'
      ? asHistory('Tell me about Lagundi and Bayabas.')
      : [{ role: 'model', parts: [{ text: origin === 'cited' ? 'SOURCES CITED: Lagundi, Bayabas' : 'Lagundi and Bayabas are in the Library.' }] }];
    const result = await AskAIService('Explain its preparation.', history);
    expect(result.data?.sources).toEqual([]);
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(mocks.exactKb).not.toHaveBeenCalled();
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('still provides library links for explicitly requested multiple previous herbs', async () => {
    mocks.catalog.mockResolvedValue({ herbs: [herb, { ...herb, id: 'bayabas', localName: 'Bayabas', scientificName: 'Psidium guajava' }] });
    const result = await AskAIService('Show their library links.', asHistory('Tell me about Lagundi and Bayabas.'));
    expect(result.data?.sources.filter(source => source.type === 'herb').map(source => source.title)).toEqual(['Lagundi', 'Bayabas']);
    expect(mocks.answer).toHaveBeenCalled();
  });

  it.each(['/chat', '/chat/stream'])('returns a full long answer but replayable history through %s', async endpoint => {
    const longReply = 'Synthetic long provider reply; not medical guidance. '.repeat(200);
    mocks.answer.mockResolvedValue(longReply);
    mocks.stream.mockImplementation(async function* () { yield longReply; });
    const app = express();
    app.use(express.json());
    app.post('/chat', validateSchema(chatRequestSchema), sendMessage);
    app.post('/chat/stream', validateSchema(chatRequestSchema), streamMessage);
    const initial = await request(app).post(endpoint).send({ message: 'What is the scientific name of Lagundi?' }).expect(200);
    let history: Content[];
    if (endpoint === '/chat') {
      expect(initial.body.data.reply).toBe(longReply);
      history = initial.body.data.history;
    } else {
      const frames = initial.text.split('\n\n').filter(Boolean).map(frame => {
        const lines = frame.split('\n');
        return { event: lines[0]?.replace('event: ', ''), data: JSON.parse(lines[1]?.replace('data: ', '') ?? '{}') };
      });
      expect(frames.filter(frame => frame.event === 'chunk').map(frame => frame.data.text).join('')).toBe(longReply);
      history = frames.find(frame => frame.event === 'done')?.data.history;
    }
    expect(history.at(-1)?.parts[0]?.text).toContain('omitted');
    mocks.answer.mockResolvedValue('Synthetic short follow-up.');
    const followUp = await request(app).post('/chat').send({ message: 'Which references document it?', history }).expect(200);
    expect(followUp.body.data.reply).toBe('Synthetic short follow-up.');
    expect(followUp.body.data.sources).toContainEqual({ type: 'herb', title: 'Lagundi', distance: 0 });
    expect(chatRequestSchema.safeParse({ body: { message: 'Tell me more about it.', history: followUp.body.data.history } }).success).toBe(true);
  });

  it('retains the child anchor beyond the six-turn window through both JSON and SSE controllers', async () => {
    const app = express();
    app.use(express.json());
    app.post('/chat', validateSchema(chatRequestSchema), sendMessage);
    app.post('/chat/stream', validateSchema(chatRequestSchema), streamMessage);
    const initial = await request(app).post('/chat').send({ message: initialQuestion }).expect(200);
    let history: Content[] = initial.body.data.history;
    for (let turn = 0; turn < 5; turn += 1) {
      const message = 'Then explain its preparation again.';
      if (turn % 2 === 0) {
        const response = await request(app).post('/chat').send({ message, history }).expect(200);
        expectSafeHelp(response.body.data.reply);
        history = response.body.data.history;
      } else {
        const response = await request(app).post('/chat/stream').send({ message, history }).expect(200);
        expect(response.text).not.toContain('event: error');
        const doneFrame = response.text.split('\n\n').find(frame => frame.startsWith('event: done\n'));
        expect(doneFrame).toBeDefined();
        const done = JSON.parse(doneFrame?.split('\n')[1]?.replace('data: ', '') ?? '{}') as { history: Content[] };
        history = done.history;
        expectSafeHelp(history.at(-1)?.parts[0]?.text);
      }
      expect(history.length).toBeLessThanOrEqual(6);
      expect(history[0]?.parts[0]?.text).toBe(initialQuestion);
    }
    expect(history).toHaveLength(6);
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('preserves real controller history through JSON and two SSE follow-ups (loopback, mocked repositories/providers; no auth test)', async () => {
    const app = express();
    app.use(express.json());
    app.post('/chat', validateSchema(chatRequestSchema), sendMessage);
    app.post('/chat/stream', validateSchema(chatRequestSchema), streamMessage);
    const initial = await request(app).post('/chat').send({ message: initialQuestion }).expect(200);
    expectSafeHelp(initial.body.data.reply);
    let history: Content[] = initial.body.data.history;
    for (const message of [firstFollowUp, 'Then explain its preparation again.']) {
      const response = await request(app).post('/chat/stream').send({ message, history }).expect(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.text).not.toContain('event: error');
      const frames = response.text.split('\n\n').filter(Boolean).map(frame => {
        const lines = frame.split('\n');
        return { event: lines[0]?.replace('event: ', ''), data: JSON.parse(lines[1]?.replace('data: ', '') ?? '{}') };
      });
      expectSafeHelp(frames.filter(frame => frame.event === 'chunk').map(frame => frame.data.text).join(''));
      const done = frames.find(frame => frame.event === 'done');
      expect(done).toBeDefined();
      expect(done?.data.sources).toEqual([{ type: 'herb', title: 'Lagundi', distance: 0 }]);
      history = done?.data.history;
    }
    expect(history).toHaveLength(6);
    expect(mocks.embed).not.toHaveBeenCalled();
    expect(mocks.exactKb).not.toHaveBeenCalled();
  });
});
