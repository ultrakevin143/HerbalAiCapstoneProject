import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createKB: vi.fn(),
  findKBById: vi.fn(),
  updateKB: vi.fn(),
  upsertKBBatch: vi.fn(),
  generateEmbedding: vi.fn(),
}));

vi.mock('../src/repositories/knowledgebase.repository.js', () => mocks);
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.generateEmbedding }));

import { hasPhilippineSourceMetadata } from '../src/services/ai/knowledge-base/source-metadata.js';
import { CreateKnowledgeBaseService } from '../src/services/ai/knowledge-base/create-knowledge-base-service.js';
import { UpdateKnowledgeBaseService } from '../src/services/ai/knowledge-base/update-knowledge-base-service.js';
import { ImportKnowledgeBaseService } from '../src/services/ai/knowledge-base/import-knowledge-base-service.js';

const metadata = {
  jurisdiction: 'Philippines',
  sources: [{ title: 'Herbs Directory', publisher: 'PITAHC', url: 'https://pitahc.gov.ph/herbs-directory/' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.generateEmbedding.mockResolvedValue([0.1, 0.2]);
  mocks.createKB.mockResolvedValue({ id: 'kb-1' });
  mocks.findKBById.mockResolvedValue({ id: 'kb-1', question: 'Question?', answer: 'Existing answer', metadata });
  mocks.updateKB.mockResolvedValue(undefined);
  mocks.upsertKBBatch.mockResolvedValue([{ created: true }]);
});

describe('knowledge-base source requirements', () => {
  it('accepts a Philippine HTTP(S) citation and rejects unsafe or missing sources', () => {
    expect(hasPhilippineSourceMetadata(metadata)).toBe(true);
    expect(hasPhilippineSourceMetadata({ ...metadata, sources: [{ ...metadata.sources[0], url: 'javascript:alert(1)' }] })).toBe(false);
    expect(hasPhilippineSourceMetadata({ ...metadata, sources: [] })).toBe(false);
    expect(hasPhilippineSourceMetadata({ ...metadata, jurisdiction: 'Other' })).toBe(false);
  });

  it('does not create an unsourced answer', async () => {
    const result = await CreateKnowledgeBaseService({ question: 'Question?', answer: 'A documented answer' }, 'admin-1');
    expect(result.code).toBe(400);
    expect(mocks.generateEmbedding).not.toHaveBeenCalled();
    expect(mocks.createKB).not.toHaveBeenCalled();
  });

  it('stores the source on a new manual answer', async () => {
    const result = await CreateKnowledgeBaseService({ question: 'Question?', answer: 'A documented answer', metadata }, 'admin-1');
    expect(result.code).toBe(201);
    expect(mocks.createKB).toHaveBeenCalledWith(expect.objectContaining({ metadata }), 'admin-1');
  });

  it('requires a source when changing legacy unsourced content', async () => {
    mocks.findKBById.mockResolvedValueOnce({ id: 'kb-1', question: 'Question?', answer: 'Old answer', metadata: null });
    const result = await UpdateKnowledgeBaseService({ id: 'kb-1', answer: 'Changed answer' }, 'admin-1');
    expect(result.code).toBe(400);
    expect(mocks.updateKB).not.toHaveBeenCalled();
  });

  it('keeps status-only updates possible without rewriting legacy content', async () => {
    mocks.findKBById.mockResolvedValueOnce({ id: 'kb-1', question: 'Question?', answer: 'Old answer', metadata: null });
    const result = await UpdateKnowledgeBaseService({ id: 'kb-1', isActive: false }, 'admin-1');
    expect(result.code).toBe(200);
    expect(mocks.updateKB).toHaveBeenCalledWith('kb-1', { isActive: false }, 'admin-1');
  });

  it('rejects imported facts with a non-HTTP source URL', async () => {
    const result = await ImportKnowledgeBaseService([{
      question: 'Question?',
      answer: 'A documented answer',
      metadata: { ...metadata, sources: [{ ...metadata.sources[0], url: 'javascript:alert(1)' }] },
    }], 'admin-1');
    expect(result.code).toBe(400);
    expect(mocks.generateEmbedding).not.toHaveBeenCalled();
    expect(mocks.upsertKBBatch).not.toHaveBeenCalled();
  });
});
