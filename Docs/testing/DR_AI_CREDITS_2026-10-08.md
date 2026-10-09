# Dr. Ai credits — test-only implementation and handoff

Date: 2026-10-08, Asia/Manila. Local prototype only; not released or approved for real money.

10 October update: the reviewed local code now defaults to **10 one-time starting credits** when TEST credit mode is enabled. Credit enforcement still defaults to off. Existing wallets are not refilled by this change, login or refresh. The separate two-credit manual depletion profile is intentionally unchanged. Validation and release boundaries are recorded in `STARTING_CREDITS_2026-10-10.md`; this change is not yet a live deployment.

## Implemented

- Owner-scoped persistent wallet, ledger, purchase history and saved completed answers; additive Prisma migration `20261008110000_add_test_credit_wallet`.
- Server-configured credit bundles; browser submits only package ID and a UUID, never the amount, credit count or account owner.
- PayMongo hosted TEST checkout. Raw-body HMAC signatures are verified with a five-minute timestamp tolerance. Only test paid-checkout events are accepted; authoritative provider retrieval must match checkout ID, order reference, paid amount/PHP currency and non-refunded/non-disputed state before granting credits.
- Wallet row locks, unique payment IDs and ledger operation keys protect against repeated top-ups. Returning from checkout alone never grants credits.
- One credit reserved per question, settled only after a nonempty completed answer is saved. Failed/incomplete generation releases the reservation. Completed answers replay without another generation or charge; conflicting/pending request IDs are rejected.
- The frontend keeps one question UUID across auth refresh, preserves failed question drafts, displays insufficient-credit feedback, and provides `/credits` with balance, packages, history and saved responses. Old-account async responses cannot expose answers or redirect after an account switch.
- Ambiguous checkout creation becomes `UNCERTAIN`; the same key cannot silently create another purchase. Abandoned question reservations expire after three minutes and are refunded on the next wallet operation, not by a background scheduler.

Default `DR_AI_CREDITS_MODE=off` preserves existing free Dr. Ai access and avoids querying the new wallet tables. Only `off` and `test` are supported. Live mode and `sk_live_` keys are rejected. Library access stays free. No private credentials, actual payment, live database migration, commit or push was performed for this batch.

Completed safety refusals and completed educational fallback responses count as completed answers. If the network disconnects after completion commits, the saved answer remains available and that charge stands. An incomplete stream is not settled. Database-unavailable refunds wait for recovery and the next wallet operation.

## Isolated sandbox setup

First apply the additive migration through Prisma against an explicitly verified isolated database, never the production Neon target. Use private environment variables:

```dotenv
DR_AI_CREDITS_MODE=test
DR_AI_TRIAL_CREDITS=10
DR_AI_CREDIT_PACKAGES=[{"id":"test-pack","name":"TEST ONLY sample","credits":10,"amountMinor":10000}]
PAYMONGO_TEST_SECRET_KEY=<private merchant test key>
PAYMONGO_TEST_WEBHOOK_SECRET=<private test webhook signing secret>
```

The sample PHP 100.00 amount is synthetic, not an approved retail price. TEST-mode defaults are ten trial credits, no bundles and no secrets; mode still defaults to off. Set `FRONTEND_URL` to the correct secure frontend; successful checkout returns to `/credits` and cancellation returns to `/chat`. Register the test `checkout_session.payment.paid` webhook at the HTTPS backend `/api/credits/webhook`. Missing secrets disable checkout. Do not place keys in Git, screenshots or chat.

