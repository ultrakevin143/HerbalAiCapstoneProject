# Hosted GCash TEST acceptance — 10 October 2026

## Authorized scope and configuration

The user answered “proceed” to the specific request to register a dedicated TEST webhook, store the authorized merchant's TEST key/new signing secret privately in Railway, and configure one simulated package. No LIVE key, real payment, merchant identity change or existing webhook modification was authorized or performed.

The official PayMongo API returned HTTP 200 for listing existing webhooks and registering the dedicated endpoint. The new webhook `hook_2HzrNzoZBZji4SendXL5TELQ` was verified as enabled, `livemode: false`, with exactly `checkout_session.payment.paid` and destination `https://herbalaicapstoneproject-staging.up.railway.app/api/credits/webhook`. Existing unrelated webhooks were left untouched.

Only three backend variables were staged and deployed: `PAYMONGO_TEST_SECRET_KEY`, `PAYMONGO_TEST_WEBHOOK_SECRET`, and `DR_AI_CREDIT_PACKAGES`. The package is `sandbox-10`, Herbal-Ai Sandbox Credits, ten credits, PHP 10000 minor units as a **simulated test amount**, not an approved retail price. The existing ten-credit allowance and TEST mode stayed unchanged. Secrets were not added to source, documentation, frontend configuration or Git. The temporary outside-Git secret handoff file was removed after these checks.

Railway configuration deployment `116ff10f-32e8-464e-ad96-567de80ca47c` became Active/Deployment successful, still on release SHA `2c98492b426b246cacd69327f33803763672b0c4`. No new code commit/push, branch update, content import or database-target change was made. Vercel needed no additional code deployment.

## Actual browser/provider outcomes

Checks ran approximately 09:24–09:29 Manila on 10 October 2026. The existing signed-in Herbal-Ai account was Admin Kevs. No password or other authentication credential was entered or changed. Synthetic provider customer names and `example.invalid` emails were used; no real phone number, GCash PIN/OTP, QR scan or bank/card details were supplied.

| Check | Observed result |
| --- | --- |
| Hosted package readiness | The live Credits page displayed the initial nine-credit balance, the configured ten-credit TEST package and enabled GCash test checkout. |
| In-app order creation | The authenticated live application prepared checkout `cs_c660e677ef547f91e42843c6`, order `c20acd6f-e3ee-42d3-9915-93aa582ef342`. Independent provider retrieval returned HTTP 200, non-live state, only GCash, no payments yet, and correct live success/cancel URLs. |
| Accidental checkout/Back | The provider Back link returned Chrome to the live `/chat` route. The authenticated original app tab remained separate, with nine credits; returning did not grant credits. Chrome had a separate login context from the signed-in Codex browser; this is not a Chrome authentication-persistence check. |
| Explicit simulated authorization | Chrome rendered GCash Test Payment Page and Authorize Test Payment. Only that simulated control was clicked. Independent retrieval afterward returned exactly one non-live paid PHP 10000 payment. |
| Genuine automatic hosted settlement | Before any agent-created replay request, the authenticated wallet changed from nine to nineteen, purchase history showed Paid and credit activity contained one `TOPUP +10` at 09:25:42. This establishes automatic registered-webhook settlement, not crediting by a return URL or manual database edit. |
| Controlled hosted duplicate | A locally constructed/signed duplicate of that already settled order returned HTTP 200 with `credited: false, duplicate: true`. Refresh kept nineteen and exactly one Top-up. This was a controlled replay, not a second genuine provider delivery. |
| Separate failure simulation | A second in-app order prepared checkout `cs_2382c91b99bdeb55281db9cb`, order `33c7a310-b45b-4ba2-a2ed-08f6dceea10d`; independent retrieval again verified non-live/Gcash-only/correct return URLs. Expire/Fail Test Payment produced expired source status. Provider retrieval confirmed a non-live failed PHP 10000 payment. |
| Failed payment non-crediting | The wallet stayed at nineteen and retained exactly one Top-up entry. No credits were granted for the second checkout. |
| Persistence and Dr. Ai integration | Full Credits reload restored login and nineteen credits without a new trial grant. Opening the existing Dr. Ai credit drawer fetched nineteen; Back to Dr. Ai preserved the original question/answer and updated the composer to nineteen, without another generation. |
| Anonymous post-configuration smoke | Health/catalog HTTP 200 with 88 unique published IDs; credits private/no-store 401; untrusted origin 403; malformed JSON sanitized 400. |

Two TEST orders remain in the live wallet's history; only one produced a ten-credit Top-up. These are simulated purchases, not real charges. No further AI prompt was sent and no administrator credit depletion was performed.

## Observed follow-up: failed-attempt history

The second order remains **Pending** in Herbal-Ai purchase history even though the provider reports its simulated payment attempt failed/source expired. This is a recorded status/reconciliation usability gap, not an incorrect balance or accepted unpaid purchase. The current backend subscribes only to confirmed paid checkout events and records order states Creating/Pending/Paid/Uncertain; it does not reconcile failed attempts into the UI.

Do not blindly mark the entire order Failed merely because one payment attempt failed: an order may permit another attempt. Next, validate the provider's retry/terminal checkout states, then add bounded reconciliation or explicit attempt status/copy with regression coverage. Do not change or deploy speculative failure-state handling without that distinction. The simulated checkout flow is working; this limitation prevents claiming all payment-history states are complete.

Other separate remaining gates: genuine provider retry delivery, actual live zero-balance refusal and failed-AI refund, new-signup/recovery acceptance for this release, physical-device and participant evidence. Their earlier local/CI coverage is not renamed a new hosted pass. Real-money rollout remains prohibited.

## Evidence and references

Sanitized receipts and screenshots are outside Git in `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for`:

- `hosted-paymongo-webhook-receipt-20261010.json`
- `hosted-checkout-cs_c660e677ef547f91e42843c6-20261010.json`
- `hosted-checkout-cs_2382c91b99bdeb55281db9cb-20261010.json`
- `hosted-test-replay-result-20261010.json`
- `hosted-test-package-ready-20261010.png`, `hosted-gcash-test-controls-20261010.png`, `hosted-test-topup-and-failure-20261010.png`, `hosted-test-balance-persisted-20261010.png`

The provider GET verifier writes sanitized identifiers/statuses only. The replay is explicitly marked locally signed in its receipt. Private handoff files/probes are not deployable project artifacts.

Official references: [Create a webhook](https://docs.paymongo.com/reference/create-a-webhook), [Webhook resource](https://docs.paymongo.com/reference/webhook-resource), [Payment testing and e-wallet simulations](https://docs.paymongo.com/docs/payment-acceptance-testing). Only GCash's simulated controls were used; QR Ph was not enabled or scanned.
