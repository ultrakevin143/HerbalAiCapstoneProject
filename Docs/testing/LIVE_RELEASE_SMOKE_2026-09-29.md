# Live release smoke — 29 September 2026

This is release evidence for the public deployment, not final user acceptance. No passwords, OAuth codes, reset links, mail contents, or private tokens are recorded.

## Release sequence

| Phase | Revision | Verified result |
|---|---|---|
| Frontend OAuth link | `357cfe3` | Pushed `codex/readability-accessibility` first. Vercel reported Ready in Production and assigned `herbalaiph.vercel.app`. After deployment, the live sign-in link pointed directly to the HTTPS Railway `/api/auth/google` endpoint. |
| Reliability, OAuth, CI, tests | `165444dd77ee158af0b639b0c66e9cb65474fe86` | Pushed only the 20 reviewed production files after the first phase was live. Vercel showed this exact revision Ready/Current in Production. Railway showed its matching GitHub revision Active and its `/api/health` healthcheck. The [GitHub Actions run](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36509840181) completed successfully for both backend and frontend jobs. |

The unrelated formal-document moves, demo scripts and credentials, image candidates, pending index migration, and other working-tree edits were not included in these pushes. `main` was not merged or changed by this release.

## Live checks on the deployed revision

| Check | Observation | Limit |
|---|---|---|
| Public availability | Homepage, Vercel `/api/health`, and direct Railway `/api/health` returned HTTP 200. | A health response is not end-to-end acceptance. |
| OAuth start/guard | Backend start returned HTTP 302 to Google; a 64-character state matched its HttpOnly, Secure, SameSite=Lax backend cookie. Direct callback without state returned HTTP 400. | The actual Google account selection and return-to-app sign-in remain untested after this release. No state or cookie value was recorded. |
| Authenticated Dr. Ai | Existing disposable contributor session opened `/chat`. A Lagundi preparation/safety question completed with herb/FAQ references and a safety notice. A fictional Moonroot question refused to invent an unverified preparation and showed no raw provider error. | Two successes do not prove ongoing Gemini availability, answer accuracy, or safety across all prompts. This is not medical validation. |
| Contributor and admin read paths | The existing contributor session restored on `/suggest` and showed its labeled rejected QA submission. The existing administrator session opened `/admin`, showing 37 herbs, 11 users, 33 FAQ facts, 0 pending, 1 approved, and 2 rejected suggestions. Historical reject and ban/unban records loaded in Audit Logs. | No new contribution, approval, rejection, or audit write was performed on this revision. The approved suggestion list includes an old placeholder-looking record; review this data before a public defense demonstration rather than treating it as an evidenced herb. |
| Automated release check | GitHub backend lint/typecheck/tests and frontend lint/typecheck/build were green on `165444d`. | The workflow excludes the catalog-remediation test requiring a preloaded governed catalog; that test was part of the earlier guarded populated-catalog local suite. |

## Still open

1. Complete a browser Google OAuth round trip on the new revision with an explicitly approved test account.
2. Exercise fresh signup, verification-email delivery, verification, and sign-in; use a disposable inbox/account and record only non-sensitive outcomes.
3. Exercise a fresh reset email, account-holder password change, replacement sign-in, and old-session revocation. The account holder must enter and submit the new password; do not record it.
4. Recheck contributor submission, administrator review/audit, and evidence-backed approval after deployment without leaving misleading public catalog data. Existing dated write-flow evidence is not a retest of this revision.
5. Complete physical-device checks, five participant UAT records, and adviser/panel acceptance. Do not describe the project as fully defense-ready until these gates are resolved or formally waived.
