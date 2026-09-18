import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { TtlCache } from "../lib/ttl-cache.js";

const herbCache = new TtlCache();
const HERB_CACHE_PREFIX = "herbs:";
const HERB_CACHE_TTL_MS = Math.max(1_000, Number(process.env["HERB_CACHE_TTL_MS"] ?? 300_000));

export const invalidateHerbCache = () => herbCache.deletePrefix(HERB_CACHE_PREFIX);

export interface HerbData {
  localName: string;
  cebuanoName?: string;
  scientificName: string;
  category: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  regionFound?: string;
  warnings?: string;
  imageUrl?: string;
  embedding?: string; // Vector as string "[v1,v2,...]"
}

/**
 * Find herb by ID
 */
export const findHerbById = async (id: string) => {
  return herbCache.getOrSet(`${HERB_CACHE_PREFIX}detail:${id}`, HERB_CACHE_TTL_MS, () =>
    prisma.herb.findFirst({
      where: { id, publicationStatus: "PUBLISHED", isVerified: true },
      include: { sources: true },
    })
  );
};

export interface FindHerbsOptions {
  search?: string | undefined;
  category?: string | undefined;
  isDohApproved?: boolean | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

/**
 * Find herbs with optional filtering and pagination
 */
export const findAllHerbs = async (options: FindHerbsOptions = {}) => {
  const { search, category, isDohApproved, page, limit } = options;

  const cacheKey = `${HERB_CACHE_PREFIX}list:${JSON.stringify({
    search: search?.trim().toLowerCase() || null,
    category: category?.trim().toLowerCase() || null,
    isDohApproved: isDohApproved ?? null,
    page: page ?? null,
    limit: limit ?? null,
  })}`;

  return herbCache.getOrSet(cacheKey, HERB_CACHE_TTL_MS, async () => {

    const where: Prisma.HerbWhereInput = {
      publicationStatus: "PUBLISHED",
      isVerified: true,
    };

    if (category && category.toLowerCase() !== 'all') {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (isDohApproved !== undefined) {
      where.isDohApproved = isDohApproved;
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { localName: { contains: s, mode: 'insensitive' } },
        { cebuanoName: { contains: s, mode: 'insensitive' } },
        { scientificName: { contains: s, mode: 'insensitive' } },
        { medicinalUses: { contains: s, mode: 'insensitive' } },
        { category: { contains: s, mode: 'insensitive' } },
      ];
    }

    const paginationArgs: { take?: number; skip?: number } = {};
    if (limit && limit > 0) {
      paginationArgs.take = limit;
      if (page && page > 1) {
        paginationArgs.skip = (page - 1) * limit;
      }
    }

    const [herbs, total] = await Promise.all([
      prisma.herb.findMany({
        where,
        include: { sources: true },
        orderBy: { localName: 'asc' },
        ...paginationArgs,
      }),
      prisma.herb.count({ where }),
    ]);

    return { herbs, total };
  });
};

/**
 * Create herb with optional embedding vector
 */
export const createHerb = async (data: HerbData) => {
  if (data.embedding) {
    const result = await prisma.$executeRawUnsafe(
      `INSERT INTO "Herb" (id, "localName", "cebuanoName", "scientificName", category, "medicinalUses", "preparationMethod", dosage, "regionFound", warnings, "imageUrl", embedding, "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::vector, NOW(), NOW())`,
      data.localName,
      data.cebuanoName ?? null,
      data.scientificName,
      data.category,
      data.medicinalUses,
      data.preparationMethod,
      data.dosage,
      data.regionFound ?? null,
      data.warnings ?? null,
      data.imageUrl ?? null,
      data.embedding
    );
    invalidateHerbCache();
    return result;
  }
  const herb = await prisma.herb.create({
    data: {
      localName: data.localName,
      cebuanoName: data.cebuanoName ?? null,
      scientificName: data.scientificName,
      category: data.category,
      medicinalUses: data.medicinalUses,
      preparationMethod: data.preparationMethod,
      dosage: data.dosage,
      regionFound: data.regionFound ?? null,
      warnings: data.warnings ?? null,
      imageUrl: data.imageUrl ?? null,
    },
  });
  invalidateHerbCache();
  return herb;
};

/**
 * Update herb, including vector embedding
 */
export const updateHerb = async (id: string, data: Partial<HerbData>) => {
  if (data.embedding) {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "Herb" SET 
        "localName" = COALESCE($1, "localName"), 
        "cebuanoName" = COALESCE($2, "cebuanoName"), 
        "scientificName" = COALESCE($3, "scientificName"), 
        category = COALESCE($4, category), 
        "medicinalUses" = COALESCE($5, "medicinalUses"), 
        "preparationMethod" = COALESCE($6, "preparationMethod"), 
        dosage = COALESCE($7, dosage), 
        "regionFound" = COALESCE($8, "regionFound"), 
        warnings = COALESCE($9, warnings), 
        "imageUrl" = COALESCE($10, "imageUrl"), 
        embedding = $11::vector, 
        "updatedAt" = NOW() 
       WHERE id = $12`,
      data.localName ?? null,
      data.cebuanoName ?? null,
      data.scientificName ?? null,
      data.category ?? null,
      data.medicinalUses ?? null,
      data.preparationMethod ?? null,
      data.dosage ?? null,
      data.regionFound ?? null,
      data.warnings ?? null,
      data.imageUrl ?? null,
      data.embedding,
      id
    );
    invalidateHerbCache();
    return result;
  }

  const updateData: Prisma.HerbUpdateInput = {};
  if (data.localName !== undefined) updateData.localName = data.localName;
  if (data.cebuanoName !== undefined) updateData.cebuanoName = data.cebuanoName ?? null;
  if (data.scientificName !== undefined) updateData.scientificName = data.scientificName;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.medicinalUses !== undefined) updateData.medicinalUses = data.medicinalUses;
  if (data.preparationMethod !== undefined) updateData.preparationMethod = data.preparationMethod;
  if (data.dosage !== undefined) updateData.dosage = data.dosage;
  if (data.regionFound !== undefined) updateData.regionFound = data.regionFound ?? null;
  if (data.warnings !== undefined) updateData.warnings = data.warnings ?? null;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ?? null;

  const herb = await prisma.herb.update({
    where: { id },
    data: updateData,
  });
  invalidateHerbCache();
  return herb;
};

export interface HerbQueryResult {
  id: string;
  localName: string;
  scientificName: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  warnings: string | null;
  distance: number;
}

/**
 * Cosine similarity search on Herb embedding column
 */
export const searchSimilarHerbs = async (vector: string, limit: number = 3) => {
  return await prisma.$queryRawUnsafe<HerbQueryResult[]>(
    `SELECT id, "localName", "scientificName", "medicinalUses", "preparationMethod", dosage, warnings,
     (embedding <=> $1::vector) as distance
     FROM "Herb"
     WHERE embedding IS NOT NULL
       AND "publicationStatus" = 'PUBLISHED'::"HerbPublicationStatus"
       AND "isVerified" = true
     ORDER BY distance ASC
     LIMIT $2`,
    vector,
    limit
  );
};
