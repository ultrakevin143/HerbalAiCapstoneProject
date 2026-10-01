import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  account: vi.fn(), views: vi.fn(), thread: vi.fn(), comments: vi.fn(), parent: vi.fn(),
  threadLike: vi.fn(), commentLike: vi.fn(), likeStatus: vi.fn(), commentStatuses: vi.fn(),
  removeThread: vi.fn(), removeComment: vi.fn(), createComment: vi.fn(),
}));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { user: { findUnique: mocks.account } } }));
vi.mock('../src/repositories/forum.repository.js', () => ({
  incrementThreadViews: mocks.views, findThreadById: mocks.thread,
  findCommentsByThreadId: mocks.comments, findCommentById: mocks.parent,
  toggleThreadLike: mocks.threadLike, toggleCommentLike: mocks.commentLike,
  hasUserLikedThread: mocks.likeStatus, findUserLikedCommentIds: mocks.commentStatuses,
  deleteThread: mocks.removeThread, deleteComment: mocks.removeComment,
  createComment: mocks.createComment,
}));
vi.mock('../src/server.js', () => ({ io: { to: vi.fn(() => ({ emit: vi.fn() })) } }));

import forumRoutes from '../src/routes/forum.routes.js';
import { generateAccessToken } from '../src/utils/jwt.js';

const app = express();
app.use(express.json());
app.use('/api/forum', forumRoutes);
app.use((_error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ status: 'error' });
});
const headers = { Authorization: `Bearer ${generateAccessToken({ userId: 'forum-id-tester', role: 'contributor' })}` };
const routes = [
  ['get', '/threads/'], ['delete', '/threads/'], ['post', '/threads/', '/like'],
  ['get', '/threads/', '/like-status'], ['get', '/threads/', '/comment-like-statuses'],
  ['post', '/threads/', '/comments'], ['post', '/comments/', '/like'], ['delete', '/comments/'],
] as const;
const cases = routes.flatMap(([method, prefix, suffix = '']) =>
  ['2147483648', '9007199254740991', '999999999999'].map(id => ({ method, path: `/api/forum${prefix}${id}${suffix}` })));

describe('forum PostgreSQL Int ID boundaries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.account.mockResolvedValue({ role: 'contributor', sessionVersion: 0, isBanned: false });
    mocks.views.mockResolvedValue({ count: 0 });
    mocks.thread.mockResolvedValue(null);
    mocks.parent.mockResolvedValue(null);
    mocks.threadLike.mockResolvedValue(null);
    mocks.commentLike.mockResolvedValue(null);
    mocks.likeStatus.mockResolvedValue(false);
    mocks.commentStatuses.mockResolvedValue([]);
  });

  it.each(cases)('rejects $method $path before any forum repository operation', async ({ method, path }) => {
    const response = await request(app)[method](path).set(headers).send({ content: 'TEST ONLY reply' });
    expect(response.status).toBe(400);
    for (const [name, mock] of Object.entries(mocks)) {
      if (name !== 'account') expect(mock).not.toHaveBeenCalled();
    }
  });

  it.each([2147483648, '2147483648', Number.MAX_SAFE_INTEGER, String(Number.MAX_SAFE_INTEGER)])('rejects out-of-range parent comment ID %s before a parent lookup', async parentCommentId => {
    mocks.thread.mockResolvedValue({ id: 7 });
    const response = await request(app).post('/api/forum/threads/7/comments').set(headers).send({ content: 'TEST ONLY reply', parentCommentId });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid parent comment ID.');
    expect(mocks.parent).not.toHaveBeenCalled();
    expect(mocks.createComment).not.toHaveBeenCalled();
  });

  it('accepts the largest supported Int for normal missing-thread handling', async () => {
    expect((await request(app).get('/api/forum/threads/2147483647')).status).toBe(404);
    expect(mocks.views).toHaveBeenCalledWith(2147483647);
  });

  it.each([8, '8'])('preserves valid numeric and string parent IDs (%s)', async parentCommentId => {
    mocks.thread.mockResolvedValue({ id: 7 });
    mocks.parent.mockResolvedValue({ id: 8, threadId: 7, isDeleted: false });
    mocks.createComment.mockResolvedValue({ comment: { id: 9 }, notifications: [] });
    const response = await request(app).post('/api/forum/threads/7/comments').set(headers).send({ content: ' TEST ONLY reply ', parentCommentId });
    expect(response.status).toBe(201);
    expect(mocks.createComment).toHaveBeenCalledWith({ authorId: 'forum-id-tester', threadId: 7, content: 'TEST ONLY reply', parentCommentId: 8 });
  });
});
