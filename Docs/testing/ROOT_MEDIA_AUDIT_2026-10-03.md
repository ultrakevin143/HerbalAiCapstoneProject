# Root and media audit — 3 October 2026

## Scope and boundaries

This is a read-only inventory/reference/privacy review of the Desktop checkout and the selective-release-check worktree. Only this report, the combined-release proposal and evidence/status appendices were written in the selective worktree. No existing source, image, audio, document, environment file or database was changed, moved, deleted, staged or published.

Desktop root: C:/Users/Hp/Desktop/CAPSTONE PROJECT. Release worktree: C:/Users/Hp/.codex/worktrees/selective-release-check/CAPSTONE PROJECT. Counts below precede the two new reports in this review; ignored dependencies/build/local files are not included in git ls-files counts.

## Checkout separation — important release risk

| Item | Observed state |
| --- | --- |
| Desktop branch/base | codex/readability-accessibility at aae460b8ba45a36bda2f6b44a26cf715597b98dd; 45 commits behind the checked e51942c release baseline. |
| Desktop inventory | 392 tracked paths, 123 nonignored untracked files, 56 tracked diff entries. The 392 include ten paths deleted locally during earlier document relocations; they are not 392 existing files. |
| Desktop untracked groups | .chart-data folders: 4; .github developer tooling: 57; Docs: 44; root files: 3; backend: 11; frontend: 1; scripts: 3. Total 123. |
| Selective branch/base | codex/mvp-acceptance-ci at e51942c35c573438c09a91104a40d4951f36fa50. |
| Selective inventory | 463 tracked paths and 28 nonignored untracked files before this review's reports. Only the accumulated reviewed code/tests/evidence are proposed for publication. |
| Remote baseline | main and codex/readability-accessibility both rechecked at e51942c. |

Do not push, reset, clean or bulk-copy the stale Desktop checkout to publish the new repairs. Its older application source, schema/package edits, untracked migration, local demo tooling and formal-document relocation are a separate review. A blanket git add . could also publish personal media and tool binaries. The clean release proposal is in COMBINED_RELEASE_REVIEW_2026-10-03.md.

## Media inventory and runtime use

Desktop contains 66 existing tracked/nonignored media files in the scanned image/audio extensions: 50 application assets plus 14 QA screenshots, one extra landscape JPEG and one personal MP3. The selective worktree has the 50 application assets and none of those sixteen Desktop-only media files. SHA-256 comparisons found no byte-identical duplicates within either media set. This does not mean differently encoded images are visually different.

The public Railway catalog returned 37 herbs with 37 distinct local image URLs. Every URL maps to a file in the selective frontend public directory. Fifty raw public asset HEAD requests, at concurrency four, returned successful image responses on https://herbalaiph.vercel.app. They cover all 48 tracked public image files plus favicon.ico and icon.svg. No account, mail, Gemini request, signed-in write or production failure was involved. Availability/reference checks are not a botanical identification, licensing or medical-accuracy certification.

| Asset group | Disposition and evidence |
| --- | --- |
| All 37 files under herbalaifrontend/public/images/herbs/ | KEEP. All 37 are referenced by the current live catalog; seeds/import JSON and attribution also retain usage/source information. Do not mistake attribution-only local references for unused assets. |
| herbalaifrontend/app/favicon.ico and app/icon.svg | KEEP. Next automatically discovers metadata icons. The installed Next documentation at node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md confirms this convention; lack of a literal import is not dead-file evidence. Both live routes returned image responses. |
| public/pwa-icon-192.png, pwa-icon-512.png, pwa-icon-maskable-512.png | KEEP. Referenced in the manifest/layout and served successfully. |
| public/images/mount-isarog-forest.jpg | KEEP. globals.css references the current hero backdrop. |
| public/images/lagundi.png | KEEP. Used by About and HomeContributionCta, with additional test/placeholder/document references. |
| Six legacy files listed below | ARCHIVAL CANDIDATES ONLY. No current runtime text reference or live catalog URL was found. Do not delete without checking stored legacy/private URLs and obtaining separate cleanup approval. |

The 37 catalog filenames are: akapulko.jpg, ampalaya.jpg, anonas.jpg, aratiles.jpeg, atsuete.jpg, bawang.jpg, bayabas.jpg, damong-maria.jpg, gabi.jpg, gumamela.jpg, indian-heliotrope.jpg, kamote.jpg, katakataka.jpg, lagundi.jpg, langka.jpg, luya.jpg, luyang-dilaw.jpg, mabolo.jpeg, makabuhay.jpg, malunggay.jpg, mangosteen.jpg, mayana.jpg, niyog-niyogan.jpg, okra.jpg, oregano.jpg, pandan.jpeg, sabila.jpg, saluyot.jpeg, sambong.jpg, sibuyas.jpeg, suha.jpg, takip-kohol.jpg, tanglad.jpg, tsaang-gubat.jpg, ulasimang-bato.jpg, yerba-buena.png and ylang-ylang.jpg. All are retained.

