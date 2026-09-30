import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  findThread: vi.fn(),
  findComment: vi.fn(),
  deleteThread: vi.fn(),
  deleteComment: vi.fn(),
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: { user: { findUnique: mocks.findUser } } }));
vi.mock('../src/repositories/forum.repository.js', () => ({
  findThreadById: mocks.findThread,
  findCommentById: mocks.findComment,
  deleteThread: mocks.deleteThread,
  deleteComment: mocks.deleteComment,
}));

import forumRoutes from '../src/routes/forum.routes.js';
import { generateAccessToken } from '../src/utils/jwt.js';

const app = express();
app.use(express.json());
app.use('/api/forum', forumRoutes);
app.use((_error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ status: 'error' });
});

const token = (role: string) => generateAccessToken({ userId: 'moderator-test', role });

describe('community moderation authorization and audit context', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findUser.mockResolvedValue({ role: 'admin', isBanned: false, sessionVersion: 0 });
    mocks.findThread.mockResolvedValue({ id: 7, authorId: 'another-user', isDeleted: false });
    mocks.findComment.mockResolvedValue({ id: 8, threadId: 7, authorId: 'another-user', isDeleted: false });
    mocks.deleteThread.mockResolvedValue({ id: 7, isDeleted: true });
    mocks.deleteComment.mockResolvedValue({ id: 8, isDeleted: true });
  });

  it('denies a demoted administrator even while their old access token is valid', async () => {
    mocks.findUser.mockResolvedValue({ role: 'contributor', isBanned: false, sessionVersion: 0 });
    const response = await request(app).delete('/api/forum/threads/7').set('Authorization', `Bearer ${token('admin')}`);
    expect(response.status).toBe(403);
    expect(mocks.deleteThread).not.toHaveBeenCalled();
  });

  it('allows a promoted administrator and forwards the audit actor', async () => {
    const response = await request(app).delete('/api/forum/threads/7').set('Authorization', `Bearer ${token('contributor')}`);
    expect(response.status).toBe(200);
    expect(mocks.deleteThread).toHaveBeenCalledWith(7, 'moderator-test');
  });

  it('forwards the administrator actor for comment moderation', async () => {
    const response = await request(app).delete('/api/forum/comments/8').set('Authorization', `Bearer ${token('admin')}`);
    expect(response.status).toBe(200);
    expect(mocks.deleteComment).toHaveBeenCalledWith(8, 'moderator-test');
  });

  it('keeps contributor self-deletion available without an administrator audit actor', async () => {
    mocks.findUser.mockResolvedValue({ role: 'contributor', isBanned: false, sessionVersion: 0 });
    mocks.findThread.mockResolvedValue({ id: 7, authorId: 'moderator-test', isDeleted: false });
    const response = await request(app).delete('/api/forum/threads/7').set('Authorization', `Bearer ${token('contributor')}`);
    expect(response.status).toBe(200);
    expect(mocks.deleteThread).toHaveBeenCalledWith(7, undefined);
  });

  it('does not repeat a deleted-comment mutation or audit entry', async () => {
    mocks.findComment.mockResolvedValue({ id: 8, threadId: 7, authorId: 'another-user', isDeleted: true });
    const response = await request(app).delete('/api/forum/comments/8').set('Authorization', `Bearer ${token('admin')}`);
    expect(response.status).toBe(404);
    expect(mocks.deleteComment).not.toHaveBeenCalled();
  });

  it('denies anonymous and banned moderation requests', async () => {
    expect((await request(app).delete('/api/forum/threads/7')).status).toBe(401);
    mocks.findUser.mockResolvedValue({ role: 'admin', isBanned: true, sessionVersion: 0 });
    expect((await request(app).delete('/api/forum/threads/7').set('Authorization', `Bearer ${token('admin')}`)).status).toBe(403);
    expect(mocks.deleteThread).not.toHaveBeenCalled();
  });
});
