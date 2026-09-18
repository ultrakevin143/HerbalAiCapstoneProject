import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Source {
  title: string;
  publisher: string;
  url: string;
  reviewCoverage: string;
  retrievalNote?: string;
}

interface DraftHerb {
  id: string;
  slug: string;
  localName: string;
  scientificName: string;
  publicationStatus: string;
  isVerified: boolean;
  isDohApproved: boolean;
  provenance: string;
  proposedEvidenceClass: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  warnings: string;
  aliases: { name: string; language: string; sourceIds: string[] }[];
  fieldSources: Record<string, string[]>;
  reviewGaps: string[];
  evidenceReview: { sourceIds: string[]; summary: string; limitations: string };
  image: {
    path: string;
    taxon: string;
    observationId: number;
    photoId: number;
    creator: string;
    sourceUrl: string;
    downloadUrl: string;
    license: string;
    licenseUrl: string;
    alt: string;
    visuallyChecked: boolean;
  };
}

const batch: {
  schemaVersion: number;
  status: string;
  reviewedAt: null;
  reviewedBy: null;
  sources: Record<string, Source>;
  herbs: DraftHerb[];
} = JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-01.json", import.meta.url), "utf8"));

describe("File-based herb expansion research batch", () => {
  it("keeps seven uniquely identified candidates as unapproved drafts", () => {
    expect(batch.schemaVersion).toBe(1);
    expect(batch.status).toBe("DRAFT");
    expect(batch.reviewedBy).toBeNull();
    expect(batch.reviewedAt).toBeNull();
    expect(batch.herbs.map(herb => herb.slug)).toEqual([
      "luya", "luyang-dilaw", "malunggay", "oregano", "sabila", "takip-kohol", "mayana",
    ]);
    expect(new Set(batch.herbs.map(herb => herb.scientificName)).size).toBe(7);
    for (const herb of batch.herbs) {
      expect(herb.id).toBe(`builtin-${herb.slug}`);
      expect(herb).toMatchObject({ publicationStatus: "DRAFT", isVerified: false, isDohApproved: false, provenance: "BUILT_IN" });
      expect(herb.reviewGaps.length).toBeGreaterThan(0);
      expect(herb.evidenceReview.limitations.length).toBeGreaterThan(20);
      expect(herb.dosage).toMatch(/No .*dose/i);
      expect(herb.warnings.length).toBeGreaterThan(20);
      expect(`${herb.medicinalUses} ${herb.preparationMethod} ${herb.dosage}`).not.toMatch(/PITAHC|clinically proven/i);
    }
  });

  it("resolves field-level and alias references without inventing safety coverage", () => {
    for (const source of Object.values(batch.sources)) {
      expect(source.title).toBeTruthy();
      expect(source.publisher).toBeTruthy();
      expect(new URL(source.url).protocol).toBe("https:");
      if (source.reviewCoverage === "ABSTRACT") expect(source.retrievalNote).toBeTruthy();
    }
    for (const herb of batch.herbs) {
      for (const field of ["identity", "localNames", "philippineRelevance", "medicinalUses"]) {
        expect(herb.fieldSources[field]?.length).toBeGreaterThan(0);
      }
      const references = [
        ...Object.values(herb.fieldSources).flat(),
        ...herb.aliases.flatMap(alias => alias.sourceIds),
        ...herb.evidenceReview.sourceIds,
      ];
      for (const reference of references) expect(batch.sources[reference], `${herb.slug}: ${reference}`).toBeDefined();
      for (const alias of herb.aliases) expect(alias.sourceIds.length).toBeGreaterThan(0);
      if (!herb.fieldSources.warnings?.length) expect(herb.reviewGaps.join(" ")).toMatch(/safety/i);
    }
  });

  it("does not label traditional entries as clinically established", () => {
    for (const slug of ["oregano", "mayana"]) {
      const herb = batch.herbs.find(candidate => candidate.slug === slug)!;
      expect(herb.proposedEvidenceClass).toBe("DOCUMENTED_TRADITIONAL_USE");
      expect(herb.evidenceReview.summary + herb.evidenceReview.limitations).toMatch(/No human trial/i);
    }
    expect(batch.herbs.find(herb => herb.slug === "malunggay")?.medicinalUses).toContain("did not find a statistically significant");
    expect(batch.herbs.find(herb => herb.slug === "sabila")?.medicinalUses).toContain("plus tretinoin");
    expect(batch.herbs.find(herb => herb.slug === "takip-kohol")?.medicinalUses).toContain("granulation-tissue formation favored placebo");
  });

  it("has local JPEG assets with taxon-matched attribution for every draft", () => {
    for (const herb of batch.herbs) {
      expect(herb.image.path).toBe(`/images/herbs/${herb.slug}.jpg`);
      expect(herb.image.taxon).toBe(herb.scientificName);
      expect(herb.image.creator).toBeTruthy();
      expect(herb.image.license).toBe("CC BY 4.0");
      expect(herb.image.licenseUrl).toBe("https://creativecommons.org/licenses/by/4.0/");
      expect(herb.image.sourceUrl).toBe(`https://www.inaturalist.org/observations/${herb.image.observationId}`);
      expect(herb.image.downloadUrl).toMatch(new RegExp(`/photos/${herb.image.photoId}/large\\.jpe?g$`));
      expect(herb.image.alt.length).toBeGreaterThan(20);
      expect(herb.image.visuallyChecked).toBe(true);
      const file = new URL(`../../herbalaifrontend/public${herb.image.path}`, import.meta.url);
      const bytes = readFileSync(file);
      expect(bytes.length).toBeGreaterThan(1000);
      expect([...bytes.subarray(0, 2)]).toEqual([0xff, 0xd8]);
      expect([...bytes.subarray(-2)]).toEqual([0xff, 0xd9]);
    }
  });
});
