# Knowledge import rollback repair — 9 October 2026

## Finding API-08: partial imports after a failed request

Severity: Medium (administrator data/audit consistency). The import service previously called individually committed `upsertKB` operations for each prepared fact. If the second record, vector or audit write failed, the response reported an unsuccessful import while the first record and its audit remained committed. A retry could therefore operate on a partially changed knowledge base.

Reproduction used the actual import service, knowledge repository and shared audit helper against an in-memory transaction-boundary fixture, not a mocked import service. Four assertions failed before repair: the three late-failure cases left the existing first answer/vector/metadata changed, and successful import opened two transactions instead of one. The independent embedding-preparation failure check already passed. No production import or live data mutation was performed.

## Focused repair

- `herbalaibackend/src/repositories/audit.repository.ts:12`: the existing audited mutation helper accepts an internal existing transaction. Standalone callers still open their own transaction, with the same audit requirement; batch callers reuse their enclosing transaction without nesting or committing a row early.
- `herbalaibackend/src/repositories/knowledgebase.repository.ts:41`: standalone upsert remains available; `upsertKBBatch` at line 80 wraps the entire collection in one transaction and preserves a separate audit entry for each fact.
- `herbalaibackend/src/services/ai/knowledge-base/import-knowledge-base-service.ts:45`: commits the prepared collection through the batch repository and computes the existing created/updated totals from its results.
- Source validation, duplicate-question rejection, metadata, tag normalization and embedding preparation are unchanged. Embeddings are generated before the transaction opens. The existing API maximum remains fifty facts; the database transaction has a bounded 30-second execution timeout. No external AI request runs while its transaction is open.
- The previous safe database-unavailable forwarding remains intact. No frontend styling, route contract, production setting, credential, schema migration or published herb changed in this continuation.

## Executed checks

| Check | Observed outcome |
| --- | --- |
| Five actual-service/repository transaction-boundary cases | Passed after repair: late record/vector/audit failures, whole-batch success and failure before transaction opening |
| Existing import/source/outage checks plus those five cases | 23 passed across four focused files |
| Real isolated PostgreSQL batch tests | Five passed: late record constraint failure, late audit constraint failure, complete retry with exactly one audit per record, standalone upsert rollback and a fifty-record/fifty-audit batch |
| Existing real wallet database regressions | All 26 passed; separate private schema, mocked provider/AI, no genuine payment or webhook delivery |
| Combined local database selection | 31 passed across two files, no skips |
| Updated broader non-database backend selection | 2,136 passed across 128 files, no failures/skips |
| Strict fixture TypeScript | Passed for the new transaction fixtures, prepared authenticated vector case, prior API/socket fixtures and existing administrator edit fixture/helper |
| Backend build and source ESLint | Passed after the repair; final import-order-only cleanup was followed by another build/lint/focused rerun |
| Complete current frontend/root Node regressions | 399 passed, zero failures/skips, including the strengthened CI scheduling requirement |
| Documentation-inclusive Git whitespace validation | Passed |

The broader selection excludes the 24 database-dependent files documented in `API_AUDIT_2026-10-09.md` plus the new `knowledge-import-database.test.ts`. The two database files above were exercised separately against the real loopback server. Counts overlap between focused and broader runs and must not be added as distinct tests.

The database runtime was the existing outside-Git PostgreSQL package, started only on `127.0.0.1:55438`, database `herbalai_test`, using synthetic test credentials. New tests verified the actual server address/database/port before creating a UUID-named private schema. Their record/audit fixture intentionally omits the vector column: these five cases certify genuine PostgreSQL/Prisma record-and-audit transaction rollback, not production vector type/dimension behavior or full migrations. The local server reported `vector_available: false` and zero remaining wallet/import test schemas after cleanup. Only this positively identified test server was stopped afterward; existing cluster files and unrelated processes were preserved. Neon and production were never used as fallback test targets.

## Prepared but not executed locally

`tests/knowledge-authenticated-flow.test.ts` now includes an actual authenticated HTTP import case for the full migrated pgvector schema: a valid first vector and invalid second dimension must roll back both records, the first vector update and all import audits; a valid retry must succeed with the correct totals and one audit per record. It is not counted as passed here because pgvector is absent locally.

`.github/workflows/ci.yml` now strictly typechecks all new API/socket/import fixtures and includes the authenticated knowledge flow in the dedicated real administrator vector/rollback gate before the complete suite. The new private-schema transaction test is also discovered by the complete suite and fails closed in CI if its isolated database configuration is missing. The deployment-configuration regression was extended to require this scheduling without removing the fail-closed or loopback database checks.

These workflow changes have not run remotely. Candidate `0151280` and its earlier CI pass do not certify this uncommitted bundle. Fresh isolated PostgreSQL/pgvector CI remains required before release.

## Evidence and continuation

Outside-Git evidence directory: `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/`.

- `knowledge-import-backend-selected-20261009.log`: successful broader backend selection.
- `knowledge-import-node-regressions-20261009.log`: complete current frontend/root Node regression run, including the strengthened CI scheduling check.
- `credit-validation-runtime/knowledge-atomicity-postgres.log`: controlled PostgreSQL startup/shutdown; synthetic local fixture only.

The executed reproduction, focused database results and strict typecheck/build/lint outputs are also retained in this chat's tool results. This report is linked from the root `PROJECT_REVIEW.md`.

Next release gates: finish reviewing the combined local bundle; obtain a separate CI-branch publication decision; run the new full pgvector/migration checks; verify provider branch/database/credit settings before any production release. Genuine signed PayMongo TEST webhook delivery and persistent wallet fulfillment remain separate payment-acceptance gates. Keep production credits off. No new commit/push, production deployment, physical-device pass or UAT result is claimed.
