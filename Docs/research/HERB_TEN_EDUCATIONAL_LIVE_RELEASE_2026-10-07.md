# Ten new herbs: observed live release, 7 October 2026

## Actual result

- Publication committed at `2026-10-07T03:03:21.926Z` to the independently confirmed live Neon compute `ep-icy-sound-aqfe958d.c-8.us-east-1.aws.neon.tech`, database `neondb`. The different host in the local `.env` was not connected to or changed; project credentials stayed in memory.
- Published ten: Duhat, Sampalok, Atis, Talisay, Butterfly pea, Mangga, Santol, Papaya, Granada and Chico. Forty of the new fifty remain DRAFT; all fifty retain preparation descriptions. There are still 41 selected covers.
- The public catalog returned **48 records, HTTP 200**, at `2026-10-07T03:07:47.925Z`. All ten new detail responses returned HTTP 200 and passed comparison of identity, preparation, dosage boundary, warnings, occurrence, image and reference counts. The unresolved Lokoloko detail remained HTTP 404. There were zero comparison failures and zero blank preparation fields across the 48 published database records.
- In the actual Codex browser, searching Duhat produced one result. Opening its detail showed its real image, preparation, explicit no-treatment-dose boundary, occurrence and four source references. Screenshot: `herbalaibackend/tmp/duhat-live-preparation-2026-10-07.jpg`.

## What publication does and does not mean

This is an automated, user-authorized, source-limited **editorial** publication, not clinical validation or a claimed clinician review. Exact-species identity and historical mappings reuse the saved first-ten review. Individual CC0 photo licenses and research-grade species were freshly checked through one iNaturalist observation batch at `2026-10-07T02:54:50.669Z`; all ten passed. Previously recorded full-decode, visible-morphology and original Cloudinary byte checks were reused rather than repeating completed downloads. Observations are not expert botanical vouchers.

The preparations remain descriptive food-use or food-processing accounts, explicitly not treatment instructions. Missing times, quantities, storage steps and human doses were not invented. `isDohApproved` remains false; evidence class is `DOCUMENTED_TRADITIONAL_USE`, category `Food-use descriptions`. The dosage field states an editorial exclusion of medicinal dosing; external sources were not falsely tagged as proving a physiological dose or the universal absence of a dose elsewhere. Source and safety text was retained unchanged.

The publication audits explicitly record `AUTOMATED_SOURCE_LIMITED_EDITORIAL_REVIEW`, `clinicalValidation=false`, `medicinalInstructionsCleared=false` and `NO_MEDICINAL_DOSE_SUPPLIED`. `reviewedById` identifies the active administrator authorizing this operation, not a fabricated manual UI or clinical review. The original staging audits keep their unresolved medicinal-review limitations.

## Guarded execution and validation

The focused publisher requires an explicit reviewed digest and target, active administrator, exact current draft/source snapshots, insert-only private backup, full transaction rollback, source ownership, current CC0 photo identity, all-state scientific/synonym/local-alias conflict checks and bounded food-description scope. It rejects repeat publication and changed provenance. The ten existing source collections and all preparation text were preserved; no unrelated live herb was updated.

Observed: 721 targeted regressions in 43 files passed; five real PostgreSQL publication tests passed (ten-only publication, forty retained drafts, repeat rejection, provenance change rejection, inactive administrator/rejected-suggestion conflict, audit-failure rollback). Backend and new-test TypeScript, focused lint and diff whitespace checks passed. These are focused release checks, not a claim of complete application, physical-device or participant acceptance. An initial local port mismatch caused ECONNREFUSED; the tests passed on the verified temporary cluster's loopback port 5432. No provider database was used for those destructive fixtures.

Indexing committed at `2026-10-07T03:05:11.691Z`: ten real 768-dimensional `gemini-embedding-2` vectors, one provider batch containing ten chunk requests, zero retries, no unrelated record updates. The indexing writer reuses the production text chunking function, validates finite dimensions, saves generated vectors before writing, locks and compares the published snapshots, updates only null vectors and writes ten indexing audits. This live pgvector operation is separate from the local text-column fixture. No Gemini key, Cloudinary key or database connection string is in these reports.

