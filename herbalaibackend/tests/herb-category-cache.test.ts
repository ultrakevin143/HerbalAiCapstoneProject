import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { herb: mocks } }));

import { findAllHerbs, invalidateHerbCache } from '../src/repositories/herb.repository.js';
import { HerbController } from '../src/controllers/herb.controller.js';

const app = express();
app.get('/api/herbs', new HerbController().getAllHerbs);

const herbs = [
  { id: 'TEST-digestive', category: 'Digestive' },
  { id: 'TEST-respiratory', category: 'Respiratory' },
];
type Filter = { category?: { equals: string } };
const matchingHerbs = (where: Filter) => herbs.filter(herb => !where.category
  || herb.category.toLowerCase() === where.category.equals.toLowerCase());

beforeEach(() => {
  vi.clearAllMocks();
  invalidateHerbCache();
  mocks.findMany.mockImplementation(async ({ where }: { where: Filter }) => matchingHerbs(where));
  mocks.count.mockImplementation(async ({ where }: { where: Filter }) => matchingHerbs(where).length);
});

describe('Library category filtering and shared cache', () => {
  it('does not let a whitespace-only category cache an empty unfiltered catalog', async () => {
    await findAllHerbs({ category: '   ', page: 1, limit: 10 });
    expect(await findAllHerbs({ page: 1, limit: 10 })).toEqual({ herbs, total: 2 });
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });

  it('normalizes a padded category before its first database query and cache write', async () => {
    const expected = { herbs: [herbs[0]], total: 1 };
    expect(await findAllHerbs({ category: '  Digestive  ' })).toEqual(expected);
    expect(await findAllHerbs({ category: 'digestive' })).toEqual(expected);
    expect(mocks.findMany).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      where: { publicationStatus: 'PUBLISHED', isVerified: true, category: { equals: 'Digestive', mode: 'insensitive' } },
    }));
  });

  it.each([undefined, '', '  ', 'All', ' ALL ', '\tall\n'])('shares the canonical unfiltered cache for category %j', async category => {
    await findAllHerbs();
    const options = category === undefined ? {} : { category };
    expect(await findAllHerbs(options)).toEqual({ herbs, total: 2 });
    expect(mocks.findMany).toHaveBeenCalledOnce();
    expect(mocks.count).toHaveBeenCalledOnce();
  });

  it('keeps distinct categories in distinct cache entries', async () => {
    expect((await findAllHerbs({ category: 'Digestive' })).herbs).toEqual([herbs[0]]);
    expect((await findAllHerbs({ category: 'Respiratory' })).herbs).toEqual([herbs[1]]);
    expect(mocks.findMany).toHaveBeenCalledTimes(2);
  });

  it('keeps publication and verification restrictions when normalizing category input', async () => {
    await findAllHerbs({ category: ' ALL ' });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { publicationStatus: 'PUBLISHED', isVerified: true },
    }));
    expect(mocks.count).toHaveBeenCalledWith({ where: { publicationStatus: 'PUBLISHED', isVerified: true } });
  });

  it('invalidates the canonical category cache after a Library mutation', async () => {
    await findAllHerbs({ category: 'Digestive' });
    invalidateHerbCache();
    await findAllHerbs({ category: ' Digestive ' });
    expect(mocks.findMany).toHaveBeenCalledTimes(2);
    expect(mocks.count).toHaveBeenCalledTimes(2);
  });

  it('keeps the normal public HTTP listing populated after a blank-category request', async () => {
    expect((await request(app).get('/api/herbs').query({ category: '   ', limit: 10 })).body.data.total).toBe(2);
    const response = await request(app).get('/api/herbs').query({ limit: 10 });
    expect(response.status).toBe(200);
    expect(response.body.data.herbs).toEqual(herbs);
    expect(response.body.data.total).toBe(2);
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });

  it('uses the same filtered HTTP result for padded and canonical category requests', async () => {
    const padded = await request(app).get('/api/herbs').query({ category: ' Digestive ' });
    const canonical = await request(app).get('/api/herbs').query({ category: 'Digestive' });
    expect(padded.status).toBe(200);
    expect(canonical.status).toBe(200);
    expect(padded.body.data.herbs).toEqual([herbs[0]]);
    expect(canonical.body.data).toEqual(padded.body.data);
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });
});
