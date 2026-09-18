# Astra High handoff — September 16, 2026

## Investigation and fixes — September 16, 2026

The observations below are the original handoff. Current disposition:

| Finding | Current status |
| --- | --- |
| Transaction-start timeout | Reproduced with controlled contention on a dedicated one-connection pool; the existing 12000 ms mitigation passed the same temporary-contention scenario. Original incident attribution remains unproven. |
| Raw database error in UI | Fixed: recognized Prisma/connection errors return safe messages without raw query details or stacks, including in development. Temporary failures return 503. |
| Review state race | Fixed: decisions atomically require Pending status and the reviewed revision. HTTP clients must send a revision for approval, return, and rejection. Losing decisions return 409 and do not send notifications. Rejection and its audit event now share one transaction. |
| Whitespace | Fixed in the three listed import blocks; full `git diff --check` passes. |
| Suspected herb data | Read-only query found no Herb matching local name `awdsawd` or scientific name `awds`; no existing records were changed or removed. |

### Timeout evidence

Run `npx tsx prisma/diagnose-transactions.ts` from `herbalaibackend`. It uses a dedicated pool, read-only SELECT operations, and controlled connection holds; it does not modify library data. The September 16 run measured:

- Cold transaction: 5076 ms; warm transaction: 850 ms.
- With the sole connection held, a 2000 ms acquisition limit reproduced `Unable to start a transaction in the given time`. The transaction callback did not execute; pool metrics were total=1, idle=0, waiting=1.
- With that connection held for 2500 ms, the configured 12000 ms limit succeeded in 3365 ms and returned the pool to idle=1, waiting=0.

These measurements demonstrate a failure mechanism and support the mitigation. They do not establish what caused the earlier untraced browser incident or prove reliability under production load. Database error logs now include the error code, transaction-start classification, pool counts, configured limits, elapsed time, and a request ID shared with slow-request logs. They omit raw database error messages, SQL, URLs, request bodies, and credentials. No automatic write retry was added.

### Regression coverage and limits

- `tests/review-publication-transaction.test.ts` now also verifies stale decisions, duplicate approval, and return/rejection after approval cannot change state or add audit entries. It exercises real database writes within an intentional rollback.
- `tests/review-decisions.test.ts` checks competing decision behavior with a modeled atomic claim and audit failure propagation. This modeled competition is not a simultaneous multi-connection PostgreSQL stress test.
- `tests/review-http.test.ts` verifies HTTP conflicts, required revisions, safe transaction errors, embedding failure blocking publication, successful side-effect ordering, notification/mail failure after publication, and image preservation on resubmission. Authentication and external dependencies are test fixtures; this is not a real contributor browser session. No email or provider requests are sent by these tests.
- Admin action failures keep existing reviewer-note state; the frontend now sends the displayed revision on return/reject. The success message no longer claims notification delivery when delivery may have failed.
- Backend build and frontend `tsc --noEmit` passed. The initial focused run passed 56 tests across eight files; follow-up HTTP/auth checks are recorded in `Docs/REVIEW_WORKFLOW_QA.md`. Runs overlap and should not be added as unique-test counts.

Remaining work: repeat the contributor and publication flows in an isolated browser environment, verify actual embedding/provider and mail integration with test delivery settings, and observe real workload timings. These remain validation gaps, not demonstrated defects. Refresh already-open admin pages to load the revision-bearing actions; older clients without revisions receive a validation error. Deploy frontend/backend changes together.

## Scope and status

This is a record of issues observed or identified during this task, not a complete project audit. The latest timeout mitigation and targeted tests are complete; end-to-end testing is not. Branch: `codex/readability-accessibility`. The workspace contains many pre-existing uncommitted changes: preserve them, inspect current diffs, and do not reset or commit without the user's instruction. Read applicable AGENTS.md files before editing.

## Original findings (see current disposition above)

### 1. Intermittent transaction-start timeout — priority high

- Observed in the authenticated admin browser on September 16 while requesting changes to synthetic suggestion 32 with valid notes.
- Exact UI error: `Transaction API error: Unable to start a transaction in the given time.`
- A single manual retry succeeded. The item disappeared from Pending Contributions, and REQUEST_CHANGES_SUGGESTION appeared in the audit log with the submitted notes.
- Root cause is NOT established. No concurrent pool/latency trace was captured. Do not claim that cold connections or saturation have been proven.
- Mitigation implemented: `src/config/env.ts` and `src/lib/prisma.ts` in the backend now configure `DB_TRANSACTION_MAX_WAIT_MS`, default 12000 ms, bounded 1000–60000 ms. Installed Prisma previously defaulted to 2000 ms; the pool connection timeout defaults to 10000 ms. `.env.example` documents the setting.
- Transaction execution timeout is unchanged. There are no automatic write retries. Changing the pool timeout can still leave the independently configured transaction wait shorter than the connection timeout.
- Next: reproduce with cold/idle connections and concurrent admin requests in an isolated environment; correlate request timing with pool total/idle/waiting metrics. Verify actual running configuration after restart. Do not increase every timeout or introduce blind write retries as a substitute for diagnosis.
- Acceptance: characterize the failure, add a regression test for the demonstrated cause, and confirm review actions finish once with consistent audit/state under the tested conditions.

