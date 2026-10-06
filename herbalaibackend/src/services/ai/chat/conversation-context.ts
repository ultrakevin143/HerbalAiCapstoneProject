import type { Content } from '@google/generative-ai';
import { MAX_CHAT_HISTORY_CHARACTERS, MAX_CHAT_TURN_CHARACTERS } from '../../../schema/chat.schema.js';

export const isPreparationQuestion = (question: string) => /\b(prepare|prepared|preparing|preparations?|step[- ]by[- ]step|walk me through|beginner(?:['’]s)? guide|how (?:do i|to) make|ihanda|paghahanda|pag-andam|andamon)\b/i.test(question);
const isClinicalQuestion = (question: string) => isPreparationQuestion(question) || /\b(dose|dosage|amount|frequency|how much|how often|give)\b/i.test(question);
const isHerbInformationQuestion = (question: string) => /\b(?:scientific|botanical|local) names?\b|\b(sources?|references?|citations?|warnings?|safety|evidence)\b/i.test(question);
const numericAges = (question: string) => [...question.matchAll(/\b(\d{1,3})(?:[-\s]*(years?|months?)[-\s]*old|[-\s]*(yo|y\/o|mo|taong gulang))\b/gi)].map(match => {
  const quantity = Number(match[1]);
  const unit = (match[2] ?? match[3] ?? '').toLowerCase();
  return { years: unit.startsWith('mo') ? quantity / 12 : quantity, index: match.index };
});
export const isPediatricQuestion = (question: string) => /\b(child|children|kid|kids|baby|infant|newborn|toddler|pediatric|paediatric|anak|bata|sanggol)\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[- ](?:years?|months?)[- ]old\b/i.test(question)
  || numericAges(question).some(age => age.years < 18);
export const userQuestionsNewestFirst = (history: Content[]) => [...history].reverse()
  .filter(turn => turn.role === 'user')
  .map(turn => turn.parts.map(part => part.text ?? '').join(' '));
const isExplicitAdultQuestion = (question: string) => !/\b(him|her|them)\b/i.test(question)
  && (/\b(?:for (?:an? )?(?:adult|grown-up)|(?:adult|grown-up) (?:beginner |educational )?guide)\b/i.test(question)
    || numericAges(question).some(age => age.years >= 18 && /\bfor\s+(?:an?\s+)?$/i.test(question.slice(0, age.index))));
export const isContextFollowUp = (question: string) => {
  const directQuestion = question.split(/[.!?]|\b(?:if|unless)\b/i, 1)[0] ?? '';
  return /\b(it|its|that|this|those|them|him|her|they|their)\b/i.test(directQuestion)
    || /^(?:(?:and|then)\s+)?how (?:much|often)\s*$/i.test(directQuestion.trim());
};
const preservesPatientContext = (question: string) => isClinicalQuestion(question) || isContextFollowUp(question) || isHerbInformationQuestion(question);

export const isPediatricRequest = (question: string, history: Content[]) => {
  if (isPediatricQuestion(question)) return true;
  if (isExplicitAdultQuestion(question) || !preservesPatientContext(question)) return false;
  for (const previousQuestion of userQuestionsNewestFirst(history)) {
    if (isPediatricQuestion(previousQuestion)) return true;
    if (isExplicitAdultQuestion(previousQuestion) || !preservesPatientContext(previousQuestion)) return false;
  }
  return false;
};

const OMITTED_MODEL_REPLY = 'The previous assistant answer was omitted from history because of the conversation size limit. Do not infer its contents or any medical instructions.';
const turnCharacters = (turn: Content) => turn.parts.reduce((total, part) => total + (part.text?.length ?? 0), 0);
const omitModelReply = <Turn extends Content>(turn: Turn): Turn => ({ ...turn, parts: [{ text: OMITTED_MODEL_REPLY }] });

const fitHistoryBudget = <Turn extends Content>(history: Turn[], anchorQuestion?: Turn): Turn[] => {
  const normalized = history.map(turn => turn.role === 'model' && turnCharacters(turn) > MAX_CHAT_TURN_CHARACTERS ? omitModelReply(turn) : turn);
  const pairs = normalized.filter((_, index) => index % 2 === 0).map((_, index) => normalized.slice(index * 2, index * 2 + 2));
  const latestIndex = pairs.length - 1;
  const anchorIndex = pairs.findIndex(pair => pair[0] === anchorQuestion);
  const priority = [...new Set([latestIndex, anchorIndex, ...pairs.map((_, index) => index).reverse()])].filter(index => index >= 0);
  const retained = new Map<number, Turn[]>();
  let remainingCharacters = MAX_CHAT_HISTORY_CHARACTERS;
  for (const index of priority) {
    let pair = pairs[index];
    if (!pair || pair.length !== 2) continue;
    let characters = pair.reduce((total, turn) => total + turnCharacters(turn), 0);
    const question = pair[0];
    const reply = pair[1];
    if (characters > remainingCharacters && index === anchorIndex && question && reply) {
      pair = [question, omitModelReply(reply)];
      characters = pair.reduce((total, turn) => total + turnCharacters(turn), 0);
    }
    if (characters > remainingCharacters) continue;
    retained.set(index, pair);
    remainingCharacters -= characters;
  }
  return [...retained.entries()].sort(([firstIndex], [secondIndex]) => firstIndex - secondIndex).flatMap(([, pair]) => pair);
};

export const retainDrAiHistory = <Turn extends Content>(history: Turn[], maximumTurns: number): Turn[] => {
  const recentHistory = history.slice(-maximumTurns);
  const currentQuestion = history.at(-2)?.parts.map(part => part.text ?? '').join(' ') ?? '';
  if (maximumTurns < 4 || !isPediatricRequest(currentQuestion, history.slice(0, -2))) return fitHistoryBudget(recentHistory);
  const anchorIndex = history.findLastIndex(turn => turn.role === 'user' && isPediatricQuestion(turn.parts.map(part => part.text ?? '').join(' ')));
  const anchorQuestion = history[anchorIndex];
  const anchorReply = history[anchorIndex + 1];
  if (!anchorQuestion || anchorReply?.role !== 'model') return fitHistoryBudget(recentHistory);
  const selected = anchorIndex >= history.length - maximumTurns
    ? recentHistory
    : [anchorQuestion, anchorReply, ...recentHistory.slice(-(maximumTurns - 2))];
  return fitHistoryBudget(selected, anchorQuestion);
};
