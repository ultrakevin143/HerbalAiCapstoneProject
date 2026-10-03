# Library timing guards — 3 October 2026

## Scope and release hold

Continued phase 3 of NEXT_WORK_PLAN_2026-10-03.md at the user's request. Workspace: C:/Users/Hp/.codex/worktrees/selective-release-check/CAPSTONE PROJECT, branch codex/mvp-acceptance-ci. This batch extends the local Library moderation/discussion repairs; it does not replace their reports. Existing styling, authentication middleware and unrelated working-tree changes were preserved. No staging, commit, push, deployment, migration or production-variable change occurred.

Main and codex/readability-accessibility still resolve to e51942c35c573438c09a91104a40d4951f36fa50. Anonymous live Library and Railway health GETs both returned 200. No live account, comment, herb, email or image was changed. These GETs establish baseline availability only, not acceptance of the unpublished repairs.

## Reproduced gaps and focused changes

| ID | Priority | Source gap and reproduction | Local repair |
| --- | --- | --- | --- |
| B11 | High | Publication validation and comment insertion were separate operations; reaction validation locked only the comment, not its herb. Comment reads checked publication before a later query without a publication predicate. Controlled tests showed missing transactional eligibility gates and the missing read predicate. | A shared parameterized FOR SHARE query checks and locks the published/verified Herb inside creation/reaction transactions. The comment read itself now includes the publication/verification relation predicate. |
| B12 | Medium | Parent validation ran before insertion, without a transaction or parent row lock. A deleted/soft-deleted parent could invalidate that result before insertion. Controlled tests showed that insertion ignored the proposed transaction-time parent gate. | Creation validates and locks the same-herb, nondeleted parent with FOR SHARE inside the insertion transaction. Ineligible parents return 400 without insertion or broadcast. |

Five new controlled checks failed against the preceding batch: transactional lock wiring, unavailable herb gate, unavailable parent gate, unavailable reaction herb gate and the second read predicate. The other 72 existing cases passed in that baseline run. This is a reproduction of missing guards through mocked persistence/controlled routes, not an empirical PostgreSQL race result or an induced live failure.

Source: herbalaibackend/src/repositories/herb-comment.repository.ts and herbalaibackend/src/controllers/herb.controller.ts. The controller retains content/ID/authentication validation and delegates insertion to createHerbComment. Locks use tagged Prisma queries with bound parameters; request values are not concatenated into SQL. Lock order is Herb before parent/comment, shared between create and react. Read-only locks avoid a no-op Herb update that would unnecessarily change updatedAt. No cache is used for mutation eligibility.

FOR SHARE was selected rather than FOR KEY SHARE because publication and isDeleted can change through non-key updates. PostgreSQL documents that SHARE conflicts with UPDATE/DELETE and lasts until transaction end: https://www.postgresql.org/docs/16/explicit-locking.html. This supports the design; it is not proof that the unexecuted integration cases pass.

Normal response data and existing event names are retained. Missing/nonpublic create target is 404; missing/ineligible reply parent is 400; unavailable reaction target is 404. Errors are passed through the production error-response machinery. Creation broadcasts only after its transaction resolves. A failure at SQL gate, insertion or transaction completion is not acknowledged as success. A herb changed after the preliminary read can produce 200 with an empty comment list; initially unavailable herbs still produce 404. This does not promise that a later publication change can retract data already returned from a valid database snapshot.

## Test-harness gaps corrected

- The Library isolated database fixture previously mapped every thrown error to 500. That would invalidate its new duplicate-delete 404 expectation. It now uses the actual errorResponse helper, preserving expected status mapping. This was a local harness defect, not an observed production error.
- CI did not yet invoke the new native Library reply-retention script from the previous batch. .github/workflows/ci.yml now includes that explicit step. Backend test discovery already includes the Library database/HTTP suites. No dependency or schema change is required.
- Old three-way parent mock cases were consolidated into a locking-query predicate case. Actual missing/cross-herb/deleted behavior belongs to the isolated database cases, rather than pretending a mock implements SQL semantics.

## Executed validation

