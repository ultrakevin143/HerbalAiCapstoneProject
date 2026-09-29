import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({
  prisma: { knowledgeBase: { findMany: mocks.findMany, count: mocks.count } },
}));

import { findKBPage } from '../src/repositories/knowledgebase.repository.js';

it('includes source metadata in the paginated editor response', async () => {
  mocks.findMany.mockResolvedValue([]);
  mocks.count.mockResolvedValue(0);

  await findKBPage(1, 25, '');

  expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
    select: expect.objectContaining({ metadata: true }),
  }));
});
