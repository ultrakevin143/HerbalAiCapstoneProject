import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { reviewExpansionMediaFollowUp, integrateCheckedExpansionMediaPlans } from '../src/content/herb-expansion-media-follow-up.js';
import { reviewExpansionReleasePreflight } from '../src/content/herb-expansion-release-preflight.js';
import { findMissingDraftCoverCandidates } from '../src/content/herb-cover-replacement-research.js';

const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const research = (file: string) => readJson(`../../Docs/research/${file}`);
const queue = readJson('../content/herbs/expansion-batch-03.review.json');
const audit = research('HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json');
const plans = [research('HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json'),
  ...['SECOND', 'THIRD', 'FOURTH', 'FIFTH'].map(batch => research(`HERB_${batch}_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`))];
const nextMedia = { manifest: research('HERB_NIPA_KASTULI_COVER_INTEGRATION_2026-10-07.json'),
  review: research('HERB_NIPA_KASTULI_MEDIA_RECOVERY_2026-10-07.json') };
const checkMedia = (value = nextMedia) => reviewExpansionMediaFollowUp({ ...value,
  queueId: queue.batchId, candidates: queue.candidates, auditRows: audit.candidates });
const input = {
  queue, audit, leads: research('STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.json'),
  catalog: { checkedAt: '2026-10-07T02:00:00Z', total: 0, herbs: [] },
  mediaFollowUp: { manifest: research('HERB_COVER_INTEGRATION_2026-10-07.json'),
    review: research('HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json') },
  additionalMediaFollowUps: [nextMedia],
};
const reviewedInput = () => {
  const integrated = integrateCheckedExpansionMediaPlans(plans, checkMedia());
  return { ...input, plan: integrated[0], additionalPlans: integrated.slice(1) };
};

describe('recovered Nipa and Kastuli cover integration', () => {
  it('selects 41 covers, leaving nine genuine media gaps and all publication holds intact', () => {
    const report = reviewExpansionReleasePreflight(reviewedInput());
    expect(report.counts).toMatchObject({ candidates: 50, fullContentDrafts: 49, partialContentDrafts: 1,
      missingSelectedCovers: 9, publicationCleared: 0 });
    expect(report.writeAllowed).toBe(false);
    expect(report.publicationAllowed).toBe(false);
    for (const candidateId of ['research-pardo-215', 'research-pardo-032']) {
      const row = report.rows.find(value => value.candidateId === candidateId);
      expect(row?.selectedCoverUrl).toContain('https://res.cloudinary.com/dclqw6at7/');
      expect(row?.blockers).not.toContain('SELECTED_COVER_MISSING');
      expect(row?.blockers).toContain('CONTENT_SAFETY_REVIEW_PENDING');
      expect(row?.medicinalInstructionsCleared).toBe(false);
    }
  });

  it('does not modify base plans or non-media content and review flags', () => {
    const before = structuredClone(plans);
    const integrated = integrateCheckedExpansionMediaPlans(plans, checkMedia());
    expect(plans).toEqual(before);
    for (const [index, plan] of integrated.entries()) {
      for (const row of plan.draftRows) {
        const original = before[index].draftRows.find((value: { candidateId: string }) => value.candidateId === row.candidateId);
        if (!['research-pardo-215', 'research-pardo-032'].includes(row.candidateId)) {
          expect(row).toEqual(original);
        } else {
          for (const key of Object.keys(original.proposedData)) expect(row.proposedData[key]).toEqual(original.proposedData[key]);
          expect(row.reviewGaps).toEqual(original.reviewGaps);
          expect(row.proposedSources).toEqual(original.proposedSources);
        }
      }
    }
  });

  it('researches only nine unresolved candidates, not the recovered assets again', () => {
    const missing = findMissingDraftCoverCandidates(queue, integrateCheckedExpansionMediaPlans(plans, checkMedia()));
    expect(missing).toHaveLength(9);
    expect(missing.some(row => ['research-pardo-215', 'research-pardo-032'].includes(row.id))).toBe(false);
  });

  it.each(['imageUrl', 'imageSourceUrl', 'imageLicense', 'imageLicenseUrl', 'imageCreator', 'imageModification'])
    ('cannot overwrite existing draft provenance: %s', field => {
      const changed = structuredClone(plans);
      const row = changed[2].draftRows.find((value: { candidateId: string }) => value.candidateId === 'research-pardo-215');
      row.proposedData[field] = field === 'imageCreator' ? null : 'https://example.com/prior';
      expect(() => integrateCheckedExpansionMediaPlans(changed, checkMedia())).toThrow('cannot overwrite');
    });

  it('cannot integrate the same receipt twice or into a partial candidate list', () => {
    const integrated = integrateCheckedExpansionMediaPlans(plans, checkMedia());
    expect(() => integrateCheckedExpansionMediaPlans(integrated, checkMedia())).toThrow('cannot overwrite');
    expect(() => integrateCheckedExpansionMediaPlans(plans.slice(0, 2), checkMedia())).toThrow('exactly one');
  });

  it('cannot count duplicate follow-up ownership twice', () => {
    const changed = reviewedInput();
    changed.additionalMediaFollowUps.push(structuredClone(nextMedia));
    expect(() => reviewExpansionReleasePreflight(changed)).toThrow('Duplicate media ownership');
  });

  it('binds a named review receipt to the manifest instead of accepting a mislabeled ledger', () => {
    const changed = structuredClone(nextMedia);
    changed.review.evidenceFile = 'OTHER_RECEIPT.json';
    expect(() => checkMedia(changed)).toThrow('does not match');
  });

  it('does not accept a decoded source hash that differs from the delivered asset', () => {
    const changed = structuredClone(nextMedia);
    changed.review.decodedOriginals[0].sha256 = '0'.repeat(64);
    expect(() => checkMedia(changed)).toThrow('byte, quality or ownership');
  });

  it('preserves the prior failed transfer receipt instead of rewriting it as success', () => {
    const bytes = readFileSync(new URL('../../Docs/research/HERB_REPLACEMENT_PHOTO_DOWNLOAD_ATTEMPT_2026-10-07.json', import.meta.url));
    expect(createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g, '\n')).digest('hex'))
      .toBe('44733cd1aa4208eb4f27e24e2b57c2910ae1e05d1ac15e8954469802291824b5');
    expect(nextMedia.review.heldOrRejected).toContainEqual(expect.objectContaining({ photoId: 632519146,
      status: 'DOWNLOAD_TIMEOUT_NO_UPLOAD' }));
  });
});
