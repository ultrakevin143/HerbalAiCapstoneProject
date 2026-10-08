# Herbal-Ai issues, tests, and release handoff

Latest consolidated root review: [PROJECT_REVIEW.md](PROJECT_REVIEW.md), updated 8 October 2026. It records the subsequent release, current 88/88 vector coverage, live retrieval checks, remaining evidence gaps and defense study links. The 27 September baseline below is retained as historical evidence, not the current deployment status.

Date: 27 September 2026
Purpose: one root entry point for future SRS, SPMP, SDD, STD, deployment, and defense revisions. This is a dated engineering record, not a signed UAT result or a claim that every workflow works on every device.

## Evidence rules

- Keep a user-reported symptom separate from a reproduced failure, a code fix, and a live retest. A passing unit test does not prove inbox delivery or a production login.
- Preserve the date and environment of each result. Older counts in the existing reports remain historical snapshots.
- Never copy passwords, OAuth codes, refresh tokens, API keys, reset/verification links, or full production environment values into this file or formal documents.

## Current deployment baseline

| Item | Verified state before this release |
| --- | --- |
| Git deployment branch | `codex/readability-accessibility`, remote head `2e1a770` at the start of this handoff |
| Frontend | `https://herbalaiph.vercel.app`; `/privacy` returned HTTP 404 before this release |
| Backend | `https://herbalaicapstoneproject-staging.up.railway.app/api/health` returned HTTP 200; health alone does not prove authenticated workflows |
| Mail | Gmail API sender code was deployed in `2e1a770`; one real reset email was observed in the sender mailbox in the earlier session |
| Email verification | Railway `REQUIRE_EMAIL_VERIFICATION=false` was confirmed in the service Variables UI after deployment; new signups currently skip verification |
| Mail OAuth | The dedicated mail OAuth app was still in Google's External **Testing** state; the observed refresh-token lifetime was approximately seven days |

## Problems and disposition

| ID | Evidence | Status / next check |
| --- | --- | --- |
| AUTH-01 | User reported slow signup ending in HTTP 502, followed by an “email already exists” response. The user then confirmed sign-in worked with that account. | The account had been created despite the uncertain response. The exact gateway failure point was not proven. The local signup UI now advises sign-in before retrying on network/502/504 errors; retest after deployment. |
| MAIL-01 | Verification and reset mail initially did not arrive on the public site. Railway SMTP egress was identified as a deployment obstacle; a Gmail API HTTPS mailer was deployed. | The earlier real reset email confirmed one delivery, **not** new-account verification or completed password recovery. Do not use a Google-only account as the reset-flow acceptance case. |
| MAIL-02 | The mail-only Google OAuth app remained in Testing; its observed refresh token expires after about seven days. | Open operational risk. Publish the reviewed public privacy URL in Google Cloud branding, complete the required OAuth publishing/consent steps, and obtain/test a durable sender authorization before relying on verification for defense. Never record credentials here. |
| AUTH-02 | With verification temporarily off, older password accounts can exist with no `emailVerified` timestamp. A global flip to true would block them under the old login check. | Local, not yet live: additive `email_verification_required` migration defaults existing rows to false; new password accounts created with verification enabled get true. Login checks the per-account flag. Verify migration succeeds before changing the Railway setting. |
| PRIV-01 | Google Cloud branding required a public privacy URL. The user reviewed and accepted a policy draft restricted to Herbal-Ai's implemented data flows. | Local `/privacy` page is prepared for release. It was not public at the start of this handoff. Check the public URL after deployment, then use it in Google Cloud branding. |
| UI-01 | User previously reported a very narrow community-thread layout problem in a 226px viewport. | Responsive repairs were committed in `44834dd`; this handoff does not claim a new 226px physical-device retest. Use existing mobile reports and repeat the target viewport before closing the issue. |
| DEPLOY-01 | Railway shows a `pgvector` service, but the 27 September pre-deploy Prisma log connected to a database named `neondb` at a Neon host. | Document the observed Neon connection in the SDD rather than assuming the Railway database service is active. Do not switch database providers as part of this release. Confirm backups and the source of `DATABASE_URL` separately. |

## Verification for this change

