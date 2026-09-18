import { describe, expect, it, vi, beforeEach } from 'vitest';
import { editSuggestionSchema, reviewReferencesSchema } from '../src/schema/suggest.schema.js';

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), updateMany: vi.fn(), auditCreate: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  $transaction: (callback: (transaction: unknown) => unknown) => callback({ suggestedHerb: mocks, auditLog: { create: mocks.auditCreate } }),
} }));
import { editSuggestion } from '../src/repositories/suggest.repository.js';
const source = { title: 'Study', publisher: 'Journal', url: 'https://example.org/study', citation: '', publishedAt: '2024', supports: ['medicinalUses'] };
const body = { localName: 'Herb', scientificName: 'Test plant', category: 'Other', medicinalUses: 'Use', preparationMethod: 'Notes', dosage: 'Notes', informationSource: 'Original reference', imageUrl: '', references: [source], reviewNotes: 'Corrected description', revision: 0 };

describe('Admin review edits', () => {
  beforeEach(() => vi.clearAllMocks());
  it('requires usable references and scoped claims', () => {
    expect(reviewReferencesSchema.safeParse([source]).success).toBe(true);
    for (const references of [[], [{ ...source, url: '', citation: '' }], [{ ...source, url: 'javascript:alert(1)' }], [{ ...source, supports: [] }], [{ ...source, supports: ['invented'] }]]) {
      expect(reviewReferencesSchema.safeParse(references).success).toBe(false);
    }
    expect(reviewReferencesSchema.safeParse([{ ...source, url: '', citation: 'Printed journal, volume 1' }]).success).toBe(true);
  });
  it('rejects publication and ownership fields in the edit payload', () => {
    expect(editSuggestionSchema.safeParse({ body }).success).toBe(true);
    expect(editSuggestionSchema.safeParse({ body: { ...body, submitterId: 'other' } }).success).toBe(false);
    expect(editSuggestionSchema.safeParse({ body: { ...body, status: 'Approved' } }).success).toBe(false);
  });
  it('rejects stale or completed submissions without writing', async () => {
    const edit = editSuggestionSchema.parse({ body }).body;
    for (const before of [null, { status: 'Approved', revision: 0 }, { status: 'Pending', revision: 1 }]) {
      mocks.findUnique.mockResolvedValue(before);
      expect(await editSuggestion(1, 'reviewer', edit)).toBeNull();
    }
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
  it('saves before/after history with the edit and guards concurrent writes', async () => {
    const before = { id: 1, status: 'Pending', revision: 0, localName: 'Original' };
    const after = { ...before, ...body, revision: 1 };
    mocks.findUnique.mockResolvedValueOnce(before).mockResolvedValueOnce(after);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    const edit = editSuggestionSchema.parse({ body }).body;
    expect(await editSuggestion(1, 'reviewer', edit)).toEqual(after);
    expect(mocks.updateMany.mock.calls[0][0].where).toEqual({ id: 1, status: 'Pending', revision: 0 });
    expect(mocks.auditCreate.mock.calls[0][0].data).toMatchObject({ adminId: 'reviewer', action: 'EDIT_SUGGESTION', details: { before, after } });
  });
});