### Possible legacy-image archival — not executed

All paths below are relative to herbalaifrontend/public/images/ in both checkouts:

| File | Bytes | Proposed action |
| --- | ---: | --- |
| bayabas.png | 543918 | Preserve locally; consider archive only after stored-URL review. The active catalog uses herbs/bayabas.jpg instead. |
| sambong.png | 603465 | Preserve locally; consider archive only after stored-URL review. The active catalog uses herbs/sambong.jpg instead. |
| botanical-bg-dark.jpg | 494609 | Preserve locally; candidate old background. |
| botanical-bg-dark.webp | 20152 | Preserve locally; candidate old background encoding. |
| botanical-bg-light.jpg | 798708 | Preserve locally; candidate old background. |
| botanical-bg-light.webp | 88848 | Preserve locally; candidate old background encoding. |

Total 2549700 bytes (approximately 2.55 decimal MB). This is potential asset-size reduction, not a measured build-time/latency improvement and not a reduction in existing Git history. JPEG backgrounds, the two PNG illustrations and the Desktop-only landscape were visually inspected. WEBP variants were reference/hash/availability checked, not separately visually certified. No asset was removed.

## All fourteen QA screenshots — usefulness and privacy

These files are Desktop-only under Docs/testing/. All fourteen were visually inspected. Twelve have documentation references; two lack a matching basename reference in the scoped document scan. An absent reference does not make an image useless or authorize deletion. Raw screenshots remain excluded from the production release proposal.

| File | Existing evidence reference | Privacy/disposition |
| --- | --- | --- |
| LIVE_BADGE_REJECTED_2026-09-30.png | SEPARATE_PUSH_AUDIT_2026-09-30.md | TEST ONLY/admin status evidence; retain. |
| LIVE_COMMUNITY_2026-09-29.png | SELECTIVE_LIVE_RELEASE_2026-09-29.md | TEST ONLY discussion evidence; retain. |
| LIVE_MESSENGER_2026-09-29.png | SELECTIVE_LIVE_RELEASE_2026-09-29.md | TEST ONLY conversation evidence; retain privately and review messaging context before publication. |
| LIVE_NAV_1200_2026-09-30.png | No matching scoped reference | Logged-out header evidence; retain and link only to the original observed check, not a new acceptance claim. |
| LIVE_OAUTH_REFRESH_2026-09-29.png | SELECTIVE_LIVE_RELEASE_2026-09-29.md | Personal account name visible. Redact before public evidence publication. |
| LIVE_OAUTH_SUGGEST_RETURN_2026-09-30.png | SEPARATE_PUSH_AUDIT_2026-09-30.md | Personal account name/avatar visible. Redact before public evidence publication. |
| LIVE_RECOVERY_SIGNIN_2026-09-29.png | SELECTIVE_LIVE_RELEASE_2026-09-29.md | TEST ONLY recovered contributor/suggestion state; retain. |
| LIVE_RELEASE_AUDIT_2026-09-29.png | SELECTIVE_LIVE_RELEASE_2026-09-29.md | Administrator email visible. Redact before public evidence publication. |
| LIVE_RESET_HANDOFF_2026-09-29.png | No matching scoped reference | Reset form with masked fields, no address bar/token visible; retain privately and do not claim it proves completed reset. |
| LIVE_UPLOAD_AUDIT_2026-09-29.png | SELECTIVE_LIVE_RELEASE_2026-09-29.md | Administrator email visible. Redact before public evidence publication. |
| LIVE_UPLOAD_REJECTED_2026-09-29.png | SELECTIVE_LIVE_RELEASE_2026-09-29.md | TEST ONLY rejected image suggestion; retain. |
| LIVE_UPLOAD_REVIEW_2026-09-29.png | SELECTIVE_LIVE_RELEASE_2026-09-29.md | TEST ONLY pending image suggestion; retain. |
| LOCAL_BROWSER_ROLE_DENIAL_2026-09-29.png | LOCAL_BROWSER_CANDIDATE_2026-09-29.md | Synthetic contributor denial; retain with local-only boundary. |
| LOCAL_NAV_1200_2026-09-29.png | OPEN_ISSUES_2026-09-29.md | Local unavailable-session/header evidence; retain with local-only boundary. |

Four screenshots visibly contain personal account details. No plaintext password, visible reset-token URL or provider secret was observed in these rendered screenshot contents. This is not a binary metadata/steganography scan or a general claim that every file is secret-free. Originals were neither redacted nor published; retain raw evidence privately and make reviewed sanitized copies in a separate authorized task.

## Desktop-only files and cleanup proposal

