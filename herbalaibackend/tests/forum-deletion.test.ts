import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { threadComment: { findMany } } }));
import { findCommentsByThreadId } from '../src/repositories/forum.repository.js';

describe('Public forum reply deletion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('masks stored deleted reply text while preserving its place in the thread', async () => {
    const deleted = { id: 7, threadId: 1, content: 'Previously deleted private text', isDeleted: true };
    findMany.mockResolvedValue([deleted]);
    const result = await findCommentsByThreadId(1);
    expect(result).toEqual([{ ...deleted, content: '[This reply has been deleted by the author or moderator.]' }]);
    expect(JSON.stringify(result)).not.toContain(deleted.content);
    expect(deleted.content).toBe('Previously deleted private text');
  });

  it('preserves active replies and their ordering beside deleted placeholders', async () => {
    const active = { id: 8, threadId: 1, content: 'Visible observation', isDeleted: false };
    findMany.mockResolvedValue([
      { id: 7, threadId: 1, content: 'Hidden text', isDeleted: true }, active,
    ]);
    const result = await findCommentsByThreadId(1);
    expect(result.map(comment => comment.id)).toEqual([7, 8]);
    expect(result[1]).toEqual(active);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { threadId: 1 }, orderBy: { date: 'asc' } }));
  });
});
