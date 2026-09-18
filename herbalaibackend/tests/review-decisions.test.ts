import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), audit: vi.fn(), herb: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  $transaction: (callback: (transaction: unknown) => unknown) => callback({
    suggestedHerb: mocks, auditLog: { create: mocks.audit }, herb: { create: mocks.herb },
  }),
} }));
import { requestChanges, rejectSuggestion, approveSuggestion } from '../src/repositories/suggest.repository.js';

describe('Atomic review decisions', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each(['return', 'reject', 'approve'])('blocks a stale %s without an audit or publication', async (action) => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const result = action === 'return' ? await requestChanges(7, 'admin', 'Review notes', 3)
      : action === 'reject' ? await rejectSuggestion(7, 'admin', 3)
      : await approveSuggestion(7, 'admin', null, 'DOCUMENTED_TRADITIONAL_USE', 'Notes', 3);
    expect(result).toBeNull();
    expect(mocks.updateMany.mock.calls[0][0].where).toEqual({ id: 7, status: 'Pending', revision: 3 });
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.herb).not.toHaveBeenCalled();
  });

  it('allows only one competing decision to claim the same revision', async () => {
    let pending = true;
    mocks.updateMany.mockImplementation(async ({ where }) => {
      if (!pending || where.status !== 'Pending' || where.revision !== 3) return { count: 0 };
      pending = false;
      return { count: 1 };
    });
    mocks.findUniqueOrThrow.mockResolvedValue({ id: 7, status: 'ChangesRequested', revision: 4, localName: 'QA', scientificName: 'QA', reviewNotes: 'Notes' });
    const results = await Promise.all([requestChanges(7, 'first-admin', 'Notes', 3), rejectSuggestion(7, 'second-admin', 3)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(mocks.audit).toHaveBeenCalledTimes(1);
  });

  it('propagates audit failure from the transaction instead of reporting rejection success', async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUniqueOrThrow.mockResolvedValue({ id: 7, localName: 'QA', scientificName: 'QA', reviewNotes: null, revision: 4 });
    mocks.audit.mockRejectedValue(new Error('Audit unavailable'));
    await expect(rejectSuggestion(7, 'admin', 3)).rejects.toThrow('Audit unavailable');
  });
});
