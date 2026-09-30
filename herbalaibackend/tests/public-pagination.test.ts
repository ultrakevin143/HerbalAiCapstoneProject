import { describe, expect, it } from 'vitest';
import { publicPagination } from '../src/utils/public-pagination.js';

describe('public pagination', () => {
  it.each([
    [{}, { page: 1, limit: 25 }],
    [{ page: '-1', limit: '0' }, { page: 1, limit: 25 }],
    [{ page: '2abc', limit: 'Infinity' }, { page: 1, limit: 25 }],
    [{ page: '2', limit: '1000' }, { page: 2, limit: 100 }],
    [{ page: '999999', limit: '12' }, { page: 10_000, limit: 12 }],
    [{ page: ['1', '2'], limit: ['5'] }, { page: 1, limit: 25 }],
  ])('normalizes %j to %j', (query, expected) => {
    expect(publicPagination(query)).toEqual(expected);
  });
});
