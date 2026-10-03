# Library discussion regression batch — 2026-10-03

## Scope and publication hold

The user requested that repairs be recorded and accumulated for a later combined push. This batch is local and uncommitted in the selective-release-check worktree, on codex/mvp-acceptance-ci. Nothing was staged, committed, pushed, migrated or deployed. Main and codex/readability-accessibility still matched e51942c35c573438c09a91104a40d4951f36fa50 when checked.

This is Batch 2 of MVP_BACKLOG_AUDIT_2026-10-03.md. It concerns Library herb comments, not Community forum comments. The existing UI, route names, response data and socket event names remain unchanged. No frontend, credential, provider variable, schema, migration or dependency was changed.

## Reproduced defects and focused repairs

### B05 — comment and reply input integrity — high

Location: herbalaibackend/src/controllers/herb.controller.ts, addComment, toggleCommentLike and deleteComment.

Before repair:

- Missing JSON bodies threw while destructuring. Whitespace, non-string content and malformed parent values could reach persistence rather than a controlled validation response.
- Replies did not check that the parent existed, was not deleted and belonged to the same herb.
- Like/delete used parseInt. IDs such as 7junk, 7.5 and 007 could address comment 7. Oversized IDs reached persistence instead of a 400.

Repair: validate meaningful string content and trim it; accept null/omitted parent or a positive PostgreSQL Int parent; check parent identity/deletion/herb ownership before creation; reject malformed action IDs before lookups or mutations. Anonymous writes still go through the existing authentication middleware. Herb IDs remain strings, not numeric IDs. Contributor delete ownership and the current database administrator role remain intact.

No new content-length policy was introduced. This does not claim to serialize a concurrent parent removal or publication change between validation and insertion; those timing cases require a separate reproduction and review.

### B06 — published-herb discussion boundary — high

Location: HerbController.getComments, addComment and toggleCommentLike.

Before repair: public comment retrieval and comment creation did not check the herb's publication/verification status. Likes did not check whether the comment was deleted or its herb was public. Missing targets could also be forwarded into foreign-key writes rather than a controlled not-found response.

Repair: comment list/create check the uncached database predicate publicationStatus=PUBLISHED and isVerified=true. Missing or nonpublic herbs return 404. Reactions require an undeleted comment under a published, verified herb; otherwise return 404 before changing reaction rows. This matches the existing Library detail visibility policy. It is not a redesign of comment socket audience/privacy or archival concurrency handling.

### B07 — reaction transaction and count integrity — medium

Location: HerbController.toggleCommentLike.

Before repair: reaction insert/delete and cached likes increment were separate database writes. A later count-write failure could leave a saved reaction without the matching count. The old code did not use a transaction and would not repair an already drifted count.

Repair: wrap target gating, reaction toggle and count update in one Prisma transaction. An initial zero-increment update on the eligible comment precedes the reaction lookup; the intent is to acquire the PostgreSQL row lock before another toggle can inspect that target. Persist the actual reaction-row count, not a blind increment/decrement. Preserve the existing returned comment and comment_liked event fields.

Local intercepted HTTP tests prove the transaction call, eligibility predicate, ordering, count write and absence of success/broadcast on a failed transaction. They do NOT prove PostgreSQL locking, concurrent execution or actual rollback. Five isolated-database regressions were added; their execution remains pending. Do not mark production concurrency accepted before that gate passes.

### B08 — saved-write acknowledgement independent of realtime broadcast — medium

Location: shared emitCommentEvent helper and all three Library comment mutation handlers.

Before repair: a socket emit exception after a successful create/like/delete escaped into the request error handler and produced a 500 despite the committed write. Retrying after a false failure could duplicate a comment or toggle a reaction again.

Repair: a shared best-effort broadcaster catches an import/emit error, logs a generic message without request content or credentials, and preserves the successful HTTP result. Actual persistence failures still fail and do not broadcast. The repair does not guarantee realtime delivery, reconnection or event ordering across concurrent commits; reloading remains the reconciliation path.

## Regression evidence

New controlled HTTP suite: herbalaibackend/tests/herb-comments-http.test.ts. It uses actual Express routes, authentication middleware, session-role selection and controller code, with database and socket dependencies intercepted. Generated tokens are local test-only tokens; no live account was accessed.

Before the source repair, the first 59 tests produced 52 failed assertions and 7 passes. This established failures in the listed boundary/visibility/transaction/broadcast cases; it is not a claim of 52 independent bugs. After repair those 59 passed. Five additional persistence-failure and response-shape cases brought the suite to 64, all passing in the final combined run.

