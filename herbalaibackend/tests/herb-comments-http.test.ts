import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  account: vi.fn(), herb: vi.fn(), list: vi.fn(), find: vi.fn(), create: vi.fn(),
  lock: vi.fn(), update: vi.fn(), remove: vi.fn(), audit: vi.fn(), like: vi.fn(),
  addLike: vi.fn(), removeLike: vi.fn(), countLikes: vi.fn(), transaction: vi.fn(), emit: vi.fn(), query: vi.fn(),
}));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  user: { findUnique: mocks.account }, herb: { findFirst: mocks.herb },
  herbComment: { findMany: mocks.list, findUnique: mocks.find, findFirst: mocks.find,
    create: mocks.create, update: mocks.update, updateMany: mocks.lock, delete: mocks.remove, deleteMany: mocks.remove },
  herbCommentLike: { findUnique: mocks.like, create: mocks.addLike,
    delete: mocks.removeLike, count: mocks.countLikes },
  $transaction: mocks.transaction, $queryRaw: mocks.query, auditLog: { create: mocks.audit },
} }));
vi.mock('../src/server.js', () => ({ io: { emit: mocks.emit } }));

import herbRoutes from '../src/routes/herb.routes.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { prisma } from '../src/lib/prisma.js';

const app = express();
app.use(express.json());
app.use('/api/herbs', herbRoutes);
app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(error.status ?? 500).json({ status: 'error', message: error.message });
});
const headers = { Authorization: `Bearer ${generateAccessToken({ userId: 'comment-tester', role: 'contributor' })}` };
const comment = { id: 7, herbId: 'qa-herb', authorId: 'comment-tester', content: 'TEST ONLY', isDeleted: false, likes: 1, userLikes: [{ userId: 'comment-tester' }] };
const write = (body: unknown) => request(app).post('/api/herbs/qa-herb/comments').set(headers).send(body as object);

