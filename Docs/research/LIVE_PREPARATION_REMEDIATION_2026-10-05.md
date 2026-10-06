# Live Library preparation follow-up

Date: October 5, 2026. Priority changed after the user reported that Library plants lacked preparation methods. No live content write or release occurred in this follow-up.

## What was actually reproduced

A fresh public API read at `2026-10-05T12:50:24.916Z` returned all 38 published identities. Twenty preparation fields still contain exactly `No clinically validated home preparation is provided in this entry.` None is an empty string. The other eighteen contain specific preparation notes, research-formulation descriptions, traditional-practice descriptions or deliberate safety restrictions. Do not report that all 38 lack the field.

Two live plant-detail screens were inspected directly:

- Oregano renders its Preparation Method heading and the exact generic API sentence. The field is not hidden by the frontend; the live content is unchanged.
- Indian Heliotrope renders an explicit preparation restriction, warning and references. Its restriction must not be converted to an ingestion recipe merely to populate the field.

The twenty researched replacements are already in `herbalaibackend/content/herbs/expansion-batch-02.json` on CI commit `f98c498d0c62998b2f5129557f038a79345cd9bd`. Its successful CI did not update production content. See `LIVE_LIBRARY_PREPARATION_FOLLOW_UP_2026-10-05.json` for the exact observed strings and identities. This check does not count as visual inspection of all 38 modals.

## Focused local repair

The existing bootstrap importer upserts broad fields, replaces images/regional names/reviewer flags, and deletes all source rows. It is not an acceptable way to deliver this preparation-only repair.

Added `herbalaibackend/src/content/herb-preparation-update.ts` and `herbalaibackend/prisma/update-herb-preparations.ts` as a separate, opt-in updater. Neither is connected to app startup or deployment bootstrap.

- Uses only selected existing published, verified BUILT_IN records with exact IDs, scientific names and local names. Refuses already-edited preparation baselines, missing records, duplicate selections and fifty-candidate research ledgers.
- Changes preparationMethod, and only changes dosage/warnings when those changed fields have reviewed source attribution. Uncited warning/dose fields are retained; textual presence is not sufficient evidence.
- Preserves image fields, regional names, medicinalUses, categories, publication/verification/evidence flags, original reviewer metadata, comments and suggestions. No herb insert, upsert, publication, source deletion or source overwrite is performed.
- Appends reviewed citations with explicit field support, access dates and exact-match deduplication. Older source rows remain available. A newer reviewed citation may coexist with its older, different evidence note rather than destroy the original.
- Creates an exclusive, digest-checked recovery export outside the repository. It contains full prior herb/source/vector snapshots, not a database URL. Existing recovery files are not overwritten. No automatic production rollback command is provided; a recovery operator must reconcile any intervening edits before restoring.
- Requires an independently confirmed connection host/database and a complete public-versus-database published identity comparison. The known differently targeted local `.env` must not be used.
- Requires an explicitly reviewed plan SHA, a plan no older than fifteen minutes, an active administrator and complete 768-dimensional finite/nonzero-vector embedding coverage. Embedding input uses current stored fields plus accepted changes, not unrelated draft metadata. Never supply synthetic test vectors in a release.
- Generates embeddings before beginning the write transaction. SERIALIZABLE transactions and herb/source row locks guard the full before-state hashes, including existing vectors, media and source rows. Whitespace-only edits also invalidate the snapshot. Failures roll back; automatic replay/retry is deliberately absent.
- Writes the existing `UPDATE_HERB` audit action with `PREPARATION_ENRICHMENT` details, so the normal audit-log action remains applicable.

This software repair is not independent medical clearance. Reported traditional preparation, food processing, clinical research formulation and supported home guidance must remain distinct. Unsupported quantities, treatment claims and contraindication gaps must not be invented. Existing harm exclusions and review gaps remain.

## Validation