| Check | Result and scope |
| --- | --- |
| Prisma schema | `npx prisma validate` passed locally; `npx prisma generate` completed. Neither applies a database migration. |
| Email-verification unit tests | Focused `tests/signup-delivery.test.ts` run passed **11/11** on 27 September. It covers new-account flag values and legacy-account password login, using mocks. |
| Backend build/lint and broader tests | Backend TypeScript build and ESLint passed. A four-file DB-independent Vitest run passed **26/26**. A separate five-file selection passed **29/30**: the sole failed check in `tests/auth.test.ts` queried the local `.env` database before the new column existed (`P2022`), returning 500 instead of its expected 401. This is a migration-order/environment failure, not evidence that production auth passed. No migration was run against that database. |
| Frontend build/lint | ESLint and the Next.js production build passed; `/privacy` is among 22 generated routes. |
| Local privacy page | `http://localhost:3001/privacy` returned HTTP 200 and was viewed in Chrome. `localhost` is accessible on the developer computer, not from a phone through that address. |
| Public verification | Commit `851a232` reached Vercel Production and Railway staging on 27 September. `https://herbalaiph.vercel.app/privacy` returned HTTP 200 and rendered in Chrome. At 320, 390, 768, and 1440px viewport widths, the page had no document-level horizontal overflow. Railway logs reported `20260927150000_track_email_verification_requirement` applied successfully; the new deployment was Active. Backend `/api/health` returned 200. A login attempt with a non-existent test identifier returned 401, not the pre-migration 500. No real account was created in this smoke test. |
| Live verification preflight | On 27 September, public `/privacy`, public `/signup`, and backend `/api/health` returned HTTP 200; login with a synthetic non-existent identifier returned 401. A resend-verification request with a synthetic non-existent email returned HTTP 200 and explicitly said verification is temporarily disabled. No email or account was created. This does **not** pass the new-account verification workflow. |

## Release sequence and stop conditions

1. Review the exact staged files; do not include unrelated untracked files or the pre-existing `.gitignore` edit.
2. Run schema validation, focused tests, backend/frontend lint and builds. Record exact counts and failures above.
3. Push the reviewed release commit to the deployment branch. Railway's settings were checked on 27 September: root `/herbalaibackend`, GitHub auto-deploy on the staging branch, pre-deploy command `npm run deploy:migrate`, healthcheck `/api/health`. Confirm migration and deployment success before treating the new backend as live.
4. Check the Vercel public `/privacy` route and backend health. Confirm the frontend and backend deployments both use the release commit.
5. Keep `REQUIRE_EMAIL_VERIFICATION=false` until the Gmail sender authorization is durable and a controlled new-account delivery test can be completed. Changing this variable is a separate production security step.
6. After mail durability is proven, enable verification, test one **new** email/password registration, receive and use its verification link, then sign in. Confirm a pre-existing unverified account can still sign in. Stop and roll back the variable if mail fails.

Release checkpoint: code and privacy page are live at `851a232`; the email-verification switch remains **off**. The live mailbox verification flow, long-lived Gmail authorization, full database-writing regression suite, and formal UAT remain open. Do not call these passed based on the public page or health check alone.

Google Cloud branding checkpoint: the live home page, live `/privacy` URL, and exact `herbalaiph.vercel.app` authorized domain were saved on the dedicated mail-only OAuth app. The app remained in Testing; publishing and replacing its expiring sender authorization were not completed at this checkpoint.

## Later controlled live auth check — 27 September 2026

This section supersedes the earlier checkpoint only where it records a newer observation. It is not a full-app UAT sign-off.

| Flow | Observed result |
| --- | --- |
| Public pages and protected entry points | Home, library, community, sign-in, and privacy returned HTTP 200. Public herbs, herb categories, and forum threads returned 200. Unauthenticated `/api/auth/me` and `/api/chat` returned 401. |
| Signup with verification off | Disposable password account `hae2e0927154111123` was created with HTTP 201 and `verificationRequired=false`; password login, `/api/auth/me`, logout, and forgot-password request returned 200. Its reset email arrived in the Gmail inbox and linked to the live reset form. No password reset was submitted, so completed recovery remains unverified. |
| Temporary verification-on test | Railway `REQUIRE_EMAIL_VERIFICATION` was deployed as `true` for one controlled test. Disposable account `havfy0927154621225` received HTTP 201 with `verificationRequired=true` and `verificationEmailSent=true`; login before verifying returned 403. Its verification email arrived. Resend returned 200 and revoked the original link; that link showed an invalid-token error. The replacement link verified successfully, password login and `/api/auth/me` then returned 200, and logout succeeded. Reusing the redeemed link showed an invalid-token error. |
| Negative cases | Invalid verification and password-reset tokens returned 400. A forgot-password request for a nonexistent address returned the neutral 200 response. |
| Restored live state | Railway `REQUIRE_EMAIL_VERIFICATION=false` was redeployed after the test; the service was Active, health returned 200, and the resend endpoint again reported verification temporarily disabled. This temporary test does not mean verification is now mandatory for public signups. |
| Mail OAuth | The dedicated `Herbal-Ai Mail` Google OAuth app was published to **In production**. Google Cloud's Verification Center still reports branding/data access verification outstanding for its sensitive scope. The Railway refresh token was issued while the app was in Testing; its long-term validity has not been established, and replacement/re-authorization is pending. |
| Local verification UI | `herbalaifrontend/app/verify-email/page.tsx` was aligned to the sign-in/sign-up layout and given an error-state resend form. The local production build passed. The page was visually checked at desktop, 768px, 390px, and 320px in light/dark; no document-level horizontal overflow was observed. This UI change is local and not yet released. |

