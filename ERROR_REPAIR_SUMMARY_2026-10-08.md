# Confirmed errors, repairs and remaining gates — 8 October 2026

## Scope and current status

Consolidates the previously reproduced release/admin-edit and credit-wallet findings, plus the current regression-driven repair pass. Eleven confirmed findings have local repairs, including one test-harness reliability defect rather than an application defect. Earlier repairs remain part of the uncommitted candidate, not newly deployed fixes.

This is not a zero-bug or full live-MVP certificate. No commit, push, production database operation, email delivery or payment was performed in this pass. The user's running preview at port 4560 was preserved; a separate fixture-targeted build at port 4561 was used for Chrome acceptance. The earlier frontend-only redesign remains unchanged in intent: credits belong in Dr. Ai, not the main header.

## Consolidated confirmed findings

| ID | Priority | Confirmed finding and location | Repair / actual status |
| --- | --- | --- | --- |
| F01 | High release gate | General CI omitted the dedicated isolated database variable required by a database suite. `.github/workflows/ci.yml:71` | Local CI now supplies `HERBALAI_TEST_DATABASE_URL` using `127.0.0.1` and `herbalai_test`. Existing production-target refusal remains. A new full remote PostgreSQL/pgvector CI run is still required; current remote CI status was not rechecked or claimed green. |
| F02 | Medium | Admin preparation/content edits retained old embeddings. `herbalaibackend/src/controllers/herb.controller.ts:312` | Local repair generates the current-input vector before saving, validates 768 finite nonzero values, and commits text/vector/audit together. Generation failure saves nothing. Mocked admin-edit regressions pass; actual pgvector rollback acceptance remains pending. |
| F03 | Medium | Scientific-name-only edits bypassed duplicate identity checks. `herbalaibackend/src/controllers/herb.controller.ts:332` | Local repair checks canonical botanical identity and vernacular-name collisions against other records inside the guarded transaction, excluding the edited record. Mocked regressions pass; full database acceptance remains pending. |
| F04 | Low robustness | Numeric/invalid admin edit fields reached `.trim()` and returned a server error. `herbalaibackend/src/controllers/herb.controller.ts:294`; `herbalaibackend/src/schema/herb-update.schema.ts:5` | Local strict, bounded partial-edit validation returns 400 before database access. Existing tests cover invalid types, empty edits, blank required values and unexpected fields. |
| F05 | Medium UX | Automatic wallet reload erased checkout-failure/uncertain-payment feedback. `herbalaifrontend/components/CreditsWallet.tsx:24` | Earlier local repair separates wallet-loading errors from action errors. Automatic refresh clears only its loading error. Handler/effect regressions pass. |
| F06 | Medium functional | Selecting saved answer A then B could show A when its slower request completed last. A late failure could likewise replace the newer selection's feedback. `herbalaifrontend/components/CreditsWallet.tsx:95` | Newly reproduced: the expected newer answer was overwritten by the stale one. A monotonically increasing selection ref now permits only the latest selection to update the answer or error. Existing owner/unmount guards remain. Success-order and late-failure regressions pass. |
| F07 | Medium functional | A completed paid purchase retained the package's idempotency key indefinitely; another deliberate purchase of that package reused the already-paid order. `herbalaifrontend/components/CreditsWallet.tsx:45` | Newly reproduced: the second purchase sent the exact original request UUID after a PAID wallet result. Successful checkout responses now retain the validated server purchase UUID. An authenticated wallet refresh releases only keys whose tracked purchase ID is PAID and clears that completed checkout link. Pending, uncertain and unrelated paid records do not release the key. Duplicate-click and failed-retry protection remain. |
| F08 | Low maintenance | `matchesRegionalNames` was imported but never used. `herbalaifrontend/app/library/page.tsx:19` | Removed only the unused import. The active `getHerbRegionalNames` calls and regional-name display remain. Full frontend lint now reports zero errors and zero warnings. |
| F09 | Medium accessibility | Drawer focus wrapping omitted native disclosure summaries and counted hidden buttons inside collapsed details. Chrome returned layout rectangles for a hidden saved-answer button, so forward Tab escaped the intended page focus loop. `herbalaifrontend/components/AccessibleDialog.tsx:32` | Include summaries and exclude descendants of closed details except their summary. Two extracted-handler regressions failed before repair. Rebuilt Chrome acceptance observed Shift+Tab from Close reaching Saved answers and forward Tab returning to Close; both remained inside the open dialog. No styling change. |
| F10 | Test reliability, not a production defect | The refresh-timeout HTTP test shortened initial requests as well as refresh to 150 ms. During a parallel build/test run, initial requests timed out before reaching the refresh path, producing an empty refresh observation. `scripts/auth-refresh.test.mjs:571` | Shorten only the deliberately unresponsive refresh request. Preserve normal request timeouts and all refresh/queue expectations. All 34 refresh tests and the complete final Node suite pass. Production timeout behavior is unchanged. |
| F11 | Low UX | A failed first wallet request displayed the error but continued saying Loading wallet indefinitely. Reproduced in Chrome with a synthetic wallet 503. `herbalaifrontend/components/CreditsWallet.tsx:120` | The status now says Wallet unavailable. Try Refresh wallet. A rendered-state regression failed before repair and passed afterward; the exact corrected message was observed in the final compiled Chrome preview. |

