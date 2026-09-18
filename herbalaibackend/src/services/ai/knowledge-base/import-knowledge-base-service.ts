import { upsertKB } from '../../../repositories/knowledgebase.repository.js';
import { generateEmbedding } from '../core/gemini-service.js';

interface ImportKnowledgeFact {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

const hasPhilippineSourceMetadata = (metadata: Record<string, unknown> | undefined) => {
  if (!metadata || typeof metadata['jurisdiction'] !== 'string') return false;
  if (metadata['jurisdiction'].trim().toLowerCase() !== 'philippines') return false;
  const sources = metadata['sources'];
  return Array.isArray(sources) && sources.length > 0 && sources.every((source) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return false;
    const record = source as Record<string, unknown>;
    return typeof record['title'] === 'string'
      && record['title'].trim().length > 0
      && typeof record['publisher'] === 'string'
      && record['publisher'].trim().length > 0
      && typeof record['url'] === 'string'
      && URL.canParse(record['url']);
  });
};

export async function ImportKnowledgeBaseService(facts: ImportKnowledgeFact[]) {
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
    for (const fact of prepared) {
      const result = await upsertKB(fact);
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
    console.error('ImportKnowledgeBaseService Error:', error);
    return { code: 500, status: 'error', message: 'Unable to import the knowledge base file.' };
  }
}