The two disposable usernames above remain in the live user table until explicitly cleaned up. Do not count them as participants in UAT. The legacy unverified-account login path and the completion of a password reset were not directly verified live in this check; focused mocked auth/mailer tests passed 19/19. Do not claim those live flows passed based on this record.

## Published verification UI and violet-profile signup test — 27 September 2026

Commit `fd053a3` updated only `herbalaifrontend/app/verify-email/page.tsx` and was pushed to the deployment branch. The public `/verify-email` page showed the shared authentication layout and a resend form. Submitting a nonexistent synthetic address through that form returned the neutral resend message. The Railway backend deployment for the commit was Active.

With `REQUIRE_EMAIL_VERIFICATION=true` temporarily deployed, a disposable `HerbalAi Test` account was created through the public signup form in the connected violet Chrome profile. The signup UI instructed the user to check email. The matching `Herbal-Ai - Verify Your Email` message arrived in the intended Gmail mailbox but was classified as **Spam**, not Inbox. Gmail described it as similar to previously reported spam. The link pointed to the public `/verify-email` route and produced `Email verified successfully. You can now log in.` Reusing that link showed an invalid/expired-token error. Password sign-in then reached the authenticated home page with the test user's account menu; logout returned to sign-in. The user entered and submitted the signup password themselves; the password and verification token are intentionally omitted here. The disposable account remains in the live database.

Email landing in Spam is a deliverability issue, not a missing-send failure. This one successful live send does not establish long-term validity of the existing Gmail refresh token or guarantee future Inbox placement. Password-reset completion, Google sign-in, and broader UAT remain outside this controlled test.

After this check, the user chose to keep `REQUIRE_EMAIL_VERIFICATION=true`; the live flow sends an email **link**, not a numeric code. Do not assume the earlier `false` setting was restored. The one-hour per-account password-reset email cooldown has since been implemented locally but is **not yet deployed**. The existing per-IP limiter is already live.

The pending cooldown reserves a timestamp atomically on the user row, sends at most one accepted reset email per account in a rolling hour, keeps the same neutral response for unknown or repeated requests, and releases the reservation if delivery fails or is suppressed. The migration backfills recent active reset requests. Prisma validation, backend build, lint, and 23 focused mocked tests passed. The database-backed recovery tests were updated but not run: the local Neon database already had three unrelated pending migrations before this change. No migration or cooldown change has been applied to Railway yet.

Rollback: restore `REQUIRE_EMAIL_VERIFICATION=false` first if verification delivery fails. The migration is additive, so older application code can ignore the new column; redeploying the previous known-good commit is the code rollback path. Do not roll back database state by deleting user rows.

## Document map for future revisions

| Topic | Existing source of detail |
| --- | --- |
| Prior test execution and issue history | `HERBAL_AI_TESTING_SCRATCHPAD.md`, `Docs/TEST_EXECUTION_LOG.md`, `Docs/ASTRA_ISSUE_HANDOFF.md` |
| Requirement-to-test evidence | `Docs/REQUIREMENTS_TRACEABILITY_MATRIX.md`, `Docs/VERIFICATION_VALIDATION_REPORT.md` |
| Account email/recovery | `Docs/ACCOUNT_RECOVERY_REHEARSAL_2026-09-06.md`, `Docs/RAILWAY_VERCEL_DEPLOYMENT.md` |
| Deployment and public smoke | `Docs/EXTERNAL_STAGING_SMOKE_TEST_2026-09-21.md`, `Docs/RAILWAY_VERCEL_DEPLOYMENT.md`, `Docs/RELEASE_READINESS_CHECKLIST.md` |
| Responsive/device acceptance | `Docs/MOBILE_FUNCTIONAL_REHEARSAL_2026-09-06.md`, `Docs/PHYSICAL_DEVICE_ACCEPTANCE_2026-09-22.md` |
| UAT | `Docs/UAT_TEST_SCRIPT.md`, `Docs/UAT_SUMMARY.md`, `Docs/UAT_2026-09-22/` — do not infer signed completion from site use |
| Formal-document corrections | `Docs/FORMAL_DOCUMENT_HANDOFF_2026-09-25.md`, then the controlled root `Herbal_AI_SRS_v3.docx`, `Herbal_AI_SPMP_v3.docx`, `Herbal_AI_SDD_v2.docx`, and `Herbal_AI_STD_v2.docx` |
