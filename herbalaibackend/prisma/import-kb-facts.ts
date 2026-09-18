import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { closeDatabasePool, prisma } from '../src/lib/prisma.js';
import { generateEmbedding } from '../src/services/ai/core/gemini-service.js';

interface KnowledgeFact {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

const sourceDirectory = path.resolve(process.cwd(), 'content', 'knowledge-base');

const validateFact = (value: unknown, index: number): KnowledgeFact => {
  if (!value || typeof value !== 'object') throw new Error(`Fact ${index + 1} must be an object.`);
  const fact = value as Partial<KnowledgeFact>;
  if (!fact.question?.trim() || !fact.answer?.trim() || !fact.category?.trim()) {
    throw new Error(`Fact ${index + 1} is missing question, answer, or category.`);
  }
  if (!Array.isArray(fact.tags) || !fact.tags.every((tag) => typeof tag === 'string')) {
    throw new Error(`Fact ${index + 1} has invalid tags.`);
  }
  if (!fact.metadata || typeof fact.metadata !== 'object' || Array.isArray(fact.metadata)) {
    throw new Error(`Fact ${index + 1} has invalid metadata.`);
  }
  return fact as KnowledgeFact;
};

const main = async () => {
  const requestedPath = process.argv[2];
  const sourcePaths = requestedPath
    ? [path.resolve(process.cwd(), requestedPath)]
    : (await readdir(sourceDirectory))
        .filter((fileName) => fileName.endsWith('.json') && !fileName.endsWith('.retired.json'))
        .sort()
        .map((fileName) => path.join(sourceDirectory, fileName));
  if (!requestedPath) {
    const retirementFiles = (await readdir(sourceDirectory))
      .filter((fileName) => fileName.endsWith('.retired.json'))
      .sort();
    for (const fileName of retirementFiles) {
      const questions = JSON.parse(await readFile(path.join(sourceDirectory, fileName), 'utf8')) as unknown;
      if (!Array.isArray(questions) || !questions.every((question) => typeof question === 'string')) {
        throw new Error(`${fileName} must contain an array of question strings.`);
      }
      const result = await prisma.knowledgeBase.updateMany({
        where: { question: { in: questions } },
        data: { isActive: false },
      });
      console.info(`Retired ${result.count} KB facts listed in ${fileName}.`);
    }
  }
  const facts: KnowledgeFact[] = [];
  for (const sourcePath of sourcePaths) {
    const raw = JSON.parse(await readFile(sourcePath, 'utf8')) as unknown;
    if (!Array.isArray(raw)) throw new Error(`${path.basename(sourcePath)} must contain an array.`);
    facts.push(...raw.map(validateFact));
  }
  const questions = facts.map((fact) => fact.question.trim().toLowerCase());
  if (new Set(questions).size !== questions.length) throw new Error('Knowledge-base files contain duplicate questions.');

  for (const fact of facts) {
    const embedding = await generateEmbedding(`${fact.question}\n${fact.answer}`);
    const record = await prisma.knowledgeBase.upsert({
      where: { question: fact.question },
      create: { ...fact, isActive: true },
      update: { answer: fact.answer, category: fact.category, tags: fact.tags, metadata: fact.metadata, isActive: true },
      select: { id: true },
    });
    await prisma.$executeRawUnsafe(
      'UPDATE "KnowledgeBase" SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2',
      `[${embedding.join(',')}]`,
      record.id,
    );
    console.info(`Imported KB fact: ${fact.question}`);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDatabasePool);
