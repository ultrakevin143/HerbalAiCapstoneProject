# Credit release checkpoint — 10 October 2026

The user authorized the reviewed CI/public-release sequence with “proceed.” Real payments remain disabled; local fixtures, runtime profiles, generated SQL, reduced schemas and credentials are excluded.

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
