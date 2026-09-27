# Herbal-Ai issues, tests, and release handoff

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
| Email verification | Railway setting was reported as `REQUIRE_EMAIL_VERIFICATION=false`; confirm the setting again before any account test |
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

## Verification for this change

| Check | Result and scope |
| --- | --- |
| Prisma schema | `npx prisma validate` passed locally; `npx prisma generate` completed. Neither applies a database migration. |
| Email-verification unit tests | Focused `tests/signup-delivery.test.ts` run passed **11/11** on 27 September. It covers new-account flag values and legacy-account password login, using mocks. |
| Backend build/lint and broader tests | Backend TypeScript build and ESLint passed. A four-file DB-independent Vitest run passed **26/26**. A separate five-file selection passed **29/30**: the sole failed check in `tests/auth.test.ts` queried the local `.env` database before the new column existed (`P2022`), returning 500 instead of its expected 401. This is a migration-order/environment failure, not evidence that production auth passed. No migration was run against that database. |
| Frontend build/lint | ESLint and the Next.js production build passed; `/privacy` is among 22 generated routes. |
| Local privacy page | `http://localhost:3001/privacy` returned HTTP 200 and was viewed in Chrome. `localhost` is accessible on the developer computer, not from a phone through that address. |
| Public verification | Pending deployment. Check the public `/privacy` page, backend health, and a controlled new email/password account without exposing a real password in test records. |

## Release sequence and stop conditions

1. Review the exact staged files; do not include unrelated untracked files or the pre-existing `.gitignore` edit.
2. Run schema validation, focused tests, backend/frontend lint and builds. Record exact counts and failures above.
3. Push the reviewed release commit to the deployment branch. Railway's settings were checked on 27 September: root `/herbalaibackend`, GitHub auto-deploy on the staging branch, pre-deploy command `npm run deploy:migrate`, healthcheck `/api/health`. Confirm migration and deployment success before treating the new backend as live.
4. Check the Vercel public `/privacy` route and backend health. Confirm the frontend and backend deployments both use the release commit.
5. Keep `REQUIRE_EMAIL_VERIFICATION=false` until the Gmail sender authorization is durable and a controlled new-account delivery test can be completed. Changing this variable is a separate production security step.
6. After mail durability is proven, enable verification, test one **new** email/password registration, receive and use its verification link, then sign in. Confirm a pre-existing unverified account can still sign in. Stop and roll back the variable if mail fails.

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
