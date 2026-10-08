# Next-work plan — 3 October 2026

## Start time and boundaries

Requested start: today, 3 October 2026 at 1:03 PM Asia/Manila (05:03 UTC), continuing this chat once. This is the start of the work, not a promise to finish every gate at that time.

Workspace: C:/Users/Hp/.codex/worktrees/selective-release-check/CAPSTONE PROJECT, branch codex/mvp-acceptance-ci. Preserve existing uncommitted repairs and unrelated files. The user explicitly requested that fixes be documented and held for one later combined push. Scheduling this work does not authorize a commit, CI-branch push, production release, migration or live account change.

Read MVP_BACKLOG_AUDIT_2026-10-03.md and LIBRARY_DISCUSSION_REGRESSION_2026-10-03.md first. Reconcile earlier reports using their latest release follow-ups, not superseded local-only statements. The current checked release baseline is e51942c35c573438c09a91104a40d4951f36fa50; recheck rather than assume it is unchanged.

## Known starting state

- Batch 1: suggestion mutation ID validation, bounded Cloudinary uploads, verification-resend delivery ordering and resend request validation. Local, unpushed.
- Batch 2: Library comment/reply validation, publication visibility, reaction transaction/count wiring and best-effort realtime acknowledgements. Local, unpushed.
- Latest combined local results: 587 backend non-database tests in 58 files and 243 native harness tests passed; backend lint/build and whitespace checks passed.
- Full database acceptance has not been run for these batches. Seventeen database-dependent files were excluded locally. The five new Library concurrency/rollback cases require isolated PostgreSQL.
- Library admin comment deletion lacks an audit write in the current source. Immediate parent deletion/reply retention and creation/publication timing remain audit candidates, not completed fixes.
- Prior live tests and user password/phone reports are evidence with their recorded limits. They are not a fresh complete acceptance of unpublished changes.

## Ordered work

### 1. Library moderation audit integrity — first

Reproduce administrator deletion without a corresponding audit record using controlled routes/persistence. Review current database-role checks, contributor ownership, missing/deleted targets, repeated requests and permission errors. Repair the smallest supported workflow so moderator mutation and its audit record cannot commit separately. Keep audit scope consistent with existing administrator actions; do not log passwords, tokens or unnecessary private content. Add rollback, authorization and duplicate-action regressions, plus isolated database cases where required. Document the baseline and final executed results.

### 2. Parent deletion and reply retention

Reproduce deleting a comment with replies and compare immediate client state, realtime recipients and reloaded database state. The schema currently uses SetNull for retained replies. Choose the smallest coherent behavior without redesigning the interface or silently discarding replies. Cover nested/orphaned replies, unauthorized deletion, duplicate/delayed events and reload reconciliation. Read applicable frontend instructions/skills if client behavior needs editing; preserve visual styling.

### 3. Remaining Library timing and realtime boundaries

Check parent removal or herb publication changes between validation and insertion; reaction/deletion overlaps; hidden/deleted targets; realtime audience scope and stale event order. Treat these as hypotheses until a reproducible test fails. Prefer a shared focused helper where it genuinely reduces repeated logic, not a broad controller rewrite. Keep successful response and existing route/event compatibility. Do not imply local mocks prove SQL locking or hosting transport behavior.

### 4. Reconcile and scan the remaining MVP backlog

Review authentication, email verification/resend, password settings/recovery, Google plus local-password linking, suggestions/revisions/review, Library, Community, Messenger, notifications, administrator audit and Dr. Ai. Prioritize authorization, accidental private-data disclosure, partial writes, duplicate actions, invalid IDs/input, recovery/draft loss, pagination and cache/account isolation. For each new confirmed defect use: failing reproduction, focused repair, regression, result and remaining gate. Do not repeat passed email/password cycles or treat a forgotten old password as an application defect. Separate actual failures from performance/provider limits and unavailable manual evidence.

