# Real local credit audit — 10 October 2026

## Corrected preview configuration

The user encountered `Fixture endpoint not provided.` on local Sign In. The running frontend was pointed at the outside-Git UI fixture on port 4559, which does not implement login. This was a preview wiring problem, not an observed failure of the real authentication controller.

Only the positively identified fixture and old frontend processes were stopped. The current frontend now uses the actual compiled backend and a separate local PostgreSQL database:

| Component | Current target |
| --- | --- |
| Frontend | `http://127.0.0.1:3000` — current working-tree Next.js development server |
| Actual backend | `http://127.0.0.1:5001/api` — current compiled application, authentication, controllers and repositories |
| Database | Fresh `herbalai_manual_20261010_b211aa41`, bound to `127.0.0.1:55438` |
| Credit configuration | TEST mode, two trial credits per newly initialized wallet |
| Payment configuration | No packages, no payment key or webhook secret; checkout unavailable |
| Email / OAuth / uploads | Local email logging, verification not required, Google OAuth and Cloudinary credentials overridden to empty |
| Test Library | Only existing Lagundi seed data, with its existing PITAHC identity/listing reference |

No live admin account, password hash, user data or production database credential was copied. The user must choose and submit their own new local account password. The prepared username is `creditqa_20261010`; its reserved `example.invalid` address is local-only and receives no mail.

## Database and AI boundaries

The native local PostgreSQL installation lacks pgvector. A generated outside-Git schema copy omits only the two optional unsupported vector fields. Normal tables were created from that copy in a new empty database. The four newly generated credit tables were replaced immediately, before data seeding, with the exact existing `20261008110000_add_test_credit_wallet` migration to retain its real balance, ledger, status and uniqueness constraints.

The repository's schema, migrations and generated Prisma client were not changed. This reduced local setup does **not** certify the full migration history, vector dimensions, semantic search, all 88 catalog records or production acceptance. Use explicit **Lagundi** questions to exercise the actual named-herb retrieval path; unrelated semantic queries are outside this local setup's coverage.

The actual application loads its existing ignored Gemini configuration. Two controlled HTTP questions reached the normal generation path. No fake AI text, mocked credit repository, simulated checkout settlement or authentication-controller bypass was used. The agent's HTTP probes used short-lived locally signed tokens for newly created disabled-password QA records; they do not prove a human password-login roundtrip. The user-created account remains independent of those probe wallets.

A preload outside Git narrows the actual server's port 5001 listener to loopback and overrides local runtime settings before dotenv loads. No production server binding or configuration file was modified.

## Observed validation

Receipts captured at approximately 00:06–00:08 Manila, 10 October 2026:

| Check | Result |
| --- | --- |
| Actual backend health and frontend `/api/test` proxy | HTTP 200, real backend success response |
| Unauthenticated wallet | HTTP 401 |
| Actual local published catalog endpoint | HTTP 200 |
| Preset zero-wallet account, normal and streaming chat | Both HTTP 402; no new credit reservation persisted |
| Fresh independent QA wallet | Two trial credits; checkout unavailable |
| First educational Lagundi question | HTTP 200, nonempty answer; actual generation timing about 18.5 seconds; balance became one |
| Same question and same idempotency key | Identical stored answer, balance stayed one |
| Second Lagundi safety question through streaming | HTTP 200 with `sources`, `chunk` and `done` events; balance became zero |
| New normal and streaming questions after actual depletion | Both HTTP 402 |
| Open previously completed answer at zero | HTTP 200, unchanged saved answer; no new generation or charge |
| Wallet versus ledger after depletion | Both zero; matching accounting totals |
| Network listeners | Frontend, backend and PostgreSQL bound to `127.0.0.1`; no fixture listener on 4559 |

These are observed local API/provider results, not newly claimed live or physical-device passes. Provider delivery/settlement, production credit enablement and fresh CI for the uncommitted release bundle remain separate gates. Production credits stay off; nothing was committed, pushed or deployed by this local setup.

## User's manual steps

1. In the prepared local signup tab, enter a new password of at least eight characters and submit Create Account yourself. Do not reuse or share the live admin password.
2. Sign in as `creditqa_20261010` and open Dr. Ai at `/chat`.
3. Confirm the displayed balance is two. Ask what preparation the Library records for **Lagundi**; wait for completion and check the balance becomes one.
4. Ask what safety warning the **Lagundi** record includes; wait for completion and check the balance becomes zero.
5. Try a third new question. The UI must prevent a new answer, and a direct new API request must still return HTTP 402. Refresh and confirm zero remains zero.
6. Old completed answers may remain readable. That is intentional and does not mean a new AI generation is allowed at zero.
7. If a generation fails, confirm the failed request is refunded instead of counted as a completed answer.

Human signup, password login and visible two-to-zero UI testing remain pending until actually observed or explicitly reported. This report does not fabricate those outcomes.

## Local restart and evidence

Outside-Git runtime directory:

`C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/manual-credit-runtime-20261010/`

- `bootstrap.mjs`: fresh isolated database and existing seed-data initialization; running again creates a different database, so do not rerun for an ordinary restart.
- `local-profile.mjs`: loopback-only backend launch settings. Its private `profile.json` contains synthetic local credentials and must never be committed or shared.
- `api-check-results.json`: health, proxy, unauthorized and preset-zero gate receipt.
- `depletion-check-results.json`: actual two-question depletion, replay, stream, zero-balance rejection and ledger receipt.
- `check-api.mjs` and `check-depletion.mjs`: controlled actual-API probes; not production tools.

With the existing local PostgreSQL server still running, start the backend from `herbalaibackend`:

```powershell
node --import 'file:///C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/manual-credit-runtime-20261010/local-profile.mjs' dist/index.js
```

Start the frontend from `herbalaifrontend`, with process-only configuration:

```powershell
$env:NEXT_PUBLIC_API_URL='http://127.0.0.1:5001/api'
$env:NEXT_PUBLIC_SOCKET_URL='http://127.0.0.1:5001'
npm run dev -- --webpack --hostname 127.0.0.1 --port 3000
```

Do not replace these loopback URLs with Neon or use the local profile on Railway. Keep runtime schemas, SQL, credentials, fixtures and receipts outside the production bundle.
