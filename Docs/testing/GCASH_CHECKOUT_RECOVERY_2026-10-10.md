# GCash TEST checkout recovery — 10 October 2026

## Scope and release status

Audited the deployed credits flow at `60be4ffce8ec4ee21499771b2f245e46ed6a1b40`, using only the previously authorized disposable contributor `creditqa_mv28uwge` / **TEST ONLY Credit Exhaustion QA**. Its balance started and ended at zero. The checkout repair described below is local and uncommitted; it is NOT deployed. No real payment, merchant setting, admin password, trial allocation, verification policy or production origin rule changed.

## Observed live checks

| Check | Observed result |
| --- | --- |
| Create one GCash TEST checkout | Genuine provider checkout, `livemode: false`; zero balance remained zero |
| Replay the original checkout UUID | Same purchase and checkout; no extra purchase or grant |
| Provider return/back navigation | Returned to `/chat`; no payment completed and no credit granted |
| Deliberately fail a simulated attempt | Clicked **Expire/Fail Test Payment** on the provider's GCash Test Payment Page, never Authorize; the simulator subsequently displayed expired source status |
| Authoritative provider read | Checkout session remained `active`, payment intent `awaiting_payment_method`, payment statuses `["failed"]`; application purchase remained `PENDING` and balance zero |
| Simulate a reload's new purchase UUID | HTTP 201 created a DISTINCT second checkout for the SAME owner and package; two pending purchases, zero credits |
| Session cleanup | Revoked only QA sessions; the issued access token returned HTTP 401; QA account and ledger retained |
| Original browser | **Admin Kevs / admin**, still signed in with **10 test credits**, unchanged |

The two pending QA purchase IDs are `2cfe7802-b73d-499a-859c-da99baa69a93` and `e0f36049-22f2-41c5-bb22-b188b7de5074`. They are retained as evidence, not presented as paid or cancelled. No real GCash PIN, OTP, QR payment or customer financial information was entered. The synthetic payer used a reserved `example.invalid` address.

