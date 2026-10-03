# Library moderation and reply retention — 3 October 2026

## Manual continuation and release hold

The user reported that the scheduled 1:03 PM continuation did not run and requested starting the plan here. The missed one-time automation capstone-combined-mvp-repairs was deleted successfully to avoid a duplicate continuation. This report does not diagnose the scheduler or claim that an automatic run occurred.

Work continued in the selective-release-check worktree on codex/mvp-acceptance-ci. Earlier unpublished B01–B08 repairs and unrelated document changes were retained. No file was staged, committed or pushed. Main and codex/readability-accessibility still matched e51942c35c573438c09a91104a40d4951f36fa50. No live record, password, email, role, media, credential or database configuration was changed.

## B09 — Library administrator deletion audit and duplicate-action integrity

Priority: medium. Scope: Library comments, not Community forum moderation.

Observed baseline: HerbController.deleteComment directly hard-deleted the comment and emitted comment_deleted. It never wrote an administrator audit entry. It also did not distinguish an already soft-deleted target or a competing deletion after its lookup. In the controlled HTTP suite, seven new assertions failed and 65 passed across 72 cases before repair. Existing current-database-role demotion behavior already passed and is not reported as a newly repaired authorization bypass.

Focused repair:

- Add deleteHerbComment in herb-comment.repository.ts, using the existing runAuditedMutation helper for administrator actions and a Prisma transaction for contributor self-deletion.
- Validate existence, isDeleted and author/administrator authorization inside the transaction. Delete conditionally; zero affected rows produces 404 rather than a duplicate success/audit/broadcast.
- Add the existing audit target vocabulary entry HerbComment; the database targetType is already a string, so no migration is required.
- Administrator deletion writes action DELETE_HERB_COMMENT with targetId and details.herbId in the same transaction. No deleted comment body, password, token or inbox address is copied into the audit.
- Contributor ownership checks remain and do not fabricate an administrator audit entry for a normal author action. Middleware still supplies the current database role rather than trusting a stale role in the JWT.
- The controller broadcasts only after successful completion. An audit failure is a failed request, not a successful deletion acknowledgement. Actual database rollback is an isolated-PostgreSQL gate, not proven by the mock.

Production locations: herbalaibackend/src/controllers/herb.controller.ts, src/repositories/herb-comment.repository.ts and src/repositories/audit.repository.ts.

## B10 — immediate reply retention after parent deletion

Priority: medium. Scope: behavior only; no JSX, classes, colors, typography, layout or visual copy was changed.

The database schema already preserves replies by setting their parentCommentId to null when the parent is hard-deleted. The component instead removed only the parent from local state. Its top-level grouping then omitted the retained reply because that reply still pointed at the removed parent. A reload could restore it; this was an immediate display mismatch, not proof that the database lost the reply.

A baseline using executable callbacks extracted from the actual component reproduced four failures in five cases: realtime parent deletion, duplicate deletion, a delayed reply to a removed parent and deletion of a reply with a child. The existing deleted-parent resurrection guard passed.

Focused repair:

- A shared reconcileDeletedComments helper removes known-deleted records and promotes direct children of deleted parents to roots, matching SetNull.
- Local confirmed deletion and realtime deletion use the same removeComment callback. A removed reply target closes that composer without clearing the stored reply text.
- Delayed new-comment events and fetched snapshots use the same reconciliation so a stale parent relationship cannot hide the retained reply or resurrect a removed parent.
- Existing mutation-version and fetch-sequence safeguards remain. No new route or socket event format is required.
- Failed deletion and canceled confirmation leave the discussion and draft state intact.

Production locations: herbalaifrontend/components/HerbComments.tsx and herbalaifrontend/lib/library-discussion.ts. The bundled Next use-client guidance and scoped frontend instructions were read before editing. Impeccable context/hardening guidance was applied to this bounded behavior fix; the mechanical detector reported no findings on the two changed frontend source files. No broad styling change was performed.

