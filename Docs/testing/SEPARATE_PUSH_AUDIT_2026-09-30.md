# Separate-push audit — 30 September 2026

Latest code change documented here: `4f69650` on `codex/readability-accessibility`. This note records historical checkpoints; statements such as “not pushed” describe the state at that checkpoint, not the final release state. Local screenshots and private workspace files are not included.

## Release already made

- Commit `01ce64d` was pushed to `origin/codex/readability-accessibility`, **not** `main`, from a clean managed checkout. It contains the OAuth return-path, admin pending-badge, and zoom-navigation fixes only. Backend and frontend GitHub CI jobs passed. The live site displayed desktop navigation at a 1200 CSS-pixel viewport and a compact menu at 390 CSS pixels.
- The live administrator session survived a refresh. A clearly labeled nonmedicinal suggestion, `TEST ONLY — badge QA 2026-09-30`, was submitted from a test contributor session. The admin Suggestions badge and Pending filter showed 1; after rejection with explicit TEST ONLY notes, both showed 0 immediately without a page refresh, and Rejected increased from 7 to 8. Audit Logs showed `REJECT_SUGGESTION` for SuggestedHerb ID 59. The QA record remains rejected in live storage; it was not published. Screenshot evidence is retained locally, not in this Git push.
- The Railway health endpoint returned 200, but a direct Google-auth start with `callbackUrl=/suggest` initially returned only the `googleOAuthState` cookie, not the new `googleOAuthDestination` cookie expected from `01ce64d`. Railway's dashboard showed the revision queued behind its API-degradation incident, then built/deployed it. A later direct request returned both cookies. From live `/signin?callbackUrl=/suggest`, a previously authorized test account completed sign-in, landed at `/suggest` (not `/`), and remained authenticated there after refresh. Screenshot evidence is retained locally, not in this Git push. At this observation Railway's dashboard still labeled the new deployment Deploying while the previous deployment was listed Active, despite the new cookie and behavior already being served; a later commit's Railway status check reported success. No duplicate deployment was triggered.

## Primary checkout boundary

- The primary checkout is at `aae460b`, behind the release branch head `01ce64d`, with 56 tracked changes/deletions and 119 untracked files at inventory time. It was not reset, staged, committed, or pushed. A bulk `git add .` would mix old and new versions of release files and risk regressing the live fixes.
- The untracked set comprises 57 `.github` agent/skill files, 41 `Docs` files, 11 backend files, three scripts, four generated chart files, one untracked frontend image, and three root files (a product note, a skill lockfile, and a personal MP3). These counts are an inventory, not approval to publish each file.

## Proposed separate pushes

1. **Production fixes, after rebase/reconstruction:** cherry-pick only unreleased functional hunks from the primary tree onto `01ce64d` in an isolated checkout. The Cloudinary failure mapping, atomic refresh rotation, and FAQ citation validation/editor are already released. Remaining candidates are comment delivery/deduplication, signup-response validation, and the separate unpaged knowledge-base behavior change described below. Each scope needs its own diff review, focused tests, full guarded suite, frontend checks where relevant, and a matched Railway/Vercel rollout. Do not copy older complete files over the release versions.
2. **Documentation-only organization:** review the moved SRS/SPMP/SDD/STD, use-case, and defense artifacts as actual moves; include only non-private operational/test notes needed by collaborators. Several screenshot evidence files and the testing scratchpad may show accounts or other private context and need visual/content review before a public Git push. Do not publish generated artifacts merely because they reside under `Docs`.
3. **Local-only/excluded:** isolated demo-database scripts and fixtures, generated `.chart-data-*` candidate decks, the personal root MP3, `.github/skills/impeccable` vendored binary/agent material, and `skills-lock.json` unless project tooling truly requires them. Do not publish credentials, `.env` files, or point Railway at the isolated test/demo database.

## Media and migration checks

- The untracked `herbalaifrontend/public/images/mt-pulag-panorama.jpg` has no application reference in a repository text search; current homepage source uses the tracked Mount Isarog image. Exclude the panorama from the next push pending a visual/content decision. This is not permission to delete it.
- The personal root MP3 and `.chart-data-*` files have no app reference and are not runtime assets. Preserve locally; exclude from Git.
- Existing tracked botanical and herb images were not removed. Text-reference absence alone is insufficient to prove an image unused because database/CSS URLs or planned content may refer to it.
- The untracked migration `20260928000000_drop_redundant_kb_question_index` drops an index and matches a local Prisma schema change. It is not needed for the selective fixes; exclude until its query impact and deployment timing are reviewed.

