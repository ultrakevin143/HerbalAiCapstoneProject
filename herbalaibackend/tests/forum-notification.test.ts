import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findThread: vi.fn(),
  findParent: vi.fn(),
  createComment: vi.fn(),
  updateThread: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    $transaction: (callback: (transaction: unknown) => unknown) => callback({
      thread: { findFirst: mocks.findThread, update: mocks.updateThread },
      threadComment: { findFirst: mocks.findParent, create: mocks.createComment },
      notification: { create: mocks.createNotification },
    }),
  },
}));

import { createComment } from '../src/repositories/forum.repository.js';

describe('Community comment notifications', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findThread.mockResolvedValue({ authorId: 'thread-owner', title: 'Growing lagundi' });
    mocks.createComment.mockResolvedValue({
      id: 42,
      author: { name: 'Maria' },
    });
    mocks.updateThread.mockResolvedValue({});
    mocks.createNotification.mockImplementation(async ({ data }) => ({ id: 10, ...data }));
  });

  it('notifies a thread owner about a new top-level comment', async () => {
    const result = await createComment({
      threadId: 7,
      authorId: 'commenter',
      content: 'Helpful answer',
    });

    expect(mocks.createNotification).toHaveBeenCalledOnce();
    expect(mocks.createNotification).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'thread-owner',
        type: 'COMMUNITY_COMMENT',
        link: '/community/7#comment-42',
      }),
    });
    expect(result.notifications).toHaveLength(1);
  });

  it('notifies both the replied-to author and thread owner without duplicates', async () => {
    mocks.findParent.mockResolvedValue({ authorId: 'comment-owner' });

    await createComment({
      threadId: 7,
      authorId: 'replier',
      content: 'Thanks for sharing',
      parentCommentId: 12,
    });

    expect(mocks.createNotification).toHaveBeenCalledTimes(2);
    expect(mocks.createNotification).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'thread-owner', type: 'COMMUNITY_COMMENT' }),
    });
    expect(mocks.createNotification).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'comment-owner', type: 'COMMUNITY_REPLY' }),
    });
  });

  it('does not send a notification for a user replying to themself', async () => {
    mocks.findThread.mockResolvedValue({ authorId: 'author', title: 'Herbal safety' });
    mocks.findParent.mockResolvedValue({ authorId: 'author' });

    const result = await createComment({
      threadId: 8,
      authorId: 'author',
      content: 'One more detail',
      parentCommentId: 15,
    });

    expect(mocks.createNotification).not.toHaveBeenCalled();
    expect(result.notifications).toEqual([]);
  });

  it('rejects replies to missing or deleted comments', async () => {
    mocks.findParent.mockResolvedValue(null);

    await expect(createComment({
      threadId: 7,
      authorId: 'replier',
      content: 'Reply',
      parentCommentId: 999,
    })).rejects.toThrow('The comment you are replying to was not found.');
    expect(mocks.createComment).not.toHaveBeenCalled();
  });
});