## Executed local validation

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Library controlled HTTP suite | 72 passed after repair | Actual Express routes/session-role checks/controller/repository/audit helper; persistence and sockets intercepted. |
| Library native callback/helper suite | 12 passed | Actual TSX callback extraction and shared helper execution, including stale fetch, delayed/duplicate events, retained grouping and confirmation/error handling. Not a mounted browser campaign. |
| Combined backend non-database run | 595 passed across 58 files; 0 failed | Includes accumulated B01–B10 local code. |
| Combined native/frontend/deployment harnesses | 255 passed across ten scripts; 0 failed | Includes the 12 Library cases. Do not add overlapping focused counts to this total. |
| Backend ESLint and TypeScript build | Passed | Production source. |
| Frontend ESLint and standalone TypeScript | Passed | Includes component and shared helper. |
| Frontend production build | Passed, 22 static pages | NEXT_PUBLIC_API_URL was process-local loopback port 1; no live API/database was used as a build fixture. Deployment must rebuild normally from reviewed source, not reuse this local .next artifact. |
| Git whitespace check | Passed | LF/CRLF notices are not failing checks. |
| New database moderation/reply cases | Added, not run locally | Four cases added to the prior five-case guarded Library database suite; nine total pending. |
| Remote CI / patched live acceptance | Not run | No commit/push/release authorization was inferred. |

The backend run used dummy loopback port-1 DATABASE_URL/DIRECT_URL, test mode, log-only mail and no Gemini key. The same seventeen database-dependent files listed in LIBRARY_DISCUSSION_REGRESSION_2026-10-03.md were excluded. No Docker/psql command was available. The isolated Library suite requires loopback herbalai_test and refuses other databases.

The four added database cases verify administrator audit plus SetNull reply retention, concurrent deletion returning exactly one success and one 404 with one audit, contributor self-deletion without an administrator audit, and audit-insert failure rolling back both parent deletion and reply detachment. Fixtures and cleanup use exact unique test IDs. These are prepared tests, not observed PostgreSQL outcomes. The earlier reaction concurrency/rollback and verification-resend database cases remain separate pending gates.

## Current live baseline

Anonymous read-only requests observed Railway /api/health=200 and the Vercel /library page=200 on the unchanged release. No browser session was commandeered, no live comment was removed and no administrative action was tested. These checks establish reachability only and do not validate B01–B10 on production.

## Root/media inventory — read-only follow-up

The Desktop checkout currently has 123 untracked files, including 16 media files. A filename-reference scan found documentation references for twelve QA screenshots; none were runtime imports in the scanned app/components/lib/backend-src folders. LIVE_NAV_1200_2026-09-30.png and LIVE_RESET_HANDOFF_2026-09-29.png had no documentation reference in that scoped scan. mt-pulag-panorama.jpg and mama_rene.mp3 had historical documentation mentions but no scanned runtime reference. A full-path-only scan missed the basename screenshot references; the corrected basename scan was used for these conclusions.

Retain referenced evidence. Do not infer that an unreferenced image is useless or safe to delete. Keep personal audio and unreviewed screenshots/media out of the production batch. Content/privacy inspection, broader references, formal-document moves and a separate cleanup proposal remain pending. Nothing was moved or deleted, and no live database-table audit/drop was performed. The inventory does not establish SRS/SPMP compliance or make the formal documents current.

## Next gates and selective files

Additional files beyond earlier batches:

- herbalaibackend/src/repositories/herb-comment.repository.ts
- herbalaibackend/src/repositories/audit.repository.ts
- herbalaifrontend/components/HerbComments.tsx
- herbalaifrontend/lib/library-discussion.ts
- scripts/library-discussion.test.mjs
- This report; updated plan/ledger follow-ups.

The existing accumulated HerbController and herb-comments-http.test.ts/herb-comments-database.test.ts also changed. There is no new dependency, schema, migration or production variable change. Preserve the earlier selective batch lists, and exclude the eight unrelated existing evidence-document diffs and the Desktop checkout's unrelated local files unless reviewed separately.

Next functional audit: parent removal/publication changes between validation and insertion, reaction/deletion overlap and realtime consistency/audience boundaries. These are candidates to reproduce, not declared repaired or failed live. After the combined selective review, full isolated PostgreSQL CI is required before publication. Patched browser acceptance, conditional authorized live acceptance, exact private-password checks and physical/participant evidence retain their separate limits. Participant UAT remains deferred, not invented. See NEXT_WORK_PLAN_2026-10-03.md for phase status.
