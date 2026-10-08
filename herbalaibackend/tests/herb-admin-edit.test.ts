import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ find: vi.fn(), current: vi.fn(), others: vi.fn(), update: vi.fn(), raw: vi.fn(), audit: vi.fn(), embed: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  herb: { findUnique: mocks.find },
  $transaction: async (operation: (transaction: unknown) => unknown) => operation({ herb: { findUnique: mocks.current, findMany: mocks.others, update: mocks.update }, $executeRaw: mocks.raw, auditLog: { create: mocks.audit } }),
} }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed }));
import { HerbController } from '../src/controllers/herb.controller.js';

const herb = { id: 'TEST-herb-edit', localName: 'TEST Audit Plant', scientificName: 'Testus originalis', preparationMethod: 'Old preparation.', dosage: 'No dose.', medicinalUses: 'Educational text.', category: 'TEST', publicationStatus: 'PUBLISHED', isVerified: true, updatedAt: new Date('2026-10-08T00:00:00Z'), sourceScientificName: null, cebuanoName: null, evidenceClass: 'DOCUMENTED_TRADITIONAL_USE', warnings: null };
const app = express();
app.use(express.json());
app.put('/herbs/:id', (req, _res, next) => { Object.assign(req, { user: { userId: 'TEST-admin', role: 'admin' } }); next(); }, new HerbController().updateHerb);
app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => { res.status(error.status ?? 500).json({ message: error.message }); });
const edit = (body: unknown) => request(app).put(`/herbs/${herb.id}`).send(body as object);

describe('guarded administrator herb edits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.find.mockResolvedValue({ ...herb });
    mocks.current.mockResolvedValue({ ...herb });
    mocks.others.mockResolvedValue([]);
    mocks.update.mockImplementation(async ({ data }) => ({ ...herb, ...data }));
    mocks.raw.mockResolvedValue(1);
    mocks.audit.mockResolvedValue({ id: 1 });
    mocks.embed.mockResolvedValue(Array(768).fill(0.1));
  });
  it.each([{ localName: 42 }, { scientificName: [] }, { preparationMethod: ' ' }, { isDohApproved: 'true' }, { id: 'other' }, {}])('rejects invalid partial input before database access: %j', async body => {
    expect((await edit(body)).status).toBe(400);
    expect(mocks.find).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('updates the current preparation vector in the same audited transaction', async () => {
    expect((await edit({ preparationMethod: 'Corrected sourced description.' })).status).toBe(200);
    expect(mocks.embed).toHaveBeenCalledWith(expect.stringContaining('Corrected sourced description.'));
    const vectorCall = mocks.raw.mock.calls.find(([query]) => query.join('').includes('SET embedding'));
    expect(JSON.parse(vectorCall?.[1]).length).toBe(768);
    expect(mocks.audit.mock.calls[0]?.[0].data.details.embeddingInputSha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it('does not save content if embedding generation fails', async () => {
    mocks.embed.mockRejectedValue(new Error('TEST provider failure'));
    expect((await edit({ preparationMethod: 'New text.' })).status).toBe(503);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it('rejects canonical scientific-identity collisions, including authorship variants', async () => {
    mocks.others.mockResolvedValue([{ localName: 'Other', scientificName: 'Testus duplicatus (L.) Author', sourceScientificName: null }]);
    expect((await edit({ scientificName: 'Testus duplicatus' })).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('rejects concurrent edits instead of overwriting the newer snapshot', async () => {
    mocks.current.mockResolvedValue({ ...herb, updatedAt: new Date('2026-10-08T01:00:00Z') });
    expect((await edit({ preparationMethod: 'New text.' })).status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('avoids generation when only the image changes', async () => {
    expect((await edit({ imageUrl: 'https://example.invalid/image.png' })).status).toBe(200);
    expect(mocks.embed).not.toHaveBeenCalled();
  });
  it('invalidates a draft vector without indexing unpublished content', async () => {
    mocks.find.mockResolvedValue({ ...herb, publicationStatus: 'DRAFT', isVerified: false });
    mocks.current.mockResolvedValue({ ...herb, publicationStatus: 'DRAFT', isVerified: false });
    expect((await edit({ preparationMethod: 'Draft text.' })).status).toBe(200);
    expect(mocks.embed).not.toHaveBeenCalled();
    expect(mocks.raw.mock.calls.some(([query, value]) => query.join('').includes('SET embedding') && value === null)).toBe(true);
  });
});