The adapter uses documented POST `/v2/checkout_sessions` for creation and GET `/v1/checkout_sessions/{id}` for retrieval:
- [Hosted checkout quick start](https://docs.paymongo.com/docs/payment-channels-hosted-checkout-quick-start)
- [Retrieve checkout session](https://docs.paymongo.com/re/reference/get_checkout_sessions)
- [Checkout session resource](https://docs.paymongo.com/reference/checkout-session-resource)
- [Webhook setup](https://docs.paymongo.com/docs/developer-tools-webhook-setup-management)

Following the user's explicit GCash choice, the prototype now requests only `gcash` as its test checkout payment method, replacing the earlier card-only configuration. [PayMongo Hosted Checkout](https://docs.paymongo.com/docs/payment-channels-hosted-checkout) documents this payment-method identifier. Use only the provider's simulated Authorize/Fail test flow, never real GCash credentials, PINs, OTPs, bank-app payments or scanned QR codes. [PayMongo payment testing](https://docs.paymongo.com/docs/payment-acceptance-testing) documents simulated e-wallet authorization and warns that scanning a test QR Ph code can process a real transaction. GCash availability still depends on the merchant's account configuration; a mocked adapter test cannot prove it is enabled.

No merchant account, KYC status or real provider transaction was verified. The user explicitly reported that they do not yet have a PayMongo test account. Documentation review and mocked fetch tests are not provider acceptance. The [official hosted-checkout quick start](https://docs.paymongo.com/docs/payment-channels-hosted-checkout-quick-start) lists a KYC-completed merchant account and private test secret key as prerequisites; account creation/verification remains a user action.

## Observed validation

| Check | Observed outcome |
| --- | --- |
| Focused backend configuration/provider, HTTP, chat settlement and herb-admin-edit suites | 51 passed; rerun with database suite: 77 passed across five files |
| Real PostgreSQL credit suite | 26 passed on isolated, loopback PostgreSQL 16.14; replaces the earlier 15 skipped result |
| Focused frontend wallet/stream tests | Latest GCash rerun: 43 passed; earlier wallet-feedback run: 42 passed |
| Complete frontend Node regression scripts | Latest rerun: 381 passed, zero failures |
| Backend Prisma generation, typecheck, build and source lint | Passed |
| Frontend typecheck and production build including `/credits` | Passed |
| Frontend lint | Zero errors; one unrelated existing Library `matchesRegionalNames` unused-import warning |
| Broader backend run with known DB suites excluded | 2029 passed, one failed: `auth.test.ts` expected 401 but received unavailable-database 503 |
| Browser preview | Blocked by the environment policy when starting the frontend; no UI/mobile acceptance claimed |
| Production or merchant sandbox checkout | Not executed |

Initial frontend extracted-handler tests lacked the new credit setter/error class; the harness was updated and the full suite rerun successfully. An earlier wider backend attempt also encountered unavailable-database fixtures and was stopped. All attempted DB connections were explicitly overridden to loopback `herbalai_test`, not production. The remaining backend failure is not proof of a live login defect or a full backend acceptance pass.

Logs outside Git:
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-nondb-tests.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-frontend-tests.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-real-pg-tests.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-feedback-tests.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-test-channel-before.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-feedback-backend.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-frontend-build.log`

A synthetic loopback-only fixture was prepared outside Git and stopped after preview startup was blocked. It contains no credentials, database connections or provider calls. Do not include that fixture or the logs in a production release.

The checkout started at `245c4286bbc190b9cb1904807983afbd2f3f7e0d`. Another actor committed unrelated UI changes during the session, advancing HEAD to `245dafcc0977f1991e4d4156be70edaa52765f91`; those changes were preserved, not reset or authored by this batch.

## Continued real database validation

The initial missing-local-database blocker was resolved with a temporary portable PostgreSQL binary installed outside Git, from `@embedded-postgres/windows-x64@16.14.0-beta.17`. No repository dependency, Windows service, firewall rule or production setting was changed. The listener was bound to `127.0.0.1:55438`; database `herbalai_test` used UTC sessions and synthetic local credentials. `DATABASE_URL`, `DIRECT_URL` and `HERBALAI_TEST_DATABASE_URL` were explicitly overridden to this loopback database for the test commands.

The suite creates a random private schema, a minimal User authentication fixture and the actual additive wallet migration, and drops the private schema afterward. It exercises real SQL transactions, real application JWT/session validation, HTTP routes and raw-body webhook signature verification. AI generation and authoritative payment retrieval remain mocked: these checks do not prove actual PayMongo checkout or actual Gemini response delivery. It does not apply the complete system migration history; this portable server has no pgvector extension.

All 26 database tests passed, including:

- Concurrent trial grants and question reservations; no negative balance.
- Duplicate checkout confirmation, request replay and owner-only saved answers.
- Top-up, debit and refund ledger failures roll back associated balance/status writes; subsequent safe retries settle exactly once.
- A payment ID cannot be credited to a second order; mismatched amount, currency, checkout identity, reference, refunds and disputes cannot grant credits.
- Reservation expiry refunds persist even when an obsolete request key is rejected; simultaneous completion/cancellation cannot both charge and refund.
- Missing JWT, revoked sessions and banned accounts cannot write a wallet.
- Authenticated checkout, a locally signed webhook and its duplicate, one answered question, replay and private saved-answer retrieval run through real HTTP handlers.
- Failed JSON/SSE generation refunds. Two loopback HTTP client-disconnect tests abort an in-progress JSON response or partially emitted stream and observe one refund, a restored balance and no completion.

The original 15 database cases first passed. Four subsequently added authenticated HTTP cases initially failed because the test adapter generated queries against `public`, whereas its User fixture lived in the random schema. Setting `PrismaPg(pool, { schema })` corrected the fixture isolation. The expanded 24-case suite then passed; the final 26-case suite and 51 existing focused tests passed together (77 total). This was a test setup defect, not evidence of a production authentication failure. A missing isolated URL now causes this suite to fail explicitly in CI rather than silently skip.

The historical wider-backend result (2029 passes and one unavailable-database assertion failure) remains a historical attempt, not a newly passed complete suite. Full migration/pgvector and actual admin-edit vector rollback checks remain outstanding. Browser preview is still blocked by environment policy; no alternate launcher was used to bypass that restriction. Genuine provider credentials were not available or fabricated, and no real payment was made.

Backend build/typecheck and source lint passed again after the extended tests. Final cleanup verification found zero remaining `qa_credits_*` schemas and zero public tables in this isolated database. The temporary PostgreSQL server was stopped, and port 55438 no longer had a listening connection. Its stopped runtime and synthetic local data remain outside Git for optional reuse; they are not production assets.

## Audit repairs included locally

The four reproduced findings from `MVP_FOCUSED_ERROR_AUDIT_2026-10-08.md` have focused local repairs: missing isolated CI DB variable, stale admin-edit embeddings, canonical scientific-identity edit collisions and malformed partial input. Admin text/vector/audit writes share a transaction; generation failure saves nothing and concurrent edits are rejected. Source certification is not inferred from an admin edit. Twelve focused mocked admin-edit tests passed; real PostgreSQL vector/audit rollback verification remains a release gate.

## Wallet feedback and test-payment safeguards

An extracted real-handler/effect regression reproduced a checkout error being immediately erased: purchase failure triggered a wallet revision, and successful balance reload called `setError('')`. Wallet loading now has a separate error state, so automatic balance refresh cannot erase an uncertain purchase notification. Explicit Refresh or a new user action can dismiss the old action message. Five additional regressions cover retained purchase feedback, separate load failure, recovery, cancellation and a recoverable session outage. The initial regression failed with an empty notification; all 42 focused frontend tests then passed. This is automated handler/effect evidence, not an observed browser pass.

Provider request inspection also confirmed the old adapter selected `qrph`; a regression asserting card-only test checkout failed before the repair and passed afterward. At that stage the adapter selected `card`, and the wallet explicitly said not to enter personal payment details. The later explicit GCash request superseded this configuration, as recorded below. All 51 focused non-database backend tests passed after the card-only change; backend build/typecheck and source lint passed again. The prior 26 real wallet database checks remain an earlier result; they were not rerun in this continuation because neither their transaction implementation nor schema changed.

The user reported a running preview, but a fresh connection probe to `127.0.0.1:4560` was refused and no listener was present. The synthetic API at port 4559 responded. A Codex browser attachment timed out before a usable preview opened. These are recorded as environment/connection limitations, not a reproduced application failure. Desktop/mobile acceptance remains pending until a reachable frontend can be inspected.

After the user renewed authorization, one standard `npm run start -- --hostname 127.0.0.1 --port 4560` attempt was rejected by tool policy. No alternate launcher or browser/shell bypass was attempted. Frontend typecheck, lint and a fresh production build with the two repairs passed; lint retained the one existing Library unused-import warning. The compiled rewrite manifest was explicitly checked to point `/api/:path*` only at `http://127.0.0.1:4559/api/:path*`, not production. The synthetic API was then stopped. The prepared build must not be deployed: it is a local preview artifact pointing at a fixture. The complete frontend regression rerun recorded 381 passes; that is the current script-set result, not a claim that all additional tests in the repository were authored by this batch.

## GCash selection and current preview status

The user explicitly selected GCash. Checkout creation now requests only `payment_method_types: ['gcash']`, and the wallet button says “Open GCash test checkout.” The page identifies PayMongo and warns that test mode uses simulated Authorize/Fail controls, not real GCash payments, PINs, OTPs or scanned QR codes. The provider regression checks the exact GCash request, and a frontend regression checks the disclosure and button label.

Observed after this change: 39 focused backend provider/chat/HTTP tests passed; 43 frontend wallet/stream tests passed; backend build and source lint, frontend typecheck and targeted credits-page lint passed. The prior real PostgreSQL and full frontend results above were not rerun for this payment-method-only change. Genuine provider acceptance remains untested: no merchant account or private keys are available, and no payment was attempted.

A fresh port probe now confirms a frontend listener on `127.0.0.1:4560`. The synthetic API fixture was restarted on loopback port 4559 outside Git. The user chose to keep the existing frontend preview running, so its previous production build was not overwritten or restarted. It still serves the earlier compiled UI; visible GCash acceptance requires a later stopped-server rebuild and restart. Do not count browser/mobile GCash validation as passed. No commit, push, production environment change or live migration was performed.

Latest logs outside Git:
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-gcash-tests.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-gcash-frontend.log`

## In-chat wallet redesign, 8 October

The user requested no additional main-header button and approved credit management inside Dr. Ai. This continuation changes frontend code only; the earlier backend prototype and unrelated working-tree changes were preserved.

- Moved the balance summary from below the chat header to immediately above the message composer. A quiet text control opens credit management; a zero balance adds an explicit recovery hint without clearing the typed question.
- Extracted the existing wallet state, owner checks, checkout request keys, feedback and saved-answer handling into `components/CreditsWallet.tsx`. The chat summary/panel and existing `/credits` return route reuse this component rather than duplicate payment logic. Account-keyed mounts reset transient wallet state on account changes.
- Reused `AccessibleDialog` with an optional drawer variant, preserving its default centered layout for existing callers. Native modal semantics, Escape closing, focus containment, focus restoration and body scroll locking remain in the existing shared component. CSS defines a right-side desktop panel and a mobile bottom sheet with bounded height and safe-area padding.
- Kept package selection prominent and purchase history, ledger activity and saved answers in collapsed sections. Existing theme tokens and the GCash test-mode disclosures remain; no main navigation item, backend endpoint or live-payment option was added.
- A validated checkout URL is now offered through an explicit `noopener noreferrer` new-tab link instead of navigating the conversation away. Checkout remains server-priced and idempotent; other owners' links/answers and late responses are not displayed. Returning focus/visibility refreshes the wallet with a one-second event coalescing guard, without clearing checkout errors. No client-side payment grant was introduced.

Observed validation: 50 focused wallet/stream tests passed, including rendered JSX checks with controlled hook/auth state, extracted real-handler/effect checks and the existing stream/draft tests. All 385 frontend Node regressions passed. Frontend typecheck and targeted lint passed. The rendered tests substitute the dialog shell; they do not certify actual browser focus behavior, mobile layout or genuine payment acceptance. An initial render harness failed because its default dialog mock lacked CommonJS ES-module metadata; correcting that test mock produced the passing rerun, not a production repair.

An isolated copy outside Git was used for production-build validation so the user's running port-4560 preview and its `.next` artifacts were not overwritten. The copy excludes private environment files and uses only the loopback synthetic API/socket configuration. Both its initial and final account-keyed webpack production builds passed with 24 generated pages. No new preview server was launched. The existing preview still serves the old compiled UI; interactive desktop/mobile acceptance of this redesign remains pending. No commit, push, production migration, merchant setup or payment occurred.

Continuation logs outside Git:
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-drawer-focused.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-drawer-frontend.log`
- `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-drawer-build.log`

The stopped isolated build copy is `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-drawer-build-20261008`; it is not a production artifact and must not be deployed with fixture rewrites.

## Continue in this order

**Subsequent error-repair pass:** root `ERROR_REPAIR_SUMMARY_2026-10-08.md` consolidates current findings and gates. Two actual-handler regressions reproduced stale saved-answer replacement and reuse of a paid order's checkout request key. Latest-selection guards now suppress stale answer/error results; validated purchase UUID tracking releases retry keys only after the matching authenticated PAID wallet record. Pending/uncertain/unrelated records retain keys. Removed the unused Library import. Latest checks: 54 focused wallet/stream tests, 393 frontend regressions (including the nested footer file), 2,026 selected backend unit tests and 26 re-executed real wallet database tests passed; both builds/typechecks/lint passed. The broader initial DB-unavailable attempt is documented separately and not counted as passed. Local database cleanup verified zero QA schemas/public tables and stopped the loopback server. The running older preview, production settings and deployment branches remain untouched. Genuine merchant and complete pgvector/browser gates remain open.

1. Run the complete migration history and backend suite on isolated PostgreSQL/pgvector, including real admin-edit vector/audit rollback checks. The 26 wallet transaction/HTTP checks now pass locally; preserve their explicit CI database gate. Do not treat this wallet-specific fixture as complete system database acceptance.
2. Start a loopback frontend preview pointed only at a synthetic fixture. Inspect desktop/mobile wallet, disabled mode, history, saved answers, zero-credit feedback and session transitions. Emulation is not physical-device evidence.
3. After the user has a merchant test account with GCash available, configure private test keys and a test webhook on an explicitly isolated HTTPS backend. Verify GCash checkout using only the provider's simulated Authorize/Fail controls, cancelled/failed payment, signed retries, no return-URL grant, exactly-once top-up, completed question, incomplete stream refund, expired reservation and saved-answer reopening. Never enter a real GCash PIN/OTP, scan/pay a QR code, expose a local service through a tunnel without an explicit deployment decision, or configure production for this test.
4. Decide actual bundles/prices and treatment of existing/demo users. Before real money, implement refund/chargeback reconciliation, operational reconciliation/alerts, purchase/privacy/retention policies and merchant acceptance. Do not simply rename `test` to live.
5. Review this bundle separately from unrelated UI work, pass isolated CI, then obtain a separate publication decision. No production deployment is authorized by this report.

This report does not certify zero bugs, completed participant UAT or payment readiness.