The original issue descriptions and historical release facts remain in `Docs/testing/MVP_FOCUSED_ERROR_AUDIT_2026-10-08.md`. Wallet design, schema, transaction semantics, payment restrictions and previous validation remain in `Docs/testing/DR_AI_CREDITS_2026-10-08.md`.

## Reproduction and safeguards

Before the current wallet repair, two desired-behavior tests failed using the extracted actual handlers:

1. A later-arriving first response replaced the newer selected answer.
2. A paid checkout's next package purchase retained the old request UUID.

After repair, the focused suite passes. Additional checks ensure a late first failure cannot erase the newer success; pending/uncertain/unrelated payment records retain checkout keys; owner changes and unmounts reject stale results; unsafe checkout URLs remain rejected; and a zero-credit response preserves the typed question.

No payment state is inferred from a return URL, a balance increase alone or a client flag. Only an authenticated wallet result matching the tracked purchase ID and `PAID` releases its frontend retry key. This change does not grant credits: backend signed-webhook and authoritative-provider checks remain responsible for settlement. TEST mode stays default-off, and real payments remain disabled.

## Executed validation in this pass

| Check | Observed result / limits |
| --- | --- |
| Focused wallet / stream regression suite | **54 passed**. Includes the two initial red regressions and their repairs; these tests are also included in the frontend total below. |
| All Node frontend regression files in root `scripts` and `herbalaifrontend/scripts` | **393 passed**, zero failures/skips. Includes footer tests, not just the root scripts. |
| Offline herb research generator regressions | **7 passed**. Nonwriting defaults, overwrite refusal and scientific-identity preservation checks; no live herb edit. |
| Selected backend non-database suites | **2,026 passed across 123 files**. Known database-backed suites were explicitly excluded; this is not the complete backend suite. |
| Real isolated wallet PostgreSQL suite | **26 passed**. Actual SQL transactions, owner/session guards and loopback HTTP paths; provider/AI boundaries are mocked. Not real GCash acceptance. |
| Backend build and source lint | Passed. |
| Frontend TypeScript and full lint | Passed; zero lint errors and zero warnings. |
| Frontend production build | Passed with 24 generated pages, in an outside-Git copy using webpack and only synthetic loopback API/socket settings. The running preview's `.next` directory was not rebuilt. |
| Patch whitespace check | Passed. |
| Database cleanup | Verified `herbalai_test`, loopback port 55438, zero remaining `qa_credits_*` schemas and zero public tables. Temporary PostgreSQL was stopped afterward. |

The initial broader backend attempt excluded `*database*` names but encountered other genuinely database-backed files, including recovery, suggestions, moderation and session tests. It was interrupted after unavailable-loopback-database fixture errors. These are environment failures, not newly proven production defects. The successful selected-unit rerun excludes those files explicitly instead of changing their expectations or manufacturing passes. Its omissions are listed below.

An attempted cleanup verification using `psql.exe` found that executable absent from the portable runtime. Verification was then completed with the already installed `pg` client against the same explicitly checked loopback database; the server was stopped again. This tool limitation is not an application error.

### Backend scope omitted from the selected-unit rerun

All `*database*` files plus: `auth`, `account-recovery`, `audited-mutations`, `chat`, `forum-moderation-flow`, `herb-catalog-remediation`, `herb-governance`, `herbs`, `knowledge-authenticated-flow`, `message-authenticated-flow`, `profile`, `session-rotation`, `suggestion-validation`, `system-features`, and `review-publication-transaction` test files. The separate 26-case wallet database run is counted separately, not used to claim those omitted system flows passed.

## Remaining gates, not closed defects

