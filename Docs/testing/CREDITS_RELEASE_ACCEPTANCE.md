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
