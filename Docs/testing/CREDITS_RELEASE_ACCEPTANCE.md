# Reviewed fixes: isolated CI and release acceptance

## Approved sequence

The user approved pushing the reviewed candidate to `codex/mvp-acceptance-ci`, running the complete isolated PostgreSQL/pgvector checks, repairing failures, and releasing only a passing candidate with credits disabled. Real payments are not authorized or enabled.

Before this push, remote `main`, `codex/readability-accessibility`, and `codex/mvp-acceptance-ci` all pointed to `245dafcc0977f1991e4d4156be70edaa52765f91`. The previous CI run `37764672182` failed in the backend's Run isolated Vitest suites step; its frontend job succeeded. Those are observed historical results, not acceptance of this new candidate.

Vercel's project dashboard showed `codex/mvp-acceptance-ci` as a Preview branch. The public alias is `herbalaiph.vercel.app`. Railway's project/service dashboard showed `herbal-ai-staging`, service `HerbalAiCapstoneProject`, alias `herbalaicapstoneproject-staging.up.railway.app`. Its description states an isolated database not connected to Neon; that description is not proof of the runtime database target. Source-settings inspection was interrupted by Chrome's disconnected debugger. Do not change provider branches, database targets or secrets based on this incomplete read.

## Candidate scope and safeguards

- Include the default-OFF test credit wallet, its additive migration, guarded chat integration, shared composer drawer, wallet regression repairs, administrator edit validation/current-vector/audit repair, fail-closed database acceptance tests, CI scheduling and related root review/testing documentation.
- Exclude private dotenv files, downloaded assets, local preview builds, loopback fixtures, raw validation logs and credentials. Existing user preview at port 4560 is not rebuilt or stopped.
- Push only the CI branch first. Do not force push, rewrite historical migrations, seed/import content, change real accounts or enable payment mode.
- Require both backend and frontend jobs for the exact candidate SHA to succeed. Specifically require the real administrator vector/audit rollback gate, all migrations and the complete backend suite; no conditional skip or failure suppression.
- Before public release, verify the actual watched branch and live migration target, preserve a rollback SHA, inspect pending migrations and keep `DR_AI_CREDITS_MODE=off`. A fixture-targeted compiled build must never enter deployment.

## Local evidence already observed

See root `ERROR_REPAIR_SUMMARY_2026-10-08.md`: 397 frontend Node regressions, 18 focused backend cases, strict administrator fixture typechecking/lint, frontend build/typechecking/lint, and actual synthetic desktop/mobile Chrome acceptance passed. The earlier 26 real wallet SQL/HTTP cases are separately recorded. Seven new real administrator database cases remain pending the remote pgvector gate; the selected non-database suite does not replace full database acceptance.

## Live smoke checklist after a passing deployment

- Confirm the provider deployment SHA, backend health and free chat/disabled-wallet behavior.
- Check the public catalog and Library-to-Dr. Ai handoff, without publishing test medicinal instructions.
- Use existing authorized contributor/admin sessions for role boundaries, suggestions, review and audit visibility. Any write should be clearly identified disposable QA or independently approved real content.
- Confirm login refresh persistence and normal session recovery; do not change administrator passwords or invent manual-password results.
- Verification/recovery delivery checks need the user's authorized inbox and credential entry where required. Preserve cooldowns. Do not claim a fresh inbox check from old receipts.
- Genuine GCash sandbox acceptance is separate and remains blocked until a merchant test account exists. Real-money reconciliation and policy/operational gates are still open.

## Receipts

Append exact committed SHA, run URLs, job/test results, provider branch/migration checks, deployment IDs and actual smoke results after execution. Do not mark incomplete steps passed.

### Reviewed candidate and remote acceptance

- Pushed only the reviewed 43-file bundle to `codex/mvp-acceptance-ci`: `015128044490de9a4d3cb13b0782e45a9dc40a8e`. No private dotenv, local fixture, compiled preview or raw job log was committed.
- [Main CI run 37807315370](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37807315370) succeeded for this exact SHA. Backend and frontend jobs both succeeded, including migration deployment, strict fixture typechecking, source lint and production builds.
- Backend job `113414863600`: the dedicated real administrator vector/audit rollback gate passed all 7 cases; the complete isolated suite passed 2,219 cases across 148 files. The Python research generator also passed 7 cases. The seven-case dedicated gate is repeated within the complete suite, not an additional seven unique tests.
- Frontend job `113414862939`: all scheduled Node regressions passed, totaling 397 cases; typecheck, lint and production build succeeded.
- [Herb Preparation PostgreSQL Gate run 37807315586](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37807315586) succeeded for the same SHA: 284 cases across 8 files. These are a separate gate, not evidence that every case is unique relative to the main suite.
- GitHub deployment `6940759395` reports a successful Vercel **Preview** for this candidate. A preview is not a public release or genuine payment acceptance.

### Release remains blocked, not failed CI

The production deployment receipt still points to `245dafcc0977f1991e4d4156be70edaa52765f91` (Vercel deployment `6933307763`, Railway deployment `6933298619`). A fresh remote-ref check found both `main` and `codex/readability-accessibility` unchanged at that baseline. It is the proposed rollback SHA, not proof of either provider's current watched-branch setting.

The existing Railway source-settings tab and a fresh settings tab could not be controlled: the Chrome extension timed out during debugger/focus attachment. No provider token was available through the checked local CLI configuration. Consequently, the actual watched branches, runtime/migration database identity and live `DR_AI_CREDITS_MODE` setting could not be verified. No source-setting change, private variable change, live migration or production-branch push was performed. Reconnect the authorized Chrome provider tabs to finish these checks before release; do not bypass them using the staging project description or old branch history.

The only new schema migration in this candidate is `20261008110000_add_test_credit_wallet`: four new wallet/ledger/request/purchase tables, constraints and indexes; no existing content table is dropped or seeded. It passed the isolated migration gate, but has not been applied live by this work.

### Safe current-public-site probes

HTTP-only checks against the current deployment returned JSON HTTP 200 with `status: success` for both `/api/health` and `/api/herbs`, through `https://herbalaiph.vercel.app` and directly through `https://herbalaicapstoneproject-staging.up.railway.app`. The public catalog request with `limit=100` returned all 88 records. These verify endpoint availability only, not database identity, UI rendering, signed-in workflows, email delivery or acceptance of the new candidate. No AI request, checkout, account change or content write was submitted.

Raw CI job receipts and public probe output remain outside Git in the harness workspace. The browser blocker and genuine GCash merchant-sandbox blocker remain open. No manual credential, physical-device or participant result was invented. This receipt update is local documentation, not an additional release commit.

After the user reported reconnecting Chrome, a fresh browser inventory exposed only the Codex in-app browser and MCP Apps; no Chrome profile was connected to this chat. This is a connection blocker, not evidence that the Railway or Vercel website failed. Provider verification and the public release still remain pending.

Subsequent 9 October work connected an authorized PayMongo team account in Brave. Genuine GCash test checkout creation, simulated success and simulated failure passed with API-verified `livemode: false`; only a TEST key was stored in ignored local backend configuration. This resolves merchant access for provider-only checks. It does not complete signed webhook delivery or persistent wallet settlement; the local checkout return also refused connection at port 4560. See `PAYMONGO_SANDBOX_2026-10-09.md` for exact evidence. No production deployment or variable change was made.
