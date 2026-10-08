import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expansionQueueSchema, findIdentityConflicts, reviewExpansionQueue } from "../src/content/herb-expansion-review.js";

const input = JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8"));
const baseline = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_CATALOG_BASELINE_2026-10-04.json", import.meta.url), "utf8"));

describe("fifty-herb research queue", () => {
  it("contains five batches of ten unique candidates absent from the recorded public baseline", () => {
    const report = reviewExpansionQueue(input, baseline.herbs);
    expect(report.candidates).toBe(50);
    expect(report.batches.map((batch) => batch.count)).toEqual([10, 10, 10, 10, 10]);
    expect(report.conflicts).toEqual([]);
  });

  it("never treats the published-only baseline as a full database clearance or publication approval", () => {
    const report = reviewExpansionQueue(input, baseline.herbs);
    expect(report.publicationAllowed).toBe(false);
    expect(report.comparisonScope).toBe("PUBLIC_BASELINE_ONLY");
    expect(report.blockers.join(" ")).toMatch(/SuggestedHerb/);
    expect(report.blockers.join(" ")).toMatch(/CC0/);
    expect(report.blockers.join(" ")).toMatch(/historical doses/);
    expect(input.herbs).toBeUndefined();
    expect(input.status).not.toBe("DRAFT");
  });

  it.each(["id", "scientificName", "acceptedTaxonKey"])("rejects duplicate %s", (field) => {
    const duplicate = structuredClone(input);
    duplicate.candidates[1][field] = duplicate.candidates[0][field];
    expect(() => expansionQueueSchema.parse(duplicate)).toThrow(/Duplicate/);
  });

  it("rejects wrong batch size, book-entry duplication and injected publication flags", () => {
    const wrongBatch = structuredClone(input);
    wrongBatch.candidates[0].batch = 2;
    expect(() => expansionQueueSchema.parse(wrongBatch)).toThrow(/ten candidates/);
    const duplicateEntry = structuredClone(input);
    duplicateEntry.candidates[1].book.entry = duplicateEntry.candidates[0].book.entry;
    expect(() => expansionQueueSchema.parse(duplicateEntry)).toThrow(/Duplicate/);
    expect(() => expansionQueueSchema.parse({ ...input, publicationAllowed: true })).toThrow();
  });

  it("rejects synonym and local-alias overlaps inside the queue", () => {
    const changed = structuredClone(input);
    changed.candidates[1].scientificSynonyms.push(changed.candidates[0].scientificName);
    expect(() => expansionQueueSchema.parse(changed)).toThrow(/Conflicting name or alias/);
    changed.candidates[1].scientificSynonyms = [];
    changed.candidates[1].localAliases.push("Duhát");
    expect(() => expansionQueueSchema.parse(changed)).toThrow(/Conflicting name or alias/);
  });

  it("normalizes the book's Latin ligature without creating a second Luffa identity", () => {
    const queue = expansionQueueSchema.parse(input);
    const conflicts = findIdentityConflicts(queue, [{ id: "existing-luffa", localName: "Other", scientificName: "Luffa ægyptiaca" }]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.candidateId).toBe("research-pardo-112");
  });

  it("rejects unreviewed image insertion and invented completed review statuses", () => {
    const changed = structuredClone(input);
    changed.candidates[0].photo = { license: "CC BY 4.0" };
    expect(() => expansionQueueSchema.parse(changed)).toThrow();
    changed.candidates[0].photo = null;
    changed.candidates[0].medicalReview = "APPROVED";
    expect(() => expansionQueueSchema.parse(changed)).toThrow();
  });

  it.each(["http://example.org", "https://user:secret@example.org", "javascript:alert(1)"])("rejects unsafe source URL %s", (url) => {
    const changed = structuredClone(input);
    changed.candidates[0].taxonomyUrl = url;
    expect(() => expansionQueueSchema.parse(changed)).toThrow();
  });

  it("detects scientific-name conflicts despite author suffixes, case and whitespace", () => {
    const queue = expansionQueueSchema.parse(input);
    const first = queue.candidates[0]!;
    const conflicts = findIdentityConflicts(queue, [{ id: "existing-draft", localName: "Other name", scientificName: `  ${first.scientificName.toUpperCase()} L.  ` }]);
    expect(conflicts[0]?.reasons).toContain("scientific name or synonym");
  });

  it("detects a historical source synonym even when the current scientific name differs", () => {
    const queue = expansionQueueSchema.parse(input);
    const conflicts = findIdentityConflicts(queue, [{ id: "existing-held", localName: "Other name", scientificName: "Example species", sourceScientificName: "Eugenia jambolana Lam." }]);
    expect(conflicts.find((conflict) => conflict.candidateId === queue.candidates[0]?.id)?.reasons).toContain("scientific name or synonym");
  });

  it("detects taxon identity and local alias collisions without requiring a published record", () => {
    const queue = expansionQueueSchema.parse(input);
    const first = queue.candidates[0]!;
    const conflicts = findIdentityConflicts(queue, [{ id: "pending-suggestion", localName: "Different", scientificName: "Example species", localAliases: ["DUHÁT"], acceptedTaxonKey: first.acceptedTaxonKey }]);
    expect(conflicts[0]?.reasons).toEqual(["accepted taxon", "local name or alias"]);
  });
});