## Remaining acceptance gates

- The `/suggest` Google return path passed in the live test browser after the new cookie appeared. The functional smoke test alone did not prove the dashboard marked that release Active; a later commit's Railway status check reported success.
- Admin badge mutation check passed with a rejected nonmedicinal QA suggestion. Keep that rejected record out of the public catalog.
- Physical phone/tablet checks, five real-participant UAT, formal acceptance, and provider quota/billing checks remain open. No results should be invented.

## Defense preflight continuation

- The non-destructive local `scripts/defense-preflight.ps1` returned **0 failures, 3 warnings**. It found the v2 defense PPTX/PDF, script, SRS/SPMP/SDD/STD, local environment files, Node/npm/Chrome, backend/frontend build outputs, and opened all 15 presentation slides successfully.
- Warnings: local ports 3000 and 5000 were free because the rehearsal services were stopped; the primary checkout remains intentionally dirty and must not be bulk-pushed. These warnings do not indicate a live outage.
- Live Railway `/api/health` and `/api/herbs?limit=1` each returned HTTP 200 after the OAuth fix became observable. The user reports a preliminary phone inspection as "so far so good." Device/browser details, per-check outcomes, and sign-off were not supplied, so the physical-device acceptance sheet remains unsigned; this must not be reported as a completed pass. Five UAT participant forms remain blank, and the five participants are not yet available.

## Reconciliation update

Comparing the primary checkout's working files directly with `origin/codex/readability-accessibility` shows that the Cloudinary failure mapping, refresh-token rotation, FAQ source validation, and source editor are **already in the release branch**. They must not be pushed again from the stale primary checkout. The primary checkout lacks the new OAuth files/tests and would revert the last release if staged wholesale.

At this reconciliation checkpoint, the net unreleased functional differences were: a 500-record cap/error on the unpaged knowledge-base endpoint (behavior change; separately assess callers), `HerbComments.tsx` optimistic comment insertion and Socket.IO deduplication (later released in this note), and stricter signup-response validation in `AuthContext.tsx` (must verify all deployed signup response variants). Other net differences were unused-parameter/import cleanups, plus document/tooling/media organization. These were **candidates** at the time, not an approved production push.

## Comment-delivery candidate review

- In the isolated `01ce64d` release checkout, `HerbComments.tsx` now inserts the posted comment from the successful API response, deduplicates the later Socket.IO event by comment ID, and avoids mutating fetched comment objects while building reply groups. An in-flight initial fetch also retains locally delivered comments absent from its result. The backend's `201` response contains `data.comment`, matching this path. `app/library/page.tsx` keys the component by herb ID so one herb's comments cannot carry into another herb's modal state.
- Frontend ESLint and Next.js production build pass in the isolated checkout. A local browser at `http://localhost:3002/library` loaded the live-backed 37-herb catalog and Akapulko details; as a guest it correctly showed the sign-in prompt and no comments. This is **not pushed**; the primary dirty checkout remains untouched by these code changes. Do not report this as a live fix yet.

### Authenticated comment regression

- The disposable `Herbal Release Test` contributor signed in to the isolated frontend. On Akapulko, TEST ONLY top-level comment ID 27 posted with HTTP 201 and appeared without reload despite the local Socket.IO connection being unavailable (`localhost:5000` refused; live Railway socket rejected the localhost origin). This directly exercised the POST-response fallback.
- TEST ONLY reply ID 28 posted under comment 27 and appeared in the browser; a separate public GET returned both records with the correct parent ID. The browser tool timed out after the reply action, but a fresh browser session and the backend read confirmed it had succeeded. Do not retry a timed-out write blindly.
- Reply 28 and parent 27 were each deleted through their UI controls. The browser returned to the empty-state message; a separate public GET returned zero Akapulko comments. No test content remains in the public herb discussion.
- Socket duplicate-event handling was reviewed in code but could not be exercised from the localhost origin because the live Socket.IO server does not allow that origin. Full page-reload behavior was not separately observed before cleanup; the independent GET established persistence. The candidate still needs a matched release review before any push.

## Local sign-in warning discovered during comment regression

