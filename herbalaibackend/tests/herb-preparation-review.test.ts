import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const batch = JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-02.json", import.meta.url), "utf8")) as {
  sources: Record<string, { url: string }>;
  herbs: { slug: string; scientificName: string; preparationMethod: string; dosage: string; warnings: string; publicationStatus: string; isVerified: boolean; fieldSources: Record<string, string[]>; reviewGaps: string[] }[];
};
const getHerb = (slug: string) => {
  const herb = batch.herbs.find(item => item.slug === slug);
  if (!herb) throw new Error(`Missing preparation review: ${slug}`);
  return herb;
};

describe("sourced preparation enrichment", () => {
  it.each(batch.herbs.map(herb => herb.slug))("%s retains reviewed field citations without promoting publication", slug => {
    const herb = getHerb(slug);
    expect(herb).toMatchObject({ publicationStatus: "DRAFT", isVerified: false });
    expect(herb.fieldSources.preparationMethod.length).toBeGreaterThan(0);
    for (const source of herb.fieldSources.preparationMethod) expect(new URL(batch.sources[source].url).protocol).toBe("https:");
    expect(herb.reviewGaps.length).toBeGreaterThan(0);
  });

  it("does not invent leaf counts, boiling duration or a dose for Philippine oregano", () => {
    const herb = getHerb("oregano");
    expect(herb.scientificName).toBe("Coleus amboinicus");
    expect(herb.preparationMethod).toMatch(/express their juice.*leaf infusion/);
    expect(herb.preparationMethod).not.toMatch(/\d/);
    expect(herb.dosage).toMatch(/No verified/);
  });

  it("preserves the exact external Centella scope and refuses guessed water measurements", () => {
    const herb = getHerb("takip-kohol");
    expect(herb.preparationMethod).toMatch(/0\.6 g.*pharmacopoeial.*boiling water/);
    expect(herb.preparationMethod).toContain("neither water volume nor steeping time");
    expect(herb.preparationMethod).not.toMatch(/\d+\s*(?:ml|mL|cups|minutes)/);
    expect(herb.dosage).toContain("1.8 g/day");
    expect(herb.dosage).toContain("at most one week");
    expect(herb.warnings).toMatch(/External use only.*under 18.*pregnancy\/breastfeeding/);
    expect(herb.fieldSources.dosage).toEqual(["ema-centella-2022"]);
  });

  it("does not turn topical ethnobotany or culinary preparation into oral treatment", () => {
    expect(getHerb("mayana").preparationMethod).toMatch(/external leaf poultice.*not an oral root-decoction/);
    expect(getHerb("mayana").preparationMethod).toContain("should not be placed on open wounds");
    expect(getHerb("pandan").preparationMethod).toMatch(/^Food preparation only:/);
    expect(getHerb("pandan").preparationMethod).toContain("not a medicinal tea recipe");
    expect(batch.herbs.filter(herb => herb.preparationMethod === "No clinically validated home preparation is provided in this entry.")).toEqual([]);
  });

  it('does not fabricate quantities for descriptive reports or food-only entries', () => {
    for (const slug of ['aratiles', 'damong-maria', 'atsuete', 'kamote', 'gabi', 'okra', 'ylang-ylang', 'sibuyas', 'katakataka', 'saluyot']) {
      const herb = getHerb(slug);
      expect(herb.preparationMethod).not.toMatch(/\d/);
      expect(herb.dosage).toContain('No verified human treatment dose');
    }
  });

  it('preserves plant parts and routes rather than substituting bulb, flower oil or raw taro', () => {
    expect(getHerb('sibuyas').preparationMethod).toMatch(/leaves used externally.*not an oral bulb recipe/);
    expect(getHerb('ylang-ylang').preparationMethod).toContain('Flower oil is a separate preparation');
    expect(getHerb('gabi').preparationMethod).toMatch(/^Food preparation only:.*warns against eating raw/);
    expect(getHerb('katakataka').preparationMethod).toMatch(/external poultice.*not validated treatment or permission for oral use/);
    expect(getHerb('katakataka').preparationMethod).toContain('all-ages frequency claim is not adopted');
    expect(getHerb('saluyot').preparationMethod).toContain('Corchorus olitorius or Corchorus capsularis are not substituted');
  });

  it('withholds Makabuhay oral instructions instead of hiding a documented human injury', () => {
    const herb = getHerb('makabuhay');
    expect(herb.preparationMethod).toMatch(/^Traditional oral preparation withheld:.*toxic hepatitis/);
    expect(herb.warnings).toContain('human case report');
    expect(herb.preparationMethod).toContain('aqueous extracts of fresh stems');
    expect(herb.fieldSources.preparationMethod).toEqual(['tinospora-hepatitis-2014', 'tinospora-hepatitis-2018']);
    expect(herb.fieldSources.warnings).toEqual(['tinospora-hepatitis-2014']);
  });

  it('preserves the remaining exact plant parts, reported routes and geographic limits', () => {
    expect(getHerb('langka').preparationMethod).toMatch(/crushed.*leaves used externally/);
    expect(getHerb('suha').preparationMethod).toContain('external wash');
    expect(getHerb('suha').preparationMethod).toContain('mixed postpartum preparation is not adopted');
    expect(getHerb('mangosteen').preparationMethod).toContain('not proof of effectiveness or a dengue treatment recommendation');
    expect(getHerb('mabolo').preparationMethod).toContain('Guianas historical report, not Philippine clinical guidance');
    expect(getHerb('mabolo').preparationMethod).toContain('explicit administration route');
    for (const slug of ['langka', 'suha', 'mangosteen', 'mabolo']) {
      expect(getHerb(slug).preparationMethod).not.toMatch(/\d/);
      expect(getHerb(slug).dosage).toContain('No verified human treatment dose');
    }
  });

  it('withholds the inconsistent Anonas recipe rather than silently correcting its units', () => {
    const herb = getHerb('anonas');
    expect(herb.preparationMethod).toMatch(/^Traditional oral preparation withheld:.*neurotoxicity/);
    expect(herb.preparationMethod).toContain('inconsistent salt units');
    expect(herb.preparationMethod).not.toMatch(/\d|teaspoon/);
    expect(herb.fieldSources.preparationMethod).toEqual(['tramil-anonas']);
    expect(herb.fieldSources.warnings).toEqual(['tramil-anonas']);
  });
});
