import { upsertKBBatch } from '../../../repositories/knowledgebase.repository.js';
import { rethrowDatabaseUnavailable } from '../../../utils/error-response.js';
import { generateEmbedding } from '../core/gemini-service.js';
import { hasPhilippineSourceMetadata } from './source-metadata.js';

interface ImportKnowledgeFact {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export async function ImportKnowledgeBaseService(facts: ImportKnowledgeFact[], adminId: string) {
  try {
    const normalizedQuestions = facts.map((fact) => fact.question.trim().toLowerCase());
    if (new Set(normalizedQuestions).size !== normalizedQuestions.length) {
      return { code: 400, status: 'error', message: 'The file contains duplicate questions.' };
    }
    if (facts.some((fact) => !hasPhilippineSourceMetadata(fact.metadata))) {
      return {
        code: 400,
        status: 'error',
        message: 'Every imported fact must declare jurisdiction "Philippines" and include at least one titled source with a publisher and valid URL.',
      };
    }

    const prepared = [];
    for (const fact of facts) {
      const question = fact.question.trim();
      const answer = fact.answer.trim();
      const embedding = await generateEmbedding(`${question}\n${answer}`);
      prepared.push({
        question,
        answer,
        tags: Array.from(new Set((fact.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))),
        embedding: `[${embedding.join(',')}]`,
        ...(fact.category?.trim() ? { category: fact.category.trim() } : {}),
        ...(fact.metadata ? { metadata: fact.metadata } : {}),
      });
    }

    let created = 0;
    let updated = 0;
    for (const result of await upsertKBBatch(prepared, adminId)) {
      if (result.created) created += 1;
      else updated += 1;
    }

    return {
      code: 200,
      status: 'success',
      message: `Imported ${facts.length} knowledge base fact${facts.length === 1 ? '' : 's'}.`,
      data: { total: facts.length, created, updated },
    };
  } catch (error) {
    rethrowDatabaseUnavailable(error);
    console.error('ImportKnowledgeBaseService Error:', error);
    return { code: 500, status: 'error', message: 'Unable to import the knowledge base file.' };
  }
}
