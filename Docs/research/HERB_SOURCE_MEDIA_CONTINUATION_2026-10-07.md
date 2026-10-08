# Herb source/media continuation — 7 October 2026
Status: HELD. This is the earlier source/media checkpoint, after HERB_FIFTY_REMAINING_GATES_2026-10-07.md's run. The subsequent two-cover integration and current eleven-cover hold are recorded in HERB_COVER_INTEGRATION_CONTINUATION_2026-10-07.md. Counts below and earlier receipts remain historical.

## Completed
- Located five exact-species primary-study method sections through the public Europe PMC XML API. Kabiki's full-text retrieval failed with HTTP 500; it is not counted as a completed full-text review.
- Applied one explicit, independently cited Tsampaka laboratory-description follow-up. No household recipe, clinical efficacy or human dose was added. Its separate stem-bark metadata quarantine remains unchanged.
- Preserved the original fifth-ten preparation review and fifty-coverage ledger. The current field draft owns the separately dated follow-up.
- Added a read-only photo-research CLI and reusable exact-taxon/per-photo permission checks. Tests reject wrong species, hybrid guesses, wrong observation IDs, non-CC0 photos, undersized images, unowned URLs and previous rejected photos.
- Replaced after-the-fact JSON size checking with streamed byte enforcement, body cancellation on failure and reader-lock release. The CLI refuses a publish flag before making a request.
- Researched 13 missing-cover candidates: 27 new photo leads for nine candidates. Four bounded searches did not yield an acceptable exact-name lead; this is not proof of absence.
- The first 27 image requests timed out under a 20-second limit. Subsequent bounded, selected retries fully decoded seven originals. Five are held/rejected for cover quality; two passed the educational cover-quality review. No partial file was uploaded.
- Uploaded unchanged Abutilon indicum and Kabiki photographs to Cloudinary cloud dclqw6at7, after individual CC0 and exact API taxon rechecks. Both originals returned HTTP 200, decoded completely and matched their source SHA-256 exactly. The dashboard increased from 58 to 60 assets.
- Retained observer usernames separately. “No rights reserved” is not asserted to be a photographer's name. Visual quality and a research-grade label do not substitute for expert botanical authentication.

## Current measured state
| Gate | Observation |
| --- | --- |
| Assembled candidate plans | 50 |
| Core draft text with descriptive preparation evidence | 44 |
| Partial drafts | 6 |
| Previously selected uploaded covers | 37 |
| New cover assets uploaded and byte-matched this run | 2 |
| Total available uploaded cover candidates | 39 |
| Candidates without an available uploaded cover | 11 |
| Cover holds in the unchanged selected-cover audit | 13 |
| New uploads integrated into that audit/draft plans | 0 |
| Live catalog, public GET at 2026-10-07T00:14:54.061Z | 38 |
| Publication cleared | 0 |

These are research/editorial and media-storage counts, not 44 safe beginner recipes or 39 approved botanical specimens. All fifty remain held; the new assets are not new Neon herb records.

## Remaining work, in order
1. Resolve bounded Philippine occurrence/historical identity for Lokoloko. Review exact-species preparation evidence for Santan, Kabiki and Balibago; methanol/ethanol experiments are not automatically household recipes. Keep Oxalis and Kastuli's food-processing/safe-quantity gaps explicit.
2. Review the remaining replacement photo leads and seek permitted exact-species alternatives where needed. Missing covers: Lokoloko, Alibangbang, Kupang, Nipa, Bottle gourd, Balibago, Asana, Kamias, Kahel, Kastuli and Ayapana.
3. Integrate the two delivered assets through an ownership-bound media follow-up, with candidate/queue identity, per-photo permissions, original SHA, delivery SHA and genuine reviewer provenance. The current checker intentionally rejects a draft image URL that differs from its owning audit; do not bypass that guard or silently rewrite historical receipts.
4. Obtain a recoverable target-specific backup and implement/review a guarded idempotent import. Recheck all-state names/aliases/synonyms inside its write transaction; test duplicate races and rollback in an isolated PostgreSQL database first.
5. Publish only records actually cleared for the educational Library, preserving unavailable medicinal recipes/doses and cited limits. Then validate public fields, photos and citations, refresh approved embeddings and run a small bounded Library-to-Dr. Ai retrieval check. No provider spam.
6. Continue the separate existing-38 remediation from LIVE_HERB_COMPLETENESS_2026-10-07.md, including ambiguous aliases, exact source tags and Kalingag's missing cover.

## Validation
- Focused suite: 281 passes in 19 files.
- Adjacent suite: 239 passes in 14 different files; 520 distinct tests total.
- Backend no-emit type check, strict CLI/changed-test type check and targeted lint passed.
- Git whitespace check passed; 13 scoped files passed whitespace checks and eight JSON receipts parsed. Docker, psql and postgres executables remain unavailable; no real isolated database import test ran.
- Public preflight remains HELD, expected checker exit 2. No current public stored-name conflict was observed; this is not fresh all-state private/transaction clearance.
- Early output-wrapper JSON parsing/truncation problems were tooling/report-capture failures, not an observed live API or application failure.
- Pure/mocked tests do not prove real PostgreSQL import/rollback/concurrency or a new full live MVP acceptance.

## Receipts and boundaries
- HERB_SOURCE_METHOD_FOLLOW_UP_2026-10-07.json: five full method reads and one failed retrieval, with concise source-bound summaries and hashes.
- HERB_TSAMPAKA_PREPARATION_FOLLOW_UP_2026-10-07.json: explicit synonym binding, independent source and uncleared medicinal/beginner flags.
- HERB_REPLACEMENT_PHOTO_LEADS_2026-10-07.json: public lead search, not specimen or upload approval.
- HERB_REPLACEMENT_PHOTO_DOWNLOAD_ATTEMPT_2026-10-07.json: failed bounded first attempt; no blank contact sheet is counted as visual review.
- HERB_REPLACEMENT_MEDIA_REVIEW_2026-10-07.json: seven inspected originals, five exclusions and two uploaded original-byte receipts.
- HERB_SOURCE_FOLLOW_UP_PUBLIC_PREFLIGHT_2026-10-07.json: latest captured counts and remaining content gaps.
- HERB_SOURCE_MEDIA_VALIDATION_2026-10-07.json: exact commands and explicit untested gates.
- Screenshot proof: cloudinary-herb-cover-upload-proof.jpg in the local herb-cover-replacements-2026-10-07 artifact directory; not committed.

HEAD remains 741167b on codex/mvp-acceptance-ci. No commit, push, Neon write/migration, embedding update, live AI request, fabricated reviewer, new credential or image retouching occurred. Two authorized Cloudinary media uploads did occur. Unrelated working-tree edits remain untouched.