1. **Complete isolated PostgreSQL/pgvector acceptance:** run the full migration history and full backend suite, including real admin-edit vector/audit rollback. Portable local PostgreSQL has no pgvector extension. Do not disable these gates, replace vector checks with text mocks or point them at production Neon.
2. **Provider-return browser acceptance:** local Chrome desktop/mobile layout, focus, closing, draft retention, saved-answer reopening, checkout-failure feedback, zero/off modes and session recovery were inspected in the separate port-4561 preview. Genuine provider checkout/return and account-switch acceptance still require the merchant sandbox. Synthetic local UI checks are not real GCash acceptance.
3. **Genuine merchant sandbox acceptance:** the user has no PayMongo merchant test account yet. GCash activation, private test-key/webhook setup and actual provider simulated Authorize/Fail, retry and payment-confirmation flows have not been executed. No real PIN, OTP or scanned QR payment should be used.
4. **Before real-money release:** approved prices, refund/chargeback reconciliation, operational reconciliation/alerts and purchase/privacy/retention policy are still required. This TEST-only prototype cannot be activated as paid production merely by renaming its mode.
5. **Human acceptance boundaries:** no new physical-device inspection, participant signatures or live manual-password outcome was invented. Earlier user-reported checks remain separate historical evidence.

## Evidence outside Git

- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-wallet-before.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-wallet-after.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-frontend-tests.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-frontend-lint.log` (before cleanup)
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-frontend-lint-after.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-frontend-build.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-backend-nondb.log` (interrupted broader attempt)
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-backend-isolated-unit.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-wallet-real-db.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-wallet-db-cleanup.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-research-generator.log`

The copied frontend build is fixture-targeted local validation output, not a deployable production build. Private environment files were not copied. Unrelated working-tree changes and concurrent earlier commits were preserved. Publication requires a separate reviewed release decision.

## Release-priority continuation: final observed validation

- **397 frontend Node tests passed**, zero failures/skips, including the new focus-wrap, strict CI scheduling and unavailable-wallet regressions. Final output: `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-frontend-final-verified.log`.
- **18 focused backend tests passed**: six fail-closed database-target boundary cases and twelve existing mocked administrator-edit cases. Output: `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/errors-admin-edit-unit-final.log`. These do not claim actual vector/audit database acceptance.
- Added **seven real PostgreSQL/pgvector administrator-edit cases** covering text/vector/audit commit, real audit foreign-key and vector SQL rollback, embedding failure, stale concurrent edits, canonical identity contention and clearing unpublished vectors. They remain **not executed locally** because pgvector is unavailable. CI now strictly typechecks their fixtures and runs the dedicated fail-closed gate before the complete suite. Both actual Prisma and dedicated test URLs must target the same loopback `herbalai_test` port; provider hosts are refused.
- Strict administrator-test TypeScript compilation and explicit new-test lint passed. Frontend TypeScript/full lint passed; final changed components were typechecked/linted again after the last repair.
- Final isolated production build passed with **24 pages**. Output: `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-acceptance-build-final.log`. It contains only loopback fixture endpoints and must never be copied into deployment.

### Actual Chrome acceptance, synthetic local environment only

At the observed desktop viewport **1366 x 577**, the right drawer measured **448 x 577**, aligned at the right edge, with no horizontal overflow. At **390 x 844**, the bottom sheet measured **390 x 717.39** (85dvh), bottom-aligned, with no horizontal overflow; its Close control remained a visible **44 x 44** target. This is responsive emulation, not physical-phone evidence.

Observed checks: collapsed disclosures; a disabled GCash button without test configuration; saved-answer retrieval; Escape and Close; return focus to Manage credits; preservation of `TEST ONLY preserved draft.` across opening/closing; both repaired keyboard-wrap directions; retained checkout error after automatic wallet reload and drawer close/reopen; zero-credit helper; no wallet summary/header link in OFF mode; the final unavailable-wallet status; session 503 displaying Connection interrupted instead of logging out; successful Try again recovery after restoring the local fixture; and signed-out chat redirect to Sign In with the chat callback retained.

No AI prompt or provider payment was submitted. The checkout-failure click called only the synthetic loopback endpoint. The fixture's unsupported catalog/logout endpoints produced 404 log entries; those omitted fixture responses are not counted as application defects. Native screenshots were displayed during inspection, but final cropped screenshot export timed out in Chrome's capture API; no saved screenshot artifact is claimed. DOM state and measured geometry remain the observed evidence.

### Public-release decision

Fixes are local and uncommitted. Before pushing a deployable bundle, run the complete isolated PostgreSQL/pgvector CI and review migration/release scope. Keep credits OFF on public production until real merchant sandbox acceptance and a separate activation decision. Real-money reconciliation, policy and operational gates remain open. No statement here certifies all historical MVP flows or zero remaining bugs.