### 5. Combined local validation and isolated-database gate

Review the complete selective diff across both batches and any new repair. Run focused tests first, then the combined non-DB/native suites, source lint/typechecks/builds and whitespace checks appropriate to edited code. Use dummy loopback credentials, intercepted/log-only mail and safe local fixtures. Run real database suites only against an isolated test database, never live Neon or a demo database used by production. Validate verification-token ordering, transactional rollback, same/different-user concurrent reactions, moderation audit atomicity and reply retention. If PostgreSQL remains unavailable locally, document a blocking release gate and prepare exact CI commands; do not automatically push just to trigger CI. Capture counts, exclusions and actual errors, without summing overlapping runs.

### 6. Root, media and documentation review — separate from production fixes

Inventory the Desktop checkout read-only and compare it with the selective worktree. Review untracked media contents/privacy and runtime/document references before classifying a file as removable or archival. Preserve referenced screenshots and deployment/runtime assets. Keep personal audio, credentials, local demo tooling and unreviewed academic documents out of the production batch. Inspect schema/code/migration references before proposing any obsolete database table; do not drop tables, delete media, move formal documents or publish personal content automatically. Produce a separate cleanup proposal with exact paths and reasons.

### 7. Combined release proposal — approval required

Prepare the exact production-source, regression and evidence file list; exclude unrelated changes and private/local-only material. Recheck remote refs and migration requirements. Specify isolated CI, reviewed release order, Vercel/Railway health/version checks and rollback to the previously healthy commit. Stop before staging/committing/pushing/deploying until the user authorizes the exact combined batch. Full isolated CI must pass before production publication; a local build is not a replacement for the DB gate.

### 8. Post-release acceptance — conditional on approved publication

Prepare and then execute only authorized bounded checks:

- Signup, Gmail delivery, verification, expired/used-link rejection and resend feedback; no intentional mail outage or repeated unnecessary sends.
- Disposable-account password change/recovery: current/old/new comparison, one-time link, cooldown, previous-session revocation, refresh persistence and role access. User enters and submits new passwords privately. Do not change the administrator password again.
- Explicitly selected Google account: setup-link request and delivery, user-created app password, email/password login, continuing Google login on the same account and used-link rejection. This does not change the Google password.
- Suggestion owner submit/revise/resubmit, reviewer changes/reject/audit and upload handling. Approval-to-Library needs an explicitly approved, genuinely sourced plant; never publish synthetic QA herbs.
- Library comments/replies/reactions/moderation/audit and reload agreement; retain test IDs and disposition. Do not delete real user content or ban users without scoped authorization.
- Community, Messenger, notification/audit visibility and healthy cited Dr. Ai answers/cancellation; safe tab-resume checks where available. Do not cause production outages, exhaust quotas or manufacture a large public dataset.

Record actual browser/account/outcome evidence. A disconnected session or incomplete private-password action remains pending. Read-only baseline health checks may proceed before release, but cannot validate unpublished repairs.

### 9. Defense/documentation handoff

Update factual requirements-to-feature-to-test traceability using the actual SRS/SPMP and prior records. Prepare inputs for SDD and STD: architecture/authentication/mail/RAG/cache/data flow, changed components, test cases/results, releases, rollback and known limits. Keep requirements separate from implemented behavior and empirical results. List user-reported physical-phone checks as self-reports; do not substitute emulation for physical evidence. Participant UAT was deferred by the user: preserve the prepared handoff, record it as unperformed and do not invent five participants or signed results. Hosting/VPS/domain migration is a separate decision, not part of this unapproved release.

## Completion and reporting rule

Use a live ledger with status, priority, exact files, reproduction, repair, local/CI/live outcomes and blockers. Notify only on meaningful fixes, reproduced failures, completed checks or required action; stay quiet on unchanged/non-actionable state. Never declare the entire system defect-free from a bounded audit. Remove the one-time continuation automation after its run, leaving this plan and accumulated fixes available for future work.