| Files/folders | Classification | Separate proposal, not executed |
| --- | --- | --- |
| mama_rene.mp3 | Personal/non-runtime audio, 248795 bytes; runtime code has no reference. Documentation mentions it only as excluded material. Audio was not played. | Move to an ignored private folder outside the app or repository after approval. Never include in a production commit. |
| public/images/mt-pulag-panorama.jpg | Desktop-only landscape, 470428 bytes. No runtime reference in either checkout; historical reports mention an unreviewed image candidate. | Preserve as a local design candidate. No reason to add it to the current production bundle or change the hero. |
| .chart-data-2NRGvH/ and .chart-data-k8KIad/ | Four generated chart/presentation scratch files, not runtime assets. | Preserve snapshots until presentation reproducibility is reviewed; later archive under an ignored local-only folder. |
| .github/agents/impeccable-*, .github/hooks/impeccable.json, .github/skills/impeccable/ | 57 untracked developer-tool files, including a native executable. The hook references the .github skill path. | Exclude from this production batch. Do not move/delete blindly: that would break tooling; review ignore/disabling policy separately. |
| PRODUCT.md, skills-lock.json, .agents/, .codex/, .impeccable/ | Local product/design/agent configuration; not runtime application code. Several directories are already ignored in Desktop. | Leave active tooling in place and separate it from production commits. Do not overwrite ignored local fixture credentials. |
| Desktop-only backend/scripts and root scripts/setup-defense-demo.ps1, run-demo-auth-rehearsal.mjs | Local demo/setup tooling; some references select an isolated demo database. | Keep local. Never merge demo credentials/URLs into production variables or run a setup script against live Neon. |
| Desktop-only migration 20260928000000_drop_redundant_kb_question_index/migration.sql and schema/package/code edits | Separate unreviewed primary batch; SQL contains a DROP INDEX. | Do not add to this release, apply, rename or delete it without migration-history review. No table was judged useless or dropped by this audit. |

A possible later ignored local folder is WorkspaceArchive/ with personal/, design-candidates/ and chart-scratch/ subfolders. This is only a proposal. It needs an ignore rule and approval before any move; verify exact absolute source/destination paths remain inside the intended workspace or explicitly selected archive. Preserve runtime/document links and never move active agent hooks/configuration into it blindly.

### Existing formal-document relocation — preserve, separate from app release

Ten Desktop paths are deleted relative to its old HEAD but have destination files in Docs. Hash comparison found eight byte-identical relocations:

- HERBAL_AI_TESTING_SCRATCHPAD.md -> Docs/testing/HERBAL_AI_TESTING_SCRATCHPAD.md.
- Herbal_AI_Capstone_Defense_v1.pptx -> Docs/defense/Herbal_AI_Capstone_Defense_v1.pptx.
- output/pdf/Herbal_AI_Capstone_Defense_v1.pdf -> Docs/defense/Herbal_AI_Capstone_Defense_v1.pdf.
- Herbal_AI_SRS_v3.docx, Herbal_AI_SPMP_v3.docx, Herbal_AI_SDD_v2.docx, Herbal_AI_STD_v2.docx and Usecase.pdf -> corresponding Docs/formal/ files.

Two Markdown relocations also contain real text changes: DEFENSE_DEMO_SCRIPT.md -> Docs/defense/DEFENSE_DEMO_SCRIPT.md and PROJECT_ISSUES_TESTS_HANDOFF_2026-09-27.md -> Docs/testing/PROJECT_ISSUES_TESTS_HANDOFF_2026-09-27.md. They are not simple renames. Keep both source history and destinations available for a separate documentation diff/link/visual review. No fresh SRS/SPMP/SDD/STD content compliance or render acceptance is claimed from hash equality. Do not commit only deletions with git add -u or silently discard the destinations.

## Validation limits and next gate

Reference scans covered existing tracked and nonignored text files in each checkout, excluding package lockfiles and generated developer-tool data. They are scoped static scans, not proof about private/legacy database URLs, external links, dynamically constructed asset paths or all ignored files. Live catalog mapping and Next metadata convention checks address two important false-unused cases. All fifty asset HEAD requests passed; no new functional defect was repaired in this review.

The proposed code/evidence bundle received a bounded credential-pattern scan: 35 source/test/CI files and ten pre-existing new reports. One database-URL pattern hit was verified as an intentional error-redaction fixture in error-response.test.ts, not a production credential. No matching provider key, private key or live reset-token URL was found in those proposed files. This is not a comprehensive secret/history/privacy certification. Private Desktop media and eight unrelated evidence diffs remain excluded.

Next gate: approve an exact selective CI-branch release proposal, confirm that branch cannot auto-deploy production, then run all isolated database tests before authorizing the production update. Full SQL/live acceptance remains pending. Cleanup and formal-document reorganization are separate proposals; nothing was removed or pushed.
