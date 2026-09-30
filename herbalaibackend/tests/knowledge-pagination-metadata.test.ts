import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({
  prisma: { knowledgeBase: { findMany: mocks.findMany, count: mocks.count } },
}));

import { findAllKB, findKBPage, MAX_UNPAGED_KB_RECORDS } from '../src/repositories/knowledgebase.repository.js';
import { GetAllKnowledgeBaseService } from '../src/services/ai/knowledge-base/get-all-knowledge-base-service.js';

it('includes source metadata in the paginated editor response', async () => {
  mocks.findMany.mockResolvedValue([]);
  mocks.count.mockResolvedValue(0);

  await findKBPage(1, 25, '');

  expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
    select: expect.objectContaining({ metadata: true }),
  }));
});

it('bounds the legacy unpaged query and directs oversized results to pagination', async () => {
  mocks.findMany.mockResolvedValueOnce(Array(MAX_UNPAGED_KB_RECORDS + 1).fill({ id: 'test' }));

  const result = await GetAllKnowledgeBaseService();

  expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
    take: MAX_UNPAGED_KB_RECORDS + 1,
  }));
  expect(result).toMatchObject({ code: 409, status: 'error', message: expect.stringContaining('/page') });
});

it('preserves the legacy unpaged response for a small knowledge base', async () => {
  const records = [{ id: 'test' }];
  mocks.findMany.mockResolvedValueOnce(records);

  expect(await findAllKB()).toBe(records);
  mocks.findMany.mockResolvedValueOnce(records);
  expect(await GetAllKnowledgeBaseService()).toMatchObject({ code: 200, status: 'success', data: records });
});
