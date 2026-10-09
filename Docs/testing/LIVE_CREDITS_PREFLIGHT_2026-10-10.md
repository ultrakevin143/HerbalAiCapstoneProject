# Live credit preflight — 10 October 2026

The user requested live testing of the new ten-credit allowance. This check used the public site and actual backend endpoints without submitting credentials, making AI calls, creating checkout sessions or changing production data/settings.

## Observed public results

| Target | Result |
| --- | --- |
| `https://herbalaiph.vercel.app/api/health` | HTTP 200, JSON success |
| Public `/api/herbs/catalog?limit=100` | HTTP 200, JSON success with the herb list |
| Public `/api/credits` | HTTP 404, `Cannot GET /api/credits` |
| Direct Railway `/api/health` | HTTP 200, JSON success |
| Direct Railway `/api/credits` | HTTP 404, `Cannot GET /api/credits` |
| Public `/credits` in the real browser | Herbal-Ai Page Not Found screen |

The direct backend checked was `https://herbalaicapstoneproject-staging.up.railway.app`. Its name does not prove it is an isolated staging database; it is the known backend used by the public site. No private database identity or provider setting was inferred from that name.

Conclusion: the existing public deployment is reachable, but the new credit feature is not available on either public frontend or direct backend. These 404s are a missing-release finding, not evidence that the tested local wallet implementation failed. Ten-credit granting, actual depletion, refunds, saved-answer replay, checkout and fulfillment have **not** been retested live.

## Release state and blocker

A fresh remote-ref read returned:

- `main` and `codex/readability-accessibility`: `245dafcc0977f1991e4d4156be70edaa52765f91`.
- `codex/mvp-acceptance-ci`: `015128044490de9a4d3cb13b0782e45a9dc40a8e`.

The latest API/import/UI repairs and ten-credit default remain uncommitted. The older candidate's CI pass cannot certify them. Remote branch heads alone do not prove a provider's current deployment SHA, watched branch or database target; those settings must be verified separately.

Browser inventory showed Mercado Chrome connected, but only unrelated personal tabs were open. No Railway/Vercel dashboard or live Herbal-Ai authenticated tab was exposed in that profile. The in-app local signup/sign-in tabs were preserved; a separate tab was used to inspect the public credits page.

Publication approval was requested for only the reviewed production-code/documentation bundle, followed by full PostgreSQL/pgvector CI and release of the exact passing commit. No commit, push, production deployment, database migration or variable change was performed during this preflight. Local fixtures, reduced schemas, bootstrap files and credentials remain outside the production bundle.

## Next actions

1. Obtain the explicit commit/push/release decision and review the exact file allowlist.
2. Run fresh full PostgreSQL/pgvector CI for that committed bundle.
3. Verify authorized Railway/Vercel source branches, deployment SHA and actual migration/runtime database target.
4. Apply only the additive reviewed migration through the normal deployment; never run local bootstrap or seed scripts against production.
5. Verify the deployed credit page/API before activating the user-approved allowance. Explicitly configure ten one-time trial credits; existing wallets must not refill.
6. Keep real payments disabled. A new question must cost one credit, failure must refund, replay must not double-charge, and both endpoints must block new questions at zero.
7. Use a clearly identified authorized test account and user-entered password for authenticated browser acceptance. Record only observed outcomes. Genuine TEST webhook/settlement remains a separate gate.

HTTP receipt outside Git: `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/live-credit-preflight-20261010.json`.
