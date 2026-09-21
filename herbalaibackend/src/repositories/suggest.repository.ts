import { prisma } from "../lib/prisma.js";
import type { HerbEvidenceClass, Prisma } from "@prisma/client";
import crypto from "crypto";
import { reviewReferencesSchema, type SuggestionEdit } from '../schema/suggest.schema.js';

export const editSuggestion = async (id: number, reviewerId: string, edit: SuggestionEdit) => {
  return prisma.$transaction(async (tx) => {
    const before = await tx.suggestedHerb.findUnique({ where: { id } });
    if (!before || before.status !== 'Pending' || before.revision !== edit.revision) return null;
    const { revision, ...fields } = edit;
    const changed = await tx.suggestedHerb.updateMany({
      where: { id, status: 'Pending', revision },
      data: {
        ...fields, imageUrl: fields.imageUrl || null, revision: { increment: 1 },
        cebuanoName: fields.cebuanoName ?? null, warnings: fields.warnings ?? null,
        regionFound: fields.regionFound ?? null,
      },
    });
    if (changed.count !== 1) return null;
    const after = await tx.suggestedHerb.findUnique({ where: { id } });
    await tx.auditLog.create({ data: {
      adminId: reviewerId, action: 'EDIT_SUGGESTION', targetType: 'SuggestedHerb', targetId: String(id),
      details: JSON.parse(JSON.stringify({ before, after })) as Prisma.InputJsonValue,
    } });
    return after;
  });
};

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

export const findPendingSuggestionPage = async (page: number, limit: number) => {
  const where = { status: 'Pending' as const };
  const [suggestions, total] = await Promise.all([
    prisma.suggestedHerb.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.suggestedHerb.count({ where }),
  ]);
  return { suggestions, total, page, limit };
};

/**
 * Approves a suggestion by updating its status and inserting it as an approved Herb.
 */
export const approveSuggestion = async (
  id: number,
  reviewerId: string,
  vectorStr: string | null,
  evidenceClass: HerbEvidenceClass = "DOCUMENTED_TRADITIONAL_USE",
  reviewNotes?: string,
  expectedRevision?: number,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update suggestion status
    const changed = await tx.suggestedHerb.updateMany({
      where: { id, status: 'Pending', ...(expectedRevision === undefined ? {} : { revision: expectedRevision }) },
      data: {
        status: "Approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
        evidenceClass,
        revision: { increment: 1 },
      },
    });

    if (changed.count !== 1) return null;
    const suggestion = await tx.suggestedHerb.findUniqueOrThrow({ where: { id } });

    // 2. Create the Herb record
    const herbId = "h-" + crypto.randomBytes(8).toString("hex");

    const informationSource = suggestion.informationSource?.trim();
    if (!informationSource) {
      throw new Error("A documented information source is required before approval.");
    }

    let sourceUrl: string | null = null;
    try {
      const parsedSource = new URL(informationSource);
      if (parsedSource.protocol === "http:" || parsedSource.protocol === "https:") {
        sourceUrl = parsedSource.toString();
      }
    } catch {
      sourceUrl = null;
    }

    await tx.herb.create({
      data: {
        id: herbId,
        localName: suggestion.localName,
        cebuanoName: suggestion.cebuanoName,
        scientificName: suggestion.scientificName,
        sourceScientificName: suggestion.scientificName,
        category: suggestion.category,
        medicinalUses: suggestion.medicinalUses,
        preparationMethod: suggestion.preparationMethod,
        dosage: suggestion.dosage,
        regionFound: suggestion.regionFound,
        warnings: suggestion.warnings,
        imageUrl: suggestion.imageUrl,
        isDohApproved: false,
        isVerified: true,
        publicationStatus: "PUBLISHED",
        evidenceClass,
        provenance: "COMMUNITY_SUBMISSION",
        reviewedAt: new Date(),
        reviewer: { connect: { id: reviewerId } },
        sourceSuggestion: { connect: { id } },
        sources: {
          create: Array.isArray(suggestion.references) && suggestion.references.length > 0
            ? reviewReferencesSchema.parse(suggestion.references).map((source) => ({
              ...source, url: source.url || null, citation: source.citation || null,
            }))
            : {
            title: "Contributor-provided information source",
            url: sourceUrl,
            citation: sourceUrl ? null : informationSource,
            supports: ["identity", "medicinalUses", "preparationMethod", "dosage", "warnings"],
            accessedAt: sourceUrl ? new Date() : null,
          },
        },
      },
    });

    if (vectorStr) {
      await tx.$executeRawUnsafe(
        `UPDATE "Herb" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        herbId
      );
    }

    await tx.auditLog.create({
      data: {
        adminId: reviewerId,
        action: "APPROVE_SUGGESTION",
        targetType: "SuggestedHerb",
        targetId: String(id),
        details: JSON.parse(JSON.stringify({ suggestion, herbId, evidenceClass })) as Prisma.InputJsonValue,
      },
    });

    // Retrieve the newly created Herb record
    return tx.herb.findUnique({
      where: { id: herbId },
      include: { sources: true },
    });
  });
};

const decideSuggestion = async (id: number, reviewerId: string, status: 'ChangesRequested' | 'Rejected', expectedRevision?: number, reviewNotes?: string) => {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.suggestedHerb.updateMany({
      where: { id, status: 'Pending', ...(expectedRevision === undefined ? {} : { revision: expectedRevision }) },
      data: { status, reviewedBy: reviewerId, reviewedAt: new Date(), reviewNotes: reviewNotes ?? null, revision: { increment: 1 } },
    });
    if (changed.count !== 1) return null;
    const suggestion = await tx.suggestedHerb.findUniqueOrThrow({ where: { id } });
    await tx.auditLog.create({
      data: {
        adminId: reviewerId,
        action: status === 'ChangesRequested' ? 'REQUEST_CHANGES_SUGGESTION' : 'REJECT_SUGGESTION',
        targetType: "SuggestedHerb",
        targetId: String(id),
        details: { localName: suggestion.localName, scientificName: suggestion.scientificName, reviewNotes: suggestion.reviewNotes, revision: suggestion.revision } as Prisma.InputJsonValue,
      },
    });
    return suggestion;
  });
};

export const requestChanges = (id: number, reviewerId: string, reviewNotes: string, expectedRevision?: number) =>
  decideSuggestion(id, reviewerId, 'ChangesRequested', expectedRevision, reviewNotes);

/**
 * Rejects a suggestion by updating its status.
 */
export const rejectSuggestion = (id: number, reviewerId: string, expectedRevision?: number) =>
  decideSuggestion(id, reviewerId, 'Rejected', expectedRevision);

/**
 * Retrieves suggestions submitted by a specific user.
 */
export const findSuggestionsBySubmitter = async (submitterId: string) => {
  return prisma.suggestedHerb.findMany({
    where: { submitterId },
    orderBy: { submittedAt: "desc" },
  });
};

export const resubmitSuggestion = async (id: number, submitterId: string, data: Omit<SuggestedHerbData, 'submitterId'>) => {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.suggestedHerb.updateMany({
      where: { id, submitterId, status: 'ChangesRequested' },
      data: {
        ...data,
        cebuanoName: data.cebuanoName ?? null,
        regionFound: data.regionFound ?? null,
        warnings: data.warnings ?? null,
        status: 'Pending',
        evidenceClass: 'UNASSESSED',
        revision: { increment: 1 },
        references: [],
      },
    });
    if (changed.count !== 1) return null;
    return tx.suggestedHerb.findUnique({ where: { id } });
  });
};
