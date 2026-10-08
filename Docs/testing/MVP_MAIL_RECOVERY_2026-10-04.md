# MVP continuation: failed live password-link delivery — 4 October 2026

## Scope

The user excluded hosting work and asked to continue MVP validation. The working checkout is `selective-release-check`; live source release is `4ad669d`. This continuation performed Library source-scope auditing and one authorized recovery request for the existing Google-linked contributor account. No hosting purchase, provider-variable change, administrator-password change, account deletion, public herb edit, commit, push, or deployment was performed.

## Reproduced live failure

The existing Mercado Chrome account settings identified the same previously authorized Google-linked contributor username, `mercado_kevin_b67e52`. The user reported forgetting its Herbal-Ai password. Google/Gmail password recovery was neither needed nor attempted: Gmail was already signed in in Mercado Chrome.

One click on Email a password link completed and the settings displayed Password link requested with the neutral message saying a reset link had been sent if the account existed. A targeted Gmail `in:anywhere` search included Spam and Trash. After refresh and an intentional Gmail reload, its settled results still contained only the two preceding-day QA recovery messages; there was no new message for this request. No repeated recovery email request or cooldown bypass was attempted.

Read-only backend logs confirmed the cause of this attempt at **2026-10-04 14:58:38 Asia/Manila**:

`Failed to send password reset email: Error: Gmail authorization failed (HTTP 400).`

The stack names the Gmail mailer, forgotPassword service and authenticated requestPasswordSetup controller. This establishes a failed OAuth token exchange before Gmail message submission, not a Spam-folder problem or a Gmail-send quota finding. The deployed logger intentionally records only HTTP status, so an expired/revoked refresh token versus a client-credential mismatch is not established by this log. Do not report a specific Google error code, expiration date, or secret value without observing it safely.

