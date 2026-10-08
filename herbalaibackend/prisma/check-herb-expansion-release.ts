import { readFile } from 'node:fs/promises';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';
import { expansionQueueSchema } from '../src/content/herb-expansion-review.js';
import { integrateCheckedExpansionMediaPlans, reviewExpansionMediaFollowUp } from '../src/content/herb-expansion-media-follow-up.js';
import { z } from 'zod';

const main = async () => {
  if (process.argv.slice(2).join(' ') !== '--check-public') {
    throw new Error('Read-only usage: tsx prisma/check-herb-expansion-release.ts --check-public. No write or publish mode exists.');
  }
  const paths = [
    '../content/herbs/expansion-batch-03.review.json',
    '../../Docs/research/HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json',
    '../../Docs/research/HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json',
    '../../Docs/research/STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json',
    '../../Docs/research/HERB_SECOND_TEN_FIELD_DRAFT_PLAN_2026-10-07.json',
    '../../Docs/research/HERB_THIRD_TEN_FIELD_DRAFT_PLAN_2026-10-07.json',
    '../../Docs/research/HERB_FOURTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json',
    '../../Docs/research/HERB_FIFTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json',
    '../../Docs/research/HERB_COVER_INTEGRATION_2026-10-07.json',
    '../../Docs/research/HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json',
    '../../Docs/research/HERB_NIPA_KASTULI_COVER_INTEGRATION_2026-10-07.json',
    '../../Docs/research/HERB_NIPA_KASTULI_MEDIA_RECOVERY_2026-10-07.json',
  ];
  const [queue, audit, plan, leads, secondPlan, thirdPlan, fourthPlan, fifthPlan, manifest, review, nextManifest, nextReview] = await Promise.all(paths.map(async relative =>
    JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8')) as unknown));
  const checkedQueue = expansionQueueSchema.parse(queue);
  const checkedAudit = z.object({ candidates: z.array(z.object({ candidateId: z.string(),
    image: z.object({ status: z.string(), cloudinaryUrl: z.string().optional() }),
  })) }).parse(audit);
  const nextMedia = { manifest: nextManifest, review: nextReview };
  const integratedPlans = integrateCheckedExpansionMediaPlans([plan, secondPlan, thirdPlan, fourthPlan, fifthPlan],
    reviewExpansionMediaFollowUp({ ...nextMedia, queueId: checkedQueue.batchId,
      candidates: checkedQueue.candidates, auditRows: checkedAudit.candidates }));
  const response = await fetch('https://herbalaicapstoneproject-staging.up.railway.app/api/herbs?limit=100', {
    signal: AbortSignal.timeout(20_000), headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Public herb catalog returned HTTP ${response.status}.`);
  const body = await response.json() as { data?: { total?: unknown; herbs?: unknown } };
  const report = reviewExpansionReleasePreflight({
    queue, audit, plan: integratedPlans[0], leads, additionalPlans: integratedPlans.slice(1),
    mediaFollowUp: { manifest, review },
    additionalMediaFollowUps: [nextMedia],
    catalog: { checkedAt: new Date().toISOString(), total: body.data?.total, herbs: body.data?.herbs },
  });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 2;
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Release preflight failed.');
  process.exitCode = 1;
});
