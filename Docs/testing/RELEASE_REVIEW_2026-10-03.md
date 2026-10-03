# Release-readiness review — 3 October 2026

## Authorization and baseline

The user canceled the 6 October, 8:10 PM Philippine-time schedule and asked to execute the saved next-work plan today. The automation service reported that live-password-acceptance-checks already did not exist. The local automations directory contained no matching configuration. No replacement schedule or new chat was created.

Work uses the existing selective-release-check worktree on codex/mvp-acceptance-ci. Both remote main and codex/readability-accessibility still resolve to 6311d09253aa6ca552306d1d664a29c4ccad624b. GitHub API rechecks confirmed successful runs 36896986949, 36896985705 and 36896648447, and successful Vercel and Railway statuses for that release. Those runs are historical release evidence, not CI for today's uncommitted repairs.

Seven existing local evidence-file diffs and the unrelated Desktop checkout were preserved. No password, reset token, email-provider credential, database URL, production configuration, migration or live data was changed. VPS procurement/migration is a separate requirement discussion, not authorization to buy or move production hosting.

## Reproduced issues and focused repairs

| ID | Severity | Reproduction and evidence | Repair | Current status |
| --- | --- | --- | --- | --- |
| REVIEW-001 | Medium | PasswordSettings casts error messages to strings without runtime validation. Object/numeric/boolean/blank messages or malformed validation details enter feedback state. Thirteen new regression cases all failed on the released implementation; an actual React server render of an object error threw Objects are not valid as a React child. This was controlled locally, not a manufactured production failure. | Select only nonblank string messages; prefer a valid validation detail, then a valid response message, then the existing actionable fallback. Do not change the password flow, cooldown, fields, notifications' positions or visual classes. | Fixed locally; thirteen cases now pass. Not committed or deployed. |
| REVIEW-002 | Medium | The live filtered Lagundi card appeared as a container, not a named keyboard action. Source inspection confirmed the card only had onClick, with no role, tabIndex or keyboard handler. Four of five new source-derived activation cases failed; pointer activation already passed. | Keep the card's div/layout, add a named button role and dialog hint, a tab stop and visible focus outline, and Enter/Space activation that prevents page scrolling. Ordinary navigation keys do not activate it; pointer behavior remains unchanged. | Fixed locally; five cases pass. New suite added to frontend CI. Patched real-browser acceptance remains pending. |

No new high/critical product failure was reproduced within this bounded review. This is not a statement that every route or scenario is defect-free. The library tests execute activation expressions from the actual TSX and verify its actual attributes; they are not a substitute for a patched browser test.

## Automated checks actually executed today

- Before repairs, 150 frontend/deployment native cases passed. After both repairs, the combined eight-file run passed 168 cases: 153 frontend functional cases and 15 deployment-script/configuration cases. Counts overlap; do not add baseline or focused runs to the final total.
- Password-settings focused suite has 56 cases; library keyboard suite has five. The two-suite focused run passed 61 cases. The password failure baseline and keyboard failure baseline were captured before applying the corresponding fixes.
- Selected backend tests passed 421 cases across 50 files with two workers. The process explicitly used an unused loopback herbalai_test URL, log-only mail, no Gemini key and local test JWT secrets. Seventeen database/account-flow suites were excluded because PostgreSQL/Docker is absent locally. No production or demo database was substituted.
- The previously released isolated CI passed 523 backend cases across 67 files. That remains separate historical coverage; today's local run does not establish a fresh database write-flow pass for unpublished changes.
- Backend lint and TypeScript build passed. Frontend ESLint, standalone TypeScript checking and production build passed, with 22 static pages, after both repairs.
- Both current npm audit metadata results reported zero vulnerabilities. This is the registry result for the installed lockfiles, not a security guarantee. Neither lockfile was modified.
- Scoped mechanical detector checks reported no findings for PasswordSettings and the edited library page. Git whitespace checks passed; CRLF conversion notices are not test failures.

Native logs are local temporary artifacts named capstone-backend-review-20261003.log, capstone-feedback-baseline-20261003.log, capstone-feedback-render-baseline-20261003.log, capstone-library-keyboard-baseline-20261003.log, capstone-focused-review-20261003.log and capstone-final-review-20261003.log. Audit JSON files are capstone-frontend-audit-20261003.json and capstone-backend-audit-20261003.json. None is a credential-bearing production export or a file staged for publication.

## Live checks actually observed today

The available browser inventory contained the Codex in-app browser, but no connected Mercado/Gina Chrome profiles or Gmail/admin tabs. A new agent-owned live library tab restored the existing Herbal QA contributor session; no credentials were entered.

