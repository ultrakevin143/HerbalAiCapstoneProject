# OAuth and Herbal-Ai password wording — 2 October 2026

## Decision and scope

The user approved the recommendation to retain Google sign-in and optional email/password sign-in, while clarifying the difference between a Google password and a Herbal-Ai password. This batch does not convert Google-linked accounts into provider-only accounts, remove recovery, infer a login provider from a username, or add provider metadata or a database migration.

The baseline checkout is release b7913bcbb009b06ad28b4830631aae580fb44a20 in the selective-release-check worktree. Existing uncommitted testing reports and the separate dirty Desktop checkout are preserved. At the initial local review, this batch had not been committed, pushed or deployed; subsequent release evidence is recorded below.

## Changed interaction path

- Account settings now names the credential Herbal-Ai password. The email-link section explicitly covers creating a first app password or resetting an existing app password. It explains that Google sign-in continues for linked accounts and that the Google password does not change.
- The public recovery page requests a link to create or reset the app password and explains that continuing Google sign-in remains an option. Its fallback response is conditional on account existence and does not claim email delivery was proven.
- The shared password-link form uses Set Your Herbal-Ai Password and Save Herbal-Ai Password. It explains the minimum length, all-device sign-out, and the separate Google password. The loading text refers to a password form instead of a verification terminal. The brand description no longer incorrectly restricts account access to a contributor panel.
- The existing recovery email body explains setup and reset, continuing linked Google sign-in, one-hour expiry, single use and all-device sign-out. Its existing reset subject and token URL are retained. User names and the application name remain HTML-escaped.

Existing styling and component structure are retained. No endpoint, credential validation, account-linking behavior, cooldown, token lifetime, redemption rule, session revocation or administrator permission is changed. The frontend does not assert that any particular account has no local password; it describes the available options conditionally.

## Observed local validation

| Check | Result | Boundary |
| --- | --- | --- |
| Combined frontend native regressions | 124 passed, 0 failed | Password settings, administrator logout, session refresh, Dr. Ai streaming and Messenger suites |
| Added frontend cases | 5 passed within the combined suite | Actual component rendering for settings, recovery and token form; neutral recovery fallback; disabled form with missing token |
| Focused backend regressions | 36 passed across 3 files | oauth-password-setup, password-reset-cooldown and password-settings; external providers, mail and persistence intercepted |
| Google-to-password service lifecycle | Passed in the focused suite | Real service, bcrypt and JWT with mocked Google, intercepted mail and memory persistence; both login methods keep the same account; previous password and used link rejected |
| Email wording assertions | Passed in the lifecycle case | App-password setup/reset, unchanged Google password, continuing Google sign-in, single-use link and session consequence |
| Frontend TypeScript, ESLint and production build | Passed | Next.js 16.3.8; 22 static pages generated |
| Backend TypeScript and ESLint | Passed | No database migration or live write |
| Mechanical UI detector | No findings | The three changed frontend source files |

This is local automated validation, not fresh Gmail delivery or live acceptance of these new strings. Browser visual checks at desktop/mobile sizes and the full PostgreSQL-backed CI suite have not been rerun for this wording batch. Local build outputs and any existing loopback fixture configuration are not production source changes.

## Release handoff

Review the six source/test files and this report as a separate wording batch; do not include unrelated working-tree changes. Before publication, run CI and check the updated copy at phone and desktop widths. After reviewed deployment, recheck settings and the recovery form without reading or entering private passwords. If an email is requested for acceptance, use the normal cooldown and the authorized test inbox; do not send repeated messages solely to inspect unchanged authentication behavior. A user must choose and submit any new credential themselves.

No claim is made that every OAuth website supports this flow. Supporting both methods is Herbal-Ai's chosen account design.

## Publication authorization

The user subsequently requested publication so they can audit the live interface manually. Only this seven-file wording/test/report batch is approved for release. The release process first pushes the existing isolated CI branch, waits for the backend and frontend checks, then fast-forwards main and the existing deployment branch if they still share the reviewed baseline. Deployment results and post-release browser checks are recorded separately after they are observed. No private password entry or new mail request is necessary merely to publish the copy.

## Observed release and live checks

The seven-file batch was committed as 0ba39ea568b19c6016b77dace9273ed353e1bb15. Isolated branch CI [36893383221](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36893383221) passed before atomic fast-forward publication to main and codex/readability-accessibility. Job logs confirmed 523 backend tests across 67 files and 124 frontend cases. The subsequent [main CI](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36893734455) and [deployment-branch CI](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36893734005) also passed. Remote branch hashes were checked against the exact release SHA.

Vercel and Railway reported successful deployments for this commit. The anonymous Railway /api/health request returned HTTP 200. A public HTTP request to the live /forgot-password page returned the updated heading, and a connected Chrome tab subsequently rendered the same updated heading, explanatory text and Email a Password Link control. That tab initially showed the old copy while deployment was settling; no cache purge or service-worker modification was performed.

The live /reset-password page without a token rendered Set Your Herbal-Ai Password, the Google-password explanation, minimum-length and sign-out consequences, plus the existing missing-token error. Both password inputs and Save Herbal-Ai Password were disabled. No token, credential or reset POST was supplied for this read-only check.

A temporary 390-by-844 Chrome viewport showed the recovery heading wrapping within its card, readable explanatory paragraphs and the email action without horizontal overflow: document width 375, viewport width 390. The override was restored. This is browser emulation, not physical-device evidence.

A new live library tab restored the existing Mercado Kevin contributor session and 37 published herbs. Account settings displayed the new Herbal-Ai password and Create or reset your Herbal-Ai password headings with the intended conditional explanations. No form was submitted; settings was closed without changes. Desktop recovery-page proof is saved outside Git as oauth-password-copy-live-20261002.png in the task visualization directory.

These post-release observations are currently saved locally rather than triggering an additional documentation-only production redeploy. No fresh email delivery, private password change, or used-link redemption was attempted in this wording-release check. The user can now perform the requested manual live audit.
