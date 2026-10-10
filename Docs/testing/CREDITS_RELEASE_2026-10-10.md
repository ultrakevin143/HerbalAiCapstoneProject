# Credit release checkpoint — 10 October 2026

The user authorized the reviewed CI/public-release sequence with “proceed.” Real payments remain disabled; local fixtures, runtime profiles, generated SQL, reduced schemas and credentials are excluded.

## Successful release and live acceptance — supersedes the earlier checkpoint below

Release SHA: `2c98492b426b246cacd69327f33803763672b0c4`. The focused CI fixture repair was committed to the existing CI branch; only after both workflows passed was the watched `codex/readability-accessibility` branch fast-forwarded to that exact SHA. No force push was used. `main` remains at `245dafcc0977f1991e4d4156be70edaa52765f91`.

- [Main CI 37960910810](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37960910810) passed: 2,352 backend cases across 155 files, 399 frontend Node cases, builds, lint, typechecks and migration checks. The dedicated vector/audit selection also passed its ten cases; these overlap the full backend suite and must not be counted again.
- [Preparation PostgreSQL CI 37960910934](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37960910934) passed its 284 cases across eight files. This is a separate overlapping gate, not another unique-case total.
- Vercel Production deployment `8F4CBqffPVgjJXzuDyMbh7HXYy2o` is Ready for `herbalaiph.vercel.app`, displaying the exact release SHA and watched branch.
- Railway deployment `06802f35-6615-40fd-a80e-6e466294b6fa` succeeded at the same SHA. Actual pre-deploy logs applied `20261008110000_add_test_credit_wallet` to the existing Neon `neondb`; all migrations completed successfully and the production backend started. No local bootstrap, seed or reduced schema was imported.
- After code/migration readiness, exactly two approved service variables were deployed: `DR_AI_CREDITS_MODE=test` and `DR_AI_TRIAL_CREDITS=10`. Configuration redeploy `5e18ddfb-9410-4fe5-b1ef-b78b167e412a` succeeded on the same code release. The pooled application and matching direct migration database targets were left unchanged.

Observed authenticated browser checks, 10 October 2026, approximately 00:53–01:00 Manila:

| Check | Actual result |
| --- | --- |
| One-time starting wallet | The existing signed-in account's newly initialized wallet displayed ten test credits. This was not a fresh-signup acceptance check. |
| Actual Dr. Ai generation | One educational Lagundi preparation question completed with recorded steps, cited sources and warnings. The balance changed from ten to nine, exactly one credit. |
| Saved answer replay | Open saved answer displayed the same completed answer without a new generation; balance remained nine. |
| Back to Dr. Ai | Closed the credit drawer and preserved the mounted original question, answer and nine-credit composer balance. |
| Independent tab and full refresh | A fresh credits tab restored the authenticated account and nine-credit wallet. Reloading that tab kept login and nine credits; no repeated trial grant occurred. |
| Visible credit activity | Exactly one `TRIAL +10` entry and one `RESERVE -1` entry were displayed for this check. No second debit appeared after replay or refresh. |
| Anonymous smoke after activation | Health and catalog HTTP 200; 88 unique catalog IDs. Credits HTTP 401 with `private, no-store`; foreign-origin login HTTP 403 `UNTRUSTED_REQUEST_ORIGIN`; trusted malformed JSON HTTP 400 `INVALID_JSON`. No credentials were submitted by these probes. |
| Payment safety | UI explicitly displayed TEST ONLY, GCash checkout not configured and no test packages. No PayMongo key/webhook secret or package was installed on Railway; no payment was submitted. |

The single controlled live question used one credit from the already authenticated administrator wallet; nine remain. The account was not depleted, its password was not changed and no moderation/content write was made. Browser evidence is saved outside Git as `live-ten-credit-wallet-20261010.png`, `live-credit-answer-nine-20261010.png` and `live-credit-wallet-refresh-20261010.png` in the calling task workspace. Anonymous receipt: `live-credit-release-smoke-results-20261010.json`.

### Remaining gates, not counted as live passes

Actual live zero-balance blocking and failure/refund behavior remain unobserved in this release: the administrator's remaining credits were deliberately preserved and no provider outage was manufactured. Authentic isolated PostgreSQL tests cover ten-to-zero, both endpoints' zero-balance rejection, concurrency, replay and refunds; the earlier local two-to-zero generation receipt is separate. New live signup/verification/recovery were not repeated. Genuine PayMongo TEST signed-webhook delivery and persistent wallet settlement still require configured test packages/provider integration. Real-money purchases remain disabled. Physical-device and participant checks are not invented or replaced by this acceptance.

