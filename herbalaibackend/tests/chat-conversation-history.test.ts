import { describe, expect, it } from 'vitest';
import type { Content } from '@google/generative-ai';
import { isPediatricQuestion, isPediatricRequest, retainDrAiHistory } from '../src/services/ai/chat/conversation-context.js';
import { chatRequestSchema, MAX_CHAT_HISTORY_TURNS, MAX_CHAT_TURN_CHARACTERS } from '../src/schema/chat.schema.js';

const pair = (question: string): Content[] => [
  { role: 'user', parts: [{ text: question }] },
  { role: 'model', parts: [{ text: 'Synthetic reply for history selection, not medical advice.' }] },
];
const childQuestion = 'Can my child use Lagundi?';
const childPair = pair(childQuestion);
const repeatedFollowUps = Array.from({ length: 4 }, () => pair('Explain its preparation again.')).flat();

describe('explicit age classification without treating every age as a child', () => {
  it.each(['18-year-old', '24 year old', '24yo', '30 y/o', '65 taong gulang', '240-month-old'])('does not label an adult age as pediatric: %s', age => {
    expect(isPediatricQuestion(`What does the Lagundi record say for a ${age}?`)).toBe(false);
  });

  it.each(['17-year-old', '17 years old', '4yo', '6 y/o', '2 taong gulang', '24-month-old', '24 months old', '6mo', 'six-year-old'])('retains the pediatric restriction for a minor age: %s', age => {
    expect(isPediatricQuestion(`What does the Lagundi record say for a ${age}?`)).toBe(true);
  });

  it('allows a clearly separate numeric adult question after a child topic', () => {
    expect(isPediatricRequest('Explain Lagundi preparation for a 24-year-old.', [...childPair, ...repeatedFollowUps])).toBe(false);
  });

  it('does not restore child context after the explicit numeric adult topic', () => {
    expect(isPediatricRequest('Explain its preparation again.', [...childPair, ...pair('Explain Lagundi preparation for a 24-year-old.')])).toBe(false);
  });

  it('does not use numeric adult wording to bypass the same child reference', () => {
    expect(isPediatricRequest('Can I use the preparation for a 24-year-old for him?', childPair)).toBe(true);
  });

  it('keeps a child mention restricted even if an adult age is also present', () => {
    expect(isPediatricQuestion('I am 24yo. Can my child use Lagundi?')).toBe(true);
  });
});

describe('bounded Dr. Ai history with an active child-context anchor', () => {
  it('keeps the latest two pairs and the original child pair without increasing the API limit', () => {
    const history = [...childPair, ...repeatedFollowUps];
    const result = retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS);
    expect(result).toEqual([...childPair, ...history.slice(-4)]);
    expect(result).toHaveLength(MAX_CHAT_HISTORY_TURNS);
    expect(chatRequestSchema.safeParse({ body: { message: 'How is it prepared?', history: result } }).success).toBe(true);
  });

  it('does not mutate the caller history while retaining the anchor', () => {
    const history = [...childPair, ...repeatedFollowUps];
    const original = JSON.stringify(history);
    retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS);
    expect(JSON.stringify(history)).toBe(original);
    expect(history).toHaveLength(10);
  });

  it.each(['Explain Lagundi preparation for an adult.', 'What is the community forum?'])('uses normal recent history after a separate topic: %s', question => {
    const history = [...childPair, ...repeatedFollowUps, ...pair(question)];
    expect(retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS)).toEqual(history.slice(-MAX_CHAT_HISTORY_TURNS));
  });

  it.each(['What is the scientific name of Lagundi?', 'Which references document Lagundi?'])('keeps the patient context through a factual question: %s', question => {
    const history = [...childPair, ...repeatedFollowUps, ...pair(question)];
    expect(retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS)).toEqual([...childPair, ...history.slice(-4)]);
  });

  it('selects the most recent explicit child question, not a stale earlier plant', () => {
    const latestChildPair = pair('Can my child use Bayabas?');
    const history = [...childPair, ...latestChildPair, ...repeatedFollowUps];
    expect(retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS)).toEqual([...latestChildPair, ...history.slice(-4)]);
  });

  it('does not drop the current pair to preserve an anchor when only one pair is allowed', () => {
    const history = [...childPair, ...repeatedFollowUps];
    expect(retainDrAiHistory(history, 2)).toEqual(history.slice(-2));
  });

  it('does not invent an anchor if the supplied history never mentioned a child', () => {
    const history = [...pair('Tell me about Lagundi.'), ...repeatedFollowUps];
    expect(retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS)).toEqual(history.slice(-MAX_CHAT_HISTORY_TURNS));
  });

  it('does not return an oversized model turn that the next request rejects', () => {
    const history: Content[] = [
      { role: 'user', parts: [{ text: 'Tell me about Lagundi.' }] },
      { role: 'model', parts: [{ text: 'Synthetic long reply. '.repeat(500) }] },
    ];
    const original = JSON.stringify(history);
    const result = retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS);
    expect(chatRequestSchema.safeParse({ body: { message: 'Which references document it?', history: result } }).success).toBe(true);
    expect(result[0]).toEqual(history[0]);
    expect(result[1]?.parts[0]?.text).toContain('omitted');
    expect(result[1]?.parts[0]?.text).not.toContain('Synthetic long reply.');
    expect(JSON.stringify(history)).toBe(original);
  });

  it('drops whole older pairs instead of returning aggregate history over the character budget', () => {
    const longPair = (question: string): Content[] => [
      { role: 'user', parts: [{ text: question }] },
      { role: 'model', parts: [{ text: 'Synthetic reply. '.padEnd(MAX_CHAT_TURN_CHARACTERS, 'x') }] },
    ];
    const history = [...longPair('Tell me about Bayabas.'), ...longPair('Tell me about Lagundi.'), ...longPair('Which references document it?')];
    const result = retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS);
    expect(chatRequestSchema.safeParse({ body: { message: 'What is its scientific name?', history: result } }).success).toBe(true);
    expect(result).toEqual(history.slice(-4));
  });

  it('preserves the child question and current pair when their combined replies exceed the budget', () => {
    const anchorQuestion = childQuestion.padEnd(MAX_CHAT_TURN_CHARACTERS, ' ');
    const longReply = 'Synthetic reply. '.padEnd(MAX_CHAT_TURN_CHARACTERS, 'x');
    const history: Content[] = [
      { role: 'user', parts: [{ text: `${anchorQuestion.slice(0, -1)}?` }] },
      { role: 'model', parts: [{ text: longReply }] },
      ...repeatedFollowUps,
      { role: 'user', parts: [{ text: 'Explain its preparation again.'.padEnd(1_000, '?') }] },
      { role: 'model', parts: [{ text: longReply }] },
    ];
    const result = retainDrAiHistory(history, MAX_CHAT_HISTORY_TURNS);
    expect(chatRequestSchema.safeParse({ body: { message: 'And how often?', history: result } }).success).toBe(true);
    expect(result[0]).toEqual(history[0]);
    expect(result.at(-2)).toEqual(history.at(-2));
    expect(result.at(-1)).toEqual(history.at(-1));
    expect(result[1]?.parts[0]?.text).toContain('omitted');
  });
});
