import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { planPreparationSourceTags } from '../src/content/herb-preparation-source-tags.js';

const main = async () => {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.length !== 2 || argumentsList[0] !== '--snapshot' || !argumentsList[1] || argumentsList[1].startsWith('--')) {
    throw new Error('Read-only usage: tsx prisma/plan-herb-source-tags.ts --snapshot <public-source-baseline.json>. No apply or publish mode exists.');
  }
  const [review, baseline] = await Promise.all([
    readFile(new URL('../../Docs/research/HERB_PREPARATION_SOURCE_TAG_REVIEW_2026-10-06.json', import.meta.url), 'utf8'),
    readFile(path.resolve(argumentsList[1]), 'utf8'),
  ]);
  console.log(JSON.stringify(planPreparationSourceTags(JSON.parse(review), JSON.parse(baseline)), null, 2));
};

main().catch(() => {
  console.error('Source-tag planning failed. Check the reviewed ledger and public snapshot; no database writes were performed. Usage: --snapshot <public-source-baseline.json> only.');
  process.exitCode = 1;
});
