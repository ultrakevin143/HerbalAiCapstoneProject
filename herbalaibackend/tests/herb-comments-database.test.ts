import { randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';

vi.mock('../src/server.js', () => ({ io: { emit: vi.fn() } }));

import herbRoutes from '../src/routes/herb.routes.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { hashPassword } from '../src/utils/password.js';
import { errorResponse } from '../src/utils/error-response.js';

const connection = new URL(process.env['DATABASE_URL'] ?? 'postgresql://invalid/');
if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname) || connection.pathname !== '/herbalai_test') {
  throw new Error('Library discussion database tests require an isolated loopback herbalai_test database.');
}

const suffix = randomUUID();
const herbId = `qa-library-${suffix}`;
const hiddenHerbId = `qa-library-hidden-${suffix}`;
const userIds = [0, 1, 2].map(index => `qa-comment-${suffix}-${index}`);
const headers = userIds.map(userId => ({ Authorization: `Bearer ${generateAccessToken({ userId, role: 'contributor' })}` }));
const app = express();
app.use(express.json());
app.use('/api/herbs', herbRoutes);
app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const response = errorResponse(error, true);
  res.status(response.status).json(response.body);
});

const waitUntil = async (predicate: () => Promise<boolean>) => {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('QA lock observation deadline exceeded');
};

