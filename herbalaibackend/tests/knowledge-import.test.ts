import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), embed: vi.fn() }));
vi.mock('../src/repositories/knowledgebase.repository.js', () => ({ upsertKB: mocks.upsert }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed }));

import { ImportKnowledgeBaseService } from '../src/services/ai/knowledge-base/import-knowledge-base-service.js';

describe('Knowledge base JSON import', () => {
  const philippineMetadata = {
    jurisdiction: 'Philippines',
    sources: [{ title: 'Directory of Herbs', publisher: 'PITAHC', url: 'https://pitahc.gov.ph/herbs-directory/' }],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.embed.mockResolvedValue([0.1, 0.2]);
    mocks.upsert
      .mockResolvedValueOnce({ id: 'new-fact', created: true })
      .mockResolvedValueOnce({ id: 'updated-fact', created: false });
  });

  it('embeds and upserts every validated fact', async () => {
    const result = await ImportKnowledgeBaseService([
      { question: 'How is Lagundi prepared?', answer: 'Use the documented preparation.', tags: ['Lagundi', 'lagundi'], metadata: philippineMetadata },
      { question: 'What evidence is available?', answer: 'The source reports clinical evidence.', metadata: philippineMetadata },
    ]);

    expect(result).toMatchObject({ status: 'success', data: { total: 2, created: 1, updated: 1 } });
    expect(mocks.embed).toHaveBeenCalledTimes(2);
    expect(mocks.upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
      question: 'How is Lagundi prepared?',
      tags: ['lagundi'],
      embedding: '[0.1,0.2]',
    }));
  });

  it('rejects duplicate questions before generating embeddings', async () => {
    const result = await ImportKnowledgeBaseService([
      { question: 'Same question?', answer: 'First sufficiently detailed answer.', metadata: philippineMetadata },
      { question: ' same question? ', answer: 'Second sufficiently detailed answer.', metadata: philippineMetadata },
    ]);

    expect(result).toMatchObject({ status: 'error', code: 400 });
    expect(mocks.embed).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('rejects facts without Philippine jurisdiction and source metadata', async () => {
    const result = await ImportKnowledgeBaseService([
      {
        question: 'What is a general herbal medicine fact?',
        answer: 'This record is intentionally outside the Philippine scope.',
        metadata: {
          jurisdiction: 'International',
          sources: [{ title: 'General source', publisher: 'Foreign publisher', url: 'https://example.com/source' }],
        },
      },
    ]);

    expect(result).toMatchObject({
      status: 'error',
      code: 400,
      message: expect.stringContaining('jurisdiction "Philippines"'),
    });
    expect(mocks.embed).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('ships PITAHC facts for the nine DOH herbs beyond Lagundi', async () => {
    const raw = await readFile(new URL('../content/knowledge-base/pitahc-nine-herbs.json', import.meta.url), 'utf8');
    const facts = JSON.parse(raw) as Array<{ question: string; metadata: { jurisdiction: string; sources: unknown[] } }>;
    const expectedHerbs = ['Sambong', 'Ampalaya', 'Bawang', 'Bayabas', 'Yerba Buena', 'Tsaang-gubat', 'Akapulko', 'Niyog-niyogan', 'Ulasimang Bato'];

    expect(facts).toHaveLength(9);
    expect(expectedHerbs.every((herb) => facts.some((fact) => fact.question.includes(herb)))).toBe(true);
    expect(facts.every((fact) => fact.metadata.jurisdiction === 'Philippines')).toBe(true);
    expect(facts.every((fact) => fact.metadata.sources.length > 0)).toBe(true);
  });
});
