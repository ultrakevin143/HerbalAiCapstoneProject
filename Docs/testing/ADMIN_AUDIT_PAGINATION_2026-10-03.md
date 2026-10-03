# Administrator audit pagination — 3 October 2026

## Scope and release hold

The user requested the next accumulated repair batch: audit-log pagination and administrator access. Work used the selective-release-check checkout on codex/mvp-acceptance-ci. It changed one backend controller and added one controlled HTTP suite, reusing the preceding batch's integer parser. Existing frontend styling, administrator credentials, roles, audit records, database settings and unrelated changes were not altered. Nothing was staged, committed, pushed or deployed.

Remote main and codex/readability-accessibility still resolve to e51942c35c573438c09a91104a40d4951f36fa50. Anonymous Library/health GETs returned 200 and a normal anonymous /api/admin/audit-logs GET returned 401. These are unchanged-release availability/authentication checks, not acceptance of unpublished pagination repairs or a signed-in administrator flow.

## Reproduced failures and retained protection

Seventy-eight actual-route HTTP cases executed before the repair: fifty-one failed and twenty-seven passed. The harness mounts the actual audit router, controller, repository, JWT authentication and role middleware; only Prisma operations are mocked. Invalid values reached audit reads and received mock-backed success instead of an input error.

| ID | Priority | Observed failure | Focused repair |
| --- | --- | --- | --- |
| B21 | Medium | Twenty-two invalid scalar limit cases, one repeated-limit case and two extended-parser limit-shape cases reached audit persistence. Empty/zero/negative/fractional/suffix/exponent/alias/overflow values and excessive page sizes were not strictly rejected. | Omitted limit remains 50. Explicit limit must be a single canonical decimal integer 1–100; invalid input returns structured 400 before list/count calls. |
| B22 | Medium | Twenty-three invalid scalar offset cases, one repeated-offset case and two extended-parser offset-shape cases reached audit persistence. Negative, malformed, noncanonical and excessive skips were not strictly rejected. | Omitted offset remains 0; explicit canonical 0 is accepted. Other offsets must be canonical positive integers no greater than 10000. Invalid input returns structured 400 before list/count calls. |

The 100-page-size and 10000-offset bounds are this repair's explicit API policy, not an asserted external standard or a measured denial-of-service incident. Values over a bound are rejected, not clamped. No audit records are removed or hidden by a database mutation. Reading beyond offset 10000 would need a separately reviewed cursor/export/archive capability; this endpoint no longer allows arbitrary deep skips. The current administrator page requests no pagination parameters, so its default 50-record view and response fields are preserved.

The twenty-seven baseline passes cover preserved behavior, not newly fixed authorization vulnerabilities. Tests verify that missing/invalid credentials, revoked sessions, bans, deleted accounts and contributor access are rejected before audit queries. A stale administrator token cannot overrule the account's current contributor role. A promoted account can use its earlier contributor token because middleware rechecks the current role. Demotion/ban/deletion between session and permission checks is also denied in controlled sequential account results. These exercise existing protection; no middleware change or production privilege bypass was demonstrated.

One fail-closed role fixture uses an unrecognized role string. The actual database Role enum contains only admin and contributor; this fixture is an invalid-state edge case, not an assertion that the system has registered guest accounts.

## Exact selective review scope

- herbalaibackend/src/controllers/audit.controller.ts: explicit query validation with existing response structure and defaults, using parsePositiveIntString from the preceding notification batch. Authentication and role checks remain in the existing route middleware before controller validation.
- herbalaibackend/tests/audit-pagination-http.test.ts: seventy-eight actual-route cases covering invalid scalar/non-scalar pagination, valid/default bounds, global totals, empty pages, constrained administrator profile selection, ignored unrelated query fields, cookie/bearer authentication, role changes, revoked/banned/deleted accounts and safe dependency-failure responses. It verifies no audit create call during reads.
- This report and appended MVP_BACKLOG_AUDIT_2026-10-03.md / NEXT_WORK_PLAN_2026-10-03.md evidence.

