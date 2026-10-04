import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { findAllHerbs, findHerbById, invalidateHerbCache } from "../src/repositories/herb.repository.js";
import { approveSuggestion } from "../src/repositories/suggest.repository.js";

const requiredHerbFields = {
  category: "Test only",
  medicinalUses: "Unpublished test content",
  preparationMethod: "Do not use",
  dosage: "Not applicable",
};

describe.sequential("Herb content governance", () => {
  it.each([
    { references: [], warnings: null },
    { references: [{ title: 'QA identity', citation: 'QA citation', supports: ['identity'] }], warnings: null },
    { references: [{ title: 'QA source', citation: 'QA citation', supports: ['identity', 'medicinalUses', 'preparationMethod', 'dosage'] }], warnings: 'Safety information is limited.' },
  ])('rolls back unsupported direct publication without changing review state %#', async ({ references, warnings }) => {
    const suffix = randomUUID();
    const userId = `coverage-reviewer-${suffix}`;
    let suggestionId: number | undefined;
    try {
      await prisma.user.create({ data: {
        id: userId, username: userId, email: `${userId}@example.invalid`,
        password: 'disabled-qa-account', name: 'Coverage QA Reviewer', role: 'admin', isBanned: true,
      } });
      const suggestion = await prisma.suggestedHerb.create({ data: {
        submitterId: userId, localName: `Coverage QA ${suffix}`, scientificName: `QA fixture ${suffix}`,
        ...requiredHerbFields, informationSource: 'QA synthetic citation', references, warnings,
      } });
      suggestionId = suggestion.id;
      await expect(approveSuggestion(suggestion.id, userId, null, 'DOCUMENTED_TRADITIONAL_USE', 'QA review', suggestion.revision))
        .rejects.toThrow('References must cover');
      expect(await prisma.suggestedHerb.findUnique({ where: { id: suggestion.id } })).toMatchObject({
        status: 'Pending', revision: suggestion.revision, reviewedBy: null, reviewedAt: null,
      });
      expect(await prisma.herb.count({ where: { sourceSuggestionId: suggestion.id } })).toBe(0);
      expect(await prisma.auditLog.count({ where: { adminId: userId } })).toBe(0);
    } finally {
      if (suggestionId) {
        await prisma.herb.deleteMany({ where: { sourceSuggestionId: suggestionId } });
        await prisma.suggestedHerb.deleteMany({ where: { id: suggestionId } });
      }
      await prisma.auditLog.deleteMany({ where: { adminId: userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      invalidateHerbCache();
    }
  });

  it("keeps new draft herbs out of public list and detail queries", async () => {
    const suffix = randomUUID();
    const id = `draft-${suffix}`;
    const localName = `Draft herb ${suffix}`;

    try {
      const created = await prisma.herb.create({
        data: {
          id,
          localName,
          scientificName: `Testus ${suffix}`,
          ...requiredHerbFields,
        },
      });

      expect(created.isVerified).toBe(false);
      expect(created.publicationStatus).toBe("DRAFT");

      const { herbs } = await findAllHerbs({ search: localName });
      expect(herbs).toHaveLength(0);
      await expect(findHerbById(id)).resolves.toBeNull();
    } finally {
      await prisma.herb.deleteMany({ where: { id } });
      invalidateHerbCache();
    }
  });

  it("preserves a reviewed suggestion's source and provenance", async () => {
    const suffix = randomUUID();
    const userId = `governance-user-${suffix}`;
    let herbId: string | undefined;
    let suggestionId: number | undefined;

    try {
      await prisma.user.create({
        data: {
          id: userId,
          username: `governance_${suffix.replaceAll("-", "")}`,
          email: `governance-${suffix}@example.invalid`,
          password: "not-used-by-this-test",
          name: "Governance Test Reviewer",
          role: "admin",
        },
      });

      const suggestion = await prisma.suggestedHerb.create({
        data: {
          submitterId: userId,
          localName: `Sourced herb ${suffix}`,
          scientificName: `Testus sourced-${suffix}`,
          informationSource: "https://example.invalid/herb-reference",
          references: [{
            title: 'Reviewed QA source', url: 'https://example.invalid/herb-reference',
            supports: ['identity', 'medicinalUses', 'preparationMethod', 'dosage'],
          }],
          ...requiredHerbFields,
        },
      });
      suggestionId = suggestion.id;

      const herb = await approveSuggestion(suggestion.id, userId, null);
      herbId = herb?.id;

      expect(herb).toMatchObject({
        isVerified: true,
        publicationStatus: "PUBLISHED",
        evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
        provenance: "COMMUNITY_SUBMISSION",
        reviewedById: userId,
        sourceSuggestionId: suggestion.id,
      });
      expect(herb?.sources).toHaveLength(1);
      expect(herb?.sources[0]).toMatchObject({
        url: "https://example.invalid/herb-reference",
        title: 'Reviewed QA source',
      });
    } finally {
      if (herbId) await prisma.herb.deleteMany({ where: { id: herbId } });
      if (suggestionId) await prisma.suggestedHerb.deleteMany({ where: { id: suggestionId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      invalidateHerbCache();
    }
  });
});
