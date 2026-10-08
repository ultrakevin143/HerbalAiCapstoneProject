# Live herb indexing and retrieval check

Date: 8 October 2026, Asia/Manila. Scope: current published-herb vector coverage, three bounded semantic samples, one authenticated live chat exchange, and focused regressions against the exported production candidate.

## Current database findings

The read-only repeatable-read snapshot completed at `2026-10-08T02:35:52.734Z` (10:35:52 Manila) against the previously confirmed live Neon target, database `neondb`. The public catalog independently returned HTTP 200 with the same 88 published IDs.

| Check | Observed result |
| --- | --- |
| Herb rows / published verified rows | 88 / 88 |
| Public catalog total | 88 |
| Published vectors with 768 dimensions | 88 |
| Published NULL vectors | 0 |
| Published non-NULL vectors with wrong dimensions | 0 |
| Expansion records / indexed expansion records | 50 / 50 |
| Database/public ID mismatches | 0 |

The ten vectors saved by the earlier first-ten indexing receipt are now different from their current float32 values. Thus, the 7 October findings of forty missing vectors and ten unchanged older vectors are not reproduced in this snapshot. Do not reindex or reimport those herbs solely on the basis of that historical report.

This establishes coverage and a changed-vector comparison, not a complete freshness certificate. No complete current-content hash/generation receipt for all 88 vectors was located in the narrowly inspected handoff artifacts. A non-NULL vector and a changed value alone cannot establish exactly which text generated it. No author/tool identity is inferred from these database results.

## Bounded live semantic query check

One Gemini `gemini-embedding-2` batch generated exactly three 768-dimensional query vectors. There were no provider retries. The production repository's published/verified/non-NULL SQL predicate was used in a read-only transaction, with a top-three limit.

| Query subject | Expected record | Observed rank | Cosine distance |
| --- | --- | --- | --- |
| Tender young fruit peeled/sliced for soups or steaming; no plant name supplied | Luffa aegyptiaca | 1 | 0.2726640647 |
| Holy basil leaves and recorded preparation/safety limits | Balanay / Ocimum tenuiflorum | 1 | 0.2218291894 |
| Indian mallow, external-use reports versus laboratory evidence | Abutilon indicum | 1 | 0.2139725472 |

The receipt completed at `2026-10-08T02:40:22.040Z` (10:40:22 Manila). These are actual pgvector results, not mocked ranks. Ranking does not certify the cited plant methods or prove that every possible prompt passes Dr. Ai's additional lexical and relevance filtering.

## Authenticated live chat

The existing user-selected signed-in in-app browser session opened a fresh chat with no retained previous plant question. Exactly one new question was sent:

> Which Library record describes peeling and slicing tender young fruit for soups or steaming, and what safety limitations does it list?

The response completed and cited Luffa aegyptiaca and Bottle gourd (Lagenaria siceraria), which both have relevant young-fruit food records. It retained the distinction between food preparation and an uncleared medicinal household recipe, and repeated the respective recorded safety limits. No medicinal dose was added in the observed answer. The presence of a second relevant record was not treated as a failure for an intentionally unnamed question.

Clicking the Bottle gourd citation opened `/library?id=builtin-expansion-03-pardo-108`; the matching title, scientific identity, food preparation and warnings were visible. This is actual UI, current-record retrieval and citation-navigation evidence. It is not medical endorsement, an independent source review, every-herb acceptance or evidence that the provider never used fallback internally.

No password, authentication setting, administrator role, herb text, image or vector was changed. No herb import, index refresh, commit, push or provider-setting change was performed. The normal chat request may persist its conversation through the application; the direct SQL checks themselves were read-only.

## Focused production-code regressions

The clean six-file release export from `f922b9e` was used, rather than the unrelated dirty working-tree changes. Vitest passed **106 tests across four files** at 10:41 Manila:

- `tests/rag-response-context.test.ts`
- `tests/chat-safety-boundaries.test.ts`
- `tests/herb-preparation-rag.test.ts`
- `tests/gemini-fallback.test.ts`

These tests mock the provider/database boundary and do not consume live AI quota or establish live medical correctness. The broader PostgreSQL CI and deployment receipts for this release remain in `LIBRARY_TO_AI_RELEASE_CHECK.md`; they were not rerun or newly claimed here.

## Evidence and remaining work

Local git-ignored artifacts:

- `herbalaibackend/tmp/index-coverage-snapshot-2026-10-08.json`: database snapshot, source rows, dimensions and older-vector comparisons. Do not commit its full vector payload.
- `herbalaibackend/tmp/indexed-retrieval-receipt-2026-10-08.json`: three actual query ranks and nearest neighbors.
- `herbalaifrontend/tmp/semantic-ai-live-answer-2026-10-08.txt`: observed live answer state.
- `herbalaifrontend/tmp/semantic-ai-live-answer-2026-10-08.png`: live answer screenshot.
- `library-release-5ffe4e49972147bba13b5da6aba621b4/indexing-regressions-2026-10-08.log`: focused clean-export test log outside the repository.

No indexing defect was reproduced that justified a new production repair. The older preparation/source-consistency findings remain separate: current Abutilon and Lokoloko methods still require exact supporting passages before being medically/source-certified. Lokoloko's occurrence field is now populated, but the presence of text alone does not verify its locality claims. Do not invent additional preparation steps to close those evidence gaps.

Next substantive work is a focused source-to-field review and, only if content is legitimately corrected, a backed-up targeted vector refresh with recorded input hashes. Participant UAT and a new physical-device check were not performed in this batch. This report is saved locally, not automatically published as a documentation-only deployment.