- A previously registered `herbal-ai-static-v1` service worker controlled `localhost:3002` and served cached Next development chunks, including an old `console.error` in the sign-in handler. Expected HTTP 401 logins appeared as a Next.js `Console AxiosError` overlay even after the source changed. One local service-worker registration and one stale cache were unregistered/cleared for this origin; cookies were not cleared. A fresh browser tab then showed only the inline invalid-credentials message, with no console errors or Next overlay.
- In the isolated checkout, the sign-in handler no longer logs expected credential failures, and `PwaRegistration` removes this app's stale service worker/static cache when running in development before reloading an affected page. It also avoids registering the worker during local production previews on `localhost` or `127.0.0.1`; public-site registration is unchanged. The disposable account then signed in and the authenticated comment/reply regression above passed. Frontend ESLint, TypeScript checking, `git diff --check`, and the final Next.js production build pass. No push was made.

### Frontend release-candidate boundary

- Candidate base: isolated worktree at `01ce64d`, matching `origin/codex/readability-accessibility` at review time. Only `herbalaifrontend/app/library/page.tsx`, `app/signin/page.tsx`, `components/HerbComments.tsx`, and `components/PwaInstall.tsx` have content changes. `context/AuthContext.tsx` appears modified because of line endings but has no diff; exclude it from any staging.
- The backend `addComment` route returns HTTP 201 with `data.comment`, including author and likes data, matching the new frontend response handling. The live-backed authenticated browser check exercised parent/reply posting and deletion; the independent GET showed no residual comments.
- Scope is frontend-only. Do not stage the dirty primary checkout, local demo tooling, credentials, generated media, or this audit note as part of a functional release. Do not deploy the isolated demo database.
- Live Socket.IO duplicate-event behavior remains unverified because the local origin is disallowed. An in-flight stale comment GET could transiently restore a just-deleted item until the next refresh; assess this race before treating the comments UI as fully synchronized. Local development service-worker cleanup is deliberately separate from public PWA registration.
- No new commit or push was made during this candidate review. After final checks, propose a separate four-file frontend push and then test comments on the public origin.

### Public comment-release verification

- The user approved the separate release. Commit `f9c257a` contains only the four reviewed frontend files and was pushed to `origin/codex/readability-accessibility`; the primary dirty checkout and line-ending-only `AuthContext.tsx` were excluded. GitHub CI completed successfully, and the commit's Vercel and Railway status checks reported success. The public `/library` returned HTTP 200.
- In the signed-in live admin browser, Akapulko comment ID 29 appeared once after posting. Reply ID 30 appeared once in the posting tab and once in a second already-open tab without reloading, verifying a real-time broadcast on the public origin and no visible duplicate from the POST response plus socket event. This is a narrow comment-delivery test, not a full-system acceptance result.
- Both TEST ONLY records were removed through authenticated same-origin `/api/herbs/comments/:id` DELETE calls after the browser confirmation dialog stalled. Each DELETE returned HTTP 200. A separate public GET returned zero visible Akapulko comments, and the live UI showed its empty-discussion state. No test comment remains published.
- At this checkpoint, the original four-file release was live and the stale-fetch race remained separate work. The physical-device/formal UAT gates remained open.

### Follow-up comment-refresh fix and release

- In the isolated worktree after `f9c257a`, `HerbComments.tsx` now versions local/socket comment changes, ignores older overlapping GET responses, and keeps deleted comment IDs out of delayed responses. This targets the stale-fetch race noted above without changing the API contract.
- The background refetch no longer hides an already loaded discussion. In the local browser against the live API, a controlled failed like request started a delayed GET containing test comment ID 31. The comment was deleted before that stale response was delivered; the UI remained empty afterward. A separate delayed initial GET returned an empty list after posting test comment ID 32; the newly posted comment remained visible. The test used Chrome DevTools request interception and temporarily replaced the local tab's confirm prompt only during deletion, then restored it. This was local frontend testing, not a public deployment of the follow-up.
- Both TEST ONLY records were deleted, and a separate public API GET returned zero visible Akapulko comments. ESLint (zero warnings), TypeScript, Next.js production build, and `git diff --check` passed after the background-refetch adjustment.
- The one-file follow-up was committed as `4f69650` and pushed to `origin/codex/readability-accessibility`; the line-ending-only `AuthContext.tsx` change and the dirty primary checkout were excluded. GitHub CI, Vercel, and Railway checks reported success. A signed-in live browser posted TEST ONLY Akapulko comment ID 33, showed it exactly once, then removed it via an authenticated same-origin API DELETE (HTTP 200). The live UI returned to its empty state, and a separate public GET returned zero visible Akapulko comments. This smoke test did not repeat the controlled timing races on the public origin; those passed locally against the live API before release.