- Seventeen new offline unit regressions passed, including exact comparison against all twenty observed live-placeholder IDs/names. Mutation tests use fabricated loopback-only fixtures and mocked SQL clients, not production data or real Gemini vectors.
- The earlier four-file focused run passed 100 tests before the final whitespace/source-change regression was added. These cover preparation evidence, retrieval, coverage and updater boundaries.
- Backend build, source lint and strict standalone TypeScript checking of the new CLI and both test files passed. The CLI `--help` completed successfully without opening a database connection.
- Four isolated PostgreSQL regressions were authored: preservation, audit-failure rollback, concurrent source-change refusal and exactly-one concurrent application. They have NOT run locally: PostgreSQL/Docker tools are unavailable. The test file refuses all provider hosts and any database other than loopback `herbalai_test`.
- The full non-database working-tree suite passed 1,069 tests across 79 files in 86.45 seconds, with an unused loopback DATABASE_URL and an empty Gemini key. Eighteen database-dependent suites were explicitly excluded, including the new preparation transaction suite. This broader result includes unrelated existing working-tree tests and is not permission to release those files. After the exact-live-ID assertion was added, the final five-file preparation/coverage/retrieval/embedding-helper subset passed 111 tests and the backend build passed again. No new remote CI, production mutation, real embedding generation or post-update live AI pass is claimed here.

## Release sequence, not a completed deployment

1. Review this small updater bundle separately from unrelated local auth, email, frontend, workflow and fifty-candidate changes. Run the new isolated PostgreSQL suite in CI before considering live application. The older CI pass does not include these files.
2. Run prepare only in the intended backend environment after privately reconfirming its connection. The confirmed provider endpoint is `ep-icy-sound-aqfe958d-pooler.c-8.us-east-1.aws.neon.tech`, database `neondb`; its credential must remain private. The CLI checks the complete public identity set against the connected database and exports a fresh plan/backup without writes.
3. Review exact changed fields and part-specific source/safety limits, record the plan digest, and apply with an active reviewer ID only after all checks pass. A stale plan requires a newly reviewed snapshot/export. Provider or embedding failures must not be bypassed or replaced with zero vectors.
4. Reconcile any ambiguous commit response against the audit log and exact database fields before retrying. Preserve the recovery export securely; restoring original source/vector snapshots requires checking intervening changes.
5. Account for caches: the backend repository cache defaults to five minutes and can be configured; this separate CLI cannot invalidate another running process's memory. Use approved service restart or observed cache expiry, then reload the browser's one-minute request cache. Do not infer deployment from a stale browser tab.
6. Compare all twenty live preparation strings and linked references with the reviewed updates, and verify that all 38 identities, photographs and reviewer/publication metadata remain unchanged. Check named/scientific-name Dr. Ai retrieval, regular and streaming responses, citations and safety fallback using authenticated sessions. Only then mark the live repair complete.

## Separate fifty-herb work preserved

Actual previously verified expansion media remains 37/50. None of these fifty candidates was inserted into the live Library in this follow-up. The source book and modern sources were researched for the next thirty content records, but that work is not silently counted as thirty completed or clinically cleared recipes.

A replacement-photo helper was stopped after slow socket reads; seven fully downloaded source files were preserved outside Git. A subsequent bounded attempt used at most two metadata requests per chunk, twenty-second total transfer deadlines and four workers. One metadata chunk returned empty responses twice, and available photo transfers failed their deadlines. Its completed intake records 27 HELD leads, zero newly completed/reviewed transfers and zero uploads. The seven earlier bytes do not count as fresh metadata clearance or usable covers. No TLS checks were disabled. Raw attempt evidence is `tmp/herb-photo-review/replacement-cover-downloads-2026-10-05.json` in the existing external scratch directory.

Alibangbang's NPDC image link points to a generic site background, not a labelled species photograph; it is not accepted. Smithsonian's Ayapana listing concerns a herbarium specimen and a fresh open returned 404; it is not accepted as a clear living-plant cover. Current rosemary EMA access failed; superseded guidance was not substituted. Existing thirteen missing/replacement covers, remaining-thirty content, new-record duplicate checks, safe DRAFT staging and integrated acceptance remain separate gates. Prior original evidence is retained.
