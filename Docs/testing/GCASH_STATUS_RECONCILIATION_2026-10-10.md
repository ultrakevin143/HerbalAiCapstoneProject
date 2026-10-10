# GCash TEST checkout reconciliation and successful top-up acceptance

Date: 10 October 2026, Asia/Manila.

## Release boundary

The successful payment checks below ran against the deployed `6578969cdb83e9fbe47c3b3e75e412866f2e9e2d` release. The new reconciliation API, wallet action and additive migration described here remain **local, uncommitted and NOT deployed**. No new push, provider variable change, production migration or real-money payment was made in this continuation. Existing unrelated working-tree documents were preserved.

## Reproduced recovery gap and focused repair

The deployed application prevents duplicate checkouts but has no owner-facing reconciliation endpoint. The new authenticated HTTP regression first failed with **404 instead of 200**. An explicitly expired, unpaid provider checkout could therefore leave the application's pending order blocking a fresh purchase. This is distinct from a failed payment attempt: the live failed QA attempt was still on an **active** checkout and remained correctly resumable.

Local repair:

- `POST /api/credits/purchases/:purchaseId/reconcile` accepts a UUID and an empty body, uses only the authenticated owner, keeps responses private/no-store and retains the existing request limiter. It cannot accept an owner, price or client-selected status.
- Known TEST checkouts are retrieved server-side and their TEST mode, checkout ID and merchant order reference verified. Confirmed payment uses the same atomic wallet/ledger settlement as the webhook, without double granting when both race.
- Only a provider-confirmed **expired** checkout with complete unpaid evidence becomes `EXPIRED`: an explicit payment list containing no payment or only failed payments, and an explicit null intent or an intent awaiting a payment method. Processing, action-required, succeeded-but-unconfirmed, unknown or incomplete evidence stays locked.
- The additive `20261010120000_add_expired_credit_purchase` migration extends the existing status CHECK constraint. Existing orders and immutable ledger entries are not deleted or reset. A late authoritative paid webhook still settles an expired order exactly once; a stale expiry read cannot overwrite `PAID`.
- Purchase history gains **Check payment status**, accessible status feedback and matching-key cleanup after verified `PAID`/`EXPIRED`. Expired URLs are not resumed. Requests and feedback remain scoped to the active account; repeated clicks cannot create/cancel purchases.

### Explicit remaining limitation

An `UNCERTAIN` creation without a known provider checkout ID is **not** cleared because of age, timeout or a guessed ID. It reports that operator reconciliation is needed and stays locked. This batch does not add automatic checkout expiration, an operator attachment tool or a blind cancellation endpoint. Opening the return URL, closing the payment tab and a failed payment attempt are not cancellation proofs.

