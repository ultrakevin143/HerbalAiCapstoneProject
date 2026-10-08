# First-ten preparation draft repair — 6 October 2026

**Later local follow-up:** `HERB_FIRST_TEN_OCCURRENCE_REPAIR_2026-10-06.md` records ten bounded region mappings and their regression results. The complete `HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json` has since been regenerated with occurrence fields. The earlier preparation results below remain a historical checkpoint, not publication clearance.

## Completed work

The read-only first-ten planner previously discarded every sourced preparation description and emitted the same generic placeholder. Its CLI also ignored the later Talisay kernel-food overlay. Neither problem was evidence that those fifty candidates had already been published: this is a repair to preparation of the future import, not a live catalog update.

The CLI now loads the first-ten supplement, the exact Talisay preparation overlay and the separate bark-evidence follow-up. All ten draft rows retain their actual preparation descriptions, plant-part metadata and bound source URLs. They remain food-processing descriptions, **not cleared medicinal household recipes**.

Modern evidence limitations are now included in the proposed persisted `medicinalUses` text instead of existing only in an auxiliary note a future writer could discard. Duhat retains the negative leaf-tea trial finding; Talisay explicitly distinguishes preclinical evidence from human benefit.

Existing botanical, traditional-use and warning source scopes are preserved. Repeated URLs are consolidated with combined field scopes and unique limitation notes. A source-ID alias cannot be reused to silently replace a URL. Stored local aliases separated by semicolons or pipes are now included in duplicate checks, alongside commas and slashes.

## Talisay evidence boundary

A [publisher abstract of a stem-bark rat pregnancy experiment](https://journalejmp.com/index.php/EJMP/article/view/333) and [a primary acute rodent stem-bark paper](https://tjnpr.org/index.php/home/article/download/29/34/18) were inspected. The proposed warning cites them only to establish the limits of the studied population and plant part. Neither establishes human pregnancy safety, a human medicinal dose or a home bark recipe.

The acute paper contains terminology and dose-reporting inconsistencies; these are retained in its source limitation. Its blanket safety conclusion and numerical animal doses were not adopted. The pregnancy paper was assessed at publisher-abstract level, not represented as a completed full-paper quality appraisal.

This supplies a source mapping for Talisay's warning about unresolved human safety. It does **not** resolve human bark safety or confer clinical approval. Historical review files and their earlier uncited-warning checkpoint remain unchanged.

## Reproduced failure and regression results

- Before the repair: **11 failures and 2 passes** in the initial 13-case regression file. The observed failures included discarded preparation text, missing Talisay warning bindings and ignored malformed overlay inputs.
- After the repair: the expanded regression file has **18 checks** covering all ten methods, plant-part metadata, evidence in persisted text, source consolidation, non-mutation, no publication/write clearance, malformed/missing references, wrong species/queue, invented doses, leaf-for-bark substitution, credential-bearing URLs and semicolon/pipe aliases.
- Focused combined run: **8 files, 87 tests passed**, duration 9.16 seconds. These were unit/ledger/mocked checks using an intentionally unreachable loopback database and an empty Gemini key. No actual PostgreSQL staging or live medicinal review is claimed.
- Backend lint passed. The first TypeScript build identified an exact-optional-property mismatch; optional safety fields were changed to be included only when present. The subsequent TypeScript build passed.
- The actual CLI was run read-only against the archived identity fixture. It produced ten method-cited draft rows and zero unmapped warning rows. This source-coverage result is not proof of medical safety.

## Saved output and target caveat

`Docs/research/HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json` contains the complete regenerated draft output. Its status remains `DRAFT_PLAN_NOT_EXECUTABLE`; `writeAllowed` and `publicationAllowed` remain false, every herb remains `DRAFT`/unverified/`UNASSESSED`, and no actual vector was generated.

The archived 5 October snapshot was used deliberately for a reproducible offline CLI check. Its expiry and unconfirmed-target flags remain visible as blockers. These historical flags are not a claim that today's independently inspected production target is broken; the live 6 October audit/recheck is documented separately. A new writer still needs a fresh independently matched all-state snapshot inside its transaction.

## Files changed in this batch

- `herbalaibackend/src/content/herb-expansion-field-research.ts`
- `herbalaibackend/src/content/herb-expansion-staging-plan.ts`
- `herbalaibackend/prisma/plan-herb-expansion.ts`
- `herbalaibackend/tests/herb-expansion-field-research.test.ts`
- `Docs/research/TALISAY_BARK_SAFETY_FOLLOW_UP_2026-10-06.json`
- `Docs/research/HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json`
- This report and the dated note in the fifty-candidate audit report.

No production database write, Cloudinary upload, Git commit, Git push or UI styling change occurred. Unrelated working-tree changes were preserved.

## Next work

1. Occurrence/region draft mapping is now completed in the later follow-up; final content/source-quality review remains pending. The regenerated planner still uses `Uncategorized` and does not infer therapeutic categories or publication clearance from geography.
2. Complete the forty remaining full-content drafts. Resolve the four adopted-method gaps and thirteen missing selected covers listed in the fifty-candidate audit; these counts have not been silently cleared by this repair.
3. Test a dedicated new-record writer in isolated PostgreSQL, including rollback and concurrent identity conflicts. The current planner still cannot write. No local PostgreSQL/Docker runtime has been available for those tests.
4. Publish only fully reviewed records after a fresh transaction-time check, then reconcile the Library, citations, accurate covers and actual Dr. Ai retrieval. Do not reuse the twenty-existing-record updater as a fifty-record importer.