describe('Library discussion isolated PostgreSQL regressions', () => {
  beforeAll(async () => {
    const password = await hashPassword(`QA-only-${randomUUID()}`);
    await prisma.user.createMany({ data: userIds.map((id, index) => ({
      id, username: `qa_comment_${suffix}_${index}`, email: `qa-comment-${suffix}-${index}@example.invalid`,
      name: 'TEST ONLY Library Comment', password, emailVerified: new Date(), role: index === 2 ? 'admin' : 'contributor',
    })) });
    const herb = {
      localName: `TEST ONLY library ${suffix}`, scientificName: 'Test fixture only', category: 'QA only',
      medicinalUses: 'None. Test fixture only.', preparationMethod: 'None.', dosage: 'None.', isVerified: true,
    };
    await prisma.herb.createMany({ data: [
      { ...herb, id: herbId, publicationStatus: 'PUBLISHED' },
      { ...herb, id: hiddenHerbId, publicationStatus: 'HOLD' },
    ] });
  });

  afterAll(async () => {
    try {
      await prisma.auditLog.deleteMany({ where: { adminId: { in: userIds } } });
      await prisma.herb.deleteMany({ where: { id: { in: [herbId, hiddenHerbId] } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    } finally {
      await closeDatabasePool();
    }
  });

  it('does not return, create or react to comments under a held herb', async () => {
    const hidden = await prisma.herbComment.create({ data: { herbId: hiddenHerbId, authorId: userIds[0]!, content: 'TEST ONLY private fixture' } });
    expect((await request(app).get(`/api/herbs/${hiddenHerbId}/comments`)).status).toBe(404);
    expect((await request(app).post(`/api/herbs/${hiddenHerbId}/comments`).set(headers[0]!).send({ content: 'TEST ONLY' })).status).toBe(404);
    expect((await request(app).post(`/api/herbs/comments/${hidden.id}/like`).set(headers[0]!)).status).toBe(404);
    expect(await prisma.herbComment.count({ where: { herbId: hiddenHerbId } })).toBe(1);
    expect(await prisma.herbCommentLike.count({ where: { commentId: hidden.id } })).toBe(0);
  });

  it('rejects cross-herb and deleted parents while retaining a valid reply', async () => {
    const otherParent = await prisma.herbComment.create({ data: { herbId: hiddenHerbId, authorId: userIds[0]!, content: 'TEST ONLY parent' } });
    const parent = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: 'TEST ONLY parent' } });
    const reply = (parentCommentId: number) => request(app).post(`/api/herbs/${herbId}/comments`).set(headers[0]!).send({ content: ' TEST ONLY reply ', parentCommentId });
    expect((await reply(otherParent.id)).status).toBe(400);
    const valid = await reply(parent.id);
    expect(valid.status).toBe(201);
    expect(valid.body.data.comment).toMatchObject({ herbId, parentCommentId: parent.id, content: 'TEST ONLY reply' });
    await prisma.herbComment.update({ where: { id: parent.id }, data: { isDeleted: true } });
    expect((await reply(parent.id)).status).toBe(400);
  });

  it('serializes repeated same-user toggles without duplicate rows or count drift', async () => {
    const comment = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: 'TEST ONLY concurrent toggle', likes: 99 } });
    const responses = await Promise.all(Array.from({ length: 6 }, () => request(app).post(`/api/herbs/comments/${comment.id}/like`).set(headers[0]!)));
    expect(responses.map(response => response.status)).toEqual(Array(6).fill(200));
    expect(await prisma.herbCommentLike.count({ where: { commentId: comment.id } })).toBe(0);
    expect((await prisma.herbComment.findUniqueOrThrow({ where: { id: comment.id } })).likes).toBe(0);
  });

  it('retains all different-user reactions with an accurate final count', async () => {
    const comment = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: 'TEST ONLY concurrent users' } });
    const responses = await Promise.all(headers.map(header => request(app).post(`/api/herbs/comments/${comment.id}/like`).set(header)));
    expect(responses.map(response => response.status)).toEqual([200, 200, 200]);
    expect(await prisma.herbCommentLike.count({ where: { commentId: comment.id } })).toBe(3);
    expect((await prisma.herbComment.findUniqueOrThrow({ where: { id: comment.id } })).likes).toBe(3);
  });

  it('rolls back the reaction if the later count persistence fails', async () => {
    const comment = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: 'TEST ONLY rollback' } });
    const originalTransaction = prisma.$transaction.bind(prisma);
    const transactionSpy = vi.spyOn(prisma, '$transaction').mockImplementation(async (mutate) => {
      return originalTransaction(async (transaction: Prisma.TransactionClient) => {
        const failingTransaction = new Proxy(transaction, {
          get(target, property) {
            if (property !== 'herbComment') return Reflect.get(target, property);
            return new Proxy(target.herbComment, {
              get(delegate, method) {
                if (method === 'update') return async () => { throw new Error('QA count save failure'); };
                return Reflect.get(delegate, method);
              },
            });
          },
        });
        return (mutate as (client: Prisma.TransactionClient) => Promise<unknown>)(failingTransaction);
      });
    });
    try {
      expect((await request(app).post(`/api/herbs/comments/${comment.id}/like`).set(headers[0]!)).status).toBe(500);
    } finally {
      transactionSpy.mockRestore();
    }
    expect(await prisma.herbCommentLike.count({ where: { commentId: comment.id } })).toBe(0);
    expect((await prisma.herbComment.findUniqueOrThrow({ where: { id: comment.id } })).likes).toBe(0);
  });

  it('audits administrator deletion while retaining replies with null parent IDs', async () => {
    const parent = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: 'TEST ONLY moderation parent' } });
    const reply = await prisma.herbComment.create({ data: { herbId, authorId: userIds[1]!, content: 'TEST ONLY retained reply', parentCommentId: parent.id } });
    expect((await request(app).delete(`/api/herbs/comments/${parent.id}`).set(headers[2]!)).status).toBe(200);
    expect(await prisma.herbComment.findUnique({ where: { id: parent.id } })).toBeNull();
    expect(await prisma.herbComment.findUniqueOrThrow({ where: { id: reply.id } })).toMatchObject({ content: 'TEST ONLY retained reply', parentCommentId: null });
    const audits = await prisma.auditLog.findMany({ where: { adminId: userIds[2]!, targetType: 'HerbComment', targetId: String(parent.id) } });
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({ action: 'DELETE_HERB_COMMENT', details: { herbId } });
    const response = await request(app).get(`/api/herbs/${herbId}/comments`);
    expect(response.body.data.comments).toEqual(expect.arrayContaining([expect.objectContaining({ id: reply.id, parentCommentId: null })]));
  });

  it('allows only one of two concurrent administrator deletions and creates one audit', async () => {
    const comment = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: 'TEST ONLY duplicate moderation' } });
    const responses = await Promise.all(Array.from({ length: 2 }, () => request(app).delete(`/api/herbs/comments/${comment.id}`).set(headers[2]!)));
    expect(responses.map(response => response.status).sort()).toEqual([200, 404]);
    expect(await prisma.auditLog.count({ where: { adminId: userIds[2]!, targetType: 'HerbComment', targetId: String(comment.id) } })).toBe(1);
  });

  it('does not write an administrator audit for contributor self-deletion', async () => {
    const comment = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: 'TEST ONLY self deletion' } });
    expect((await request(app).delete(`/api/herbs/comments/${comment.id}`).set(headers[0]!)).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { targetType: 'HerbComment', targetId: String(comment.id) } })).toBe(0);
  });

  it('rolls back deletion and parent detachment if the audit insert fails', async () => {
    const parent = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: 'TEST ONLY audit rollback parent' } });
    const reply = await prisma.herbComment.create({ data: { herbId, authorId: userIds[1]!, content: 'TEST ONLY audit rollback reply', parentCommentId: parent.id } });
    const originalTransaction = prisma.$transaction.bind(prisma);
    const transactionSpy = vi.spyOn(prisma, '$transaction').mockImplementation(async (mutate) => {
      return originalTransaction(async (transaction: Prisma.TransactionClient) => {
        const failingTransaction = new Proxy(transaction, {
          get(target, property) {
            if (property !== 'auditLog') return Reflect.get(target, property);
            return new Proxy(target.auditLog, {
              get(delegate, method) {
                if (method === 'create') return async () => { throw new Error('QA audit save failure'); };
                return Reflect.get(delegate, method);
              },
            });
          },
        });
        return (mutate as (client: Prisma.TransactionClient) => Promise<unknown>)(failingTransaction);
      });
    });
    try {
      expect((await request(app).delete(`/api/herbs/comments/${parent.id}`).set(headers[2]!)).status).toBe(500);
    } finally {
      transactionSpy.mockRestore();
    }
    expect(await prisma.herbComment.findUnique({ where: { id: parent.id } })).not.toBeNull();
    expect((await prisma.herbComment.findUniqueOrThrow({ where: { id: reply.id } })).parentCommentId).toBe(parent.id);
    expect(await prisma.auditLog.count({ where: { targetType: 'HerbComment', targetId: String(parent.id) } })).toBe(0);
  });

  it.each(['comment-publication', 'reply-parent', 'reaction-publication', 'reaction-deletion'] as const)
    ('holds the eligibility row lock until commit: %s', async (scenario) => {
      const parent = await prisma.herbComment.create({ data: { herbId, authorId: userIds[0]!, content: `TEST ONLY lock ${scenario}` } });
      const originalTransaction = prisma.$transaction.bind(prisma);
      let gateReached = false;
      let releaseGate!: () => void;
      const gate = new Promise<void>(resolve => { releaseGate = resolve; });
      const pause = async () => { gateReached = true; await gate; };
      const transactionSpy = vi.spyOn(prisma, '$transaction').mockImplementation(async (mutate) => {
        return originalTransaction(async (transaction: Prisma.TransactionClient) => {
          const pausedTransaction = new Proxy(transaction, {
            get(target, property) {
              if (property === '$queryRaw') {
                return async (strings: TemplateStringsArray, ...values: unknown[]) => {
                  const rows = await target.$queryRaw(strings, ...values);
                  const table = scenario === 'reply-parent' ? 'HerbComment' : 'Herb';
                  if (scenario !== 'reaction-deletion' && strings.join('?').includes(`FROM "${table}"`)) await pause();
                  return rows;
                };
              }
              if (property === 'herbComment' && scenario === 'reaction-deletion') {
                return new Proxy(target.herbComment, {
                  get(delegate, method) {
                    if (method === 'updateMany') return async (args: Prisma.HerbCommentUpdateManyArgs) => {
                      const result = await delegate.updateMany(args);
                      await pause();
                      return result;
                    };
                    return Reflect.get(delegate, method);
                  },
                });
              }
              return Reflect.get(target, property);
            },
          });
          return (mutate as (client: Prisma.TransactionClient) => Promise<unknown>)(pausedTransaction);
        }, { timeout: 10000 });
      });
      const responsePromise = (scenario.startsWith('reaction')
        ? request(app).post(`/api/herbs/comments/${parent.id}/like`).set(headers[0]!)
        : request(app).post(`/api/herbs/${herbId}/comments`).set(headers[0]!).send({
          content: 'TEST ONLY locked insertion', ...(scenario === 'reply-parent' ? { parentCommentId: parent.id } : {}),
        })).then(response => response);
      let writer: Promise<unknown> | undefined;
      let writerPid = 0;
      try {
        await waitUntil(async () => gateReached);
        writer = originalTransaction(async (transaction: Prisma.TransactionClient) => {
          const [backend] = await transaction.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
          writerPid = backend!.pid;
          if (scenario === 'reply-parent' || scenario === 'reaction-deletion') {
            return transaction.herbComment.delete({ where: { id: parent.id } });
          }
          return transaction.herb.update({ where: { id: herbId }, data: { publicationStatus: 'HOLD' } });
        }, { timeout: 10000 });
        void writer.catch(() => undefined);
        await waitUntil(async () => {
          if (!writerPid) return false;
          const [blocked] = await prisma.$queryRaw<{ blocked: boolean }[]>`
            SELECT cardinality(pg_blocking_pids(${writerPid}::integer)) > 0 AS blocked
          `;
          return blocked?.blocked === true;
        });
        releaseGate();
        const response = await responsePromise;
        expect(response.status).toBe(scenario.startsWith('reaction') ? 200 : 201);
        await writer;
        if (scenario === 'reply-parent') {
          expect((await prisma.herbComment.findUniqueOrThrow({ where: { id: response.body.data.comment.id } })).parentCommentId).toBeNull();
        } else if (scenario === 'reaction-deletion') {
          expect(await prisma.herbCommentLike.count({ where: { commentId: parent.id } })).toBe(0);
        } else {
          expect((await request(app).get(`/api/herbs/${herbId}/comments`)).status).toBe(404);
        }
      } finally {
        releaseGate();
        await Promise.allSettled([responsePromise, ...(writer ? [writer] : [])]);
        transactionSpy.mockRestore();
        await prisma.herb.update({ where: { id: herbId }, data: { publicationStatus: 'PUBLISHED' } });
      }
    }, 15000);
});
