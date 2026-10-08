# Held herb cover integration — 7 October 2026
Status: HELD. This supersedes the media-integration checkpoint in HERB_SOURCE_MEDIA_CONTINUATION_2026-10-07.md. It is not a publication or import approval.
Subsequent source checkpoint: HERB_BALIBAGO_TKDL_CONTINUATION_2026-10-07.md records the separately cited Balibago traditional description. Counts below remain this cover-integration run's historical results.

## Completed
- Linked the previously uploaded Abutilon indicum and Kabiki originals to their existing held field drafts through HERB_COVER_INTEGRATION_2026-10-07.json.
- Added a reusable, read-only ownership validator: queue/candidate identity, exact species, per-photo CC0 receipt, observation/asset identity, unchanged source/delivery hashes and dimensions, decoded originals, visual exclusions and ordered receipt timestamps.
- The checker still rejects unsupported draft URLs. The follow-up cannot replace an existing audit cover, invent a creator, authorize retouching, or clear medicinal, botanical or publication holds.
- Kept the historical fifty-herb audit and two-upload receipt unchanged. Their earlier thirteen-cover/zero-integration counts are historical, not stale evidence silently rewritten.
- Updated only the two held draft photo/provenance fields. Kabiki still lacks an established preparation method. Abutilon's existing combined-part laboratory description remains unchanged and is not a home recipe.
- Follow-up photo research now starts from the eleven remaining missing covers and excludes all seven newly inspected originals. No new research searches or uploads ran in this batch.

## Current counts
| Check | Observed result |
| --- | --- |
| Held field drafts | 50 |
| Descriptive core fields present with preparation evidence | 44 |
| Partial content drafts | 6 |
| Selected covers, including two ownership-bound follow-ups | 39 |
| Missing selected covers | 11 |
| Secondary identity holds | 2 |
| Live public catalog at 2026-10-07T00:32:29.467Z | 38 |
| Current public stored-name conflicts | 0 |
| Cleared for publication | 0 |

These are editorial/media counts, not forty-four safe medicinal recipes or thirty-nine expertly authenticated specimens. A later direct checker run at 00:32:57.768Z returned intentional exit 2, identical counts and no stderr. The earlier full-output PowerShell/npx capture propagated exit 1 despite complete held JSON; no live API failure was observed.

## Validation
- 566 distinct targeted tests passed in 34 files, including 46 media follow-up regressions. The 46-test file passed again after making receipt assertions tolerant of checkout line endings; it is not counted twice.
- Backend no-emit type check, strict CLI/changed-test type check, targeted ESLint and scoped Git whitespace checks passed.
- Regressions cover absent/mismatched ledgers, altered species/photo/asset/URLs/hashes/dimensions, duplicates, rejected originals, unauthorized licenses/creators, synthetic or retouched images and attempts to replace earlier selected covers.
- Docker, psql and postgres remain unavailable. No real isolated import, rollback or concurrent-duplicate test ran. Mocked RAG/unit results are not a new full live MVP acceptance.
- Full commands, historical receipt fingerprints and boundary flags are in HERB_COVER_INTEGRATION_VALIDATION_2026-10-07.json. Public counts and fifty compact row summaries are in HERB_COVER_INTEGRATION_PUBLIC_PREFLIGHT_2026-10-07.json.

## Next work
1. Resolve source-backed occurrence/identity for Lokoloko; exact-species preparation gaps for Santan, Kabiki and Balibago; and unestablished food-processing/safe-quantity details for Oxalis corniculata and Kastuli. Do not fill gaps with invented recipes or animal/solvent doses.
2. Review permitted exact-species replacement covers for Lokoloko, Alibangbang, Kupang, Nipa, Bottle gourd, Balibago, Asana, Kamias, Kahel, Kastuli and Ayapana. Recheck individual permissions/delivery before actual publication; saved upload checks are not permanent clearance.
3. Resolve identity, category and accountable human content/safety review. Preserve source limitations and unavailable medicinal instructions.
4. Obtain a recoverable target-specific backup and independently targeted, all-state private comparison. Implement an idempotent guarded import only with isolated PostgreSQL rollback/concurrency tests and transactional duplicate checks.
5. Publish only eligible, actually reviewed educational records. Then verify public content/photos/citations, approved embeddings and a small bounded Library-to-Dr. Ai retrieval check. No provider spam.
6. Continue the separate existing-38 remediation in LIVE_HERB_COMPLETENESS_2026-10-07.md. This batch did not repair or republish those live rows.

No commit, push, Neon write, new Cloudinary upload, authentication change, frontend styling change, credential access, embedding update or AI-provider request occurred. Unrelated working-tree changes were preserved.
