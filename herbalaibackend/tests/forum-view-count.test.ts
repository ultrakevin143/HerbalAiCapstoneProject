import { describe, expect, it, vi } from 'vitest';

const updateMany = vi.hoisted(() => vi.fn().mockResolvedValue({ count: 0 }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { thread: { updateMany } } }));

import { incrementThreadViews } from '../src/repositories/forum.repository.js';

describe('forum view counting', () => {
  it('updates only a visible thread and can report a missing row without throwing', async () => {
    expect(await incrementThreadViews(999999999)).toEqual({ count: 0 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 999999999, isDeleted: false },
      data: { views: { increment: 1 } },
    });
  });
});
