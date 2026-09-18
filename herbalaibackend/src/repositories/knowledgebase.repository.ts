import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export interface KBData {
  question?: string;
  answer: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  embedding?: string; // Vector as string "[v1,v2,...]"
  isActive?: boolean;
}

/**
 * Create knowledge base entry with vector embedding
 */
export const createKB = async (data: KBData) => {
  const records = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "KnowledgeBase" (id, question, answer, category, tags, metadata, embedding, "isActive", "createdAt", "updatedAt") 
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::vector, true, NOW(), NOW())
     RETURNING id`,
    data.question || null,
    data.answer,
    data.category || null,
    data.tags || [],
    data.metadata || {},
    data.embedding || null
  );
  return records[0];
};

export const upsertKB = async (data: KBData & { question: string }) => {
  const existing = await prisma.knowledgeBase.findUnique({
    where: { question: data.question },
    select: { id: true },
  });
  const record = await prisma.knowledgeBase.upsert({
    where: { question: data.question },
    create: {
      question: data.question,
      answer: data.answer,
      category: data.category ?? null,
      tags: data.tags ?? [],
      metadata: data.metadata ? data.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
      isActive: data.isActive ?? true,
    },
    update: {
      answer: data.answer,
      category: data.category ?? null,
      tags: data.tags ?? [],
      metadata: data.metadata ? data.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
      isActive: data.isActive ?? true,
    },
    select: { id: true },
  });
  if (data.embedding) {
    await prisma.$executeRawUnsafe(
      'UPDATE "KnowledgeBase" SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2',
      data.embedding,
      record.id,
    );
  }
  return { ...record, created: !existing };
};

/**
 * Update knowledge base entry, optionally updating vector embedding
 */
export const updateKB = async (id: string, data: Partial<KBData>) => {
  if (data.embedding) {
    return await prisma.$executeRawUnsafe(
      `UPDATE "KnowledgeBase" SET 
        question = COALESCE($1, question), 
        answer = COALESCE($2, answer), 
        category = COALESCE($3, category), 
        tags = COALESCE($4, tags), 
        metadata = COALESCE($5, metadata), 
        embedding = $6::vector, 
        "isActive" = COALESCE($7, "isActive"), 
        "updatedAt" = NOW() 
       WHERE id = $8`,
      data.question ?? null,
      data.answer ?? null,
      data.category ?? null,
      data.tags ?? null,
      data.metadata ?? null,
      data.embedding,
      data.isActive ?? null,
      id
    );
  } else {
    const updateData: Prisma.KnowledgeBaseUpdateInput = {};
    if (data.question !== undefined) updateData.question = data.question;
    if (data.answer !== undefined) updateData.answer = data.answer;
    if (data.category !== undefined) updateData.category = data.category ?? null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.metadata !== undefined) updateData.metadata = (data.metadata as Prisma.InputJsonValue) ?? null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.knowledgeBase.update({
      where: { id },
      data: updateData
    });
  }
};

/**
 * Delete knowledge base entry
 */
export const deleteKB = async (id: string) => {
  return await prisma.knowledgeBase.delete({
    where: { id }
  });
};

/**
 * Find all entries (excluding embeddings for performance)
 */
export const findAllKB = async () => {
  return await prisma.knowledgeBase.findMany({
    select: {
      id: true,
      question: true,
      answer: true,
      category: true,
      tags: true,
      metadata: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" }
  });
};

/**
 * Find entry by ID
 */
export const findKBById = async (id: string) => {
  return await prisma.knowledgeBase.findUnique({
    where: { id }
  });
};

export const findActiveKBByTerms = async (terms: string[], limit: number = 3) => {
  const normalizedTerms = Array.from(new Set(terms.map((term) => term.trim().toLowerCase()).filter(Boolean)));
  if (normalizedTerms.length === 0) return [];
  return prisma.knowledgeBase.findMany({
    where: {
      isActive: true,
      OR: [
        { tags: { hasSome: normalizedTerms } },
        ...normalizedTerms.flatMap((term) => [
          { question: { contains: term, mode: 'insensitive' as const } },
          { answer: { contains: term, mode: 'insensitive' as const } },
        ]),
      ],
    },
    select: { id: true, question: true, answer: true, category: true, tags: true, metadata: true },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
};

export interface KBQueryResult {
  id: string;
  question: string | null;
  answer: string;
  category: string | null;
  tags: string[];
  metadata: Record<string, unknown> | null;
  distance: number;
}

/**
 * Semantic search using cosine similarity
 */
export const searchSimilarKB = async (vector: string, limit: number = 3) => {
  return await prisma.$queryRawUnsafe<KBQueryResult[]>(
    `SELECT id, question, answer, category, tags, metadata, 
     (embedding <=> $1::vector) as distance
     FROM "KnowledgeBase"
     WHERE "isActive" = true
     ORDER BY distance ASC
     LIMIT $2`,
    vector,
    limit
  );
};
