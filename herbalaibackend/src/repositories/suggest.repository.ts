import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

export interface SuggestedHerbData {
  submitterId: string;
  localName: string;
  cebuanoName?: string;
  scientificName: string;
  category: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  regionFound?: string;
  warnings?: string;
  informationSource?: string;
  imageUrl?: string | null;
}

/**
 * Creates a new herb suggestion in the database.
 */
export const createSuggestion = async (data: SuggestedHerbData) => {
  return prisma.suggestedHerb.create({
    data: {
      submitterId: data.submitterId,
      localName: data.localName,
      cebuanoName: data.cebuanoName ?? null,
      scientificName: data.scientificName,
      category: data.category,
      medicinalUses: data.medicinalUses,
      preparationMethod: data.preparationMethod,
      dosage: data.dosage,
      regionFound: data.regionFound ?? null,
      warnings: data.warnings ?? null,
      informationSource: data.informationSource ?? null,
      imageUrl: data.imageUrl ?? null,
    },
  });
};

/**
 * Finds a suggestion by its ID.
 */
export const findSuggestionById = async (id: number) => {
  return prisma.suggestedHerb.findUnique({
    where: { id },
  });
};

/**
 * Retrieves all suggestions ordered by submission date.
 */
export const findAllSuggestions = async () => {
  return prisma.suggestedHerb.findMany({
    orderBy: { submittedAt: "desc" },
  });
};

/**
 * Approves a suggestion by updating its status and inserting it as an approved Herb.
 */
export const approveSuggestion = async (id: number, reviewerId: string, vectorStr: string | null) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update suggestion status
    const suggestion = await tx.suggestedHerb.update({
      where: { id },
      data: {
        status: "Approved",
        reviewedBy: reviewerId,
      },
    });

    // 2. Create the Herb record
    const herbId = "h-" + crypto.randomBytes(8).toString("hex");

    await tx.$executeRawUnsafe(
      `INSERT INTO "Herb" (id, "localName", "cebuanoName", "scientificName", category, "medicinalUses", "preparationMethod", dosage, "regionFound", warnings, "imageUrl", embedding, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::vector, NOW(), NOW())`,
      herbId,
      suggestion.localName,
      suggestion.cebuanoName,
      suggestion.scientificName,
      suggestion.category,
      suggestion.medicinalUses,
      suggestion.preparationMethod,
      suggestion.dosage,
      suggestion.regionFound,
      suggestion.warnings,
      suggestion.imageUrl,
      vectorStr
    );

    // Retrieve the newly created Herb record
    return tx.herb.findUnique({
      where: { id: herbId },
    });
  });
};

/**
 * Rejects a suggestion by updating its status.
 */
export const rejectSuggestion = async (id: number, reviewerId: string) => {
  return prisma.suggestedHerb.update({
    where: { id },
    data: {
      status: "Rejected",
      reviewedBy: reviewerId,
    },
  });
};

/**
 * Retrieves suggestions submitted by a specific user.
 */
export const findSuggestionsBySubmitter = async (submitterId: string) => {
  return prisma.suggestedHerb.findMany({
    where: { submitterId },
    orderBy: { submittedAt: "desc" },
  });
};
