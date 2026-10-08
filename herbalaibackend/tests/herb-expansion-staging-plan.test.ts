import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { herbIdentitySnapshotSchema, planFirstTenDrafts } from "../src/content/herb-expansion-staging-plan.js";

const queue = JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8"));
const review = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_FIRST_TEN_REVIEW_2026-10-05.json", import.meta.url), "utf8"));
const snapshot = JSON.parse(readFileSync(new URL("../../Docs/research/NEON_HERB_IDENTITY_SNAPSHOT_2026-10-05.json", import.meta.url), "utf8"));
const capturedAt = new Date(snapshot.capturedAt);

function withRow(row: string[]) {
  const changed = structuredClone(snapshot);
  changed.rows.push(row);
  changed.displayedResultRowCount += 1;
  const recordType = row[0];
  if (recordType !== "Herb" && recordType !== "SuggestedHerb") throw new Error("Invalid fixture record type");
  changed.counts[recordType] += 1;
  return changed;
}

describe("read-only first-ten draft planner", () => {
  it("binds exact reviewed botanical headings without treating photo morphology as identity clearance", () => {
    const result = planFirstTenDrafts(queue, review, snapshot, capturedAt);
    for (const row of result.draftRows) {
      const source = row.proposedSources.find(source => source.supports.includes("identity"));
      expect(source).toHaveProperty("identityHeading", row.proposedData.scientificName);
      expect(source).toHaveProperty("identityHeadingCheckedAt", "2026-10-07");
    }
    const unreviewed = structuredClone(review);
    for (const record of unreviewed.records) delete record.identity.headingReview;
    expect(planFirstTenDrafts(queue, unreviewed, snapshot, capturedAt).draftRows
      .every(row => row.proposedSources.every(source => !source.supports.includes("identity")))).toBe(true);
  });

  it.each(["species", "source", "kind", "date"])("rejects an invalid %s botanical heading review", mutation => {
    const changed = structuredClone(review);
    const heading = changed.records[0].identity.headingReview;
    if (mutation === "species") heading.heading = "Example species";
    if (mutation === "source") heading.sourceId = "missing";
    if (mutation === "kind") heading.sourceId = "pardo-1901";
    if (mutation === "date") heading.checkedAt = "not-a-date";
    expect(() => planFirstTenDrafts(queue, changed, snapshot, capturedAt)).toThrow();
  });

  it("compares every recorded state without treating a snapshot as write authorization", () => {
    const plan = planFirstTenDrafts(queue, review, snapshot, capturedAt);
    expect(plan).toMatchObject({ status: "DRAFT_PLAN_NOT_EXECUTABLE", writeAllowed: false, publicationAllowed: false, comparedHerbs: 38, comparedSuggestions: 17, conflicts: [] });
    expect(plan.blockers.join(" ")).toMatch(/concurrent-write/);
    expect(plan.blockers.join(" ")).toMatch(/Railway/);
    expect(plan.draftRows).toHaveLength(10);
    for (const row of plan.draftRows) {
      expect(row.proposedData).toMatchObject({ publicationStatus: "DRAFT", evidenceClass: "UNASSESSED", provenance: "BUILT_IN", isVerified: false, isDohApproved: false, reviewedAt: null, reviewedById: null, embedding: null });
      expect(row.proposedData.preparationMethod).toMatch(/No medicinal preparation/);
      expect(row.proposedData.dosage).toMatch(/No validated medicinal dose/);
      const original = review.records.find((record: { candidateId: string }) => record.candidateId === row.candidateId);
      expect(row.reviewGaps).toEqual(expect.arrayContaining(original.publicationBlockers));
      expect(row.proposedSources.some((source) => source.supports.includes("medicinalUses"))).toBe(true);
      if (row.uncitedFields.includes("warnings")) {
        expect(row.reviewGaps.join(" ")).toMatch(/No plant-part-specific safety source reviewed/);
      } else {
        expect(row.proposedSources.some((source) => source.supports.includes("warnings"))).toBe(true);
      }
      expect(row.proposedSources.some((source) => source.supports.includes("imageIdentity"))).toBe(true);
    }
  });

  it("keeps the unresolved Talisay bark-safety gap explicit instead of inventing a citation", () => {
    const row = planFirstTenDrafts(queue, review, snapshot, capturedAt).draftRows.find((draft) => draft.proposedData.localName === "Talisay");
    expect(row?.uncitedFields).toEqual(["warnings"]);
    expect(row?.proposedSources.some((source) => source.supports.includes("warnings"))).toBe(false);
    expect(row?.reviewGaps.join(" ")).toMatch(/unresolved review note/);
  });

  it.each(["DRAFT", "HOLD", "ARCHIVED"])("blocks an existing Herb in %s despite a different local name", (state) => {
    const changed = withRow(["Herb", "existing-other", "Other", "Eugenia jambolana Lam.", "", "", state, "f"]);
    const plan = planFirstTenDrafts(queue, review, changed, capturedAt);
    expect(plan.conflicts[0]).toMatchObject({ candidateId: "research-pardo-098", recordId: "Herb:existing-other" });
  });

  it.each(["Pending", "ChangesRequested", "Approved", "Rejected"])("blocks a SuggestedHerb in %s without publishing or deleting it", (state) => {
    const changed = withRow(["SuggestedHerb", "9001", "Other", "SYZYGIUM CUMINI (L.) Skeels", "", "", state, ""]);
    expect(planFirstTenDrafts(queue, review, changed, capturedAt).conflicts[0]?.candidateId).toBe("research-pardo-098");
  });

  it("splits stored local aliases and catches an intended record ID independently of its name", () => {
    const alias = withRow(["Herb", "other", "Other", "Example species", "", "Unknown / Lomboy, Something", "HOLD", "f"]);
    expect(planFirstTenDrafts(queue, review, alias, capturedAt).conflicts[0]?.reasons).toContain("local name or alias");
    const id = withRow(["Herb", "builtin-expansion-03-pardo-098", "Other", "Example species", "", "", "DRAFT", "f"]);
    expect(planFirstTenDrafts(queue, review, id, capturedAt).conflicts[0]?.reasons).toContain("planned record ID");
  });

  it("rejects incomplete, duplicate or incorrectly scoped identity results", () => {
    const incomplete = structuredClone(snapshot);
    incomplete.rows.pop();
    expect(() => herbIdentitySnapshotSchema.parse(incomplete)).toThrow(/counts/);
    const duplicate = withRow(snapshot.rows[0]);
    duplicate.counts.publicHerbs += 1;
    expect(() => herbIdentitySnapshotSchema.parse(duplicate)).toThrow(/Duplicate/);
    expect(() => herbIdentitySnapshotSchema.parse({ ...snapshot, scope: "PUBLIC_BASELINE_ONLY" })).toThrow();
    const wrongColumns = structuredClone(snapshot);
    wrongColumns.columns.reverse();
    expect(() => herbIdentitySnapshotSchema.parse(wrongColumns)).toThrow();
  });

  it("flags stale and future snapshots and rejects an invalid audit time", () => {
    for (const offset of [-1, 3_600_001]) {
      const plan = planFirstTenDrafts(queue, review, snapshot, new Date(capturedAt.getTime() + offset));
      expect(plan.blockers.join(" ")).toMatch(/future-dated or older than one hour/);
    }
    expect(() => planFirstTenDrafts(queue, review, snapshot, new Date("invalid"))).toThrow(/valid audit time/);
  });

  it("rejects incomplete content, replaced identities and invented publication clearance", () => {
    const incomplete = structuredClone(review);
    incomplete.records.pop();
    expect(() => planFirstTenDrafts(queue, incomplete, snapshot, capturedAt)).toThrow();
    const duplicate = structuredClone(review);
    duplicate.records[1] = duplicate.records[0];
    expect(() => planFirstTenDrafts(queue, duplicate, snapshot, capturedAt)).toThrow(/exactly the first ten/);
    const replaced = structuredClone(review);
    replaced.records[0].scientificName = "Example species";
    expect(() => planFirstTenDrafts(queue, replaced, snapshot, capturedAt)).toThrow(/Identity mismatch/);
    expect(() => planFirstTenDrafts(queue, { ...review, publicationAllowed: true }, snapshot, capturedAt)).toThrow();
    expect(() => planFirstTenDrafts(queue, { ...review, stagingAllowed: true }, snapshot, capturedAt)).toThrow();
  });

  it("rejects uncited fields, duplicate source definitions and unfinished local occurrence", () => {
    const missing = structuredClone(review);
    missing.records[0].safetySourceIds = ["missing-source"];
    expect(() => planFirstTenDrafts(queue, missing, snapshot, capturedAt)).toThrow(/Missing source/);
    const duplicate = structuredClone(review);
    duplicate.sources.push(duplicate.sources[0]);
    expect(() => planFirstTenDrafts(queue, duplicate, snapshot, capturedAt)).toThrow(/Duplicate source/);
    const pending = structuredClone(review);
    pending.records[0].identity.philippineOccurrence = "MODERN_LOCAL_SOURCE_PENDING";
    expect(() => planFirstTenDrafts(queue, pending, snapshot, capturedAt)).toThrow(/Unresolved Philippine occurrence/);
  });

  it("accepts clear portraits but rejects undersized, wrong-species, unlicensed or unverified media", () => {
    expect(planFirstTenDrafts(queue, review, snapshot, capturedAt).draftRows[2]?.proposedData.imageUrl).toContain("atis_annona_squamosa");
    for (const change of [{ width: 599 }, { observationTaxon: "Annona reticulata" }, { licenseCodeObserved: "cc-by" }, { deliveryOriginalSha256Matches: false }, { cloudinaryUrl: "https://res.cloudinary.com/wrong/image/upload/v1/other.jpg" }, { sourceUrl: "https://www.inaturalist.org/observations/1" }, { assetUrl: "https://example.org/other.jpg" }]) {
      const changed = structuredClone(review);
      Object.assign(changed.records[2].photoReview, change);
      expect(() => planFirstTenDrafts(queue, changed, snapshot, capturedAt)).toThrow();
    }
  });

  it("does not mutate source inputs or become executable if target verification is asserted", () => {
    const before = JSON.stringify({ queue, review, snapshot });
    const plan = planFirstTenDrafts(queue, review, { ...snapshot, railwayConnectionTargetIndependentlyVerified: true }, capturedAt);
    expect(plan.writeAllowed).toBe(false);
    expect(plan.publicationAllowed).toBe(false);
    expect(JSON.stringify({ queue, review, snapshot })).toBe(before);
  });
});
