# Combined release proposal — 3 October 2026

## Status: CI passed; approved production release deployed; bounded live acceptance in progress

The user first approved only this reviewed forty-nine-path bundle to codex/mvp-acceptance-ci. After isolated CI passed, the user approved proceeding with the exact production release. Main and codex/readability-accessibility were atomically fast-forwarded to e6b774a39d56d6116da26350f87c4483e92d8cd3; both providers and both resulting CI runs succeeded. See PRODUCTION_MVP_RELEASE_2026-10-03.md for current observed acceptance and open gates. Provider variables/settings and excluded files were not changed. The proposal/baseline sections below are historical review evidence, not the current remote state.

The user requested accumulating the repairs and auditing unrelated root material before a later combined push. This is the exact candidate path list, not permission to stage/commit/push. The release checkout is C:/Users/Hp/.codex/worktrees/selective-release-check/CAPSTONE PROJECT on codex/mvp-acceptance-ci, based on e51942c35c573438c09a91104a40d4951f36fa50. Remote main and codex/readability-accessibility match that baseline. The Desktop checkout is 45 commits behind this baseline and contains unrelated/private/local-only material; do not publish from it or copy its complete working tree.

The proposed bundle contains 49 paths: eighteen application-source files, seventeen regression files, one CI workflow and thirteen evidence/proposal documents. Eight other dirty evidence documents are explicitly excluded. Existing unchanged files remain part of the project but are not additional paths to stage. No dependency, lockfile, schema, migration, provider credential or production variable change is proposed. This supersedes the preceding 47-path proposal; see CI_RELEASE_PREFLIGHT_2026-10-03.md for the two added paths and observed provider settings.

## 1. Application source — 18 paths

```text
herbalaibackend/src/controllers/audit.controller.ts
herbalaibackend/src/controllers/herb.controller.ts
herbalaibackend/src/controllers/notification.controller.ts
herbalaibackend/src/controllers/suggest.controller.ts
herbalaibackend/src/repositories/audit.repository.ts
herbalaibackend/src/repositories/herb-comment.repository.ts
herbalaibackend/src/repositories/token.repository.ts
herbalaibackend/src/routes/auth.routes.ts
herbalaibackend/src/services/auth.service.ts
herbalaibackend/src/services/cloudinary.service.ts
herbalaibackend/src/utils/error-response.ts
herbalaibackend/src/utils/positive-int.ts
herbalaifrontend/components/HerbComments.tsx
herbalaifrontend/components/NotificationBell.tsx
herbalaifrontend/lib/library-discussion.ts
herbalaifrontend/lib/notification-state.ts
herbalaifrontend/lib/refresh-coordinator.ts
herbalaifrontend/lib/request-cache.ts
```

Review dependencies as a complete bundle: notification/audit controllers need positive-int.ts; HerbController needs herb-comment.repository.ts and the widened audit target type; notification and Library recovery need the shared refresh coordinator, notification validator and Library compatibility export. Omitting untracked helpers would produce a broken release even if tracked diffs were staged correctly.

## 2. Regression files — 17 paths

```text
herbalaibackend/tests/account-recovery.test.ts
herbalaibackend/tests/audit-pagination-http.test.ts
herbalaibackend/tests/cloudinary-lifetime-loopback.test.ts
herbalaibackend/tests/cloudinary.service.test.ts
herbalaibackend/tests/error-response.test.ts
herbalaibackend/tests/herb-comments-database.test.ts
herbalaibackend/tests/herb-comments-http.test.ts
herbalaibackend/tests/notification-boundaries-http.test.ts
herbalaibackend/tests/suggestion-id-boundaries-http.test.ts
herbalaibackend/tests/suggestion-upload-recovery-http.test.ts
herbalaibackend/tests/verification-resend-delivery.test.ts
herbalaibackend/tests/verification-resend-repository.test.ts
herbalaibackend/tests/verification-resend-validation-http.test.ts
scripts/library-discussion.test.mjs
scripts/notifications.test.mjs
scripts/request-cache.test.mjs
scripts/deployment-config.test.mjs
```