A failed payment attempt is NOT equivalent to a terminal cancelled checkout. PayMongo documents reuse of the same checkout across failed attempts and explicit, rather than automatic, checkout expiry. Accordingly, returning to the app or failing one simulated attempt does not warrant marking the application order paid/cancelled/failed. Sources: [Payment channels key concepts](https://docs.paymongo.com/docs/payment-channels-key-concepts), [Payment acceptance key concepts](https://docs.paymongo.com/docs/payment-acceptance-key-concepts), [Checkout session resource](https://docs.paymongo.com/reference/checkout-session-resource).

## Confirmed issue and focused local repair

**Duplicate unpaid checkout after reload.** `CreditsWallet.tsx` kept purchase request UUIDs and links only in memory. Reload lost both. The backend accepted a fresh UUID while another order for the same owner/package was pending; the wallet response provided neither the original request UUID nor checkout URL.

- `credits.repository.ts`: expose request UUID and checkout URL only in the authenticated owner's purchase history. Under the existing wallet-row transaction lock, reject a new UUID with HTTP 409 while the same owner/package has a `CREATING`, `PENDING` or `UNCERTAIN` order. Original UUID replay remains idempotent; another account or package is independent; a deliberate new purchase is allowed after payment.
- `lib/credits.ts`: accept optional recovery metadata for rolling-deployment compatibility, and return resume links only for pending orders with validated HTTPS `checkout.paymongo.com` URLs and no embedded credentials.
- `CreditsWallet.tsx`: recover the pending request UUID from wallet history after reload without replacing an in-flight request. Show **Resume GCash test checkout** inside existing purchase history, opening a separate protected tab. Existing styling, upper credit toolbar, Back action and no-real-money disclosures remain intact.
- Regression tests cover actual PostgreSQL concurrency and owner/package isolation, pending/uncertain duplicate protection, paid transitions, reload recovery, rejected-key recovery, safe resume links and account-switch privacy.

No schema migration is needed: the recovery fields already exist. No provider call was moved inside the wallet lock. Existing top-up validation, signed TEST webhooks and zero-credit enforcement are unchanged.

## Observed automated validation

- Before repair: frontend credits suite **27 passed / 1 failed**; real isolated PostgreSQL credits suite **28 passed / 2 failed**, reproducing missing reload recovery and duplicate pending/uncertain checkout creation.
- After repair: `node --test scripts/credits.test.mjs scripts/dr-ai-stream.test.mjs` — **60 passed, 0 failed, 0 skipped**.
- Five backend credits suites (`credits-database`, `credits-http`, `credits-provider`, `credits-config`, `credits-chat`) — **82 passed, 0 failed**. The database suite uses a random private schema in loopback `herbalai_test`, not Neon.
- Backend lint and TypeScript build passed. Frontend focused ESLint and `tsc --noEmit` passed. `git diff --check` passed.
- Frontend optimized production build passed with `NEXT_CONSTRAINED_BUILD=1`, after the separate successful TypeScript check. Its API target was loopback-only; this local build is not a production deployment or a live-fix receipt.
- A broader backend run excluding only `*database*` filenames was NOT a clean full-suite pass: **131 files passed / 15 failed; 2239 tests passed / 17 failed / 77 skipped**. Other database-dependent tests do not all have `database` in their names. They failed setup/requests because the portable wallet-only database lacks the full public application schema (`public.User`, `public.Herb`, etc.). This is a local full-suite prerequisite blocker, not evidence that the production recovery/auth/herb flows broke. Do not cite this run as complete MVP acceptance. Full isolated PostgreSQL/pgvector CI is still required before release.

## Evidence and cleanup

Screenshots and private QA tooling remain outside Git in the task output directory. `gcash-test-failed-20261010.png` records the genuine provider failure result; `checkout-audit-admin-restored-20261010.png` records the original admin account and unchanged ten-credit balance. No authentication/merchant/database secrets are included in this report or the source changes. The temporary provider tab was closed. The original admin chat remains open. QA sessions were revoked without altering other users.

The isolated portable PostgreSQL process started for this run was stopped after validation; loopback port 55438 has no remaining listener. No user's running preview was stopped. The updated frontend build remains local and is configured for a loopback API, not a credential-bearing fixture or production database.

## Remaining release gates

1. Review only this five-code/test-file repair plus this report/root review, preserving unrelated document edits and excluding private helper files, credentials, fixtures and build artifacts.
2. Run the complete isolated PostgreSQL/pgvector CI; review any genuine failure before publication. The local frontend production build passed, as recorded above.
3. Release the reviewed bundle only with publication authorization, then verify the authenticated owner sees a resumable existing checkout after a real browser reload; the same UUID returns the same order and a fresh UUID cannot duplicate it. No live post-repair result is claimed yet.
4. For an `UNCERTAIN` provider creation or a checkout explicitly expired/archived by an operator, reconciliation is required before releasing that owner/package for a new order. This repair intentionally refuses blind retries; it does not implement an operator reconciliation interface or automatically expire provider sessions.
5. Genuine sandbox successful payment/signed-webhook acceptance and physical-device/participant gates remain separate evidence; this failure-only run does not replace them or enable real-money sales.

## Authorized release continuation

The user subsequently requested deployment. Fetching the remote showed four newer live-branch commits, ending at `e03433d`, after the previously audited toolbar release. These herb/image/language changes were preserved by fast-forwarding the CI checkout; no production branch was reset to the older audit baseline.

The current remote CI run `38028708638` was failing a real regression at `tests/pediatric-conversation-help.test.ts:265`: an unnamed preparation follow-up after mentioning BOTH Lagundi and Bayabas inherited both herbs and an unrelated preparation FAQ. This was independently reproduced locally (**95 passed / 1 failed** across the pediatric/language suites), not inferred from who wrote the changes.

The release repair also restores ambiguity protection in `ask-ai-service.ts`: unnamed non-link follow-ups cannot choose among multiple previously cited/mentioned herbs, and do not call generation or embedding with guessed source attribution. Explicit multi-herb library-link requests remain supported. Added regression coverage for user turns, model mentions, model citations and deliberate multi-herb links. The three focused pediatric/language/source-attribution suites now pass **107/107**, and the merged frontend credits/stream suites still pass **60/60**. Full isolated CI and actual provider deployment outcomes must still be recorded before claiming this bundle live.

The authorized release bundle comprises the five checkout code/test files, the two focused AI regression/repair files and this report. Other uncommitted reports/root-review edits and all private QA tooling remain outside the staged release.
