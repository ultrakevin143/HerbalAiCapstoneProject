import { readFile } from "node:fs/promises";
import path from "node:path";
import { planFirstTenDrafts } from "../src/content/herb-expansion-staging-plan.js";

const main = async () => {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.length !== 2 || argumentsList[0] !== "--snapshot" || !argumentsList[1] || argumentsList[1].startsWith("--")) {
    throw new Error("Read-only usage: tsx prisma/plan-herb-expansion.ts --snapshot <all-state-snapshot.json>. No database-write or publish mode exists.");
  }
  const [queue, review, snapshot, preparations, preparationOverlay, safetyOverlay, occurrence] = await Promise.all([
    readFile(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8"),
    readFile(new URL("../../Docs/research/HERB_FIRST_TEN_REVIEW_2026-10-05.json", import.meta.url), "utf8"),
    readFile(path.resolve(argumentsList[1]), "utf8"),
    readFile(new URL("../../Docs/research/HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json", import.meta.url), "utf8"),
    readFile(new URL("../../Docs/research/TALISAY_PREPARATION_FOLLOW_UP_2026-10-05.json", import.meta.url), "utf8"),
    readFile(new URL("../../Docs/research/TALISAY_BARK_SAFETY_FOLLOW_UP_2026-10-06.json", import.meta.url), "utf8"),
    readFile(new URL("../../Docs/research/HERB_FIRST_TEN_OCCURRENCE_REVIEW_2026-10-06.json", import.meta.url), "utf8"),
  ]);
  console.log(JSON.stringify(planFirstTenDrafts(JSON.parse(queue), JSON.parse(review), JSON.parse(snapshot), new Date(), {
    preparations: JSON.parse(preparations), preparationOverlay: JSON.parse(preparationOverlay), safetyOverlay: JSON.parse(safetyOverlay),
    occurrence: JSON.parse(occurrence),
  }), null, 2));
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Herb draft planning failed");
  process.exitCode = 1;
});
