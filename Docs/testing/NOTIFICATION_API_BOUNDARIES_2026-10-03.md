# Notification API boundaries — 3 October 2026

## Scope and release hold

The user requested the next accumulated repair batch after cache/notification recovery. This batch covers notification action IDs, bounded list limits and preservation of existing authentication, ownership and failure responses. Only backend source and a controlled HTTP regression file were added/edited. The frontend, notification layout and preceding unpublished batches are unchanged. No staging, commit, push, deployment, database migration or production variable change occurred.

The active checkout is the selective-release-check worktree on codex/mvp-acceptance-ci. Remote main and codex/readability-accessibility both still resolve to e51942c35c573438c09a91104a40d4951f36fa50. Anonymous live Library and Railway health GETs returned 200. They measure the unchanged release's availability, not the local repair.

## Reproduction and repair groups

Sixty-two controlled HTTP cases executed before the production change: thirty failed and thirty-two passed. They mount the actual notification router, controller, repositories, authentication middleware and JWT/session checks in Express. Only Prisma calls are mocked; no database or real account is accessed.

| ID | Priority | Observed failure | Repair |
| --- | --- | --- | --- |
| B19 | Medium | parseInt accepted noncanonical action IDs such as 7junk, 7.5, 7e0, +7 and 007, or passed zero, negative and out-of-Int-range values to the mutation. Eleven invalid-ID baseline cases failed. | Accept only canonical positive decimal strings representing Int values 1–2147483647; reject malformed IDs with the existing 400 envelope before notification persistence. |
| B20 | Medium | Empty, zero, negative, suffix, fractional, exponent, oversized and repeated/structured limits were forwarded to repository reads instead of rejected. Sixteen scalar cases, one repeated-query case and two extended-parser shape cases failed. | Omitted limit retains 30; explicit limit must be a single canonical decimal integer 1–100. Invalid values return 400 before list/count calls. A request above 100 is rejected, not silently clamped. |

The baseline mocks permit invalid Prisma arguments so the assertions expose forwarding/acknowledgement behavior. This is not evidence of a live Prisma failure or a demonstrated cross-user mutation. Existing updateMany queries already include userId, and that protection remains unchanged. Zero affected rows still produce idempotent success without exposing whether a notification exists or belongs to another account.

Thirty-two baseline passes represent preserved behavior, not thirty-two newly repaired issues. After the initial focused pass, twelve control-character/line-ending cases and three browser-cookie cases were added; all passed without an additional production repair. The final focused suite has seventy-seven passing cases.

## Exact selective review scope

Production:

- herbalaibackend/src/controllers/notification.controller.ts: strict ID/limit parsing, default limit 30, explicit maximum 100, structured 400 errors, authentication checked before parsing in each action.
- herbalaibackend/src/utils/positive-int.ts: one shared canonical positive-string/maximum parser used for both notification IDs and limits. It refuses non-string values, aliases, unsafe integers and overflow rather than coercing them. Other controllers' parsing policies are deliberately not changed in this batch.

Tests:

- herbalaibackend/tests/notification-boundaries-http.test.ts: actual routes/repositories/authentication with isolated Prisma mocks. Covers malformed IDs and limits; default and valid limits; global unread totals larger than the displayed page; empty snapshots; exact owner predicates; ignored caller owner overrides; idempotent no-op read/read-all; cookie and bearer authentication; invalid, revoked and banned sessions; authentication-before-validation; dependency failure propagation and safe production error bodies. Mutation failures are not acknowledged as success or retried automatically.

Documentation: this report and appended MVP_BACKLOG_AUDIT_2026-10-03.md / NEXT_WORK_PLAN_2026-10-03.md statuses. The existing backend CI test glob discovers the new file; no additional workflow/dependency/schema/lockfile change was needed in this batch. Preserve eight unrelated evidence diffs and all preceding batches. Do not stage the whole root or include generated dist/.next output.

## Observed validation

| Check | Result and boundary |
| --- | --- |
| Initial HTTP baseline | 62 executed: 30 failed, 32 passed. Actual router/controller/repository/auth checks, mocked persistence. |
| Initial post-repair HTTP suite | 62 passed. |
| Extended focused HTTP suite | 77 passed, zero failed. Includes encoded control characters and cookie authentication; no new failure was inferred from those preservation cases. |
| Combined backend non-DB suite | 681 passed in 59 files, zero failed. Seventeen DB-dependent files excluded. Synthetic loopback database settings, test JWT secrets, log-only mail and no Gemini key. |
| Combined native/frontend suites | 311 passed across twelve scripts, zero failed/skipped. These rerun the accumulated frontend recovery checks; no frontend file was edited in this batch. |
| Backend lint, standalone typecheck and build | Passed. The source tsconfig excludes test files; Vitest executed the test code. Generated dist output remains ignored/local. |
| Whitespace and index | git diff --check passed; index empty. |
| Live baseline | Anonymous Library and Railway health returned 200; a normal anonymous /api/notifications GET returned 401. Remote main/deployment unchanged at e51942c. No authenticated write or adversarial input was sent to production. |

The combined executed total is 992 cases, not a sum including the repeated baseline/focused runs. Logged negative-test provider/dependency errors in the combined run are expected fixture outcomes; the final test summaries show zero failed cases. Mocked predicates prove which persistence arguments were supplied, not real SQL filtering, concurrency, transaction rollback or physical-device acceptance.

## Repeatable checks

From herbalaibackend, use only synthetic local test settings:

```powershell
$env:DATABASE_URL='postgresql://qa_only:qa_only@127.0.0.1:1/unused_qa?sslmode=disable'
$env:DIRECT_URL=$env:DATABASE_URL
$env:NODE_ENV='test'
$env:EMAIL_DELIVERY_MODE='log'
$env:GEMINI_API_KEY=''
$env:JWT_SECRET='qa_notification_only_secret_not_production'
$env:JWT_REFRESH_SECRET='qa_notification_only_refresh_not_production'
npx vitest run tests/notification-boundaries-http.test.ts --maxWorkers=2
npm run lint
npx tsc --noEmit
npm run build
```

The synthetic values above are not real credentials and must not be used in production. The combined non-DB exclusion list remains the preceding documented seventeen-file list; adding this mock-backed suite does not resolve those SQL gates. Full CI uses its isolated PostgreSQL service, never live Neon or the demo database. From the worktree root, node --test --test-concurrency=2 with the twelve scripts/*.test.mjs files reruns the native batch.

## Next work and remaining acceptance

1. Audit administrator audit-log pagination next. Source currently uses parseInt for limit and offset; malformed/oversized values are candidates, not yet reproduced or counted as repaired. Preserve administrator role/demotion/session protection and existing audit records. No table cleanup or log deletion is authorized by this audit.
2. Full isolated PostgreSQL CI remains required before the combined release. No local PostgreSQL/Docker is available; seventeen DB suites, including thirteen Library SQL cases, remain unexecuted locally.
3. After explicit combined publication, perform bounded authenticated notification list/read/read-all and recovery checks in connected contributor/admin sessions. Do not manufacture a production outage or mutate real user notifications as an adversarial test.
4. Root/media content/privacy review and formal academic traceability remain separate pending work. Participant UAT was deferred; physical-phone inspection remains a user report. Neither is counted as an automated acceptance result.

B01–B20 are accumulated local repair groups, not a claim that the whole system has no remaining defects. Publication remains on hold.
