# OAuth and Herbal-Ai password wording — 2 October 2026

## Decision and scope

The user approved the recommendation to retain Google sign-in and optional email/password sign-in, while clarifying the difference between a Google password and a Herbal-Ai password. This batch does not convert Google-linked accounts into provider-only accounts, remove recovery, infer a login provider from a username, or add provider metadata or a database migration.

The baseline checkout is release b7913bcbb009b06ad28b4830631aae580fb44a20 in the selective-release-check worktree. Existing uncommitted testing reports and the separate dirty Desktop checkout are preserved. This batch has not been committed, pushed or deployed.

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
