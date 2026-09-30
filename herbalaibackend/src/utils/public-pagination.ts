const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_PAGE = 10_000;

const positiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const publicPagination = (query: { page?: unknown; limit?: unknown }) => ({
  page: Math.min(positiveInteger(query.page, 1), MAX_PAGE),
  limit: Math.min(positiveInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT),
});