[Google's OAuth documentation](https://developers.google.com/identity/protocols/oauth2#expiration) describes several reasons refresh tokens can stop working. Those possibilities are not a diagnosis of this particular credential. Restore the intended sender's existing Gmail API authorization/client configuration through the normal authorized flow, without adding scopes or exposing credentials, then verify actual delivery before restarting password acceptance. An existing Google-linked site sign-in is not proof that the separate mail-sender authorization works.

The shared Gmail mailer is also used for verification and other notification emails. This is a serious release-readiness blocker for mail-dependent flows. No additional live signup was created to test verification while sending was known to fail; its impact is inferred from the shared mailer, not a newly observed signup-to-inbox failure.

Proof is saved outside Git as `4ad669d-mail-authorization-failure-20261004.png` in the task visualization directory. It shows the filtered failure and timestamp, not a token, password, client secret, or reset URL.

## Focused local repair

The code incorrectly reused public Forgot Password's anti-enumeration response for a signed-in user's settings request. That neutral public response hid both a provider failure and a cooldown as apparent success. The user is already authenticated and the backend selects their own email, so settings can report these outcomes without exposing whether an arbitrary target account exists.

`src/services/auth.service.ts` now shares one internal request/token/delivery implementation and distinguishes missing account, cooldown, failed delivery and provider-accepted send. Public forgotPassword keeps the identical neutral message for unknown, cooldown, failed and successful cases. Authenticated requestPasswordSetup now returns:

| Outcome | Response |
| --- | --- |
| Provider accepted the send | HTTP 200, check inbox/Spam; one-hour, single-use link |
| Existing rolling-hour request | HTTP 429, explicitly says one password link per hour; no replacement token/send |
| Provider rejects, times out or suppresses delivery | HTTP 503, says the link could not be sent; no provider details exposed |
| Account absent during the request | HTTP 401 |
| Banned account | Existing HTTP 403 preserved |

Failed-delivery cleanup still revokes the failed token and releases its cooldown. Existing password, auth cookies and session version are not changed by requesting a link. Password redemption and password-change behavior are untouched. This repair does **not** renew Google credentials or restore live mail delivery by itself.

The existing frontend already displays backend errors in an action-local alert above Email a password link and restores the controls without logging out or erasing the current-password draft. Added native component regressions verify the exact HTTP 503 and 429 messages use that path. No frontend source, layout, CSS, account settings copy or visual style was changed.

## Observed validation

| Check | Outcome |
| --- | --- |
| Baseline focused mail/password suites | 45 cases passed across five files before the new regressions. This did not establish healthy production credentials. |
| New regressions before repair | Seven assertions failed, reproducing apparent-success responses for failed delivery/cooldown and neutral settings success text. |
| Focused suites after repair | 50 cases passed across five files: mailer, actual MIME composer, public cooldown, Google/password lifecycle and protected password settings. Providers/repositories are intercepted where specified. |
| Native frontend password/settings suite | 79 cases passed, including the two new action-local alert cases. These are component/render regressions, not a newly completed live password cycle. |
| Backend lint/build | Passed. |
| Focused diff whitespace check | Passed; Git only reported its existing LF/CRLF conversion warnings. |
| Additional strict test-file typecheck | Failed on existing unchecked mock-call indexing and the existing Prisma-client-versus-async-spy typing in the three selected test files. Source build passes; this stronger diagnostic must not be represented as passed. No unrelated mock/type refactor was made. |
| Local account-recovery SQL suite | Could not validate: nine cases failed at database-backed fixture/signup operations because loopback PostgreSQL refused the connection. The five accompanying non-DB files passed. This is not proof of a production database defect. |
| New SQL settings cleanup regression | Added and existing SQL cooldown expectation updated to HTTP 429; not executed here. Requires the isolated PostgreSQL CI before publication. |

There are **129 unique passing cases** in the two final focused non-DB runs (50 backend + 79 frontend), not an accumulation of repeated baseline/red/green runs. The previous release's 1224-case CI result does not certify this new, uncommitted repair.

## Pending release scope

Production code: `herbalaibackend/src/services/auth.service.ts` and `herbalaibackend/src/lib/mailer.ts`.

Regression files: `herbalaibackend/tests/mailer.test.ts`, `herbalaibackend/tests/password-settings.test.ts`, `herbalaibackend/tests/oauth-password-setup.test.ts`, `herbalaibackend/tests/password-settings-database.test.ts`, and `scripts/password-settings.test.mjs`.

Documentation: this report and `LIBRARY_SOURCE_AUDIT_2026-10-04.md`. Existing historical documentation edits remain unrelated and uncommitted. No credential, environment file, generated proof image, fixture database, migration, hosting note or personal file is part of this repair. Nothing from this continuation is published.

## Remaining gates and order

1. Restore the mail-sender authorization and observe one successful recovery email in the already signed-in Gmail inbox. Do not ask the user to recover Gmail merely to test the separate Herbal-Ai password.
2. Let the user privately enter and submit the replacement Herbal-Ai password, then observe email/password sign-in to the same username/account, old-session revocation, refresh persistence, continuing Google login and used-link rejection. No link or password was entered/submitted in this continuation.
3. Run isolated SQL CI for the local feedback repair, review its exact scope and obtain publication authorization before releasing. Retest failure/cooldown/success feedback after deployment without manufacturing production outages.
4. Complete the genuine Suggestions away/back check on the currently signed-in account. Old Release QA cached UI and automated foreground commands do not prove this event; do not count it as passed or a confirmed focus-handler bug.
5. Perform the prioritized legacy Library source review in the separate report. All 38 records have citations, but each has an exact-scope gap against the new prospective rule. No broad tag backfill is authorized by that structural finding.

Hosting stays excluded. Physical-device checks previously reported by the user and the participant-UAT deferral are not converted into new agent-observed or signed acceptance evidence. Full MVP acceptance is not complete while these live mail/account and genuine-tab-return gates remain open.

## Repair continuation — 4 October 2026

Read-only Google Cloud inspection found the dedicated `Herbal-Ai Mail` project already **In production**, with one existing `Herbal-Ai Gmail Sender` web client and one authorized user. Its verification is not complete: the normal sender reauthorization flow displays Google's unverified-app warning. The deployed Railway `GMAIL_CLIENT_ID` matches that dedicated client, not the separate website sign-in client. This rules out a different deployed client ID as the observed mismatch; it does not prove the client secret or refresh token is valid and does not identify the underlying HTTP 400 error code.

The existing mail-only client was prepared in Google's OAuth Playground with only `gmail.send`, using the already signed-in intended sender account. No new client, expanded scope, Google password reset, token revocation, provider-variable write, or deployment was performed. The flow stopped at Google's warning for the user to review and complete personally. The existing credentials were not written to Git, documentation, chat, or proof images. Pending sender reauthorization is a human-action blocker, not successful mail recovery.

The mailer now includes only allowlisted OAuth error codes in internal authorization failures, retaining generic status-only errors for unknown or malformed error bodies. Error descriptions, tokens, client secrets and arbitrary provider response text are never appended. This improves diagnosis after release; it is not evidence that the live failure was `invalid_grant` or `invalid_client`. Successful token responses are also checked for an object containing a nonempty string access token before composing or sending a message, instead of trusting a TypeScript assertion for network data. Fourteen additional regressions cover known safe codes, unknown error shapes, null/array/missing/non-string/blank access tokens and non-JSON success bodies.

The strict test typing failures found earlier were repaired in the affected tests. Mock calls are asserted to exist before indexed access. The SQL password-change race uses a correctly typed bcrypt-comparison barrier after both requests have read their credentials, rather than replacing a Prisma query-client return value with an incompatible native Promise. It still asserts one successful password change, one conflict and exactly one accepted replacement; its SQL runtime outcome remains unverified here.

| Subsequent check | Observed result |
| --- | --- |
| Five focused backend files | 64 cases passed. |
| Native password-settings component suite | 79 cases passed. |
| Backend source lint and build | Passed. |
| Strict typecheck of mailer, password-settings, OAuth password setup and SQL password-settings test files | Passed with strict, unchecked-index and exact-optional checks enabled. This supersedes the earlier typing failure, not the pending SQL runtime gate. |
| Full working-tree whitespace check | Passed; only existing LF/CRLF conversion warnings. |
| Isolated SQL runtime/CI for the new batch | Pending; no local loopback PostgreSQL and no new branch push performed. |
| Sender token renewal and live inbox delivery | Pending user-completed Google authorization; not counted as passed. |

The final focused non-DB total is now **143 unique passing cases** (64 backend + 79 frontend). Do not add the earlier 129-case run to this total. This repair remains local, with existing UI styling and unrelated working-tree files preserved. Source-scope review of the 38 legacy Library records remains separate; no medicinal claims, dosages or coverage tags were fabricated to close the audit.
