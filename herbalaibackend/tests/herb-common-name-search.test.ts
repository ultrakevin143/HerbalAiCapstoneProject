import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { herb: mocks } }));

import { findMatchingHerbNames } from '../src/content/regionalCommonNames.js';
import { findAllHerbs, invalidateHerbCache } from '../src/repositories/herb.repository.js';
import { HerbController } from '../src/controllers/herb.controller.js';

const cases = [
  { query: 'Holy Basil', localName: 'Balanay', scientificName: 'Ocimum tenuiflorum', category: 'Respiratory' },
  { query: 'Indian Mallow', localName: 'Abutilon indicum', scientificName: 'Abutilon indicum', category: 'Renal & Diuretic' },
  { query: 'Portia Tree', localName: 'Thespesia populnea', scientificName: 'Thespesia populnea', category: 'Dermatological & Skin Care' },
  { query: 'Sponge Gourd', localName: 'Luffa aegyptiaca', scientificName: 'Luffa aegyptiaca', category: 'Digestive & Gastrointestinal' },
];

const published = cases.map((entry, index) => ({
  id: `TEST-alias-${index}`,
  localName: entry.localName,
  scientificName: entry.scientificName,
  category: entry.category,
  cebuanoName: '',
  medicinalUses: '',
  publicationStatus: 'PUBLISHED',
  isVerified: true,
  isDohApproved: false,
}));
const records = [
  ...published,
  { ...published[0]!, id: 'TEST-alias-draft', publicationStatus: 'DRAFT' },
  { ...published[0]!, id: 'TEST-alias-unverified', isVerified: false },
];

type TextFilter = { contains?: string; equals?: string; mode?: string };
type SearchField = 'localName' | 'cebuanoName' | 'scientificName' | 'medicinalUses' | 'category';
type Filter = {
  publicationStatus?: string;
  isVerified?: boolean;
  isDohApproved?: boolean;
  category?: TextFilter;
  OR?: Partial<Record<SearchField, TextFilter>>[];
};

const matchesText = (value: string, filter: TextFilter) => {
  const text = filter.mode === 'insensitive' ? value.toLowerCase() : value;
  const normalize = (input: string) => filter.mode === 'insensitive' ? input.toLowerCase() : input;
  return (filter.equals === undefined || text === normalize(filter.equals))
    && (filter.contains === undefined || text.includes(normalize(filter.contains)));
};

const matchingRecords = (where: Filter) => records.filter(record =>
  record.publicationStatus === where.publicationStatus
  && record.isVerified === where.isVerified
  && (where.isDohApproved === undefined || record.isDohApproved === where.isDohApproved)
  && (!where.category || matchesText(record.category, where.category))
  && (!where.OR || where.OR.some(condition => Object.entries(condition).every(([field, filter]) =>
    matchesText(record[field as SearchField], filter)))),
);

const app = express();
app.get('/api/herbs', new HerbController().getAllHerbs);

beforeEach(() => {
  vi.clearAllMocks();
  invalidateHerbCache();
  mocks.findMany.mockImplementation(async ({ where, skip = 0, take }: { where: Filter; skip?: number; take?: number }) => {
    const filtered = matchingRecords(where);
    return filtered.slice(skip, take === undefined ? undefined : skip + take);
  });
  mocks.count.mockImplementation(async ({ where }: { where: Filter }) => matchingRecords(where).length);
});

describe('Common-name search uses the published catalog identity', () => {
  it.each(cases)('maps $query to the stored $localName rather than its first Tagalog alias', entry => {
    expect(findMatchingHerbNames(entry.query)).toContain(entry.localName);
  });

  it.each(cases)('returns $query through the real HTTP controller and repository', async entry => {
    const response = await request(app).get('/api/herbs').query({ search: entry.query, page: 1, limit: 12 });
    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(1);
    expect(response.body.data.herbs).toEqual([expect.objectContaining({ localName: entry.localName, scientificName: entry.scientificName })]);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        publicationStatus: 'PUBLISHED',
        isVerified: true,
        OR: expect.arrayContaining([{ localName: { equals: entry.localName, mode: 'insensitive' } }]),
      }),
    }));
    expect(mocks.count.mock.calls[0]![0].where).toEqual(mocks.findMany.mock.calls[0]![0].where);
  });

  it('normalizes case and surrounding whitespace without contaminating other search caches', async () => {
    const first = await findAllHerbs({ search: '  HOLY BASIL  ', page: 1, limit: 12 });
    expect(await findAllHerbs({ search: 'holy basil', page: 1, limit: 12 })).toEqual(first);
    expect(mocks.findMany).toHaveBeenCalledOnce();
    expect((await findAllHerbs({ search: 'Indian Mallow', page: 1, limit: 12 })).herbs[0]?.localName).toBe('Abutilon indicum');
    expect(mocks.findMany).toHaveBeenCalledTimes(2);
  });

  it('retains category and DOH filters for alias searches', async () => {
    expect((await findAllHerbs({ search: 'Holy Basil', category: 'Respiratory' })).total).toBe(1);
    expect((await findAllHerbs({ search: 'Holy Basil', category: 'Renal & Diuretic' })).total).toBe(0);
    expect((await findAllHerbs({ search: 'Holy Basil', isDohApproved: true })).total).toBe(0);
  });

  it('uses the same alias-aware predicate for paginated rows and total counts', async () => {
    expect((await findAllHerbs({ search: 'Holy Basil', page: 2, limit: 1 }))).toEqual({ herbs: [], total: 1 });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 1, take: 1 }));
    expect(mocks.count.mock.calls[0]![0].where).toEqual(mocks.findMany.mock.calls[0]![0].where);
  });

  it('does not turn unknown input into an unrelated catalog result', async () => {
    expect(findMatchingHerbNames('TEST-no-such-herb')).toEqual([]);
    expect(await findAllHerbs({ search: 'TEST-no-such-herb' })).toEqual({ herbs: [], total: 0 });
  });
});