The following sections retain historical pre-release observations and pending steps as they stood at those checkpoints; they do not override the successful release receipt above.

## Reviewed candidate

- The explicit 46-file source/test/config/documentation allowlist was committed and pushed only to `codex/mvp-acceptance-ci` at `0e7783e7688ec8a5e838b563e315440afc756230`.
- Local backend build, source lint and strict API/import/credit fixture typecheck passed. Frontend lint/typecheck passed; 395 root Node cases passed, followed by another passing nine-case deployment-configuration rerun after extending the credit fixture typecheck schedule. Earlier real wallet/API generation receipts remain separate.
- No local dotenv, embedded PostgreSQL files, local credentials, fixture API, log or screenshot was staged. The live branch and `main` were not changed by that push.

## First CI result and focused repair

[Main CI run 37960056832](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37960056832) failed in the full backend test selection. Build prerequisites, migration deployment, strict fixture typechecking and the dedicated real administrator vector/audit gate passed. The frontend job, including production build, also passed. [Herb Preparation PostgreSQL Gate 37960056691](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37960056691) succeeded for the same SHA.

The full backend selection reported 2,336 passes and five skipped cases because `knowledge-import-database.test.ts` failed its beforeAll check. Its PostgreSQL server-address assertion expected `127.0.0.1`, but a Docker-published loopback endpoint correctly reported its internal `172.18.0.2/32` server address. This was a fixture deployment-boundary mismatch, not an import rollback failure. The suite was not declared passed and the production release was held.

The focused test-only repair retains explicit loopback URL checks, the isolated `herbalai_test` database name and matching ports, adds an actual `test_user` role check, and permits a valid `172.16.0.0/12` Docker bridge only in CI on the expected PostgreSQL port 5432. A remote URL, different database/role, mismatched port, malformed/public server IP, other private range or non-CI Docker address remains rejected before test schema creation. No production database or application guard was relaxed.

Eleven new pure boundary cases plus the five real private-schema import rollback cases and 28 real wallet cases passed locally: 44 cases total, no failures/skips. Strict TypeScript passed. The repair's helper/test were added to the CI strict fixture schedule. Full remote CI for the repaired candidate remains pending at this checkpoint; a focused local pass is not a substitute.

## Provider settings actually observed

- Vercel Production serves `herbalaiph.vercel.app` from repository `ultrakevin143/HerbalAiCapstoneProject`, directory `herbalaifrontend`, branch `codex/readability-accessibility`; its current displayed production source is `245dafcc0977f1991e4d4156be70edaa52765f91`.
- Railway backend service `HerbalAiCapstoneProject` watches the same branch, root `/herbalaibackend`, with pre-deploy `npm run deploy:migrate` and health path `/api/health`.
- Runtime database metadata identifies the existing Neon `neondb` database. `DATABASE_URL` uses the `ep-icy-sound-aqfe958d` pooled endpoint; `DIRECT_URL` uses its matching non-pooler endpoint. No credential was copied into Git or this report. The local reduced credit database is not configured on Railway.
- Railway's trusted frontend origin was observed as `https://herbalaiph.vercel.app`. The unrelated standalone pgvector service and project description were not treated as proof of the backend's actual database target.
- The browser intermittently stopped responding while masking configuration values. No provider variable was changed or deployment triggered. Credit/payment configuration still needs verified completion before allowance activation.

## Remaining release sequence

1. Push only the focused CI-boundary repair and this checkpoint documentation to the existing CI branch; run both workflows for that exact candidate.
2. After both pass, verify the current provider settings and fast-forward only the approved watched live branch to the passing SHA. Do not force-push or update `main` implicitly.
3. Confirm additive migration completion, healthy backend and Vercel Production at the same SHA.
4. Explicitly set the approved ten-credit TEST allowance only after confirming the real deployed wallet endpoints; real-money mode/keys stay prohibited. Existing wallets must not refill.
5. Complete actual hosted authenticated allowance/depletion/replay/refund checks and record observed results. Use user-entered credentials for browser account creation/login; do not claim a human login from the agent's synthetic API probe.
6. Genuine PayMongo TEST signed webhook and wallet settlement remain separate acceptance checks. Returning from checkout must never grant credits by itself.

This checkpoint is not a successful production-release receipt or complete live payment/MVP acceptance.