## Manual start and current phase status

The user reported that the scheduled continuation did not run and requested manual work. The one-time automation was successfully deleted to avoid duplicate work. The reason it missed its run was not diagnosed. See LIBRARY_MODERATION_REPLY_RETENTION_2026-10-03.md for executed evidence; earlier scheduled wording is historical, not a claim that an automatic execution occurred.

| Phase | Current status |
| --- | --- |
| 1. Moderation audit integrity | B09 locally repaired; 72 controlled HTTP cases pass. Real transaction/audit rollback and concurrent-delete SQL cases pending. |
| 2. Reply retention | B10 locally repaired using shared reconciliation; 12 actual callback/helper cases pass. No mounted browser/physical-device acceptance claimed. |
| 3. Timing/realtime boundaries | Next functional audit. Candidate parent/publication timing and event-order/audience cases are not declared fixed. |
| 4. Remaining MVP scan | Prior evidence reconciled; Library auth/ownership/demotion reviewed in this batch. Whole-system audit remains incremental, not complete. |
| 5. Combined validation | 595 non-DB backend and 255 native cases pass; both applications lint/typechecks/builds pass. Seventeen DB-dependent files excluded; no local PostgreSQL/Docker available. |
| 6. Root/media review | Read-only inventory/reference follow-up completed: 123 untracked files, sixteen media, twelve referenced QA screenshots. Content/privacy inspection and cleanup proposal pending; nothing removed. |
| 7. Release proposal | Accumulated selective lists preserved; no staging/commit/push. Requires exact-batch user authorization and isolated CI before production release. |
| 8. Post-release acceptance | Pending approved deployment; baseline live health/Library reads passed on unchanged e51942c, not on the unpublished fixes. |
| 9. Defense handoff | Repair evidence/limits updated; formal SRS/SPMP/SDD/STD content traceability remains to be reviewed. Participant UAT deferred and physical-phone report retains its self-report boundary. |

Continue from phase 3, while treating isolated SQL CI and conditional live/private-password checks as separate release gates. Do not publish the process-local loopback .next build artifact or copy local fixture settings into production.

## Phase 3 follow-up — transaction-time eligibility

See LIBRARY_TIMING_GUARDS_2026-10-03.md. B11/B12 add transaction-scoped Herb/parent FOR SHARE eligibility guards, shared publication locking for reactions and a publication predicate in the read itself. Five controlled baseline failures were repaired; 80 Library HTTP cases and fresh combined 603 non-DB backend / 255 native cases pass. Backend lint/build and whitespace checks pass. The Library PostgreSQL suite has thirteen prepared cases, all locally unexecuted; its status mapping was corrected and CI now invokes native reply retention. No frontend styling/source edit, live write, commit or push occurred.

Phase 3 is partially complete, not closed: next examine delayed/out-of-order Library realtime payloads and reaction/delete/snapshot reconciliation. Phase 5 still requires full isolated SQL CI; seventeen database suites remain excluded locally. Anonymous live availability passed on unchanged e51942c, not on these unpublished fixes. Phases 6–9 and the selective release hold remain as documented above.

## Phase 3 follow-up — realtime recovery

See LIBRARY_REALTIME_RECOVERY_2026-10-03.md. Six controlled native failures were repaired as B13–B15: canonical invalidations/reconnect recovery, single-flight reactions without stranded optimism, and duplicate-creation mutation-version protection. Current focused Library totals are 33 native and 81 controlled HTTP cases. Fresh combined totals are 604 non-DB backend / 276 native cases, zero failed; both applications lint/typecheck/build pass. Styling is retained; new pending attributes do not redesign controls. Backend reaction events add compatible herb scope. No live write, commit or push occurred.

