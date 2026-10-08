# Herb expansion: larger-batch validation and handoff

Date: 2026-10-05 (Asia/Manila). Working branch: `codex/mvp-acceptance-ci`, selective-release-check worktree. This report records observed work, not approval to publish all fifty candidates.

## Current result

- Ten selected, individually CC0-labelled photographs are now uploaded to Cloudinary and verified through their original public delivery URLs.
- Ten educational content drafts retain historical entry/page references, modern evidence distinctions, plant-part cautions and field-level source references. The source registry contains twenty entries. These drafts are not medicinal-content clearance.
- A fresh, unfiltered, read-only Neon result contains 38 Herb rows and 17 SuggestedHerb rows. All fifty research candidates were compared against these 55 recorded identities; the comparison returned zero conflicts for recorded names and supplied synonyms/aliases.
- A separate first-ten draft planner passed regression checks and produced ten proposed DRAFT records. It cannot write to a database or publish anything.
- No new Neon herbs, suggestions, sources or schema were written. No Git commit, push or production deployment occurred. Existing assets, public plant records and unrelated working-tree changes were preserved.
- The same continuation also queried all remaining forty candidates: 69 individual-photo CC0 leads cover 35 candidates; five searches remain unresolved. None of these leads was downloaded, visually reviewed or uploaded. See `HERB_REMAINING_FORTY_PROGRESS_2026-10-05.md` and its nonimportable metadata ledger.

## Media actually uploaded

Cloudinary cloud: `dclqw6at7`; folder: `herbal_ai_herbs`. The earlier two-photo upload increased the folder count from 12 to 14. This continuation uploaded eight more; the widget reported `8 uploaded` and the folder displayed 22 assets afterward. Ten is the total new herb-photo count, not the total folder size.

| Plant | Accepted name used for research | Selected photo ID | Verified original dimensions |
| --- | --- | --- | --- |
| Duhat | Syzygium cumini | 607793783 | 1024 x 771 |
| Sampalok | Tamarindus indica | 580527782 | 1024 x 768 |
| Atis | Annona squamosa | 96588239 | 768 x 1024 |
| Talisay | Terminalia catappa | 264306526 | 1024 x 771 |
| Butterfly pea | Clitoria ternatea | 173979709 | 1024 x 768 |
| Mangga | Mangifera indica | 619870559 | 771 x 1024 |
| Santol | Sandoricum koetjape | 474259100 | 1024 x 771 |
| Papaya | Carica papaya | 174095229 | 768 x 1024 |
| Granada | Punica granatum | 245176628 | 1024 x 981 |
| Chico | Manilkara zapota | 342658687 | 768 x 1024 |

Every original delivery returned HTTP 200 with `image/jpeg`, decoded completely and matched the selected source file's SHA-256. `HERB_FIRST_TEN_PHOTOS_2026-10-05.json` retains exact public URLs, asset/public IDs, creators, observation IDs, individual licences, dimensions and hashes. `HERB_FIRST_TEN_REVIEW_2026-10-05.json` links each selected photo to a botanical morphology reference and the corresponding content draft.

Selection required exact observation taxon, research-grade observation, individual photo CC0 licence, full decoding, a minimum 800-pixel long edge and 600-pixel short edge, and visible features consistent with the cited botanical description. This is visual consistency, not expert specimen authentication, proof of Philippine photographic origin or medicinal safety.

Watermarked alternatives were rejected without removing their marks. Other rejected leads included blurry fruit, distant plants, cluttered imagery and an undersized Papaya derivative. The Santol selection shows trifoliate leaves, not its fruit. No image was generated or retouched. No existing required attribution was removed; provenance remains recorded internally for these CC0 assets.

