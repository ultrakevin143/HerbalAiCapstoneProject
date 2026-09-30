import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  incrementThreadViews: vi.fn(),
  findThreadById: vi.fn(),
  findCommentsByThreadId: vi.fn(),
  findAllThreads: vi.fn(),
  findAllHerbs: vi.fn(),
}));

vi.mock('../src/repositories/forum.repository.js', () => ({
  incrementThreadViews: mocks.incrementThreadViews,
  findThreadById: mocks.findThreadById,
  findCommentsByThreadId: mocks.findCommentsByThreadId,
  findAllThreads: mocks.findAllThreads,
}));
vi.mock('../src/repositories/herb.repository.js', () => ({ findAllHerbs: mocks.findAllHerbs }));

import app from '../src/app.js';

describe('public read endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.incrementThreadViews.mockResolvedValue({ count: 0 });
    mocks.findAllThreads.mockResolvedValue({ threads: [], total: 0 });
    mocks.findAllHerbs.mockResolvedValue({ herbs: [], total: 0 });
  });

  it('returns 404 rather than a database error for a missing discussion', async () => {
    const response = await request(app).get('/api/forum/threads/999999999');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Discussion thread not found.');
    expect(mocks.findThreadById).not.toHaveBeenCalled();
  });

  it.each(['16abc', '0', '-1', '9007199254740992'])('rejects malformed discussion ID %s before a database write', async (id) => {
    const response = await request(app).get(`/api/forum/threads/${id}`);

    expect(response.status).toBe(400);
    expect(mocks.incrementThreadViews).not.toHaveBeenCalled();
  });

  it.each([
    ['/api/forum/threads?page=-1&limit=1000', 'findAllThreads'],
    ['/api/herbs?page=-1&limit=1000', 'findAllHerbs'],
  ] as const)('normalizes pagination at %s', async (path, repositoryMethod) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ page: 1, limit: 100, totalPages: 0 });
    expect(mocks[repositoryMethod]).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 100 }));
  });

  it.each([
    ['/api/forum/threads?search=one&search=two', 'findAllThreads'],
    ['/api/herbs?category=one&category=two', 'findAllHerbs'],
    ['/api/herbs?isDohApproved=maybe', 'findAllHerbs'],
  ] as const)('returns 400 for malformed filters at %s', async (path, repositoryMethod) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(400);
    expect(mocks[repositoryMethod]).not.toHaveBeenCalled();
  });
});
