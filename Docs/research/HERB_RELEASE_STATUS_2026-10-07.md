# Herb release status — 7 October 2026

## Latest post-handoff observation — 15:18 Asia/Manila

All fifty expansion records are now PUBLISHED in live Neon and exposed by the public API: **88 total Library records, no remaining expansion drafts, 50/50 covers and nonblank preparation descriptions**. All fifty public details match the checked database fields/source IDs; all 88 image URLs deliver HTTP 200 image responses. These are observed post-handoff results, superseding the historical ten-public/forty-draft status below.

Remaining reproduced gaps include forty NULL semantic embeddings, ten unchanged vectors after preparation/category/dosage edits, four failing common-name searches, absent local regional-name UI in two inspected live dialogs, Lokoloko's NULL occurrence, and Abutilon's source/method inconsistency. Read `HERB_POST_HANDOFF_LIVE_AUDIT_2026-10-07.md` and its JSON for evidence, limitations and the focused repair order. This audit was read-only: no production data, code deployment or provider AI calls were made.

## Latest public result — 11:07 Asia/Manila

**Ten of the fifty new records are now published and independently checked live. The public Library contains 48 records; the other 40 new records remain private drafts.** Published: Duhat, Sampalok, Atis, Talisay, Butterfly pea, Mangga, Santol, Papaya, Granada and Chico.

Each new public detail returned HTTP 200 with its original preparation description, safety text, occurrence, real Cloudinary image and field-specific references preserved. The catalog returned 48 records. The unresolved Lokoloko draft still returned HTTP 404. All 48 published records have nonblank preparation text; this is not a claim that every text is a complete household medicinal recipe.

The ten records were released as source-limited educational descriptions, not clinically approved remedies. Their category is `Food-use descriptions`; DOH approval remains false. Their dosage field explicitly supplies no medicinal dose or prescribed treatment regimen. No source was falsely tagged as establishing a dose. Audit logs identify an automated editorial review authorized by the user, not a clinician examination or a human-admin UI review. The original staging audit gaps remain available.

All ten received real 768-dimensional Gemini embeddings in **one provider batch, ten chunk requests, no retries**. Their public detail data and index dimensions were verified. Authenticated Dr. Ai chat acceptance remains pending: the connected Codex browser is signed out and Chrome reports unavailable. No authentication token was fabricated, password entered, or login requirement bypassed.

Validation: **721 targeted regressions in 43 files**, plus **five real PostgreSQL publication transaction tests**, passed. Backend TypeScript, the new test TypeScript check, focused lint and diff whitespace check passed. The first local database attempt targeted a port where this temporary cluster was not listening; rerunning against its verified loopback port 5432 passed. This was not a live Neon failure. The local fixture uses text for the unused vector column; the actual ten vector writes and dimension checks took place in live Neon.

Remaining media: 41/50 selected covers. Bottle gourd, Balibago and Kamias original downloads timed out and were not uploaded or called complete. One Asana original decoded, but its visibly dark, obstructed foliage view was not accepted as a clear cover. Lokoloko also has an unresolved historical identity and was excluded from further photo downloading. The other saved exact-species photo holds remain recorded; do not replace them with neighboring taxa or generated images.

Evidence: `HERB_TEN_PUBLIC_RELEASE_VERIFICATION_2026-10-07.json` and `HERB_TEN_EDUCATIONAL_LIVE_RELEASE_2026-10-07.md`. The earlier staging receipts describe the state before publication and must not be mistaken for the current public count.

## What changed in this continuation

- Two real photos, Nipa and Kastuli, were downloaded completely, visually inspected and uploaded to Cloudinary `dclqw6at7`. Individual photo CC0 licenses and exact research-grade species were checked. No synthetic images or image modifications were used.
- Both delivered JPEGs returned HTTP 200, decoded fully and matched the source SHA-256 byte for byte. Cloudinary now has these two assets; this is an actual external change, not just a proposed upload.
- The checked media receipt now integrates those covers into the held fifty-draft release check in memory. Historical receipts and base draft plans remain unchanged. Current selected draft covers: **41/50**, leaving **9** gaps. The cover researcher uses this integration so it does not keep searching for the two recovered candidates.
- Added regression coverage for immutable plans, provenance overwrites, repeated integration, ledger identity, ownership and source/delivery mismatch. **682 tests in 40 files passed**. Backend and CLI TypeScript checks and focused lint passed.
- Implemented the missing fifty-draft importer, including a credential-free Neon SQL Editor export. It preserves preparation text and field-level source tags, requires an active administrator, rejects duplicates against every Herb/SuggestedHerb state, saves an insert-only backup before writing, locks competing identity changes, and rolls back the complete batch on failure. It cannot publish or generate embeddings.
- Established a temporary PostgreSQL 17.6 cluster bound only to loopback, outside the repository. **695 herb regression tests in 41 files plus 15 real PostgreSQL transaction tests passed (710 total).** Backend, CLI and new-test TypeScript checks and focused lint passed. These are targeted herb-release checks, not the complete application's acceptance suite. The transaction fixture uses nullable text instead of pgvector for the unused embedding column; full production Prisma migrations and pgvector operations were not validated by this fixture.
- Independently matched Railway's database host with Neon project `falling-block-62836604`, branch `br-still-waterfall-aqtagztm` (`pre-railway-deploy-2026-09-20`), compute `ep-icy-sound-aqfe958d`, database `neondb`. The default production branch is a different target and was not modified. No database credentials were copied into Git or local artifacts.
- Captured all **55** existing Herb/SuggestedHerb identities at `2026-10-07T02:17:56.671Z` and confirmed that the proposed fifty have no conflicts with that all-state snapshot. Generated a backed-up import containing **50 private drafts, 193 sources, 50 preparation descriptions and 41 selected covers**. The executable SQL compares the snapshot again inside its locked transaction and rejects snapshots older than one hour.

