import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findThread: vi.fn(),
  findComment: vi.fn(),
  findThreadLike: vi.fn(),
  findCommentLike: vi.fn(),
  createThreadLike: vi.fn(),
  createCommentLike: vi.fn(),
  countThreadLikes: vi.fn(),
  countCommentLikes: vi.fn(),
  updateThread: vi.fn(),
  updateComment: vi.fn(),
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    $transaction: (callback: (transaction: unknown) => unknown) => callback({
      thread: { findFirst: mocks.findThread, update: mocks.updateThread },
      threadComment: { findFirst: mocks.findComment, update: mocks.updateComment },
      threadLike: { findUnique: mocks.findThreadLike, create: mocks.createThreadLike, count: mocks.countThreadLikes },
      threadCommentLike: { findUnique: mocks.findCommentLike, create: mocks.createCommentLike, count: mocks.countCommentLikes },
    }),
  },
}));

import { toggleThreadLike, toggleCommentLike } from '../src/repositories/forum.repository.js';

describe('forum like target visibility', () => {
  beforeEach(() => vi.resetAllMocks());

  it('does not like a missing or deleted discussion', async () => {
    mocks.findThread.mockResolvedValue(null);

    expect(await toggleThreadLike(999, 'member')).toBeNull();
    expect(mocks.findThread).toHaveBeenCalledWith({ where: { id: 999, isDeleted: false }, select: { id: true } });
    expect(mocks.createThreadLike).not.toHaveBeenCalled();
  });

  it('does not like a deleted reply or a reply in a deleted discussion', async () => {
    mocks.findComment.mockResolvedValue(null);

    expect(await toggleCommentLike(999, 'member')).toBeNull();
    expect(mocks.findComment).toHaveBeenCalledWith({
      where: { id: 999, isDeleted: false, thread: { isDeleted: false } },
      select: { id: true },
    });
    expect(mocks.createCommentLike).not.toHaveBeenCalled();
  });

  it('preserves a valid thread like and its displayed count', async () => {
    mocks.findThread.mockResolvedValue({ id: 16 });
    mocks.findThreadLike.mockResolvedValue(null);
    mocks.countThreadLikes.mockResolvedValue(1);

    expect(await toggleThreadLike(16, 'member')).toEqual({ likes: 1, hasLiked: true });
    expect(mocks.createThreadLike).toHaveBeenCalledWith({ data: { threadId: 16, userId: 'member' } });
    expect(mocks.updateThread).toHaveBeenCalledWith({ where: { id: 16 }, data: { likes: 1 } });
  });
});
