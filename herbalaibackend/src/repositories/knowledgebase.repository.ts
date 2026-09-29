import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { runAuditedMutation } from "./audit.repository.js";

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
export const createKB = (data: KBData, adminId: string) => runAuditedMutation({
  adminId,
  action: "CREATE_KNOWLEDGE_BASE",
  targetType: "KnowledgeBase",
}, async (transaction) => {
  const records = await transaction.$queryRawUnsafe<Array<{ id: string }>>(
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
  const created = records[0];
  if (!created) throw new Error("Knowledge base insert returned no record");
  return { result: created, targetId: created.id, details: { question: data.question } };
});

export const upsertKB = (data: KBData & { question: string }, adminId: string) => runAuditedMutation({
  adminId,
  action: "IMPORT_KNOWLEDGE_BASE",
  targetType: "KnowledgeBase",
}, async (transaction) => {
  const existing = await transaction.knowledgeBase.findUnique({
    where: { question: data.question },
    select: { id: true },
  });
  const record = await transaction.knowledgeBase.upsert({
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
    await transaction.$executeRawUnsafe(
      'UPDATE "KnowledgeBase" SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2',
      data.embedding,
      record.id,
    );
  }
  const result = { ...record, created: !existing };
  return { result, targetId: record.id, details: { question: data.question, created: result.created } };
});

/**
 * Update knowledge base entry, optionally updating vector embedding
 */
export const updateKB = (id: string, data: Partial<KBData>, adminId: string) => runAuditedMutation({
  adminId,
  action: "UPDATE_KNOWLEDGE_BASE",
  targetType: "KnowledgeBase",
}, async (transaction) => {
  if (data.embedding) {
    const updated = await transaction.$executeRawUnsafe(
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
    if (updated !== 1) throw new Error("Knowledge base record was not updated");
    return { result: undefined, targetId: id, details: { fields: Object.keys(data).filter((field) => field !== "embedding") } };
  } else {
    const updateData: Prisma.KnowledgeBaseUpdateInput = {};
    if (data.question !== undefined) updateData.question = data.question;
    if (data.answer !== undefined) updateData.answer = data.answer;
    if (data.category !== undefined) updateData.category = data.category ?? null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.metadata !== undefined) updateData.metadata = (data.metadata as Prisma.InputJsonValue) ?? null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await transaction.knowledgeBase.update({
      where: { id },
      data: updateData
    });
    return { result: undefined, targetId: id, details: { fields: Object.keys(data) } };
  }
});

/**
 * Delete knowledge base entry
 */
export const deleteKB = (id: string, adminId: string) => runAuditedMutation({
  adminId,
  action: "DELETE_KNOWLEDGE_BASE",
  targetType: "KnowledgeBase",
}, async (transaction) => {
  const result = await transaction.knowledgeBase.delete({ where: { id } });
  return { result, targetId: id };
});

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

export const findKBPage = async (page: number, limit: number, search: string) => {
  const where = search ? {
    OR: [
      { question: { contains: search, mode: 'insensitive' as const } },
      { answer: { contains: search, mode: 'insensitive' as const } },
      { category: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {};
  const [items, total] = await Promise.all([
    prisma.knowledgeBase.findMany({
      where,
      select: { id: true, question: true, answer: true, category: true, tags: true, metadata: true, isActive: true, createdAt: true, updatedAt: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.knowledgeBase.count({ where }),
  ]);
  return { items, total, page, limit };
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