PayMongo states that checkout sessions remain active until explicitly expired, and that `cancel_url` is only return navigation, not cancellation. The repair follows those distinctions rather than inventing a one-hour payment timeout. References: [checkout lifecycle](https://docs.paymongo.com/docs/payment-channels-key-concepts), [checkout resource and cancel URL semantics](https://docs.paymongo.com/reference/checkout-session-resource).

## Observed live sandbox acceptance

Used only the previously authorized **TEST ONLY Credit Exhaustion QA** contributor and its existing pending order. No new account or checkout was created, and no administrator AI prompt was submitted.

1. A secret-key provider read independently confirmed the existing checkout/order identity, `livemode=false`, active session, empty payments and null intent before payment. The other failed QA checkout remained active with a failed TEST payment and an intent awaiting a payment method.
2. The existing PayMongo page displayed **Herbal-Ai Sandbox Credits — TEST ONLY** and its exact QA order reference. Synthetic customer information used a reserved `example.invalid` email. The redirect displayed **GCash Test Payment Page** and explicitly identified a TEST payment.
3. Clicked only **Authorize Test Payment** in that simulator. No real GCash account, PIN, OTP, QR payment or live secret key was used. No forged webhook was posted and no direct wallet top-up was written by the test helper.
4. Provider retrieval showed a paid TEST payment, matching PHP 100 test amount and succeeded TEST intent. Neon independently showed the matching order `PAID`, balance **0 → 10**, and exactly **one +10 TOPUP** ledger entry. Automatic settlement is consistent with the application's configured verified-webhook path; raw provider delivery/signature logs were not separately inspected.
5. A normal-login QA session was temporarily installed only on the app origin for browser testing. The UI confirmed the disposable contributor identity and **10** credits. Two bounded prompts completed; balance became **9**, then **8**. The second prompt produced a Lagundi answer with repository/PITAHC citations, demonstrating restored AI access.
6. Browser reload retained **8** credits. Purchase history displayed one `PAID` order and the separate still-`PENDING` failed-attempt order. Two authenticated wallet reads both returned HTTP **200**, **8** credits and one TOPUP. These reads are not claimed as deliberate replay of a genuine provider webhook; duplicate/race acceptance is covered in PostgreSQL regressions.
7. Ledger reconciled **+10 trial, +10 TOPUP, twelve -1 reservations = 8**. The first ten reservations belong to the preceding exhaustion audit; this continuation added only two prompts.

### Observed AI issue, subsequently repaired locally

The source-free mixed introduction **“Hello Dr. Ai, what can you help me with?”** received the medical no-source fallback instead of an introduction and consumed one credit as a completed answer. The subsequent source-backed Lagundi question succeeded. In the next continuation, this exact introduction failed regressions in both response paths before repair (two failures, two clinical negative cases passed). A shared, fully anchored classifier now recognizes a greeting followed by an identity/capability question. Clinical suffixes still require grounding; a greeting cannot bypass child-dosing or dangerous-topic protections. Both response paths and prior pediatric-context regressions now pass. This repair is **local and uncommitted**, not a new live AI pass; the existing one-credit-per-completed-answer policy is unchanged.

## Initial local validation checkpoint

- **106/106 backend credits tests passed**, including **53 real private-schema PostgreSQL tests**: authoritative paid recovery; failed-active session remains locked; expired unpaid unlock; missing/live/mismatched evidence; unknown creation; provider timeout; actual JWT owner isolation; simultaneous settlement; stale expiry versus paid webhook; late paid confirmation; existing zero-credit/replay/refund behavior.
- **65/65 frontend credits and Dr. Ai streaming tests passed**, including serialized owner-scoped status checks, late responses, failed/mismatched confirmation, expired-key cleanup and existing request/stream recovery.
- Backend lint and build passed. Strict TypeScript checking of all five credits test fixtures passed.
- Frontend focused ESLint, `tsc --noEmit` and constrained optimized Next build passed. The constrained build skips Next's duplicate typechecking only after the separate TypeScript check succeeds; its local API target was explicitly loopback.
- Initial DB attempt could not connect because the portable process started on its default port rather than 55438. Stopped only that owned process and restarted it bound to `127.0.0.1:55438`; the final real database suite passed. No tests or migrations ran against Neon.
- Full migrated PostgreSQL/pgvector CI has **not** run for this new uncommitted batch. The previous release's passing CI does not certify these new changes.

## Cleanup and user action

Revoked only the QA contributor's issued sessions; its former access token returned **401**. Its account, both orders, ledger and eight remaining TEST credits were retained for audit. No other account, administrator password or administrator credit balance was changed; Neon confirmed the admin still has **10** credits.

The browser backup contained the admin refresh cookie but no access cookie. Restoring it did not restore authenticated admin access after removal of the temporary QA cookie; the browser is now at Sign In. **The administrator needs to sign in again.** No alternative credential was used or manufactured, and successful admin session restoration is not claimed for this continuation.

Private helpers, credentials, tokens, database URLs, provider keys and screenshots remain outside Git in the local task directory. The final owned portable PostgreSQL process is stopped after checks.

## Next release gate

Review the focused eleven-code/test/migration-file bundle, including the composed-introduction repair, and this report/root-review update, then obtain publication authorization. Run the complete isolated PostgreSQL/pgvector CI before release. Apply the additive migration through the usual deployment path, then verify the new owner-facing status action and the exact introduction on the deployed SHA. Preserve unrelated documents and exclude all private QA helpers/build output. Real-money merchant onboarding and physical-device/five-participant UAT are not certified here.

## Continuation: browser recovery and combined regressions

No additional production purchase, prompt, credit grant, migration, authentication change or deployment occurred in this continuation. Read-only live checks returned backend health **200** and anonymous wallet **401**. The existing live browser is signed out; authenticated live acceptance of the new local repair is not claimed.

### Observed client behavior with an isolated local fixture

The actual production-built frontend was served at loopback port 4610 with a synthetic, credential-free API on loopback port 5000. This API has no database, provider key or real payment integration. It supplies a clearly labeled TEST ONLY account and controlled responses: these are browser UI tests, **not genuine payment/authentication acceptance**. No simulated checkout link was followed to the provider.

- **Processing:** Check payment status displayed pending/no-credit feedback, kept Resume available and re-enabled controls. A subsequent Buy action reused the fixture's original request UUID, rather than making a fresh request key.
- **Provider outage:** a simulated HTTP 503 displayed the error and left the pending checkout/Resume link intact; the status action became usable again. The next status check succeeded after the local fixture recovered.
- **Expired unpaid:** the status became EXPIRED with explicit closed/unpaid feedback, balance stayed zero, and Resume/Check controls disappeared for that order. Buy generated a different UUID; the fixture recorded it independently. No external purchase was created.
- **Paid:** the status became PAID, balance became ten and activity displayed one +10 TOPUP. Full browser reload retained ten. The fixture recorded one status check and no Buy operation in this scenario; transactional exactly-once correctness is separately covered by the real PostgreSQL tests.
- **Unknown creation:** UNCERTAIN displayed operator/support guidance, retained the lock and added no credits or Resume URL. It did not invent a provider checkout identifier.
- **Responsive:** at a 390 × 844 viewport, document width was 375 CSS pixels (no horizontal overflow), the status message wrapped within a 343-pixel region, and the recovery control was enabled after completion. This is browser emulation, not physical-device certification.

Screenshot evidence and sanitized fixture observations were saved outside Git in the local task directory: `local-credit-status-paid-20261010.png`, `local-credit-status-mobile-20261010.png`, `local-expired-credit-observation-20261010.json`, `local-paid-credit-observation-20261010.json` and `local-uncertain-credit-observation-20261010.json`. Temporary browser viewport overrides were reset.

### Combined validation observed

- **295 backend cases passed across nine files**, covering credits plus introduction, pediatric conversation, regional-language retrieval and herb-follow-up sources. This includes the seven added PostgreSQL payment-evidence/rollback cases and the composed-introduction regressions. The private-schema database coverage now contains **60 cases**; no test ran against Neon.
- Added payment checks reject wrong amounts/currency, refunded/disputed payments, multiple paid records and live-mode payment evidence without wallet/ledger writes. A forced TOPUP ledger failure rolls back order and balance; retry grants once, and subsequent reconciliation grants nothing more.
- **65 frontend credits/stream cases passed** again. Backend lint/build and strict TypeScript fixture checks (including exact optional properties and unchecked-index protection) passed. Frontend focused ESLint and `tsc --noEmit` passed again. `git diff --check` passed.
- The optimized frontend build from the initial checkpoint was reused for these client tests; the new introduction repair affects only backend source/tests. Full isolated PostgreSQL/pgvector CI and hosted validation of this uncommitted bundle remain pending.

Only the owned local fixture, preview and portable database are stopped after validation; unrelated processes, user browser tabs and project changes are preserved. The administrator's live sign-in requirement from the preceding sandbox run remains unresolved.

## Authorized release preflight

The user authorized the release-validation plan on 10 October: review, complete isolated CI, deploy only on success, and perform bounded live acceptance. Remote refs were refreshed; both the watched live branch and CI branch were still at `6578969`, while `main` remained at `245dafc`. The candidate includes only eleven reviewed code/test/migration files, this receipt, the existing zero-credit acceptance receipt referenced by the root review, and `PROJECT_REVIEW.md`. Other pending toolbar, local-language, PWA and checkout-receipt changes remain unstaged. No private QA helper, credential, runtime, screenshot or frontend build is part of the candidate. Full CI and production deployment are pending at this checkpoint; no passing outcome is implied by pushing the CI branch.
