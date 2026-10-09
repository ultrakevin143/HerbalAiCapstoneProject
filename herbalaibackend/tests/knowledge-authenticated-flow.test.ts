import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/services/ai/core/gemini-service.js', () => ({
  generateEmbedding: vi.fn(async () => Array.from({ length: 768 }, (_, index) => index === 0 ? 1 : 0)),
}));

import app from '../src/app.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { generateEmbedding } from '../src/services/ai/core/gemini-service.js';

const suffix = randomUUID();
const password = `Test-only-${randomUUID()}`;
const adminId = `source-admin-${suffix}`;
const contributorId = `source-contributor-${suffix}`;
const question = `TEST ONLY source workflow ${suffix}?`;
const importQuestions = [`TEST ONLY batch first ${suffix}?`, `TEST ONLY batch second ${suffix}?`];
const metadata = {
  jurisdiction: 'Philippines',
  sources: [{ title: 'Test citation structure', publisher: 'Test publisher', url: 'https://example.invalid/source' }],
};

describe('authenticated knowledge-base flow', () => {
  beforeAll(async () => {
    const hashedPassword = await hashPassword(password);
    await prisma.user.createMany({ data: [
      { id: adminId, username: `source_admin_${suffix.replaceAll('-', '')}`, email: `source-admin-${suffix}@example.invalid`, name: 'TEST Admin', password: hashedPassword, role: 'admin', emailVerified: new Date() },
      { id: contributorId, username: `source_contributor_${suffix.replaceAll('-', '')}`, email: `source-contributor-${suffix}@example.invalid`, name: 'TEST Contributor', password: hashedPassword, emailVerified: new Date() },
    ] });
  }, 30000);

  afterAll(async () => {
    try {
      await prisma.knowledgeBase.deleteMany({ where: { question: { in: [question, ...importQuestions] } } });
      await prisma.user.deleteMany({ where: { id: { in: [adminId, contributorId] } } });
    } finally {
      await closeDatabasePool();
    }
  });

  it('rejects anonymous and contributor writes', async () => {
    const body = { question, answer: 'TEST ONLY non-medical answer', metadata };
    expect((await request(app).post('/api/knowledge-base/create').send(body)).status).toBe(401);
    const contributor = request.agent(app);
    const login = await contributor.post('/api/auth/login').send({ email: `source-contributor-${suffix}@example.invalid`, password });
    expect(login.status).toBe(200);
    expect((await contributor.post('/api/knowledge-base/create').send(body)).status).toBe(403);
    expect(await prisma.knowledgeBase.findUnique({ where: { question } })).toBeNull();
  }, 30000);

  it('logs in, validates sources, creates, reads, edits and deletes with audit records', async () => {
    const admin = request.agent(app);
    expect((await admin.post('/api/auth/login').send({ email: `source-admin-${suffix}@example.invalid`, password })).status).toBe(200);
    const body = { question, answer: 'TEST ONLY non-medical answer' };
    expect((await admin.post('/api/knowledge-base/create').send(body)).status).toBe(400);
    expect(await prisma.knowledgeBase.findUnique({ where: { question } })).toBeNull();

    const created = await admin.post('/api/knowledge-base/create').send({ ...body, metadata });
    expect(created.status).toBe(201);
    const record = await prisma.knowledgeBase.findUniqueOrThrow({ where: { question } });
    expect(record.metadata).toEqual(metadata);
    const page = await admin.get('/api/knowledge-base/page').query({ search: question });
    expect(page.status).toBe(200);
    expect(page.body.data.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: record.id, metadata })]));

    expect((await admin.patch(`/api/knowledge-base/${record.id}`).send({ answer: 'TEST ONLY revised answer', metadata })).status).toBe(200);
    expect(await prisma.knowledgeBase.findUniqueOrThrow({ where: { id: record.id } })).toMatchObject({ answer: 'TEST ONLY revised answer', metadata });
    expect((await admin.delete(`/api/knowledge-base/${record.id}`)).status).toBe(200);
    expect(await prisma.knowledgeBase.findUnique({ where: { id: record.id } })).toBeNull();
    expect(await prisma.auditLog.findMany({ where: { adminId, targetId: record.id }, orderBy: { id: 'asc' }, select: { action: true } })).toEqual([
      { action: 'CREATE_KNOWLEDGE_BASE' },
      { action: 'UPDATE_KNOWLEDGE_BASE' },
      { action: 'DELETE_KNOWLEDGE_BASE' },
    ]);
  }, 60000);
  it('rolls back an authenticated import on a late vector failure, then retries exactly once', async () => {
    const admin = request.agent(app);
    expect((await admin.post('/api/auth/login').send({ email: `source-admin-${suffix}@example.invalid`, password })).status).toBe(200);
    const original = await prisma.knowledgeBase.create({ data: {
      question: importQuestions[0]!, answer: 'TEST ONLY prior answer', tags: ['baseline'], metadata: { ...metadata, baseline: true },
    } });
    const facts = importQuestions.map(question => ({ question, answer: 'TEST ONLY imported answer', tags: ['imported'], metadata }));
    vi.mocked(generateEmbedding)
      .mockResolvedValueOnce(Array.from({ length: 768 }, (_, index) => index === 0 ? 1 : 0))
      .mockResolvedValueOnce([0.1, 0.2]);
    const failed = await admin.post('/api/knowledge-base/import').send({ facts });
    expect(failed.status).toBe(500);
    expect(await prisma.knowledgeBase.findUniqueOrThrow({ where: { id: original.id } })).toMatchObject({ answer: 'TEST ONLY prior answer', tags: ['baseline'], metadata: { ...metadata, baseline: true } });
    expect(await prisma.knowledgeBase.findUnique({ where: { question: importQuestions[1]! } })).toBeNull();
    expect(await prisma.$queryRawUnsafe('SELECT embedding::text AS embedding FROM "KnowledgeBase" WHERE id = $1', original.id)).toEqual([{ embedding: null }]);
    expect(await prisma.auditLog.count({ where: { adminId, action: 'IMPORT_KNOWLEDGE_BASE', targetId: original.id } })).toBe(0);

    const retried = await admin.post('/api/knowledge-base/import').send({ facts });
    expect(retried.status).toBe(200);
    expect(retried.body.data).toEqual({ total: 2, created: 1, updated: 1 });
    const records = await prisma.knowledgeBase.findMany({ where: { question: { in: importQuestions } }, select: { id: true, question: true, answer: true } });
    expect(records).toHaveLength(2);
    expect(records.every(record => record.answer === 'TEST ONLY imported answer')).toBe(true);
    expect(await prisma.auditLog.count({ where: { adminId, action: 'IMPORT_KNOWLEDGE_BASE', targetId: { in: records.map(record => record.id) } } })).toBe(2);
  }, 60000);
});