The bounded phase-3 source/callback audit is documented; mounted/transport and isolated SQL acceptance remain pending, so phase 3 is not a universal concurrency sign-off. Continue phase 4 with cache/account isolation and notification invalidations using reproducible cases. Phase 5 still requires seventeen database suites (thirteen Library cases included), selective review and later authorised release. Anonymous live health passed on unchanged e51942c. Root/media review, formal traceability and conditional manual gates remain separate; do not deploy the loopback .next artifact.

## Phase 4 follow-up — notification/account recovery

See NOTIFICATION_CACHE_RECOVERY_2026-10-03.md. B16–B18 locally repair owner cache/lifecycle boundaries, canonical unread/read mutation reconciliation and socket/tab recovery. Ten baseline failures were reproduced; all 68 focused cases now pass. Fresh combined totals: 604 non-DB backend and 311 native cases; zero failures. Frontend lint/typecheck/build pass and 34/34 notification class expressions are unchanged. The new actual loopback reconnect check passes with synthetic credentials and controlled canonical reads; mounted authenticated live acceptance remains pending. Existing Library queue semantics are preserved through a shared coordinator.

Continue with notification HTTP input boundaries: reproduce strict action-ID and bounded pagination candidates before a focused repair. Existing ownership predicates must remain unchanged. Phase 5 still requires full isolated SQL CI (seventeen locally excluded files), reviewed selective publication and authenticated post-release checks. CI's added loopback test dependency installation uses existing lockfiles; no package change or live database is needed. Anonymous Library/health passed on unchanged e51942c, not the unpublished fixes. No staging/commit/push. Root/media and academic traceability remain pending separate phases; manual/participant evidence limits are unchanged.

## Phase 4 follow-up — notification HTTP boundaries

See NOTIFICATION_API_BOUNDARIES_2026-10-03.md. B19/B20 locally repair strict positive Int IDs and canonical list limits 1–100 while preserving default 30, owner-scoped persistence, cookie/bearer authentication, unread totals and failure/no-op contracts. Thirty baseline failures were reproduced; the final seventy-seven controlled HTTP cases pass. Fresh combined totals: 681 non-DB backend and 311 native cases, zero failures. Backend lint/typecheck/build pass. No frontend/style/dependency/schema/production-variable change and no live write, staging, commit or push.

Next bounded audit: administrator audit-log limit/offset parsing, starting with actual-route controlled reproduction and existing role/demotion/session boundaries. Do not assume or claim a defect until tested. Phase 5 still requires all seventeen locally excluded SQL suites in isolated CI and exact selective release approval. Anonymous Library/health passed on unchanged e51942c, not these accumulated repairs. Root/media review, academic traceability and conditional live/manual gates remain separate; preserve the physical-device self-report and deferred participant status.

## Phase 4 follow-up — administrator audit pagination

See ADMIN_AUDIT_PAGINATION_2026-10-03.md. B21/B22 locally repair strict audit limit/offset validation with unchanged defaults (50/0) and explicit bounds (1–100 / 0–10000). Fifty-one baseline failures were reproduced; seventy-eight audit cases now pass. The focused audit/notification total is 155. Fresh combined totals: 759 non-DB backend and 311 native cases, zero failures. Backend lint/typecheck/build pass. Authentication/role/demotion/session/failure protections were retained rather than newly invented; no audit record, credential, role or frontend/style changed.

Next, review the accumulated selective release bundle and perform the pending root/media/reference inspection read-only. Classify local/private/generated files separately; do not delete evidence images or stage unrelated changes. Phase 5 still requires seventeen excluded SQL suites in isolated CI and explicit release authorization. Anonymous audit 401 and Library/health 200 passed on unchanged e51942c; they do not validate unpublished fixes. No staging/commit/push. Root cleanup proposals, academic traceability and conditional signed-in live/manual acceptance remain separate; preserve deferred participant and physical-device self-report limits.

## Phases 6–7 follow-up — read-only inventory and exact proposal

