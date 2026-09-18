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
    isDohApproved: boolean;
    proposedEvidenceClass: string;
    medicinalUses: string;
    preparationMethod: string;
    dosage: string;
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
      expect(herb.proposedEvidenceClass).toBe("DOCUMENTED_TRADITIONAL_USE");
      expect(herb.medicinalUses).toMatch(/traditional|laboratory|Philippine/i);
      expect(herb.preparationMethod).toMatch(/No clinically validated home preparation/i);
      expect(herb.dosage).toMatch(/No verified human treatment dose/i);
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