Proof outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/tmp/herb-photo-review/cloudinary-ten-herb-uploads-2026-10-05.jpg`. Downloaded originals, API responses and delivery-validation results remain in the same scratch directory, not the repository.

## Evidence and publication boundaries

The 1901 book is a historical reference, not modern clinical validation. Its unsafe or unvalidated recipes and doses were withheld. Draft preparation instructions and dosage remain null in the evidence review. The proposed database plan uses explicit withheld-instruction text rather than inventing recipes or numerical doses.

Each draft separates traditional-use reporting, modern evidence and plant-part-specific limitations. Source entries distinguish botanical descriptions from human trials, case reports and preclinical findings. A clear photograph, local occurrence record or food use does not establish medicinal safety.

Talisay still has no reviewed plant-part-specific bark safety source. The planner exposes its warnings as an uncited review note and retains an explicit publication gap; it does not fabricate a supporting citation. All ten retain medicinal-content review gates. No new record is marked verified, DOH-approved or evidence-supported.

The first-ten plan uses `publicationStatus: DRAFT`, `evidenceClass: UNASSESSED`, `isVerified: false`, `isDohApproved: false`, null reviewer metadata and null embeddings. It proposes `Uncategorized`, not an invented therapeutic category. Source and image provenance remain attached to the proposed records. This is a planning artifact, not an importer-compatible production manifest.

## Duplicate audit and staging safeguards

The Neon capture at `2026-10-05T01:13:24.305Z` used an unfiltered UNION ALL SELECT of Herb and SuggestedHerb. All 55 displayed rows were read. The selected target was project `falling-block-62836604`, branch `br-still-waterfall-aqtagztm` (`pre-railway-deploy-2026-09-20`), database `neondb`.

`NEON_HERB_IDENTITY_SNAPSHOT_2026-10-05.json` preserves the selected branch and the all-state result. The fifty-candidate comparison found zero recorded-name/supplied-alias conflicts; the first-ten plan also found zero planned-ID conflicts. This is not an exhaustive discovery of unrecorded synonyms, a concurrency guarantee or independent proof that Railway currently uses that selected branch. The snapshot explicitly keeps Railway binding unverified.

The new planner validates snapshot scope, columns, state values, row counts, duplicate result IDs, review identity, source references, licensed-photo metadata, exact source-photo IDs, cloud destination and image-integrity flags. It detects scientific synonyms, supplied local aliases and intended record-ID collisions. A snapshot older than one hour or future-dated adds a blocker. `writeAllowed` and `publicationAllowed` remain false regardless of the result.

The existing built-in importer checks conflicting local/scientific names in Herb but does not implement this new research queue's complete all-state/synonym/alias comparison. Its upsert/source-replacement behavior is not suitable for feeding unreviewed research drafts. It was neither changed nor run. The queue must not be added to deployment bootstrap.

A future writer must re-read identities inside its transaction and coordinate with competing Herb and SuggestedHerb writers. An advisory lock used only by one importer would not protect it from non-cooperating approval paths. Staging, rollback, rerun idempotency and concurrent-writer behavior still require an isolated PostgreSQL integration environment. Live Neon must not be used as a destructive test fixture.

The existing malformed Approved suggestion 3 remains a separate data-quality backlog. It was not deleted or modified.

## Observed validation

| Check | Observed result | Limit |
| --- | --- | --- |
| Four focused herb suites | 62 tests passed | Local contracts and offline planning, not clinical or SQL approval |
| Five focused herb suites after adding remaining-photo tests | 69 tests passed | Includes seven new metadata/research-boundary checks; not completed photo inspection |
| Broad backend non-database suite | 64 files, 885 tests passed; exit 0 | Seventeen database-dependent suites explicitly excluded |
| Final combined backend non-database rerun | 65 files, 892 tests passed; exit 0 | Includes seven remaining-photo tests; same seventeen database suites excluded |
| Backend build and lint | Both passed; exit 0 | No production deployment implied |
| Standalone strict TypeScript | Planner tests, content tests and CLI passed | Includes noUncheckedIndexedAccess and exactOptionalPropertyTypes |
| Sources page/footer SSR checks | 2 tests passed | Static rendering, not a fresh production UI acceptance run |
| Planner CLI on the actual captured result | Ten proposed draft rows; zero first-ten conflicts; writes/publication false | Saved result is time-specific and cannot execute SQL |
| Planner CLI with --publish or extra --write | Both refused with exit 1 | No credentials or database connection used |
| Fifty-candidate all-state identity comparison | 50 candidates versus 55 rows; zero conflicts | Only recorded identities and supplied aliases/synonyms |
| Cloudinary original delivery | 10 of 10 HTTP/decode/hash checks passed | Responsive transformed delivery and app integration not tested |
| git diff --check | No whitespace errors | Existing Windows LF/CRLF notices; untracked files are not covered by Git's tracked diff |

Focused command: `npm test -- --run tests/herb-expansion-staging-plan.test.ts tests/herb-first-ten-content-review.test.ts tests/herb-expansion-review.test.ts tests/herb-expansion-batch-02.test.ts`.

Read-only planning command, from `herbalaibackend`: `node --import tsx prisma/plan-herb-expansion.ts --snapshot ../Docs/research/NEON_HERB_IDENTITY_SNAPSHOT_2026-10-05.json`.

The broad suite used fixture-only environment values and an unreachable loopback PostgreSQL URL on port 1, not live credentials. Excluded database suites: account-recovery, auth, chat, audited-mutations, herb-governance, knowledge-authenticated-flow, forum-moderation-flow, herb-catalog-remediation, profile, review-publication-transaction, herbs, message-authenticated-flow, password-settings-database, suggestion-validation, system-features, session-rotation and herb-comments-database. Docker, psql and postgres were not available through command discovery. No database test result is claimed.

Raw initial safe-suite output is outside Git at `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/tmp/herb-photo-review/backend-safe-suite.log`. The final combined rerun is recorded separately as `backend-safe-suite-with-photo-leads.log` in that directory: 65 files, 892 tests, exit 0, duration 75.39 seconds.

## Issues reproduced and repaired in this batch

1. A width-only photo size check incorrectly rejected suitable portrait images. It now checks long/short edges without lowering the size threshold.
2. Early draft validation assumed every candidate had a reviewed safety citation. Talisay's missing citation is now represented explicitly as an uncited field and publication gap, not invented evidence or a safety approval.
3. Early identity validation assumed Kew's accepted-name URL and GBIF's checklist-match URL must be identical. Both complementary references are retained; candidate identity and historical entry alignment are checked instead.
4. Strict TypeScript exposed unchecked test-fixture indexing. The fixture now validates record type before changing counts.
5. Regression assertions initially expected one generic gap for all plants. They now preserve each record's actual, potentially more specific review gaps.
6. Two remaining-photo API queries returned empty server replies; one bounded retry each recovered both. A new provenance test initially assumed every lead was JPEG; an observed PNG lead prompted an explicit JPEG/PNG source check, without asserting that the undownloaded file is valid.

## Remaining work, in dependency order

1. Finish first-ten plant-part/content review, including Talisay's uncited safety gap. Keep unsupported dosage/preparation guidance withheld.
2. Confirm the selected Neon target independently against Railway without exposing credentials. Capture identities again immediately before any future write.
3. Implement and test DRAFT-only staging in an isolated database, including duplicate prevention, concurrent approval/import, rollback, source retention and rerun behavior. Do not overwrite existing plant or suggestion records.
4. For cleared drafts, test appropriately sized Cloudinary delivery and source rendering through the existing Library/Dr. Ai flow at desktop and mobile widths before considering publication. Uploaded originals alone do not prove app integration or mobile performance.
5. Complete the remaining forty candidates' historical identity, Philippine occurrence, individual licensed-photo inspection and modern evidence review using the same gates. No remaining candidate is represented as approved merely because a photo lead was found.
6. Review the combined clean production diff and its CI results before proposing a release. Local research, scratch media and credentials must not be mixed into deployment configuration.

Current totals: 50 research candidates, 10 first-batch content reviews, 10 verified uploaded photographs, 0 new staged Neon herbs, 0 newly published herbs. No full-system, physical-device, participant-UAT or clinical-safety result was invented.

Remaining-forty totals: 40 candidates queried, 35 with provisional photo leads, 69 leads, 5 unresolved searches. Seven newly added metadata tests passed with the previous 62 focused tests. A separate final broad rerun now includes all seven: 892 tests passed in 65 files. The earlier 885-test result remains historical and is not an additional independent test count to sum into the final run.

Additional primary-source taxonomy follow-up confirmed two naming discrepancies in the remaining queue and a research-parser limitation for hybrids/subspecies. See `HERB_TAXONOMY_FOLLOW_UP_2026-10-05.md`. The first-ten naming checks are unchanged; the fifty-name snapshot result is not accepted-taxonomy clearance.
