# PayMongo GCash sandbox acceptance — 9 October 2026

## Authorization and boundaries

The user provided an authorized borrowed/team PayMongo dashboard in Brave, explicitly required test mode and no real spending, and approved saving only its TEST secret key in the ignored local backend configuration. PayMongo requested an email verification code before copying the key; the user completed that step themselves. No email code or secret key was printed, committed or placed in the frontend.

The copied value was checked for the `sk_test_` prefix and saved only to `herbalaibackend/.env`. `git check-ignore` confirms this file is excluded from Git. The clipboard was cleared after saving. LIVE secret keys were neither revealed nor copied; no key was regenerated. No merchant verification, subscription, bank/GCash account, live payment or production variable was changed.

## Observed provider checks

An outside-Git probe called the actual compiled project adapter with the authorized test key. It set test mode only in that isolated process, used a loopback test database URL without making database calls, and supplied a clearly labeled local-only webhook sentinel. That sentinel is not a registered PayMongo signing secret and does not establish webhook delivery or wallet settlement. It was not saved to the backend configuration or any deployment.

Two checkout sessions were created using POST `/v2/checkout_sessions`; both returned HTTP 200. Each was retrieved using GET `/v1/checkout_sessions/{id}` and validated by the project's schema with `livemode: false` and the matching synthetic order reference. The requested payment method was exclusively `gcash`, not QR Ph. The displayed PHP 100.00 is a simulated amount, not a retail price or real charge.

| Check | Observed result |
| --- | --- |
| Test-key copy and local storage | Passed after user-completed email verification; ignored backend configuration only |
| Genuine provider checkout creation/retrieval | Passed for two test sessions; HTTP 200 and `livemode: false` |
| Hosted GCash test screen | Rendered “GCash Test Payment Page” and explicit test-payment wording |
| Simulated authorization | Provider retrieval returned a `paid` payment with `livemode: false`, amount 10000 minor units and PHP currency; no refunds or dispute |
| Simulated expiry/failure | Browser showed expired source status; provider retrieval returned `failed`, with `livemode: false` |
| Return after successful simulation | Redirected to configured local `/credits`; connection refused because no preview was listening on port 4560 |
| Focused backend regressions | 39 passed across provider, chat and HTTP test files; mocked provider checks, separate from genuine sandbox observations above |
| Registered signed webhook and persistent wallet credit | Not tested; no provider webhook was created or altered |
| Full in-app purchase/balance/Dr. Ai debit/refund flow | Not tested in genuine merchant sandbox; requires isolated backend/frontend and registered test webhook |
| Production release or paid activation | Not performed |

Only synthetic customer details were entered: a TEST ONLY name and an `example.invalid` email. No real GCash phone number, PIN, OTP, QR scan or customer payment data was used. PayMongo's documented e-wallet test controls were used, and the API independently confirmed non-live state before checkout navigation and after each result.

## Evidence and continuation

Provider receipts, probe code and screenshots are outside Git in the harness workspace, including `paymongo-sandbox-success-receipt.json`, `paymongo-sandbox-failure-receipt.json` and `paymongo-gcash-test-page.png`. They contain no API key. Do not deploy the probe or fixture-targeted build.

The earlier merchant-access blocker is resolved for provider-only testing. The current local return-page availability and genuine webhook/wallet integration gates remain open; a paid test receipt alone does not prove credits were granted. Next: run a verified isolated backend/frontend, obtain specific authorization to register a TEST-only webhook and store its signing secret privately, then verify signed delivery, exactly-once top-up, duplicate-event handling and failed-payment non-crediting. Keep public credits disabled until a separate activation decision. Do not alter an existing account owner's webhook or live settings.

References:
- [Official PayMongo payment testing](https://docs.paymongo.com/docs/payment-acceptance-testing)
- [Official hosted checkout quick start](https://docs.paymongo.com/docs/payment-channels-hosted-checkout-quick-start)

## Visible Chrome check and approved product-heading change

At the user's request, a new provider-verified TEST checkout opened in connected Mercado Chrome. Selecting GCash, entering synthetic customer details and continuing rendered the genuine “GCash Test Payment Page.” The user interrupted before authorization to ask about the displayed merchant name. That Chrome session was not counted as a completed payment test; the preceding Brave success/failure receipts above remain separate evidence.

The user approved renaming the product heading, not the borrowed merchant identity. The adapter now appends `— TEST ONLY` to the configured package name. The local probe uses `Herbal-Ai Credits`, producing exactly **Herbal-Ai Credits — TEST ONLY**. An exact request-payload regression failed against the previous prefix format, then all 39 provider/chat/HTTP regressions passed after the one-line repair. Backend build/typecheck and source lint passed.

A fresh checkout was created and retrieved successfully (HTTP 200, `livemode: false`). Chrome visibly displayed the exact new heading; the merchant name remained unchanged. The renamed checkout was left open for inspection without submitting a payment. Its screenshot is outside Git at `paymongo-chrome-renamed-heading.png`. Existing hosted sessions retain their old names; the change affects newly created sessions. No PayMongo account settings, merchant identity, webhook or production configuration changed. The adapter/test changes and these receipts are local and uncommitted; the earlier CI pass applies to SHA `0151280`, not to this subsequent label change.
## Subsequent safe-return check

The new local adapter sends `/chat` as the cancel URL while retaining `/credits` for success. Genuine TEST checkout `cs_4eec115d5beaa61da3bbae8d` was created and retrieved successfully (`livemode: false`), then its provider Back arrow returned Chrome to the synthetic loopback Dr. Ai preview. Follow-up retrieval showed `payments: []`; no payment was authorized or wallet settled. Full API/return validation, screenshot paths and remaining gates are recorded in `API_AUDIT_2026-10-09.md`. This does not alter existing provider checkout sessions or the merchant's legal identity, and does not establish a production release.