ROOT_MEDIA_AUDIT_2026-10-03.md classifies all fifty application assets and sixteen Desktop-only media; fourteen QA screenshots were visually reviewed, with four personal-detail redaction gates and two missing documentation links. All fifty live image routes passed HEAD checks; the public catalog's thirty-seven image paths exist locally. Six legacy image candidates remain intact. Desktop is forty-five commits behind the release baseline; its 123 untracked files, formal-document moves, demo tooling and unrelated code are not part of this batch. No existing file was moved/deleted or credential/provider changed.

COMBINED_RELEASE_REVIEW_2026-10-03.md freezes the proposed forty-seven-path source/test/CI/evidence list and eight unrelated evidence exclusions. No new runtime fix or repeated suite count is claimed; latest combined execution remains 1070 passing cases. Next action needs exact authorization for an isolated CI-branch publication, with provider production-branch settings checked before any push. All seventeen SQL suites must pass isolated CI before a separate production release approval. Cleanup/redaction/document relocation and formal traceability remain distinct tasks; conditional authenticated live/manual acceptance is not already complete. Index empty and publication hold remains active.

## Phase 5/7 follow-up — CI coverage and observed provider branches

B23 adds the two missing deployment-regression commands to CI and a coverage assertion. One baseline failure, sixteen focused passes and a fresh full native run of 312 passing cases are documented in CI_RELEASE_PREFLIGHT_2026-10-03.md. No application styling/source change; seventeen database suites still need actual isolated CI. Both production providers were inspected read-only and watch codex/readability-accessibility, while Vercel's CI branch is Preview. Railway Wait for CI is off; do not update production until full CI passes. Trial continuity is a separate owner action, not a diagnosed application outage or a billing change.

The exact selective proposal is now forty-nine paths, superseding the preceding forty-seven. Publication still requires explicit authorization; no index/commit/push/provider/database mutation occurred. Next: approve the reviewed CI-only commit/push, observe both jobs including PostgreSQL, repair any actual failure without excluding required suites, then propose production release separately. Preserve excluded documents and physical-device/participant/manual result boundaries.

## Phase 5/7 follow-up — approved CI-only publication passed

The user authorized exactly the forty-nine-file bundle to codex/mvp-acceptance-ci. Commit e6b774a39d56d6116da26350f87c4483e92d8cd3 was successfully pushed only to that branch. GitHub run 37113901921 passed both jobs: 872 backend cases in 77 files and 312 native cases, total 1184; migrations, lint/typechecks and frontend build passed. All seventeen formerly excluded database suites (113 cases), including thirteen Library SQL cases, now have executed isolated CI evidence. See CI_RELEASE_PREFLIGHT_2026-10-03.md; earlier pending-SQL statements describe historical local limitations, not the current CI gate.

At that CI-only checkpoint, main and production-watched codex/readability-accessibility remained e51942c and production publication was pending. Eight excluded documents were preserved. This checkpoint describes the historical state before the subsequent approval below.

## Phase 5/7 follow-up — approved production release and live acceptance

The approved exact e6b774a release was atomically fast-forwarded to main and codex/readability-accessibility, with no force-push or provider-variable change. Both providers deployed successfully and both new branch CI runs passed. PRODUCTION_MVP_RELEASE_2026-10-03.md records bounded public validation, actual Gmail recovery delivery, user-completed password save, observed new-password login/refresh, live suggestion ID 64 creation/revision/rejection, audit entries, notification delivery/read persistence and guest Library detail/public exclusion. Synthetic data was not published; retained QA records remain rejected.

Next: the remaining live upload/rejection and authenticated Library write boundaries, followed by remaining mail/private-password checks as necessary. Do not reuse historical results as new release evidence, bypass cooldowns, manufacture production failures or invent UAT/device outcomes. Review hosting trial continuity before defense. These outcome documents remain local; no additional commit/push is authorized by this evidence follow-up.
