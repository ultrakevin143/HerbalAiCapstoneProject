import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  incrementThreadViews: vi.fn(),
  findThreadById: vi.fn(),
  findCommentsByThreadId: vi.fn(),
  toggleThreadLike: vi.fn(),
  toggleCommentLike: vi.fn(),
}));

vi.mock('../src/repositories/forum.repository.js', () => mocks);

import { ForumController } from '../src/controllers/forum.controller.js';

const response = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json };
};

describe('forum thread detail', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 404 without loading comments when the thread is absent or deleted', async () => {
    mocks.incrementThreadViews.mockResolvedValue({ count: 0 });
    const res = response();

    await new ForumController().getThreadDetail({ params: { id: '999999999' } } as never, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 404, message: 'Discussion thread not found.' }));
    expect(mocks.findThreadById).not.toHaveBeenCalled();
    expect(mocks.findCommentsByThreadId).not.toHaveBeenCalled();
  });

  it('returns the thread and comments after a successful view increment', async () => {
    const thread = { id: 16, title: 'Available thread' };
    const comments = [{ id: 1 }];
    mocks.incrementThreadViews.mockResolvedValue({ count: 1 });
    mocks.findThreadById.mockResolvedValue(thread);
    mocks.findCommentsByThreadId.mockResolvedValue(comments);
    const res = response();

    await new ForumController().getThreadDetail({ params: { id: '16' } } as never, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { thread, comments } }));
  });

  it('returns 404 when a thread disappears between the increment and detail lookup', async () => {
    mocks.incrementThreadViews.mockResolvedValue({ count: 1 });
    mocks.findThreadById.mockResolvedValue(null);
    const res = response();

    await new ForumController().getThreadDetail({ params: { id: '16' } } as never, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.findCommentsByThreadId).not.toHaveBeenCalled();
  });

  it.each(['likeThread', 'deleteThread', 'createComment', 'likeComment', 'deleteComment'] as const)(
    'rejects malformed IDs on %s before mutating records', async (action) => {
      const res = response();
      const req = { params: { id: '16abc' }, user: { userId: 'member', role: 'contributor' }, body: { content: 'Test' } };

      await new ForumController()[action](req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mocks.findThreadById).not.toHaveBeenCalled();
    },
  );

  it('rejects a malformed parent comment ID instead of replying to another comment', async () => {
    mocks.findThreadById.mockResolvedValue({ id: 16 });
    const res = response();
    const req = { params: { id: '16' }, user: { userId: 'member', role: 'contributor' }, body: { content: 'Reply', parentCommentId: '7abc' } };

    await new ForumController().createComment(req as never, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid parent comment ID.' }));
  });

  it.each([
    ['likeThread', 'toggleThreadLike', 'Discussion thread not found.'],
    ['likeComment', 'toggleCommentLike', 'Comment not found.'],
  ] as const)('returns 404 for a missing or deleted target on %s', async (action, repositoryMethod, message) => {
    mocks[repositoryMethod].mockResolvedValue(null);
    const res = response();
    const req = { params: { id: '16' }, user: { userId: 'member', role: 'contributor' } };

    await new ForumController()[action](req as never, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message }));
  });

  it.each([
    ['createThread', { title: { unexpected: true }, category: 'growing', content: 'Text' }],
    ['createThread', { title: 'Title', category: 'growing', content: ['not text'] }],
    ['createComment', { content: { unexpected: true } }],
  ] as const)('rejects non-text content on %s without a server error', async (action, body) => {
    const res = response();
    const req = { params: { id: '16' }, user: { userId: 'member', role: 'contributor' }, body };

    await new ForumController()[action](req as never, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
