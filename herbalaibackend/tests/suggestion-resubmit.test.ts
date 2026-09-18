import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ updateMany: vi.fn(), findUnique: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  $transaction: (callback: (transaction: unknown) => unknown) => callback({ suggestedHerb: mocks }),
} }));
import { resubmitSuggestion } from '../src/repositories/suggest.repository.js';

const revision = { localName: 'Test herb', scientificName: 'Test plant', category: 'Other', medicinalUses: 'Recorded use', preparationMethod: 'Not provided', dosage: 'Not provided', informationSource: 'Reference', imageUrl: '/images/herbs/test.jpg' };

describe('Contributor resubmission', () => {
  beforeEach(() => vi.clearAllMocks());
  it('requires matching ownership and changes-requested state in the write itself', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect(await resubmitSuggestion(7, 'owner', revision)).toBeNull();
    expect(mocks.updateMany.mock.calls[0][0].where).toEqual({ id: 7, submitterId: 'owner', status: 'ChangesRequested' });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it('returns a revised pending submission with evidence awaiting review', async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUnique.mockResolvedValue({ id: 7, status: 'Pending' });
    expect(await resubmitSuggestion(7, 'owner', revision)).toEqual({ id: 7, status: 'Pending' });
    expect(mocks.updateMany.mock.calls[0][0].data).toMatchObject({ ...revision, status: 'Pending', evidenceClass: 'UNASSESSED', warnings: null });
    expect(mocks.updateMany.mock.calls[0][0].data).not.toHaveProperty('reviewNotes');
  });
});
