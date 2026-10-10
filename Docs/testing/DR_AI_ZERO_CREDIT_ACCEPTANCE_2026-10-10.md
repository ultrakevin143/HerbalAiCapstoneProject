# Dr. Ai zero-credit live acceptance — 10 October 2026

## Scope and evidence

- Reviewed release: `60be4ffce8ec4ee21499771b2f245e46ed6a1b40`, deployed frontend/backend. No production application code or settings changed in this check.
- Backend tested: `https://herbalaicapstoneproject-staging.up.railway.app/api`.
- Database target verified before provisioning: existing `ep-icy-sound-aqfe958d` Neon endpoint, `neondb`; the authenticated live wallet subsequently confirmed this record belongs to the deployed backend.
- User explicitly authorized disposable account creation and a verification exemption for that test account. Created exactly one contributor, `creditqa_mv28uwge`, named **TEST ONLY Credit Exhaustion QA**, with a reserved `example.invalid` address, a random bcrypt-hashed password and a populated verification timestamp. Normal authentication APIs were used; no JWT was forged. Verification was not disabled globally and no email was sent.
- Private QA credentials/scripts and raw non-secret results remain outside Git in the task output directory. No database URLs, passwords, access tokens or merchant keys are recorded here.

## Observed live API / database results

| Check | Observed result |
| --- | --- |
| Ordinary contributor login | HTTP 200; exact disposable user and contributor role returned |
| Starting wallet | 10 TEST credits; exactly one TRIAL grant |
| Actual documented herb answer | Lagundi preparation returned through streaming endpoint; completed answer reduced balance to 9 |
| Bounded additional answers | Eight short introductory questions, sequentially, alternating JSON/streaming, reduced balance from 9 to 1; these avoid unnecessary provider-generation calls |
| Final-credit race | Two simultaneous requests, one JSON and one streaming: exactly one HTTP 200 and one HTTP 402; balance 0, ten completed answers total |
| Fresh JSON request at zero | HTTP 402, no generated answer |
| Fresh streaming request at zero | HTTP 402 before any SSE answer |
| Completed request replay at zero | Previous Lagundi response replayed unchanged, without charging |
| Saved answer retrieval at zero | HTTP 200; same completed answer remains accessible |
| Changed question with reused request UUID | HTTP 409, no extra answer or credit |
| Session refresh and wallet reload | HTTP 200; balance stays 0; no second trial grant |
| Live ledger reconciliation | One TRIAL +10, ten RESERVE entries totalling -10, final sum 0 |
| Payments | Zero purchase records for this user; no checkout or payment performed |
| Cleanup | Only the exact QA account's session version incremented; its issued access token subsequently rejected with HTTP 401; account/zero wallet/ledger retained for evidence |

Exact zero-credit backend message: **“You have no Dr. Ai test credits remaining. Open Credits to check your balance.”**

The source renders an **Add test credits: 0 available** action and **“No test credits left. Add credits to continue; your typed question stays here.”** Both were subsequently observed on the canonical live site in the browser continuation below.

## Regression validation

`node --test scripts/credits.test.mjs scripts/dr-ai-stream.test.mjs`: **57 passed, 0 failed, 0 skipped**. These automated regressions are distinct from the live API/database assertions above.

## Live browser continuation — acceptance passed

The continuation used `https://herbalaiph.vercel.app/chat`, not the local frontend or a synthetic wallet. A fresh QA session was issued through the normal login API for the existing disposable account. Because only a shared browser was connected, its original admin authentication cookies were held privately in memory; documented, origin-scoped browser developer controls temporarily installed the legitimately issued QA session cookies. No authentication token was minted, no response or balance was mocked, and no production protection was disabled. This was authenticated session-cookie testing, not a claim that a user manually entered credentials in the sign-in form.

| Browser check | Observed result |
| --- | --- |
| Initial zero balance | `0 test credits available`, Add action and the add-credits notification visibly rendered |
| One submitted question | Browser network response `/api/chat/stream` was HTTP 402; the exact backend blocking message appeared above the composer; no generated answer remained |
| Draft retention after rejection | The exact submitted question returned to the editable composer |
| Add credits | Opened the live wallet drawer at balance 0, showing the GCash TEST package and explicit no-real-money notice |
| Back to Dr. Ai | Closed the drawer; the exact question remained in the composer; no checkout button was pressed |
| Page refresh | The authenticated QA chat reopened with balance 0 and the Add action; no trial refill |
| Original session restoration | Restored the original cookies, reloaded and observed **Admin Kevs / Admin** and **10 test credits available**, matching the before-test balance |
| QA cleanup | Revoked only QA sessions again; its former access token returned 401; zero balance/evidence retained |

Screenshots are saved outside Git in the task output folder: `zero-credit-live-block-20261010.png` shows the actual zero balance, HTTP-402 notification and retained question; `zero-credit-live-drawer-20261010.png` shows the live drawer. No credential backup or interception was left in the browser; its restored admin chat remains open.

Draft retention here means after rejection and after closing the drawer. A full page reload cleared the unsent text; this check verifies that reload preserves the **balance and authenticated access**, not persistent unsent drafts. No new credit-blocking, drawer or balance defect was reproduced, and no production repair/release was necessary. Test-only checkout is still not a real-money retail purchase flow.

## Earlier browser limitations — historical, resolved by the continuation

Only the shared Codex browser was connected; an independent Chrome QA profile was unavailable. An attempt to use the exact production deployment's separate Vercel hostname redirected to Vercel authentication. A separate, tracked-code local frontend targeting the genuine live backend was correctly denied at login by the backend's untrusted-origin protection; production origin protections were not changed. A tab-scoped developer interception attempt failed before usable zero-credit UI evidence and was cleared; the temporary QA tab was closed and the temporary local preview stopped. No zero-credit browser screenshot, draft-preservation observation, Buy/Add drawer acceptance at zero or public browser refresh persistence is claimed from this run. No admin logout/password change or admin credit expenditure was performed.

The missing zero-credit browser/drawer checks were subsequently completed using the reversible, genuine QA-session method described above. The earlier failed attempts are retained as historical evidence, not current blockers. Real-money checkout remains disabled; the current product offers TEST credits, not retail purchases.

## Operational note

The first direct database connection was terminated by the server before provisioning was confirmed. A handled reconnect succeeded. This was a test-run connection interruption, not evidence of a reproduced production credit defect. The successful run created only the one QA record identified above. Broader MVP, physical-device acceptance and participant UAT were not performed or certified by this check.