## 3. CI — one path

```text
.github/workflows/ci.yml
```

The backend job generates Prisma, applies migrations to the isolated pgvector PostgreSQL herbalai_test service and runs the full Vitest suite with maxWorkers=2. The frontend job runs existing and added native regressions, installs existing locked backend packages with scripts disabled for the loopback Socket.IO server test, and lint/typecheck/build. The already existing frontend client dependencies are also required. The workflow includes codex/mvp-acceptance-ci, but a local syntax/source review is not an actual GitHub execution pass.

## 4. Evidence and proposals — 13 paths

```text
Docs/testing/ADMIN_AUDIT_PAGINATION_2026-10-03.md
Docs/testing/COMBINED_RELEASE_REVIEW_2026-10-03.md
Docs/testing/CI_RELEASE_PREFLIGHT_2026-10-03.md
Docs/testing/LIBRARY_DISCUSSION_REGRESSION_2026-10-03.md
Docs/testing/LIBRARY_MODERATION_REPLY_RETENTION_2026-10-03.md
Docs/testing/LIBRARY_REALTIME_RECOVERY_2026-10-03.md
Docs/testing/LIBRARY_TIMING_GUARDS_2026-10-03.md
Docs/testing/LIVE_MVP_ACCEPTANCE_2026-10-03.md
Docs/testing/MVP_BACKLOG_AUDIT_2026-10-03.md
Docs/testing/NEXT_WORK_PLAN_2026-10-03.md
Docs/testing/NOTIFICATION_API_BOUNDARIES_2026-10-03.md
Docs/testing/NOTIFICATION_CACHE_RECOVERY_2026-10-03.md
Docs/testing/ROOT_MEDIA_AUDIT_2026-10-03.md
```

These records distinguish earlier live acceptance, failing baselines, bounded local repairs and unexecuted gates. They do not claim that all 22 local repair groups have been accepted in production. Manual account/password/device/participant results retain their stated limits.

## Explicit exclusions

Preserve, but do not stage these eight unrelated pre-existing worktree diffs:

```text
Docs/testing/ADMIN_LOGOUT_2026-10-01.md
Docs/testing/AUTH_FEEDBACK_2026-10-03.md
Docs/testing/OAUTH_PASSWORD_COPY_2026-10-02.md
Docs/testing/PASSWORD_SETTINGS_2026-10-01.md
Docs/testing/PASSWORD_SETTINGS_FEEDBACK_2026-10-02.md
Docs/testing/REFRESH_OWNER_CANCELLATION_2026-10-01.md
Docs/testing/REMAINING_MVP_GATES_2026-10-01.md
Docs/testing/SESSION_REFRESH_RECOVERY_2026-10-01.md
```

Also exclude all unrelated Desktop diffs/untracked material, private/personal media, fourteen raw QA screenshots, generated chart scratch files, agent hooks/skills/binaries, local demo scripts/credentials, formal-document relocation, the Desktop-only index-drop migration, .env files, .next/dist output, node_modules, logs and ignored fixtures. See ROOT_MEDIA_AUDIT_2026-10-03.md for usefulness/privacy evidence. No images are added/deleted by this proposed production batch.

## Observed readiness versus open gates