New isolated database suite: herbalaibackend/tests/herb-comments-database.test.ts. Five tests cover held-herb privacy/write denial, cross-herb/deleted-parent handling, six concurrent same-user toggles, three concurrent different-user reactions, and an injected later count-save failure with real transactional rollback. Fixtures are uniquely named TEST ONLY records and cleaned by their exact IDs. A guard refuses any database except loopback herbalai_test. These tests have NOT been run locally; do not infer their outcome from mocks or successful source compilation.

| Check | Observed result | Limits |
| --- | --- | --- |
| New Library controlled HTTP suite | 64 passed in final combined run | Database/session rows and socket emits intercepted. |
| Combined backend non-DB suites | 587 passed across 58 files; 0 failed | Includes prior uncommitted Batch 1 and the new HTTP tests. |
| Existing native/frontend/deployment harnesses | 243 passed; 0 failed | Nine native test scripts; not a physical-device/browser acceptance campaign. |
| Backend ESLint | Passed | Production source lint. |
| Backend TypeScript build | Passed | Source build excludes tests; does not execute/typecheck the new DB fixture suite. |
| Git whitespace review | Passed | Existing LF/CRLF warnings are not failing checks. |
| Isolated PostgreSQL suite | Pending | No Docker/psql available. Five new database regressions were excluded locally. |
| Remote CI / combined release | Not run / not published | User explicitly requested a later combined push. |

The final backend run supplied DATABASE_URL and DIRECT_URL pointing to dummy loopback port 1, NODE_ENV=test, EMAIL_DELIVERY_MODE=log and an empty Gemini key. Seventeen database-dependent files were excluded: account-recovery, auth, chat, audited-mutations, herb-governance, knowledge-authenticated-flow, forum-moderation-flow, herb-catalog-remediation, profile, review-publication-transaction, herbs, message-authenticated-flow, password-settings-database, suggestion-validation, system-features, session-rotation and herb-comments-database. Expected injected error logs are not current test failures. No database credential or local fixture configuration was added to production.

## Current live baseline — not validation of unpublished code

Anonymous, read-only checks against the unchanged Railway release observed:

- /api/health: 200.
- Lagundi search returned a published herb.
- That herb's comments endpoint: 200, success, zero comments.

No malformed mutation, induced outage, upload, new account, email, password reset, moderation or test-record publication was performed live in this batch. No Chrome/browser session was changed. These reads establish only current baseline reachability.

## Exact additional files for later review

- herbalaibackend/src/controllers/herb.controller.ts
- herbalaibackend/tests/herb-comments-http.test.ts
- herbalaibackend/tests/herb-comments-database.test.ts
- Docs/testing/LIBRARY_DISCUSSION_REGRESSION_2026-10-03.md
- Docs/testing/MVP_BACKLOG_AUDIT_2026-10-03.md (combined ledger update)

Do not stage unrelated academic documents, prior evidence edits, personal media or local-only tooling. The index remains empty. Batch 1 is retained unchanged alongside this batch.

## Next audit, not marked complete

Inspect Library moderation audit coverage and parent-deletion/reply retention. The current Library comment delete handler still hard-deletes without runAuditedMutation; unlike the Community moderation workflow it has no matching admin audit write. This is an observed source-level gap, not a newly passed/failed live moderation test. The schema retains replies using parentCommentId=SetNull, while the existing frontend removes the parent from local state; immediate reply rendering/reconciliation needs a controlled reproduction before repair. Neither case is included in the four fixed groups above.

Before a combined production release: review the selective diff, obtain publication authorization, run the full isolated PostgreSQL CI (including the new rollback/concurrency cases), then do bounded authorized live comment/reaction/moderation checks. Do not use synthetic plant fixtures or the isolated database in production. Exact private-password, physical-device and participant evidence remain separate gates.

## Manual continuation follow-up

LIBRARY_MODERATION_REPLY_RETENTION_2026-10-03.md supersedes the source-level moderation/reply candidates above: missing Library administrator deletion audits and immediate retained-reply rendering were reproduced and repaired locally as B09/B10. Conditional transactional deletion, shared audit logging and shared client reconciliation passed 72 controlled HTTP and 12 native callback/helper cases. The combined local totals are now 595 non-DB backend tests and 255 native harness tests, with both application lint/typechecks/builds passing. The guarded Library database suite now has nine prepared cases; none was run locally. These changes and B01–B08 remain uncommitted/unpushed; no patched live, real PostgreSQL or physical-device result is inferred.
