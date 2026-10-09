import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FixtureRecord = { id: string; question: string; answer: string; metadata?: unknown; embedding?: string };
const state = vi.hoisted(() => ({
  records: new Map<string, FixtureRecord>(), audits: [] as Array<Record<string, unknown>>, transactions: 0,
  rejectRecord: false, rejectVector: false, rejectAudit: false, embed: vi.fn(),
}));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  $transaction: async (mutate: (transaction: unknown) => Promise<unknown>) => {
    state.transactions += 1;
    const records = structuredClone(state.records);
    const audits = structuredClone(state.audits);
    const transaction = {
      knowledgeBase: {
        findUnique: async ({ where }: { where: { question: string } }) => records.get(where.question) ?? null,
        upsert: async ({ where, create, update }: { where: { question: string }; create: FixtureRecord; update: Partial<FixtureRecord> }) => {
          if (state.rejectRecord && where.question === 'TEST second question?') throw new Error('TEST ONLY record failure');
          const existing = records.get(where.question);
          const record = { ...(existing ?? create), ...(existing ? update : {}), id: existing?.id ?? where.question, question: where.question };
          records.set(where.question, record);
          return { id: record.id };
        },
      },
      $executeRawUnsafe: async (_query: string, embedding: string, id: string) => {
        if (state.rejectVector && id === 'TEST second question?') throw new Error('TEST ONLY vector failure');
        const record = Array.from(records.values()).find(record => record.id === id);
        if (!record) throw new Error('TEST fixture record missing');
        record.embedding = embedding;
        return 1;
      },
      auditLog: { create: async ({ data }: { data: Record<string, unknown> & { details?: { question?: string } } }) => {
        if (state.rejectAudit && data.details?.question === 'TEST second question?') throw new Error('TEST ONLY audit failure');
        audits.push(data);
        return data;
      } },
    };
    const result = await mutate(transaction);
    state.records = records;
    state.audits = audits;
    return result;
  },
} }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: state.embed }));

import { ImportKnowledgeBaseService } from '../src/services/ai/knowledge-base/import-knowledge-base-service.js';

const metadata = { jurisdiction: 'Philippines', sources: [{ title: 'TEST ONLY source', publisher: 'TEST', url: 'https://example.invalid/source' }] };
const facts = [
  { question: 'TEST first question?', answer: 'TEST ONLY revised first answer', metadata },
  { question: 'TEST second question?', answer: 'TEST ONLY new second answer', metadata },
];
const existing = { id: 'TEST-existing', question: facts[0]!.question, answer: 'TEST ONLY original answer', embedding: '[1,0]', metadata: { original: true } };

describe('knowledge import transaction boundaries with actual service/repositories', () => {
  beforeEach(() => {
    state.records = new Map([[existing.question, structuredClone(existing)]]);
    state.audits = [];
    state.transactions = 0;
    state.rejectRecord = false;
    state.rejectVector = false;
    state.rejectAudit = false;
    state.embed.mockReset().mockResolvedValue([0.1, 0.2]);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(['rejectRecord', 'rejectVector', 'rejectAudit'] as const)('rolls back the entire import when the second fact fails (%s)', async failure => {
    state[failure] = true;
    expect(await ImportKnowledgeBaseService(facts, 'TEST-admin')).toMatchObject({ code: 500, status: 'error' });
    expect(Array.from(state.records.values())).toEqual([existing]);
    expect(state.audits).toEqual([]);
  });

  it('commits all records and their individual audit entries in one transaction', async () => {
    expect(await ImportKnowledgeBaseService(facts, 'TEST-admin')).toMatchObject({ code: 200, data: { total: 2, created: 1, updated: 1 } });
    expect(state.transactions).toBe(1);
    expect(state.audits).toHaveLength(2);
    expect(state.audits.map(audit => audit.action)).toEqual(['IMPORT_KNOWLEDGE_BASE', 'IMPORT_KNOWLEDGE_BASE']);
    expect(state.records.get(existing.question)).toMatchObject({ id: existing.id, answer: facts[0]!.answer, metadata, embedding: '[0.1,0.2]' });
  });

  it('does not start a transaction if embedding preparation fails', async () => {
    state.embed.mockResolvedValueOnce([0.1, 0.2]).mockRejectedValueOnce(new Error('TEST ONLY embedding failure'));
    expect(await ImportKnowledgeBaseService(facts, 'TEST-admin')).toMatchObject({ code: 500 });
    expect(state.transactions).toBe(0);
    expect(Array.from(state.records.values())).toEqual([existing]);
    expect(state.audits).toEqual([]);
  });
});