| Check | Observed result |
| --- | --- |
| Controlled baseline | 5 failed, 72 passed; failing gate/query checks recorded before production edits. |
| Focused Library HTTP suite after repair | 80 passed. Covers actual routes, auth middleware, transaction-client use, parameter binding/predicate/ordering, missing targets, no precommit broadcast, persistence/gate failures and prior moderation behavior. |
| Combined backend non-DB suites | 603 passed across 58 files, zero failed. Seventeen DB-dependent suites excluded. Dummy loopback port-1 database URL, log-only mail and empty Gemini key were process-local. |
| Native frontend/deployment harnesses | 255 passed across ten scripts, zero failed. Includes twelve Library reply-retention cases. |
| Backend ESLint and TypeScript build | Passed. Source build excludes test files. |
| Library database test syntax | TypeScript transpile diagnostics: zero syntax errors. This is neither test typechecking nor SQL execution. |
| Whitespace/index | git diff --check passed; index empty. Git emitted normal LF-to-CRLF advisory warnings. |
| Anonymous live baseline | Vercel /library 200; Railway /api/health 200; main/deployment refs unchanged at e51942c. |

Counts are fresh combined results, not sums of overlapping focused/baseline runs. Expected synthetic socket/provider failure logs were present in failure-path tests; those tests passed. Frontend source was not changed in this batch and its production build was not rerun; the earlier batch's lint/typecheck/build evidence remains historical.

## Isolated PostgreSQL gate — not executed locally

No Docker, psql or postgres command is installed here. The Library database suite still refuses non-loopback connections and any database name other than herbalai_test. It now contains thirteen prepared cases, including four new lock-observation scenarios:

1. A comment transaction holds its public Herb gate while an independent writer tries to put that herb on HOLD.
2. A reply transaction holds its parent gate while an independent writer tries to delete the parent; after commit/delete the retained reply has a null parent ID.
3. A reaction transaction holds its public Herb gate while an independent writer tries to put that herb on HOLD.
4. A reaction transaction holds its comment row while an independent writer tries to delete the comment; final deletion cascades the saved reaction.

The tests pause after actual gate/row-lock queries inside isolated transactions, obtain the competing connection's PostgreSQL PID and inspect pg_blocking_pids before releasing the gate. They do not use a sleep-only guess as lock evidence. Transaction deadlines, fixture cleanup and spy restoration are bounded. None of these four cases has been run or counted as passed. The earlier nine SQL cases (including reaction concurrency, rollback, moderation atomicity and reply retention) also remain unexecuted locally.

Required execution, only after an isolated pgvector PostgreSQL database is available and all migrations applied:

```powershell
$env:DATABASE_URL='postgresql://test_user:test_password@127.0.0.1:5432/herbalai_test?sslmode=disable'
$env:DIRECT_URL=$env:DATABASE_URL
$env:NODE_ENV='test'
$env:EMAIL_DELIVERY_MODE='log'
$env:GEMINI_API_KEY=''
npx prisma migrate deploy
npx vitest run tests/herb-comments-database.test.ts --maxWorkers=1
npm test -- --maxWorkers=2
```

Those example credentials are isolated CI fixture credentials, not production values. Do not point these commands at live Neon or a production/demo database. Existing GitHub CI supplies pgvector/pgvector:pg16 and the isolated database; triggering it still requires the user's later exact-batch push authorization. Release remains blocked on full isolated SQL CI, selective review and subsequent bounded live acceptance. No source claim is made about every account-deletion/deadlock interleaving.

## Remaining next work

- Review Library delayed/out-of-order realtime payloads and client reaction/delete reconciliation with reproducible tests. SQL commit ordering does not guarantee that global socket payloads arrive in commit order. Current event names/audience were not changed and the realtime phase is not declared complete.
- Review cross-user audience requirements and cached/fetched snapshot reconciliation before changing transport scope. Existing public comment events are not automatically classified as private-data disclosure.
- Run isolated SQL/rollback/concurrency suites; mock coverage and a healthy live baseline are not substitutes.
- Continue the remaining MVP backlog scan and separate root/media/privacy review from this production repair batch. Preserve personal files and deferred participant/physical-device evidence boundaries.

## Selective review additions

This phase modifies the accumulated HerbController, herb-comment.repository.ts, herb-comments-http.test.ts and herb-comments-database.test.ts; adds the CI reply-retention step and this report; and appends current status to the backlog ledger/work plan. Keep Batch 1–3 selective lists. Do not stage unrelated evidence, Desktop media, fixtures, credentials or the earlier loopback .next build artifact.
