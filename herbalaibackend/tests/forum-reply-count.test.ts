import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { thread: mocks } }));
import { findAllThreads, findThreadById } from '../src/repositories/forum.repository.js';

describe('forum reply counts', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lists the current comment count even when the historical counter is stale', async () => {
    mocks.findMany.mockResolvedValue([
      { id: 13, replies: 6, _count: { comments: 4 } },
      { id: 14, replies: 5, _count: { comments: 0 } },
    ]);
    mocks.count.mockResolvedValue(2);
    expect(await findAllThreads({ page: 2, limit: 10 })).toEqual({
      threads: [{ id: 13, replies: 4 }, { id: 14, replies: 0 }], total: 2,
    });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({ _count: { select: { comments: true } } }), take: 10, skip: 10,
    }));
  });

  it('returns the current comment count on thread detail without leaking aggregate fields', async () => {
    mocks.findFirst.mockResolvedValue({ id: 13, replies: 6, _count: { comments: 4 } });
    expect(await findThreadById(13)).toEqual({ id: 13, replies: 4 });
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 13, isDeleted: false },
      include: expect.objectContaining({ _count: { select: { comments: true } } }),
    }));
  });

  it('retains the missing/deleted thread boundary', async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect(await findThreadById(99)).toBeNull();
  });
});