- Library loaded 37 published herbs. Searching Lagundi returned one result; pointer activation opened its names, preparation, safety and reference sections. Expanding Sources and references exposed the PITAHC directory link and scope caveat. No herb comment was submitted.
- Account settings showed the expected Herbal-Ai password fields and request-link control with aria-busy=false. Its dialog role and aria-modal=true were present. Tab from the last email action wrapped to Close account settings.
- At a temporary 390-by-844 viewport, document width was 390 and the settings panel height was 796. The panel scrolled to expose Change password and Email a password link, and the text remained within the viewport. The override was restored. This is browser emulation, not a new physical-phone result.
- Suggestions restored the contributor form and My Submissions with zero records. A full reload again restored that protected form and account without requiring sign-in. No suggestion or image was submitted.
- Direct navigation to Admin as that contributor rendered Access Denied. This is a contributor-denial check, not an authenticated administrator dashboard/write-flow test.
- Messenger restored the same contributor, its existing Admin Kevs test conversation and its stored preview. No conversation was selected and no message was sent, edited or deleted; this is sidebar restoration, not a new full messaging lifecycle. The observed tab had no captured warning/error entries at that check. The temporary viewport override was reset and the agent-owned audit tab was closed afterward.
- Anonymous backend health and a one-record public herb-list request both returned HTTP 200 with success status. Healthy requests do not establish outage recovery, load capacity or every authenticated flow.

No new mail request, private password change, used-link redemption, Google authorization or AI prompt was submitted. The user's manual notification audit remains pending unless they provide its exact outcome. The local fixes are not falsely counted as live because the deployed SHA remains 6311d09.

## Caching implementation checked

Frontend cachedApiGet stores successful responses in module memory, deduplicates simultaneous requests and expires entries. Its default TTL is 60 seconds; AuthContext uses two seconds for /auth/me. Login, logout, authentication invalidation and profile updates clear applicable entries. A hard page refresh recreates browser memory, so this does not promise that refresh avoids all requests.

Backend herb-repository caching defaults to five minutes and is invalidated by catalog mutations/publication. User-session lookups have a separate cache keyed by user ID, with a configurable default five-second TTL and session invalidation hooks. These are process-memory caches, not persistent shared Redis storage; a restart or another server instance has its own state. Runtime environment overrides may change these defaults.

Public herb caching also benefits unauthenticated visitors. Therefore the current implementation must not be described as logged-in-only caching. Caching does not replace authorization, mail delivery, database resilience or Gemini quota, and does not guarantee zero lag.

## Root and media hygiene audit

The unrelated Desktop checkout contains 123 untracked paths: four generated chart-data paths in two directories, 57 under .github, 44 under Docs, 11 backend paths, one frontend image, three scripts, PRODUCT.md, skills-lock.json and one personal audio file. It also has existing modified/deleted tracked files, including formal document moves and application edits. Nothing was staged, moved, deleted or copied from that checkout.

A scoped reference scan checked all sixteen untracked media paths against Desktop documentation, app/components/public text and README. Twelve QA screenshots have documentation references. LIVE_NAV_1200_2026-09-30.png and LIVE_RESET_HANDOFF_2026-09-29.png had no reference in that scan; that is not proof of disuse or authorization to delete evidence. The mt-pulag-panorama.jpg image and mama_rene.mp3 audio file are mentioned in historical handoff reports, but no runtime app/component/public reference was found by that scan. The personal audio stays out of a release. Screen captures and the unreferenced image require content/privacy and broader-reference review before any separate publication or cleanup.

The worktree's deployment scripts/configuration, migration files, application assets and technical records were retained. A filenames-only scan cannot justify dropping tables, removing documentation, deleting referenced screenshots or applying the Desktop checkout's entire diff to main. No live database table audit or mutation was performed today.

## Remaining plan gates and release proposal

The historical recovery, Messenger, Dr. Ai and session-cancellation reports were reconciled so superseded local-only notes are not reopened as current defects. The existing requirements matrix and readiness checklist contain older test-count/performance snapshots. Today's record supplements them rather than claiming a fresh formal-document or 500-concurrent-user acceptance. No SRS/SPMP/SDD/STD revision or invented participant result was produced.

Pending independently: user-completed password notification/change/old-versus-new acceptance; selected Google-linked account/inbox availability; authenticated administrator review/audit writes; fresh authorized suggestion/image/moderation lifecycle; patched browser keyboard/error checks; broader Community/Messenger/Dr. Ai live acceptance; controlled hosting/provider cancellation and capacity boundaries; full media-content/root cleanup review; and formal requirements traceability updates. Historical checks remain historical. The user previously declined the participant campaign; it was not started or invented.

Proposed production repair files are PasswordSettings.tsx, library/page.tsx, password-settings.test.mjs, library-accessibility.test.mjs and .github/workflows/ci.yml, plus this report and the plan's execution-date note if reviewed. There are no backend/migration/environment changes. Run fresh isolated CI and patched browser acceptance before release; after authorization publish only the reviewed batch and recheck live messages and Enter/Space card activation. Keep the current deployment as rollback baseline. Do not include unrelated existing evidence diffs, fixtures, personal media or credentials.

No new commit, push, deployment or automatic publication occurred during this review.
