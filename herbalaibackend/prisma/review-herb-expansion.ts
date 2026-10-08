import { readFileSync } from "node:fs";
import { reviewExpansionQueue } from "../src/content/herb-expansion-review.js";
import type { CatalogIdentity } from "../src/content/herb-expansion-review.js";

const queue = JSON.parse(readFileSync(new URL("../content/herbs/expansion-batch-03.review.json", import.meta.url), "utf8")) as unknown;
const baseline = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_CATALOG_BASELINE_2026-10-04.json", import.meta.url), "utf8")) as { herbs: CatalogIdentity[] };
const report = reviewExpansionQueue(queue, baseline.herbs);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.conflicts.length) process.exitCode = 1;
