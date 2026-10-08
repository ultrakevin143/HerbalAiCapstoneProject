import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expansionQueueSchema, findIdentityConflicts } from "../src/content/herb-expansion-review.js";

const input = JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8"));

function withIdentity(scientificName: string, synonyms: string[] = []) {
  const changed = structuredClone(input);
  const targetName = scientificName.startsWith("Citrus") ? "Citrus aurantium" : "Raphanus sativus";
  const targetIndex = changed.candidates.findIndex((candidate: { scientificName: string }) => candidate.scientificName === targetName);
  if (targetIndex < 0) throw new Error("Missing taxonomy fixture target");
  [changed.candidates[0], changed.candidates[targetIndex]] = [changed.candidates[targetIndex], changed.candidates[0]];
  changed.candidates[0].scientificName = scientificName;
  changed.candidates[0].scientificSynonyms = synonyms;
  return changed;
}

describe("research-only taxonomic identity comparison", () => {
  it.each(["Citrus × aurantium", "Raphanus raphanistrum subsp. sativus", "Raphanus raphanistrum var. sativus", "Citrus × aurantium f. aurantium", "× Brassarda juncea"])("preserves valid named taxon syntax: %s", name => {
    expect(expansionQueueSchema.parse(withIdentity(name)).candidates[0]?.scientificName).toBe(name);
  });

  it.each(["Citrus aurantium unexpected", "Citrus ×", "Raphanus raphanistrum subsp.", "Citrus maxima × Citrus reticulata"])("rejects incomplete or unsupported taxon syntax: %s", name => {
    expect(() => expansionQueueSchema.parse(withIdentity(name))).toThrow();
  });

  it.each(["Citrus × aurantium L.", "CITRUS x AURANTIUM L.", "Citrus ×aurantium L."])("detects the named hybrid with marker/authority variation: %s", name => {
    const queue = expansionQueueSchema.parse(withIdentity("Citrus aurantium"));
    expect(findIdentityConflicts(queue, [{ id: "hybrid", localName: "Different", scientificName: name }])[0]?.reasons).toContain("scientific name or synonym");
  });

  it("does not collapse different named hybrids to the genus plus multiplication marker", () => {
    const changed = withIdentity("Citrus × aurantium");
    changed.candidates[1].scientificName = "Citrus × limon";
    const queue = expansionQueueSchema.parse(changed);
    const conflicts = findIdentityConflicts(queue, [{ id: "hybrid", localName: "Different", scientificName: "Citrus × limon (L.) Osbeck" }]);
    expect(conflicts.some(conflict => conflict.candidateId === queue.candidates[0]?.id)).toBe(false);
    expect(conflicts.some(conflict => conflict.candidateId === queue.candidates[1]?.id)).toBe(true);
  });

  it.each(["Raphanus raphanistrum subsp. sativus (L.) Domin", "Raphanus raphanistrum L. ssp. sativus (L.) Domin"])("matches explicit subspecies with authority/rank spelling variation: %s", name => {
    const queue = expansionQueueSchema.parse(withIdentity("Raphanus raphanistrum subsp. sativus"));
    expect(findIdentityConflicts(queue, [{ id: "crop", localName: "Different", scientificName: name }])[0]?.candidateId).toBe(queue.candidates[0]?.id);
  });

  it.each(["Raphanus raphanistrum", "Raphanus raphanistrum subsp. raphanistrum", "Raphanus raphanistrum var. sativus"])("does not silently equate a different rank/concept with the crop: %s", name => {
    const queue = expansionQueueSchema.parse(withIdentity("Raphanus raphanistrum subsp. sativus"));
    expect(findIdentityConflicts(queue, [{ id: "other", localName: "Different", scientificName: name }])).toEqual([]);
  });

  it("requires an explicitly supplied synonym to connect alternate crop treatments", () => {
    const queue = expansionQueueSchema.parse(withIdentity("Raphanus raphanistrum subsp. sativus", ["Raphanus sativus"]));
    expect(findIdentityConflicts(queue, [{ id: "crop", localName: "Different", scientificName: "Raphanus sativus L." }])[0]?.reasons).toContain("scientific name or synonym");
  });

  it("rejects internal overlaps when named hybrid spellings differ only by the marker", () => {
    const changed = withIdentity("Citrus aurantium");
    changed.candidates[1].scientificName = "Citrus × aurantium";
    expect(() => expansionQueueSchema.parse(changed)).toThrow(/Conflicting name or alias/);
  });

  it("preserves a literal initial x in a species epithet and the L.f. authority", () => {
    const queue = expansionQueueSchema.parse(withIdentity("Garcinia xanthochymus"));
    expect(findIdentityConflicts(queue, [{ id: "same", localName: "Different", scientificName: "Garcinia xanthochymus L.f." }])[0]?.candidateId).toBe(queue.candidates[0]?.id);
    expect(findIdentityConflicts(queue, [{ id: "different", localName: "Different", scientificName: "Garcinia anthochymus" }])).toEqual([]);
  });

  it("does not reduce a parent-cross formula to its first parent", () => {
    const queue = expansionQueueSchema.parse(withIdentity("Citrus maxima"));
    expect(findIdentityConflicts(queue, [{ id: "cross", localName: "Different", scientificName: "Citrus maxima × Citrus reticulata" }])).toEqual([]);
  });

  it("does not reduce an incomplete source rank to an ordinary species match", () => {
    const queue = expansionQueueSchema.parse(withIdentity("Raphanus raphanistrum"));
    expect(findIdentityConflicts(queue, [{ id: "incomplete", localName: "Different", scientificName: "Raphanus raphanistrum subsp." }])).toEqual([]);
  });

  it("retains named hybrid genera instead of treating the multiplication marker as the genus", () => {
    const queue = expansionQueueSchema.parse(withIdentity("× Brassarda juncea"));
    expect(findIdentityConflicts(queue, [{ id: "same", localName: "Different", scientificName: "×Brassarda juncea (L.) Su Liu & Z.H.Feng" }])[0]?.candidateId).toBe(queue.candidates[0]?.id);
    expect(findIdentityConflicts(queue, [{ id: "different", localName: "Different", scientificName: "× Brassarda alba" }])).toEqual([]);
  });
});
