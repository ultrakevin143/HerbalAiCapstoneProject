import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/services/ai/core/gemini-service.js', () => ({
  generateEmbedding: vi.fn(async () => Array.from({ length: 768 }, (_, index) => index === 0 ? 1 : 0)),
}));

import app from '../src/app.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { hashPassword } from '../src/utils/password.js';

const suffix = randomUUID();
const password = `Test-only-${randomUUID()}`;
const adminId = `source-admin-${suffix}`;
const contributorId = `source-contributor-${suffix}`;
const question = `TEST ONLY source workflow ${suffix}?`;
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
      await prisma.knowledgeBase.deleteMany({ where: { question } });
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
});