## Staging milestone before publication

All fifty new herbs entered the live Neon database as private drafts. The insert-only transaction committed at `2026-10-07T02:41:32.762Z`. Independent post-commit validation at `2026-10-07T02:43:55.327Z` confirmed **50 drafts, 193 source rows, 50 staging audits, 50 preparation descriptions and 41 covers**, with every proposed field/source checked against the reviewed plan. No existing herb was updated in that transaction, and no embeddings were generated at that staging milestone. Ten were subsequently published and indexed as recorded above.

At the staging check, the public catalog returned **38 herbs (HTTP 200)** and a new draft's public detail returned **HTTP 404**, confirming staging isolation. The latest public check now returns **48 herbs**. No commit or push occurred; the actual public changes were authorized, backed-up Neon data transactions, not an unrelated code deployment.

The earlier release-preflight command remains read-only. Chrome stayed unavailable, so the import was completed using the tested guarded CLI instead. Existing local credentials for the same Neon project authenticated successfully to the independently confirmed live compute host after a read-only target check (38 Herb and 17 SuggestedHerb rows). The different branch named in the local `.env` was not connected to, and `.env` was not changed. Credentials stayed in memory; TLS used `verify-full`. The writer took a fresh all-state backup, checked active administrator ownership and duplicate identities inside its locked transaction, then inserted the whole batch atomically.

## The actual release bottlenecks

1. **Completed locally:** guarded draft importer and real PostgreSQL rollback, repeat-import and concurrent-duplicate tests. Do not feed these plans to the older built-in importer or use its publication mode.
2. **Completed live:** target-confirmed, backed-up, duplicate-checked staging and independent post-commit validation. Do not rerun the import: all fifty IDs now exist, and repeat imports correctly abort without overwriting them.
3. Finish missing covers: Lokoloko, Alibangbang, Kupang, Bottle gourd, Balibago, Asana, Kamias, Kahel and Ayapana. Bottle gourd's browser download timed out; no accepted file or upload was claimed.
4. Resolve Lokoloko's missing occurrence field, two secondary-source identity holds, categories and final content/source review. Do not clear these by inventing details or marking a review as completed.
5. Separate **private draft staging** from **public publication**. Draft staging must not mark records verified, generate embeddings, overwrite current herbs or expose unfinished research in the public Library. Publish only individually reviewed records afterward, then check their Library details and AI retrieval.

## Preparation limits

All fifty plans contain preparation text, but 49 have the currently required descriptive-field coverage and Lokoloko remains partial. Some text describes food processing or laboratory extraction, not a clinically validated medicinal recipe. Missing safe times, ratios or human doses must not be invented to make every entry look complete. Existing live-herb edits and new-record imports remain separate operations.

## Evidence

- `HERB_NIPA_KASTULI_MEDIA_RECOVERY_2026-10-07.json`: observed photo licenses, identities, upload asset IDs, delivery URLs, dimensions and hashes; records the failed Bottle gourd attempt separately.
- `HERB_NIPA_KASTULI_COVER_INTEGRATION_2026-10-07.json`: held cover selection manifest.
- `HERB_NIPA_KASTULI_MEDIA_VALIDATION_2026-10-07.json`: test/check commands and compact observed public preflight.
- `HERB_DRAFT_IMPORT_2026-10-07.md`: implemented importer, observed tests, precise live target, saved runtime artifacts and the no-rescan execution handoff.
- `HERB_FIFTY_LIVE_STAGE_VERIFICATION_2026-10-07.json`: actual post-commit database and public API results, with zero comparison failures.

Physical-device, participant and clinical review outcomes were not invented. Earlier reports retain their historical counts; the current totals are stated here.
