import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../src/server.js', () => ({ io: { to: vi.fn(() => ({ emit: vi.fn() })) } }));

import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { deleteThread, deleteComment } from '../src/repositories/forum.repository.js';
import { hashPassword } from '../src/utils/password.js';

const suffix = randomUUID();
const adminId = `forum-admin-${suffix}`;
const authorId = `forum-author-${suffix}`;
const otherId = `forum-other-${suffix}`;
const userIds = [adminId, authorId, otherId];
const marker = `community-pages-${suffix}`;
const password = `TEST-only-${randomUUID()}`;
const admin = request.agent(app);
const author = request.agent(app);
const other = request.agent(app);
let safeDatabase = false;

const createDiscussion = async () => {
  const response = await author.post('/api/forum/threads').send({
    title: `TEST ONLY community workflow ${randomUUID()}`,
    category: 'growing',
    content: 'TEST ONLY non-medical discussion.',
  });
  expect(response.status).toBe(201);
  return response.body.data.thread.id as number;
};

describe('isolated authenticated community moderation flow', () => {
  beforeAll(async () => {
    const target = new URL(ENV.DATABASE_URL ?? 'postgresql://invalid');
    if (ENV.NODE_ENV !== 'test' || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || target.pathname !== '/herbalai_test') {
      throw new Error('Community workflow fixtures require the isolated loopback herbalai_test database.');
    }
    safeDatabase = true;
    const hashedPassword = await hashPassword(password);
    await prisma.user.createMany({ data: userIds.map((id) => ({
      id,
      username: id.replaceAll('-', '_'),
      email: `${id}@example.invalid`,
      name: 'TEST ONLY community account',
      password: hashedPassword,
      role: id === adminId ? 'admin' : 'contributor',
      emailVerified: new Date(),
    })) });
    for (const [agent, id] of [[admin, adminId], [author, authorId], [other, otherId]] as const) {
      expect((await agent.post('/api/auth/login').send({ email: `${id}@example.invalid`, password })).status).toBe(200);
    }
    await prisma.thread.createMany({ data: Array.from({ length: 26 }, (_, index) => ({
      authorId,
      title: `TEST ONLY ${marker} ${index}`,
      category: 'growing',
      content: 'TEST ONLY pagination fixture.',
      date: new Date(Date.UTC(2026, 0, 1) - index * 1000),
    })) });
  }, 30000);

  afterAll(async () => {
    try {
      if (safeDatabase) {
        await prisma.auditLog.deleteMany({ where: { adminId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        expect(await prisma.thread.count({ where: { authorId: { in: userIds } } })).toBe(0);
      }
    } finally {
      await closeDatabasePool();
    }
  });

  it('restricts deletion, audits the moderator, and reports a shrinking last page', async () => {
    const page = await request(app).get('/api/forum/threads').query({ search: marker, page: 2, limit: 25 });
    expect(page.status).toBe(200);
    expect(page.body.data).toMatchObject({ total: 26, totalPages: 2, page: 2 });
    expect(page.body.data.threads).toHaveLength(1);
    const threadId = page.body.data.threads[0].id as number;
    const path = `/api/forum/threads/${threadId}`;
    expect((await request(app).delete(path)).status).toBe(401);
    expect((await other.delete(path)).status).toBe(403);
    expect((await prisma.thread.findUniqueOrThrow({ where: { id: threadId } })).isDeleted).toBe(false);
    expect((await admin.delete(path)).status).toBe(200);
    expect((await prisma.thread.findUniqueOrThrow({ where: { id: threadId } })).isDeleted).toBe(true);
    expect(await prisma.auditLog.count({ where: { adminId, action: 'DELETE_THREAD', targetType: 'Thread', targetId: String(threadId) } })).toBe(1);
    expect((await admin.delete(path)).status).toBe(404);
    expect((await request(app).get(path)).status).toBe(404);
    expect((await author.post(`${path}/like`)).status).toBe(404);
    expect((await author.post(`${path}/comments`).send({ content: 'TEST ONLY hidden target' })).status).toBe(404);
    const shrunk = await request(app).get('/api/forum/threads').query({ search: marker, page: 2, limit: 25 });
    expect(shrunk.status).toBe(200);
    expect(shrunk.body.data).toMatchObject({ total: 25, totalPages: 1, page: 2, threads: [] });
    const recovered = await request(app).get('/api/forum/threads').query({ search: marker, page: 1, limit: 25 });
    expect(recovered.body.data.threads).toHaveLength(25);
    expect(recovered.body.data.threads.some((thread: { id: number }) => thread.id === threadId)).toBe(false);
    const auditPage = await admin.get('/api/admin/audit-logs');
    expect(auditPage.status).toBe(200);
    expect(auditPage.body.data.logs).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'DELETE_THREAD', targetId: String(threadId) })]));
  }, 30000);

  it('creates nested replies and reactions, masks moderated text, and keeps self-deletion', async () => {
    const threadId = await createDiscussion();
    const path = `/api/forum/threads/${threadId}`;
    const comment = await other.post(`${path}/comments`).send({ content: 'TEST ONLY parent text to be moderated.' });
    expect(comment.status).toBe(201);
    const commentId = comment.body.data.comment.id as number;
    const reply = await author.post(`${path}/comments`).send({ content: 'TEST ONLY retained nested reply.', parentCommentId: commentId });
    expect(reply.status).toBe(201);
    expect((await author.post(`${path}/like`)).body.data).toMatchObject({ hasLiked: true, likes: 1 });
    expect((await author.post(`${path}/like`)).body.data).toMatchObject({ hasLiked: false, likes: 0 });
    expect((await author.post(`/api/forum/comments/${commentId}/like`)).body.data).toMatchObject({ hasLiked: true, likes: 1 });
    expect((await author.delete(`/api/forum/comments/${commentId}`)).status).toBe(403);
    expect((await admin.delete(`/api/forum/comments/${commentId}`)).status).toBe(200);
    expect((await admin.delete(`/api/forum/comments/${commentId}`)).status).toBe(404);
    expect((await author.post(`/api/forum/comments/${commentId}/like`)).status).toBe(404);
    const detail = await request(app).get(path);
    expect(detail.status).toBe(200);
    expect(detail.body.data.comments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: commentId, isDeleted: true, content: '[This reply has been deleted by the author or moderator.]' }),
      expect.objectContaining({ id: reply.body.data.comment.id, parentCommentId: commentId, content: 'TEST ONLY retained nested reply.' }),
    ]));
    expect(JSON.stringify(detail.body)).not.toContain('TEST ONLY parent text to be moderated.');
    const audit = await prisma.auditLog.findMany({ where: { adminId, action: 'DELETE_THREAD_COMMENT', targetId: String(commentId) } });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ targetType: 'ThreadComment', details: { threadId } });
    expect(JSON.stringify(audit)).not.toContain('TEST ONLY parent text to be moderated.');
    expect((await author.delete(path)).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { action: 'DELETE_THREAD', targetId: String(threadId) } })).toBe(0);
  }, 30000);

  it('uses current roles after promotion and demotion without issuing new credentials', async () => {
    const threadId = await createDiscussion();
    const path = `/api/forum/threads/${threadId}`;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'contributor' } });
    try {
      expect((await admin.delete(path)).status).toBe(403);
      expect((await prisma.thread.findUniqueOrThrow({ where: { id: threadId } })).isDeleted).toBe(false);
    } finally {
      await prisma.user.update({ where: { id: adminId }, data: { role: 'admin' } });
    }
    await prisma.user.update({ where: { id: otherId }, data: { role: 'admin' } });
    try {
      expect((await other.delete(path)).status).toBe(200);
      expect(await prisma.auditLog.count({ where: { adminId: otherId, action: 'DELETE_THREAD', targetId: String(threadId) } })).toBe(1);
    } finally {
      await prisma.user.update({ where: { id: otherId }, data: { role: 'contributor' } });
    }
  }, 30000);

  it('rolls back thread and comment moderation when its audit cannot be written', async () => {
    const threadId = await createDiscussion();
    const comment = await author.post(`/api/forum/threads/${threadId}/comments`).send({ content: 'TEST ONLY rollback fixture.' });
    expect(comment.status).toBe(201);
    const commentId = comment.body.data.comment.id as number;
    const missingAdminId = `forum-missing-${suffix}`;
    await expect(deleteThread(threadId, missingAdminId)).rejects.toThrow();
    await expect(deleteComment(commentId, missingAdminId)).rejects.toThrow();
    expect((await prisma.thread.findUniqueOrThrow({ where: { id: threadId } })).isDeleted).toBe(false);
    expect((await prisma.threadComment.findUniqueOrThrow({ where: { id: commentId } })).isDeleted).toBe(false);
    expect(await prisma.auditLog.count({ where: { adminId: missingAdminId } })).toBe(0);
  }, 30000);
});