At `2026-10-07T03:11:31.161Z`, a second bounded provider batch generated two real natural-language query vectors. Using the production published/verified/non-null-vector predicate against live Neon, the Duhat preparation question retrieved Duhat at rank 1 (cosine distance 0.15754); the Atis fruit/seed question retrieved Atis at rank 1 (0.17794). This was read-only semantic retrieval, with no chat messages or database writes. It does not replace authenticated chat/UI acceptance. Evidence: `HERB_TEN_LIVE_SEMANTIC_RETRIEVAL_2026-10-07.json`. Total provider calls for this release: two batches, twelve text embeddings, zero retries; no AI chat spam.

## Do not repeat completed operations

Do not rerun the fifty-row importer, first-ten publisher or indexing script: the records exist and repeat/stale operations are intentionally rejected. Keep the immutable staging plans as historical evidence. The old fifty-draft verifier expects the prepublication state and is no longer an appropriate current-status check.

Private operational artifacts are in git-ignored `herbalaibackend/tmp`: original fifty-row plan; first-ten publication plan, before-image backup and receipt; generated-vector before-images and indexing receipt; fresh photo receipt; current public verification; screenshot. Public credential-free evidence is `HERB_TEN_PUBLIC_RELEASE_VERIFICATION_2026-10-07.json`.

## Remaining work, without starting over

1. Continue the **remaining forty** only. Reuse their saved source ledgers and selected photos, retaining identity/variety holds for Lokoloko, Mustasa, Radish, Tubo, Manzanitas and Kahel where unresolved. Category, exact field-source coverage and food-versus-laboratory scope need per-record decisions; do not transfer the first-ten approval to them.
2. Complete nine clear exact-species covers. Three source transfers stalled; partial bytes are not usable covers. Asana's first decoded foliage view was dark and obstructed, so it was not uploaded. Keep held species private when no accurate, cleared image is available.
3. Finish authenticated Dr. Ai end-to-end acceptance in an existing signed-in test session. The current Codex browser is signed out; Chrome is unavailable. Do not fabricate a session or claim a chat response was observed. Index availability is verified independently from browser chat acceptance.
4. Keep clinical/home-treatment instructions, physical-device and participant approval distinct from these data/editorial checks. Source limitations must remain visible rather than be filled from model memory.

No commit or push of the unrelated dirty checkout occurred. The public site already reads the released Neon data; it does not require a frontend deployment to display these ten.

## Final handoff for immediate live testing

The public catalog was checked again using `?limit=100`: HTTP 200, `data.total=48`, and all 48 entries returned. Duhat's wrapped `data.herb` detail also returned code 200 with its preparation present. Open the live Library and search any of the ten names above; the records are already available without a code deployment. The temporary isolated PostgreSQL cluster was shut down cleanly after validation; the live database was not stopped.

Bottle gourd photo 632519146 finished downloading through bounded HTTP Range resumes, with matching ETag `69e39961583472250c5e9ea463637adb`. The complete original is 771802 bytes, JPEG 768 x 1024, full sharp decode passed, SHA-256 `4dc222a3ba941d77c9f56f6f910237e6093c04d99150a103c8a536f4c8a5ec99`. Its central hanging fruit is obscured and out of focus in a cluttered view; it is held for clear-cover quality, not asserted to be the wrong species. No Cloudinary upload or live media update was made. Keep the complete file `herbalaibackend/tmp/bottle-gourd-source-resume.jpg`; do not restart this download or upload it as an approved cover. The earlier partial-transfer report remains historical. Kamias and Balibago transfers remain incomplete; Asana's decoded first image is also held for visibility. Nine covers are therefore still unresolved.

Next continuation: review only the remaining forty drafts against their saved field-source and identity ledgers, resolve the nine clear-cover holds using different qualified leads, then publish eligible records through a separately reviewed bounded plan. Do not rerun the fifty-row staging import, ten-row publication or successful indexing. Authenticated Dr. Ai chat remains a separate pending live check; the current available browser is signed out, and Chrome is unavailable. No synthetic chat result or session was created.