| Item | Status |
| --- | --- |
| Local functional regressions | Latest prior executed combined run: 759 non-DB backend cases in 60 files and 311 native cases in twelve scripts, zero failed. Total 1070, excluding repeated focused/baseline runs. The subsequent CI-only preflight freshly passed all 312 native cases, including one new coverage assertion; backend cases were not rerun in that preflight. |
| Source validation | Both applications previously passed lint/typecheck/build for their edited batches; latest backend batch also passed standalone typecheck/build. Generated frontend build uses a process-local loopback API and must not be deployed/copied. |
| SQL acceptance | PASSED in actual isolated GitHub CI for e6b774a: all seventeen formerly locally excluded files (113 cases) passed, including thirteen Library SQL cases. They remain unexecuted on this laptop; no live database was used. See the subsequent outcome appendix in CI_RELEASE_PREFLIGHT_2026-10-03.md. |
| Root/media review | Fifty public image routes returned successful image responses; all 37 current catalog image paths map locally. Four QA screenshots need personal-detail redaction; six legacy images are candidates, not approved deletions. |
| Secret-pattern check | 35 source/test/CI files and ten preceding new reports scanned with bounded patterns. One intentional synthetic error-redaction fixture matched a database URL. No provider/private-key/live-reset-token match observed. Not a comprehensive history/privacy certification. |
| Remote baseline | main, production-watched branch and CI branch now resolve to e6b774a after approved atomic fast-forward. e51942c remains the historical rollback baseline. |
| Staging/release | Exactly 49 reviewed paths released after full isolated CI passed (1184 cases). Both provider deployments and the resulting main/deployment CI runs succeeded. Bounded live recovery, suggestion revision/rejection, audit, notification and Library reads passed; remaining gates are recorded in PRODUCTION_MVP_RELEASE_2026-10-03.md. Follow-up evidence remains local; no extra automatic documentation push or provider setting change. |

## Proposed release order — requires explicit authorization

1. Recheck remote refs, worktree diff and the exact 49 paths. Stop if unrelated edits or changed baseline make this proposal stale. The subsequent preflight inspected both providers: production watches codex/readability-accessibility, whereas codex/mvp-acceptance-ci appears as a Vercel preview branch. Recheck before pushing; do not assume the preview uses an isolated runtime database. Railway Wait for CI is off, so wait for full successful CI manually before any production-branch update. See CI_RELEASE_PREFLIGHT_2026-10-03.md; no provider setting was changed.
2. Only after exact authorization, stage those paths from the selective checkout, inspect staged diff/whitespace/credential patterns and commit on the existing codex/mvp-acceptance-ci branch. Never git add . from Desktop or force-push/reset its unrelated work.
3. Push only the reviewed CI branch after confirming production isolation. Wait for both GitHub jobs, including all isolated database tests. Investigate actual failing logs rather than excluding a required database suite to obtain a green badge. No current CI pass is asserted.
4. Reconcile any necessary repair within the same exact reviewed scope and repeat tests/review. Preserve migration isolation and private mail/provider fixtures. Do not point production at the CI service or demo database.
5. After full CI passes and production release authorization, update the intended deployment/main refs using a reviewed fast-forward or approved PR flow, rechecking provider branches and existing collaborators' commits. Never force-push. No production migration is required by this bundle, but the normal existing startup/migration pipeline still must succeed.
6. Record the resulting commit and GitHub/Vercel/Railway statuses; check frontend pages, backend health/version, public catalog and current assets. Confirm correct production API/socket URLs, not the local ignored loopback .next artifact.
7. Perform bounded authorized live signup/verification/resend, disposable recovery/password/session refresh, suggestions/review/upload/audit, Library comments/replies/reactions/moderation and notification/account recovery checks. Use connected contributor/admin sessions; the user enters new passwords privately. Do not publish synthetic medicinal records, alter administrator passwords or manufacture production outages.
8. If deployment fails, stop acceptance, capture observed diagnostics and restore the previously healthy e51942c release through an authorized provider/Git rollback. Avoid destructive schema/data rollback; this bundle has no schema change. Record rollback outcome, not just the intended command.

Root cleanup, document migration, VPS/domain decisions and SRS/SPMP/SDD/STD traceability remain separate work. Participant UAT was deferred and phone checks are user reports. Do not convert either into invented acceptance or claim the entire system is defect-free from this proposal.
