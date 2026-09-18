import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";

const officialNames = [
  "Akapulko",
  "Ampalaya",
  "Bawang",
  "Bayabas",
  "Lagundi",
  "Niyog-niyogan",
  "Sambong",
  "Tsaang Gubat",
  "Ulasimang Bato",
  "Yerba Buena",
];

describe("Remediated herb catalog", () => {
  it("publishes one governed record for every official PITAHC herb", async () => {
    const herbs = await prisma.herb.findMany({
      where: { localName: { in: officialNames } },
      include: { sources: true },
    });

    expect(herbs).toHaveLength(officialNames.length);
    for (const herb of herbs) {
      expect(herb).toMatchObject({
        isDohApproved: true,
        isVerified: true,
        publicationStatus: "PUBLISHED",
        evidenceClass: "DOH_PITAHC_LISTED",
        provenance: "BUILT_IN",
      });
      expect(herb.sources.some(source => source.publisher === "Philippine Institute of Traditional and Alternative Health Care")).toBe(true);
      expect(herb.imageUrl).toMatch(/^\/images\/herbs\/[a-z-]+\.(?:jpg|png)$/);
      expect(herb.imageCreator).toBeTruthy();
      expect(herb.imageSourceUrl).toMatch(/^https:\/\//);
      expect(herb.imageLicense).toBeTruthy();
      expect(herb.imageLicenseUrl).toMatch(/^https:\/\//);
      expect(`${herb.medicinalUses} ${herb.preparationMethod} ${herb.dosage}`).not.toMatch(/PITAHC/i);
    }
  });

  it("uses the corrected Yerba Buena identity without a duplicate Hilbas record", async () => {
    const yerbaBuena = await prisma.herb.findFirst({ where: { localName: "Yerba Buena" } });
    const hilbas = await prisma.herb.findFirst({ where: { localName: "Hilbas" } });

    expect(yerbaBuena).toMatchObject({
      scientificName: "Mentha × villosa",
      sourceScientificName: "Mentha cordifolia",
      imageUrl: "/images/herbs/yerba-buena.png",
    });
    expect(hilbas).toBeNull();
  });

  it("publishes non-DOH herbs with evidence-specific classifications", async () => {
    const additionalHerbs = await prisma.herb.findMany({
      where: { localName: { in: ["Gumamela", "Indian Heliotrope", "Tanglad"] } },
      include: { sources: true },
    });

    expect(additionalHerbs).toHaveLength(3);
    expect(additionalHerbs.find(herb => herb.localName === "Gumamela")).toMatchObject({ publicationStatus: "PUBLISHED", evidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE", isDohApproved: false, isVerified: true });
    expect(additionalHerbs.find(herb => herb.localName === "Tanglad")).toMatchObject({ publicationStatus: "PUBLISHED", evidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE", isDohApproved: false, isVerified: true });
    expect(additionalHerbs.find(herb => herb.localName === "Indian Heliotrope")).toMatchObject({ publicationStatus: "PUBLISHED", evidenceClass: "DOCUMENTED_TRADITIONAL_USE", isDohApproved: false, isVerified: true });
    for (const herb of additionalHerbs) {
      expect(herb.sources.length).toBeGreaterThan(0);
      expect(herb.imageUrl).toMatch(/^\/images\/herbs\/[a-z-]+\.jpg$/);
    }
  });
});