describe('Library discussion request integrity', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.account.mockResolvedValue({ role: 'contributor', sessionVersion: 0, isBanned: false });
    mocks.herb.mockResolvedValue({ id: 'qa-herb' });
    mocks.list.mockResolvedValue([comment]);
    mocks.find.mockResolvedValue(comment);
    mocks.create.mockResolvedValue(comment);
    mocks.remove.mockResolvedValue({ count: 1 });
    mocks.audit.mockResolvedValue({ id: 'qa-audit' });
    mocks.like.mockResolvedValue(null);
    mocks.addLike.mockResolvedValue({ commentId: 7, userId: 'comment-tester' });
    mocks.removeLike.mockResolvedValue({ commentId: 7, userId: 'comment-tester' });
    mocks.lock.mockResolvedValue({ count: 1 });
    mocks.countLikes.mockResolvedValue(1);
    mocks.update.mockResolvedValue(comment);
    mocks.transaction.mockImplementation(async (mutate) => mutate(prisma));
    mocks.query.mockResolvedValue([{ id: 'qa-herb' }]);
  });

  it.each([{}, { content: '' }, { content: ' \n\t ' }, { content: 5 }, { content: true }, { content: ['TEST'] }, { content: { text: 'TEST' } }])
    ('rejects malformed content %j before writing or broadcasting', async (body) => {
      expect((await write(body)).status).toBe(400);
      expect(mocks.create).not.toHaveBeenCalled();
      expect(mocks.emit).not.toHaveBeenCalled();
    });

  it('rejects a missing JSON body without a server error', async () => {
    expect((await request(app).post('/api/herbs/qa-herb/comments').set(headers)).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('preserves authenticated middleware boundaries', async () => {
    expect((await request(app).post('/api/herbs/qa-herb/comments').send({ content: 'TEST' })).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([8, '8', null])('stores trimmed content and a valid parent %s', async (parentCommentId) => {
    mocks.find.mockResolvedValue({ ...comment, id: 8 });
    expect((await write({ content: ' TEST ONLY ', parentCommentId })).status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: {
      herbId: 'qa-herb', authorId: 'comment-tester', content: 'TEST ONLY',
      parentCommentId: parentCommentId === null ? null : 8,
    } }));
  });

  it.each([0, -1, 1.5, 2147483648, '8junk', '08', '8e0', '2147483648', {}, []])
    ('rejects malformed parent ID %j before creating', async (parentCommentId) => {
      expect((await write({ content: 'TEST ONLY', parentCommentId })).status).toBe(400);
      expect(mocks.find).not.toHaveBeenCalled();
      expect(mocks.create).not.toHaveBeenCalled();
    });

  it('rejects a parent excluded by the same-herb/nondeleted locking query', async () => {
      mocks.query.mockResolvedValueOnce([{ id: 'qa-herb' }]).mockResolvedValueOnce([]);
      expect((await write({ content: 'TEST ONLY', parentCommentId: 7 })).status).toBe(400);
      expect(mocks.create).not.toHaveBeenCalled();
      expect(mocks.query.mock.calls[1]?.[0].join('?')).toContain('"isDeleted" = false');
      expect(mocks.query.mock.calls[1]?.slice(1)).toEqual([7, 'qa-herb']);
    });

  it.each(['read', 'write'])('does not expose or add comments to a nonpublic/missing herb: %s', async (operation) => {
    mocks.herb.mockResolvedValue(null);
    mocks.query.mockResolvedValue([]);
    const response = operation === 'read'
      ? await request(app).get('/api/herbs/qa-herb/comments')
      : await write({ content: 'TEST ONLY' });
    expect(response.status).toBe(404);
    if (operation === 'read') {
      expect(mocks.herb).toHaveBeenCalledWith(expect.objectContaining({ where: {
        id: 'qa-herb', publicationStatus: 'PUBLISHED', isVerified: true,
      } }));
    } else {
      expect(mocks.query.mock.calls[0]?.[0].join('?')).toContain('"publicationStatus"');
    }
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  for (const action of ['like', 'delete'] as const) {
    it.each(['7junk', '7.5', '7e0', '0x7', '+7', ' 7 ', '007', '0', '-7', '2147483648', '9007199254740992'])
      ('rejects invalid ID %s for ' + action + ' without mutations', async (id) => {
        const path = `/api/herbs/comments/${encodeURIComponent(id)}`;
        const response = action === 'like'
          ? await request(app).post(`${path}/like`).set(headers)
          : await request(app).delete(path).set(headers);
        expect(response.status).toBe(400);
        for (const dependency of [mocks.find, mocks.like, mocks.addLike, mocks.removeLike, mocks.remove, mocks.update, mocks.transaction, mocks.emit]) {
          expect(dependency).not.toHaveBeenCalled();
        }
      });
  }

  it.each(['7', '2147483647'])('accepts valid Int ID %s with a missing-delete 404', async (id) => {
    mocks.find.mockResolvedValue(null);
    expect((await request(app).delete(`/api/herbs/comments/${id}`).set(headers)).status).toBe(404);
    expect(mocks.find).toHaveBeenCalledWith({ where: { id: Number(id) } });
  });

  it('rejects deletion by another contributor', async () => {
    mocks.find.mockResolvedValue({ ...comment, authorId: 'someone-else' });
    expect((await request(app).delete('/api/herbs/comments/7').set(headers)).status).toBe(403);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('uses the current database role for admin deletion', async () => {
    mocks.account.mockResolvedValue({ role: 'admin', sessionVersion: 0, isBanned: false });
    mocks.find.mockResolvedValue({ ...comment, authorId: 'someone-else' });
    expect((await request(app).delete('/api/herbs/comments/7').set(headers)).status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledWith({ where: { id: 7, isDeleted: false } });
  });

  it('does not react to deleted or nonpublic comments', async () => {
    mocks.lock.mockResolvedValue({ count: 0 });
    expect((await request(app).post('/api/herbs/comments/7/like').set(headers)).status).toBe(404);
    expect(mocks.lock).toHaveBeenCalledWith({ where: {
      id: 7, isDeleted: false, herb: { publicationStatus: 'PUBLISHED', isVerified: true },
    }, data: { likes: { increment: 0 } } });
    expect(mocks.addLike).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([false, true])('toggles and reconciles the count in a transaction; previously liked: %s', async (liked) => {
    mocks.like.mockResolvedValue(liked ? { commentId: 7, userId: 'comment-tester' } : null);
    mocks.countLikes.mockResolvedValue(liked ? 0 : 1);
    expect((await request(app).post('/api/herbs/comments/7/like').set(headers)).status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(liked ? mocks.removeLike : mocks.addLike).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { likes: liked ? 0 : 1 } }));
    expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.like.mock.invocationCallOrder[0]!);
  });

  it.each(['create', 'like', 'delete'])('acknowledges a saved %s when realtime broadcasting fails', async (operation) => {
    mocks.emit.mockImplementation(() => { throw new Error('QA socket unavailable'); });
    const response = operation === 'create' ? await write({ content: 'TEST ONLY' })
      : operation === 'like' ? await request(app).post('/api/herbs/comments/7/like').set(headers)
      : await request(app).delete('/api/herbs/comments/7').set(headers);
    expect(response.status).toBe(operation === 'create' ? 201 : 200);
  });

  it('does not acknowledge or broadcast a failed reaction transaction', async () => {
    mocks.countLikes.mockRejectedValue(new Error('QA count failure'));
    expect((await request(app).post('/api/herbs/comments/7/like').set(headers)).status).toBe(500);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('preserves the public comment response shape and deletion filter', async () => {
    const response = await request(app).get('/api/herbs/qa-herb/comments');
    expect(response.status).toBe(200);
    expect(response.body.data.comments).toEqual([comment]);
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ where: {
      herbId: 'qa-herb', isDeleted: false, herb: { publicationStatus: 'PUBLISHED', isVerified: true },
    } }));
  });

  it.each(['create', 'like', 'delete'])('does not broadcast a failed %s persistence operation', async (operation) => {
    const dependency = operation === 'create' ? mocks.create : operation === 'like' ? mocks.update : mocks.remove;
    dependency.mockRejectedValue(new Error('QA persistence failure'));
    const response = operation === 'create' ? await write({ content: 'TEST ONLY' })
      : operation === 'like' ? await request(app).post('/api/herbs/comments/7/like').set(headers)
      : await request(app).delete('/api/herbs/comments/7').set(headers);
    expect(response.status).toBe(500);
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it.each(['comment-tester', 'someone-else'])('audits administrator deletion of a comment by %s inside its transaction', async (authorId) => {
    mocks.account.mockResolvedValue({ role: 'admin', sessionVersion: 0, isBanned: false });
    mocks.find.mockResolvedValue({ ...comment, authorId });
    mocks.remove.mockResolvedValue({ count: 1 });
    expect((await request(app).delete('/api/herbs/comments/7').set(headers)).status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.audit).toHaveBeenCalledExactlyOnceWith({ data: {
      adminId: 'comment-tester', action: 'DELETE_HERB_COMMENT', targetType: 'HerbComment',
      targetId: '7', details: { herbId: 'qa-herb' },
    } });
    expect(mocks.remove.mock.invocationCallOrder[0]).toBeLessThan(mocks.audit.mock.invocationCallOrder[0]!);
    expect(mocks.audit.mock.invocationCallOrder[0]).toBeLessThan(mocks.emit.mock.invocationCallOrder[0]!);
  });

  it('keeps author deletion transactional without an administrator audit record', async () => {
    mocks.remove.mockResolvedValue({ count: 1 });
    expect((await request(app).delete('/api/herbs/comments/7').set(headers)).status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.remove).toHaveBeenCalledWith({ where: { id: 7, authorId: 'comment-tester', isDeleted: false } });
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it('does not acknowledge or broadcast administrator deletion when its audit save fails', async () => {
    mocks.account.mockResolvedValue({ role: 'admin', sessionVersion: 0, isBanned: false });
    mocks.remove.mockResolvedValue({ count: 1 });
    mocks.audit.mockRejectedValue(new Error('QA audit persistence failed'));
    expect((await request(app).delete('/api/herbs/comments/7').set(headers)).status).toBe(500);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it.each(['admin', 'contributor'])('returns 404 without duplicate audit/events after a concurrent delete: %s', async (role) => {
    mocks.account.mockResolvedValue({ role, sessionVersion: 0, isBanned: false });
    mocks.remove.mockResolvedValue({ count: 0 });
    expect((await request(app).delete('/api/herbs/comments/7').set(headers)).status).toBe(404);
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('does not delete an already soft-deleted target', async () => {
    mocks.find.mockResolvedValue({ ...comment, isDeleted: true });
    expect((await request(app).delete('/api/herbs/comments/7').set(headers)).status).toBe(404);
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it('does not honor a stale admin token after database demotion', async () => {
    mocks.find.mockResolvedValue({ ...comment, authorId: 'someone-else' });
    const token = generateAccessToken({ userId: 'comment-tester', role: 'admin' });
    expect((await request(app).delete('/api/herbs/comments/7').set('Authorization', `Bearer ${token}`)).status).toBe(403);
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it('locks the public herb and reply parent inside the same creation transaction', async () => {
    expect((await write({ content: 'TEST ONLY', parentCommentId: 7 })).status).toBe(201);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.query).toHaveBeenCalledTimes(2);
    const [herbQuery, parentQuery] = mocks.query.mock.calls;
    expect(herbQuery?.[0].join('?')).toMatch(/FROM "Herb".*"publicationStatus".*"isVerified".*FOR SHARE/s);
    expect(herbQuery?.slice(1)).toEqual(['qa-herb']);
    expect(parentQuery?.[0].join('?')).toMatch(/FROM "HerbComment".*"herbId".*"isDeleted".*FOR SHARE/s);
    expect(parentQuery?.slice(1)).toEqual([7, 'qa-herb']);
    expect(mocks.query.mock.invocationCallOrder[1]).toBeLessThan(mocks.create.mock.invocationCallOrder[0]!);
  });

  it('rejects a herb no longer public at the transaction gate', async () => {
    mocks.query.mockResolvedValue([]);
    expect((await write({ content: 'TEST ONLY' })).status).toBe(404);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('rejects a reply parent no longer eligible at the transaction gate', async () => {
    mocks.query.mockResolvedValueOnce([{ id: 'qa-herb' }]).mockResolvedValueOnce([]);
    expect((await write({ content: 'TEST ONLY', parentCommentId: 7 })).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('rejects a reaction when the herb is no longer public at its transaction gate', async () => {
    mocks.query.mockResolvedValue([]);
    expect((await request(app).post('/api/herbs/comments/7/like').set(headers)).status).toBe(404);
    expect(mocks.lock).not.toHaveBeenCalled();
    expect(mocks.addLike).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('checks publication in the comment read itself, not only the earlier existence check', async () => {
    expect((await request(app).get('/api/herbs/qa-herb/comments')).status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ where: {
      herbId: 'qa-herb', isDeleted: false, herb: { publicationStatus: 'PUBLISHED', isVerified: true },
    } }));
  });

  it('uses only the transaction client for creation gates and insertion', async () => {
    const query = vi.fn().mockResolvedValue([{ id: 'qa-herb' }]);
    const create = vi.fn().mockResolvedValue(comment);
    mocks.transaction.mockImplementation(async (mutate) => mutate({ $queryRaw: query, herbComment: { create } }));
    expect((await write({ content: 'TEST ONLY', parentCommentId: 7 })).status).toBe(201);
    expect(query).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledTimes(1);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.herb).not.toHaveBeenCalled();
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it('does not broadcast or acknowledge creation before transaction completion', async () => {
    mocks.transaction.mockImplementation(async (mutate) => {
      await mutate(prisma);
      expect(mocks.emit).not.toHaveBeenCalled();
      throw new Error('QA commit failure');
    });
    expect((await write({ content: 'TEST ONLY' })).status).toBe(500);
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('does not insert or broadcast when the publication lock fails', async () => {
    mocks.query.mockRejectedValue(new Error('QA lock failure'));
    expect((await write({ content: 'TEST ONLY' })).status).toBe(500);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('locks the herb before the reaction row, avoiding the reverse lock order', async () => {
    expect((await request(app).post('/api/herbs/comments/7/like').set(headers)).status).toBe(200);
    expect(mocks.find).toHaveBeenCalledWith({ where: { id: 7 }, select: { herbId: true } });
    expect(mocks.query.mock.invocationCallOrder[0]).toBeLessThan(mocks.lock.mock.invocationCallOrder[0]!);
    expect(mocks.query.mock.calls[0]?.slice(1)).toEqual(['qa-herb']);
  });

  it('returns 404 before locking a herb for a nonexistent reaction target', async () => {
    mocks.find.mockResolvedValue(null);
    expect((await request(app).post('/api/herbs/comments/7/like').set(headers)).status).toBe(404);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.lock).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('adds herb scope to reaction events without removing legacy payload fields', async () => {
    expect((await request(app).post('/api/herbs/comments/7/like').set(headers)).status).toBe(200);
    expect(mocks.emit).toHaveBeenCalledWith('comment_liked', {
      commentId: 7, herbId: 'qa-herb', likes: 1, userLikes: [{ userId: 'comment-tester' }],
    });
  });
});
