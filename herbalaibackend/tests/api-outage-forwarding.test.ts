import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ findAll: vi.fn(), findOne: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), upsert: vi.fn(), stats: vi.fn(), embedding: vi.fn() }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({
  MAX_UNPAGED_KB_RECORDS: 500, findAllKB: mocks.findAll, findKBById: mocks.findOne,
  createKB: mocks.create, updateKB: mocks.update, deleteKB: mocks.remove, upsertKBBatch: mocks.upsert,
}));
vi.mock('../src/repositories/stats.repository.js', () => ({ statsRepository: { getSystemStats: mocks.stats } }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embedding }));

import { statsController } from '../src/controllers/stats.controller.js';
import { errorResponse } from '../src/utils/error-response.js';
import { GetAllKnowledgeBaseService } from '../src/services/ai/knowledge-base/get-all-knowledge-base-service.js';
import { CreateKnowledgeBaseService } from '../src/services/ai/knowledge-base/create-knowledge-base-service.js';
import { UpdateKnowledgeBaseService } from '../src/services/ai/knowledge-base/update-knowledge-base-service.js';
import { DeleteKnowledgeBaseService } from '../src/services/ai/knowledge-base/delete-knowledge-base-service.js';
import { ImportKnowledgeBaseService } from '../src/services/ai/knowledge-base/import-knowledge-base-service.js';

const metadata = { jurisdiction: 'Philippines', sources: [{ title: 'TEST ONLY source', publisher: 'TEST', url: 'https://example.invalid/source' }] };
const fact = { question: 'TEST ONLY question', answer: 'TEST ONLY answer', metadata };
const operations = [
  ['list', mocks.findAll, () => GetAllKnowledgeBaseService()],
  ['create', mocks.create, () => CreateKnowledgeBaseService(fact, 'TEST-admin')],
  ['update', mocks.update, () => UpdateKnowledgeBaseService({ id: 'TEST-record', answer: 'TEST update' }, 'TEST-admin')],
  ['delete', mocks.remove, () => DeleteKnowledgeBaseService('TEST-record', 'TEST-admin')],
  ['import', mocks.upsert, () => ImportKnowledgeBaseService([fact], 'TEST-admin')],
] as const;

describe('administrator API outage forwarding', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findOne.mockResolvedValue({ ...fact, id: 'TEST-record' });
    mocks.embedding.mockResolvedValue([0.1, 0.2]);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(['P1001', 'P2028'])('forwards statistics outage %s to the safe 503 handler', async code => {
    mocks.stats.mockRejectedValue(Object.assign(new Error('private database details'), { code }));
    const app = express();
    app.get('/stats', statsController.getDashboardStats);
    app.use((error: Error & { code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const response = errorResponse(error, true);
      res.status(response.status).json(response.body);
    });
    const response = await request(app).get('/stats');
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('DATABASE_UNAVAILABLE');
    expect(JSON.stringify(response.body)).not.toContain('private database details');
  });

  it.each(operations)('%s forwards a database outage rather than returning generic 500', async (_name, dependency, operation) => {
    const outage = Object.assign(new Error('private database details'), { code: 'P1001' });
    dependency.mockRejectedValue(outage);
    await expect(operation()).rejects.toBe(outage);
  });

  it('preserves create duplicate-conflict handling', async () => {
    mocks.create.mockRejectedValue(Object.assign(new Error('unique constraint'), { code: 'P2002' }));
    expect(await CreateKnowledgeBaseService(fact, 'TEST-admin')).toMatchObject({ code: 409 });
  });
});
