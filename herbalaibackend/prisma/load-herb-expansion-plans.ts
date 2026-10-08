import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { expansionQueueSchema } from '../src/content/herb-expansion-review.js';
import { integrateCheckedExpansionMediaPlans, reviewExpansionMediaFollowUp } from '../src/content/herb-expansion-media-follow-up.js';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';

export async function loadHeldExpansionPlans() {
  const readJson = async (relative: string): Promise<unknown> => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
  const research = (file: string) => readJson(`../../Docs/research/${file}`);
  const queue = expansionQueueSchema.parse(await readJson('../content/herbs/expansion-batch-03.review.json'));
  const audit = await research('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json');
  const checkedAudit = z.object({ candidates: z.array(z.object({ candidateId: z.string(),
    image: z.object({ status: z.string(), cloudinaryUrl: z.string().optional() }),
  })) }).parse(audit);
  const basePlans = await Promise.all(['HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json',
    ...['SECOND', 'THIRD', 'FOURTH', 'FIFTH'].map(batch => `HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`)].map(research));
  const mediaFollowUp = { manifest: await research('HERB_COVER_INTEGRATION_2026-10-07.json'),
    review: await research('HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') };
  const nextMedia = { manifest: await research('HERB_NIPA_KASTULI_COVER_INTEGRATION_2026-10-07.json'),
    review: await research('HERB_NIPA_KASTULI_MEDIA_RECOVERY_2026-10-07.json') };
  const plans = integrateCheckedExpansionMediaPlans(basePlans, reviewExpansionMediaFollowUp({
    ...nextMedia, queueId: queue.batchId, candidates: queue.candidates, auditRows: checkedAudit.candidates,
  }));
  reviewExpansionReleasePreflight({ queue, audit, plan: plans[0], additionalPlans: plans.slice(1),
    leads: await research('STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
    mediaFollowUp, additionalMediaFollowUps: [nextMedia],
    catalog: { checkedAt: new Date().toISOString(), total: 0, herbs: [] },
  });
  return { queue, plans };
}