### 2. Raw database error shown to administrators — priority medium

- The timeout above was displayed verbatim in the browser. It gives administrators no useful recovery guidance.
- Inspect backend error handling and frontend admin action error rendering. Return a stable, safe message for temporary database unavailability while retaining diagnostic detail in server logs without secrets.
- Acceptance: a simulated transaction-start failure produces actionable UI feedback, does not lose entered notes, and does not claim a write succeeded. Avoid telling users to retry unknown-commit failures unless the operation is safe to repeat.

### 3. Review state race risk — code-inspection finding, not reproduced

- `herbalaibackend/src/repositories/suggest.repository.ts`: `requestChanges` and `rejectSuggestion` update by ID alone. Their controller checks Pending status before the write, leaving a time-of-check/time-of-use window.
- A concurrent approval or other review action could change status between the check and the update. This has NOT been demonstrated in a concurrency test.
- Next: add a deterministic concurrent/stale-state test; enforce allowed status (and revision where appropriate) in the database write itself, returning a conflict when the precondition fails. Ensure failed actions cannot create misleading audit events or notifications.
- Acceptance: two conflicting decisions cannot both succeed or overwrite a completed decision; existing owner and revision protections remain intact.

### 4. Existing whitespace failures — priority low

- `git diff --check` currently reports trailing whitespace in import blocks in:
  - `herbalaifrontend/app/community/[id]/page.tsx` starting line 11.
  - `herbalaifrontend/app/community/page.tsx` starting line 10.
  - `herbalaifrontend/app/suggest/page.tsx` starting line 9.
- These were not modified during the timeout mitigation. Limit cleanup to whitespace; preserve other pending edits. This is not a demonstrated runtime defect.

## Validation gaps — not confirmed bugs

1. Contributor browser resubmission: still untested with a real authenticated contributor session. Verify returned notes, prefilled content, image preservation/replacement, validation, resubmission, Pending state, and cleared reviewed references. Do not fabricate sessions or weaken authentication.
2. Successful admin approval through the browser/HTTP path: still untested. Missing-classification blocking was verified, but that is not a successful publication test. Use an isolated database/environment for synthetic content, or obtain a genuinely reviewed submission before publishing to the actual library.
3. Gemini embedding generation in the publication path: the database integration test uses a synthetic 768-dimensional vector. It validates persistence, not the provider request or semantic quality.
4. Publication notifications/email and failure behavior: not verified end-to-end. Live email may be configured. Use a safe test delivery mode/recipient and never send synthetic QA mail to real users.
5. Timeout mitigation has passed configuration and repository tests, not a repeated browser/load reliability test. The rollback integration test overrides its outer transaction wait, so it does not demonstrate that the new default resolves the original browser timeout.
6. Dashboard showed 17 total herbs and an existing approved suggestion named `awdsawd` with scientific name `awds`. This is an observed data-quality concern, not proof that the current safeguards fail or that a corresponding herb is publicly visible. Inspect provenance and current library contents before deciding what to do; do not delete existing user data automatically.

## Previously addressed / environmental observations

- Audit snapshots rendered as `[object Object]`: fixed with expandable formatted before/after details; verified in the browser on September 14. Expanded notes also verified September 16.
- `ERR_CONNECTION_REFUSED` during the browser phase: both local servers were stopped. Starting frontend on port 3000 and backend on 5000 restored access. Not evidence of an application defect.
- Expired/absent browser login: user signed in again successfully; do not treat it as a confirmed authentication bug.
- Earlier user reports included TLS-mode warnings, port 5000 EADDRINUSE, email verification delivery, and library network/image issues. Relevant earlier changes exist, but this phase did not revalidate every historical report. Consult current code/tests and `Docs/REVIEW_WORKFLOW_QA.md`; do not label all historical reports either fixed or still broken without checking.

## Completed checks

- Admin: signed-in session, pending review card, structured references, missing classification blocked, missing review notes blocked, valid request-changes succeeded on retry, audit actor and exact notes verified.
- Repository/database: owner-only resubmit, reference reset, stale-edit guard, publication content/provenance/scoped references/embedding persistence/audit, approved-entry edit/resubmit blocking, and rollback cleanup.
- Latest command from backend: `npx vitest run tests/transaction-config.test.ts tests/review-publication-transaction.test.ts tests/suggestion-resubmit.test.ts tests/suggestion-review-edit.test.ts` — 12 tests passed.
- `npm run build` in backend passed. Earlier focused validation ran 20 tests successfully; these are separate runs, not 32 unique tests.
- Changed tracked timeout files passed focused `git diff --check`; full workspace check still has the whitespace issues above.

## Data safety and suggested order

Synthetic suggestion 32 and its two disabled QA accounts were cleaned up. The real administrator's QA audit event remains intentionally. No synthetic herb was committed to the public library. The rollback integration test discards its fixtures. `prisma/check-review-workflow.ts` leaves a pending fixture when run normally; use its targeted `--cleanup` afterward and NEVER approve that fixture into the public library.

Recommended order: diagnose timeout and safe error reporting; test/fix review races; contributor browser flow; isolated successful publication including provider and notification failures; final regression and formatting checks. Record evidence and remaining limitations rather than claiming production readiness from a passing build alone.
