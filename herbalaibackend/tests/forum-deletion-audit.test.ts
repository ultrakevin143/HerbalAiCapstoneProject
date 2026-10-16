import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateThread: vi.fn(),
  createAudit: vi.fn(),
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    thread: { update: mocks.updateThread },
    $transaction: (callback: (transaction: unknown) => unknown) => callback({
      thread: { update: mocks.updateThread },
      auditLog: { create: mocks.createAudit },
    }),
  },
}));

import { deleteThread } from '../src/repositories/forum.repository.js';

describe('thread deletion audit details', () => {
  const thread = {
    id: 17,
    title: 'Growing lagundi at home',
    category: 'growing',
    authorId: 'discussion-author',
    content: 'Discussion body retained only in the thread record.',
    isDeleted: true,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.updateThread.mockResolvedValue(thread);
  });

  it('writes identifying details to the audit entry without copying the discussion body', async () => {
    expect(await deleteThread(17, 'moderator')).toEqual(thread);
    expect(mocks.updateThread).toHaveBeenCalledExactlyOnceWith({
      where: { id: 17, isDeleted: false },
      data: { isDeleted: true },
    });
    expect(mocks.createAudit).toHaveBeenCalledExactlyOnceWith({
      data: {
        adminId: 'moderator',
        action: 'DELETE_THREAD',
        targetType: 'Thread',
        targetId: '17',
        details: {
          title: thread.title,
          category: thread.category,
          authorId: thread.authorId,
          isDeleted: true,
        },
      },
    });
    expect(JSON.stringify(mocks.createAudit.mock.calls)).not.toContain(thread.content);
  });

  it('does not record successful deletion when the thread update fails', async () => {
    mocks.updateThread.mockRejectedValue(new Error('Thread not found'));
    await expect(deleteThread(17, 'moderator')).rejects.toThrow('Thread not found');
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it('keeps contributor self-deletion outside the administrator audit trail', async () => {
    await deleteThread(17);
    expect(mocks.updateThread).toHaveBeenCalledOnce();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });
});