The controller depends on herbalaibackend/src/utils/positive-int.ts from Batch 7; include that shared parser when reviewing the combined release. It was reused, not changed in this batch. audit.repository.ts already has unrelated preceding Library moderation edits; this batch does not alter its reads or audited mutations. No schema, migration, package, lockfile, frontend, route or production-variable edit. Existing backend CI discovery includes the new test without an additional workflow change.

## Observed validation

| Check | Observed result and boundary |
| --- | --- |
| Initial audit HTTP baseline | 78 executed: 51 failed, 27 passed before repair. Persistence mocked; no real audit data accessed. |
| Post-repair focused HTTP checks | 155 passed across audit pagination (78) and prior notification boundaries (77), zero failed. |
| Combined backend non-DB suites | 759 passed across 60 files, zero failed. Seventeen DB-dependent suites excluded. |
| Combined native/frontend suites | 311 passed across twelve scripts; zero failed/skipped. These rerun preceding frontend recovery checks; this batch makes no frontend change. |
| Backend lint, standalone typecheck and build | Passed. Source tsconfig excludes tests; Vitest executes their code. Generated dist output remains ignored/local. |
| Whitespace/index | git diff --check passed; index empty. |
| Anonymous live baseline | Library and Railway health 200; normal audit-log GET without credentials 401; main/deployment unchanged at e51942c. No authenticated write or malformed input sent to production. |
| Local SQL availability | docker, psql and postgres commands were not found on PATH. No live/demo database used for tests. |

The fresh combined total is 1070 executed cases (759 backend plus 311 native). Repeated baseline/focused runs are not added to that total. Expected negative-test logs are not failures; final summaries show zero failed cases. Mocked Prisma selectors, guards and arguments do not prove actual SQL transactions, concurrent role changes, count/list snapshot consistency or real tied-timestamp pagination ordering. No mounted administrator browser, physical-device or participant pass is claimed.

## Repeatable focused check

From herbalaibackend:

```powershell
$env:DATABASE_URL='postgresql://qa_only:qa_only@127.0.0.1:1/unused_qa?sslmode=disable'
$env:DIRECT_URL=$env:DATABASE_URL
$env:NODE_ENV='test'
$env:EMAIL_DELIVERY_MODE='log'
$env:GEMINI_API_KEY=''
$env:JWT_SECRET='qa_audit_only_secret_not_production'
$env:JWT_REFRESH_SECRET='qa_audit_only_refresh_not_production'
npx vitest run tests/audit-pagination-http.test.ts tests/notification-boundaries-http.test.ts --maxWorkers=2
npm run lint
npx tsc --noEmit
npm run build
```

These are synthetic test settings, not real credentials, and must not be copied to production. The combined backend run retains the preceding seventeen-file database exclusion list. Full database CI uses only its isolated PostgreSQL service, never live Neon or the demo database. Native checks use node --test --test-concurrency=2 over the twelve scripts/*.test.mjs files.

## Next work and remaining gates

1. Review the accumulated release bundle and root/media documentation references, distinguishing deployable code/evidence from local-only fixtures, credentials, generated output and unrelated files. Begin read-only; propose any cleanup separately instead of deleting apparently unused images or staging the whole root. Preserve screenshots used as testing evidence.
2. Complete full isolated PostgreSQL CI before production publication. Seventeen locally excluded suites, including thirteen prepared Library SQL cases, remain unexecuted locally. Actual audit mutation atomicity/rollback is part of that separate SQL gate, not resolved by pagination mocks.
3. After explicit combined-release authorization and deployment, check signed-in administrator audit loading, actor metadata, bounded paging and the associated mutation/audit flow using disposable records and connected sessions. Preserve real audit records. Do not manufacture a production failure.
4. Keep formal SRS/SPMP/SDD/STD traceability, physical-device self-report and deferred participant UAT statuses factual. No universal MVP/defense-ready claim follows from this bounded audit.

B01–B22 are accumulated local repair groups. Publication remains on hold.
