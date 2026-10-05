import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const batch = JSON.parse(
  readFileSync(new URL("../content/herbs/expansion-batch-02.json", import.meta.url), "utf8"),
) as {
  status: string;
  sources: Record<string, { url: string }>;
  herbs: Array<{
    id: string;
    slug: string;
    localName: string;
    scientificName: string;
    publicationStatus: string;
    isVerified: boolean;
    isDohApproved: boolean;
    proposedEvidenceClass: string;
    medicinalUses: string;
    preparationMethod: string;
    dosage: string;
    warnings: string;
    reviewGaps: string[];
    fieldSources: Record<string, string[]>;
    evidenceReview: { sourceIds: string[] };
    image: { path: string; sourceUrl: string; license: string; visuallyChecked: boolean };
  }>;
};

describe("Philippine twenty-herb expansion batch", () => {
  it("contains exactly twenty unique, non-DOH-approved built-in records", () => {
    expect(batch.status).toBe("DRAFT");
    expect(batch.herbs).toHaveLength(20);
    expect(new Set(batch.herbs.map((herb) => herb.slug)).size).toBe(20);
    expect(new Set(batch.herbs.map((herb) => herb.scientificName)).size).toBe(20);
    for (const herb of batch.herbs) {
      expect(herb.id).toBe(`builtin-${herb.slug}`);
      expect(herb.isDohApproved).toBe(false);
      expect(herb.publicationStatus).toBe("DRAFT");
      expect(herb.isVerified).toBe(false);
      expect(herb.proposedEvidenceClass).toBe("DOCUMENTED_TRADITIONAL_USE");
      expect(herb.medicinalUses).toMatch(/traditional|laboratory|Philippine/i);
      if (herb.fieldSources.preparationMethod.length) {
        expect(herb.preparationMethod).toMatch(/traditional|Food preparation only/i);
        expect(herb.reviewGaps.join(" ")).toMatch(/review/i);
      } else {
        expect(herb.preparationMethod).toMatch(/No clinically validated home preparation/i);
      }
      if (herb.fieldSources.dosage?.length) {
        expect(herb.slug).toBe("takip-kohol");
        expect(herb.dosage).toMatch(/external.*not a personalized/i);
      } else {
        expect(herb.dosage).toMatch(/No verified human treatment dose/i);
      }
    }
  });

  it.each(batch.herbs)("$localName retains an explicit safety review gap when warnings lack citations", (herb) => {
    expect(herb.warnings.trim().length).toBeGreaterThan(0);
    if (!herb.fieldSources.warnings?.length) {
      expect(herb.reviewGaps.join(" ")).toMatch(/safety.*warnings|warnings.*safety/i);
    }
  });

  it("resolves sources and keeps every visually checked image locally", () => {
    for (const herb of batch.herbs) {
      const sourceIds = [...Object.values(herb.fieldSources).flat(), ...herb.evidenceReview.sourceIds];
      for (const sourceId of sourceIds) expect(batch.sources[sourceId], `${herb.slug}: ${sourceId}`).toBeDefined();
      expect(new URL(herb.image.sourceUrl).hostname).toBe("www.inaturalist.org");
      expect(["CC BY 4.0", "CC0 1.0"]).toContain(herb.image.license);
      expect(herb.image.visuallyChecked).toBe(true);
      expect(existsSync(new URL(`../../herbalaifrontend/public${herb.image.path}`, import.meta.url))).toBe(true);
    }
  });
});
