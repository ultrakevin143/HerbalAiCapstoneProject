# Ten starting credits — 10 October 2026

## Requested behavior

The user confirmed a one-time starting allowance of ten credits per user, with one credit per completed Dr. Ai question. This is not ten credits each login, a daily refill or permission to activate real payments.

## Focused implementation

- `herbalaibackend/src/config/credits.ts`: TEST-mode fallback `DR_AI_TRIAL_CREDITS` changed from zero to ten. Explicit overrides remain supported, including zero and the local two-credit depletion profile.
- Root `.env.example`: intended `DR_AI_TRIAL_CREDITS=10`, while `DR_AI_CREDITS_MODE=off` remains unchanged and payment secrets remain blank.
- Existing wallet transaction and question debit/refund logic remain unchanged. The actual database creates a wallet only once, records one trial grant and subtracts one credit for each newly reserved question. Failed/incomplete requests release the charge; a completed request replays without a second charge.
- A wallet is initialized lazily on its first wallet operation, not necessarily during signup. Older users without wallets also receive the configured starting allowance upon initialization. Existing wallets retain their balances; no backfill, top-up or migration was added.
- At zero, new normal and streaming questions return HTTP 402. Already completed answers remain readable without new generation.

An explicit existing runtime value such as `DR_AI_TRIAL_CREDITS=0` overrides the new fallback. Before enabling a hosted TEST deployment, verify and explicitly set its private variable to `10`; updating the example or code alone does not prove Railway's current setting.

## Observed validation

Executed locally against the existing isolated loopback PostgreSQL server on `127.0.0.1:55438`, database `herbalai_test`. Database tests used a UUID-named private schema and the exact credit migration. They did not use Neon, change live accounts or invoke PayMongo/Gemini.

| Validation | Observed result |
| --- | --- |
| Focused configuration, provider, chat and HTTP regressions | 49 passed across four files |
| Real PostgreSQL wallet suite | 28 passed, including two new ten-credit cases |
| Combined focused selection | 77 passed across five files, no skips or failures |
| Default allowance and overrides | Default ten; explicit zero/two/ten/one-hundred preserved; invalid bounds rejected |
| Credit mode disabled | Remains off unless explicitly enabled; no checkout enabled by the allowance |
| Concurrent first reads and independent users | Exactly one ten-credit grant per account |
| Runtime allowance changed after wallet creation | Existing consumed and unconsumed balances preserved, no duplicate grant |
| Ten completed questions | Exactly ten one-credit reservations and ten completions; balance decreases ten to zero |
| Completed answer replay at zero | Same stored answer, no additional reservation or debit |
| Zero-balance normal/streaming HTTP requests | Both HTTP 402 before AI invocation; wallet read remains zero |
| Accounting | One trial ledger entry of +10 and ten reservation entries of -1; total zero |
| Backend build and focused source ESLint | Passed |
| Strict TypeScript for configuration/database test fixtures | Passed |
| Credit UI and deployment-configuration Node regressions | 36 passed, no failures or skips |

The database suite mocks AI and payment adapters to avoid spamming models or generating checkouts. It validates real persistence and HTTP enforcement, not ten genuine provider requests. The separate real two-question local generation receipt remains in `LOCAL_CREDIT_MANUAL_AUDIT_2026-10-10.md`.

Outside-Git test output: `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/credits-starting-ten-tests-20261010.log`.

Node regression output is retained beside it in `credits-starting-ten-node-20261010.log`. Build, lint and strict fixture typecheck completed successfully in this chat's command results.

## Publication boundary

These changes are local and uncommitted. No provider variables, deployment branch, live wallet, trial grant or production payment setting were changed. Full pgvector CI for the combined uncommitted repair bundle, hosted TEST acceptance and genuine webhook/settlement acceptance remain release gates. Do not publish the local runtime profile, fixture, generated SQL or credentials.

The current local manual server intentionally continues using two trial credits for quick depletion testing. A ten-credit code default does not silently alter its explicit two-credit runtime override or refill an already initialized local wallet.
