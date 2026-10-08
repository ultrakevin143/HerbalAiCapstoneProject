# Account password settings — 1 October 2026

## Scope and release state

The user requested password changes for email/password accounts, password creation for Google accounts, and email/password login after creation. Initial local implementation used the selective-release-check worktree on top of `f3ec55af291f72f929e556cd9b82ef3598d09b50`. Following explicit publication authorization, the feature and a focused keyboard repair were released as recorded below. Three existing session-recovery evidence edits were preserved, and the primary checkout was untouched. No live password has been changed by the agent in this batch.

## Implemented flow

- The existing profile editor is now named Account settings. Profile editing remains a separate form. Reopening the modal remounts it for the current user so it does not retain blank bootstrap fields or another account's profile draft.
- Change password asks for the current password, a new password and confirmation. The server verifies the current bcrypt hash and rejects a replacement matching that hash. Incorrect-current and same-password requests do not mutate the account or revoke sessions.
- Google users, or users who have forgotten their password, can request an email password link from settings. The server selects the authenticated user's email; clients cannot submit another email or account ID. Users choose their password through the existing reset form after proving inbox access. A signed-in browser alone cannot silently add a password.
- The existing schema has a password hash for every account, including a random hash on Google-created accounts. There is no reliable provider-only marker. The implementation does not infer account type from usernames, does not expose hashes, and needs no database migration.
- After password creation, the existing email/password login checks the chosen hash on the same account. Google login continues to resolve that account by its verified email.
- Password changes use a conditional database transaction guarded by account ID, current hash, session version and ban status. Only one concurrent change can win. The transaction increments sessionVersion and revokes refresh tokens and outstanding password-reset links. Cache invalidation and socket-session notification happen after commit.
- Successful changes clear both authentication cookies and the frontend session. The screen warns users in advance that all devices are signed out. Old access tokens fail the existing fresh session-version check.
- New change/reset passwords require at least eight characters and at most 72 UTF-8 bytes, avoiding bcrypt truncation collisions. Resetting to the current password is rejected without consuming the link.
- Both new endpoints require authentication, reject untrusted browser Origin headers and use a shared limit of five requests per authenticated account per fifteen minutes. Password-link requests also retain the existing database-backed one-hour cooldown. Reset links retain their one-hour expiry and single-use transaction.
- Password fields have labels, autocomplete hints and a show/hide control. Duplicate submissions and competing email-link requests are locked while a request is pending. Timeout/error responses do not falsely report a completed change or automatically replay a timed-out write.

## Endpoints

| Method and path | Body | Result |
| --- | --- | --- |
| POST /api/auth/change-password | currentPassword, newPassword | Verify current hash, atomically replace it, revoke sessions and clear cookies |
| POST /api/auth/password-setup | Empty object | Request the existing password link for the authenticated account's email |
| POST /api/auth/reset-password | token, password | Existing single-use recovery flow, now also rejecting unchanged/oversized passwords |

## Observed local validation

| Check | Observed result | Boundary |
| --- | --- | --- |
| Backend selected non-database/API-validation suites | 419 tests passed in 50 files | Repositories/providers mocked where needed; unused loopback database URL, no production access |
| Combined frontend native regressions | 104 tests passed | Session, Messenger, Dr. Ai streaming and 19 password-settings cases |
| Backend lint and TypeScript build | Passed | Production source compiled; tests are outside the existing production tsconfig |
| Frontend typecheck, lint and production build | Passed | All 22 static pages generated; no live settings deployment |
| Impeccable detector on changed frontend targets | Empty findings list | Mechanical detection, not browser/device acceptance |
| git diff whitespace check | Passed | Existing line-ending conversion notices are not whitespace failures |

The new service/API tests exercise real bcrypt checks, wrong-current and same-password rejection, stale/missing/banned accounts, conditional-write conflicts, database-write failures, authentication, forged fields, trusted/untrusted origins, cookie clearing, UTF-8 limits and per-account rate limits. Repository tests inspect the actual transaction implementation with mocked Prisma operations; they are not evidence of PostgreSQL rollback or locking.

The new memory-persistence lifecycle test runs the actual Google-login, password-setup, reset, email-login and change-password services with real bcrypt/JWT code and intercepted Google/mail providers. It verifies email/password login after Google signup, continuing Google login on the same account, one-hour email cooldown, used-link rejection, session-version increments and rejection of the previous chosen password. It is not a real Google authorization, Gmail-delivery or database test.

An initial broader local selection accidentally included two existing database-dependent suites: herb-catalog-remediation required the isolated herbalai_test database, and review-publication-transaction could not connect to unused loopback port 1. These were environment failures, not repaired production defects. After excluding database-dependent suites, all 419 selected tests passed. The initial frontend regression harness also failed because its CommonJS mock double-wrapped default exports; the test loader was corrected, after which all 19 new cases and the combined 104 cases passed.

A static layout preview was generated outside Git using the real component and built styles. Browser navigation to its file URL was blocked by browser security policy; no alternate navigation or server workaround was attempted. No browser screenshot, responsive-layout or keyboard-navigation pass is claimed for this feature.

## Remaining gates before publication

1. Run the full backend suite against the isolated CI PostgreSQL database. Six new password-settings-database cases cover regular password changes; old access/refresh/reset invalidation; wrong-current/same-password preservation; Google-to-email-password login with continuing Google login; reusable-link rejection; concurrent changes; and banned/forged-target requests. These tests enforce a loopback herbalai_test database and were not run locally because PostgreSQL/Docker is unavailable.
2. Review the complete code/test diff, including the existing evidence-document edits, before an explicitly authorized commit or push. No local fixture, preview, secret or migration belongs in the release.
3. After backend and frontend deployment, test Account settings on desktop and a physical phone: menu discovery, modal scrolling, labels, show/hide, keyboard navigation, busy/error feedback and profile-field initialization.
4. On a disposable email/password account, have the user enter and submit a password change themselves. Verify old-password rejection, new-password login, refresh persistence and old-session revocation in another tab.
5. On an authorized disposable Google account, request the settings email link, observe Gmail delivery, have the user choose a password themselves, then verify email/password and Google login resolve the same account. Confirm a reused link is rejected.

Real password entry/submission, physical-device results and participant UAT are not invented. This report documents a tested local implementation, not completed live acceptance.

## Authorized release and live findings

The user subsequently authorized publication and live testing. The reviewed sixteen-file password-settings batch was committed as `ec6d313845c797bf94245062f121a10822442da6`, leaving the three pre-existing evidence-document edits unstaged. Isolated CI run [36865999919](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36865999919) passed: 523 backend tests across 67 files, including all six PostgreSQL password-settings cases, and 104 frontend regressions. The same commit was atomically fast-forwarded to main and codex/readability-accessibility. Vercel and Railway reported successful deployments for that SHA.

After publication, a separate live contributor tab restored Herbal QA and the library's 37 published herbs. The new Account settings menu and all password controls rendered. Display name was correctly initialized, and the account username matched the existing disposable QA account. A separate Gina administrator tab restored its dashboard without Forbidden; no administrator password or database record was changed.

The settings Email a password link action completed with the neutral recovery response. Searching the exact disposable Gmail alias with in:anywhere/newer_than:1h returned one new matching password-reset email in Inbox, timestamped 9:17 PM Philippine time on 1 October. This proves actual delivery for this request, not unlimited future mail availability or a completed password change.

A live keyboard defect was reproduced: pressing Tab while the final Email a password link control was focused moved focus to the herbal-library search input behind the still-open modal. DOM inspection confirmed dialogContainsFocus was false. This pre-existing profile-dialog behavior became visible during password-settings acceptance and was not counted as a pass.

A focused frontend follow-up adds initial dialog focus, Tab/Shift+Tab containment, Escape closing, background-scroll locking and cleanup/focus restoration. It preserves the existing styling and adds eight regression cases for the actual focus helper. Local combined frontend regressions now pass 112/112; frontend typecheck, lint and production build also passed. This follow-up still requires reviewed publication and live confirmation at the time of this entry.

## Follow-up release and live recheck

The focus repair was committed as `db531de904de8ec2ba94d6ccc39e4bbf15080ad3`. Isolated branch CI [36868292965](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36868292965) passed before atomic promotion to main and codex/readability-accessibility. The resulting main and deployment-branch CI runs also passed. Vercel and Railway both reported successful deployments for this exact SHA.

| Live check | Observed result | Boundary |
| --- | --- | --- |
| Initial modal focus and background scroll | Focus was on role=dialog; body overflow was hidden | Actual live contributor browser |
| Tab from final email-link button | Wrapped to Close account settings; focus remained inside dialog | Previously reproduced escape no longer occurs |
| Shift+Tab from close button | Wrapped to Email a password link inside dialog | Actual keyboard events |
| Escape and cleanup | Dialog closed; focus returned to User account menu; body overflow restored | No account mutation |
| Empty Change password form | Native required-field prompt focused Current password; no success response | No credentials entered or password change attempted |
| Show/hide passwords | All three empty password fields changed to type=text, then the Hide passwords control returned to Show passwords | No stored or entered password read |
| Phone-size layout | At 390 by 844 CSS pixels, page width was 390; modal bounds were x=16..374 and y=24..820; inner width and scroll width both 341 | Browser emulation, not a physical-phone result |
| Modal scrolling | Profile, password, confirmation, change action and email-link action were reachable in the internally scrolling modal | Temporary viewport override restored afterward |
| Contributor refresh | Herbal QA session and 37-herb library restored after live reload | No password change has occurred yet |
| Administrator refresh | Admin Admin dashboard restored after loading, with no Forbidden response | No administrator password or record changed |
| Public API authentication | Health returned 200; anonymous change-password, password-setup and auth/me returned 401 | Requests carried no cookies or credentials |

Live visual evidence is saved outside Git as password-settings-live-mobile-20261001.png in the task visualization directory. The initial actual Gmail email remains evidence of delivery, not evidence that its reset link was consumed. A native AX snapshot represented the pressed password toggle as a checkbox; the DOM snapshot correctly identified a button. The test selector was corrected accordingly; this was not a product defect.

Remaining authenticated acceptance: the user must enter and submit a current-to-new password change, then verify the exact old password is rejected, the new password signs in, and the previous session is revoked. Actual Google-to-password setup and subsequent email/password plus Google sign-in also require an explicitly selected test account and user-entered password. These live credential cases remain pending; automated PostgreSQL and service lifecycle coverage is not substituted for them. Physical-device checks of these new settings and participant acceptance also remain outside the observed results.

## Scheduled continuation — 11:34 PM Philippine time

The scheduled run rechecked remote main and codex/readability-accessibility; both still resolve to db531de904de8ec2ba94d6ccc39e4bbf15080ad3. GitHub reports success for the main, deployment-branch and isolated-branch CI runs, plus Vercel and Railway deployments for that SHA. No commit, push or production environment change was performed during this continuation.

The previously retained form tab was no longer available. A new live library tab restored Herbal QA, and Account settings displayed username mvpqa_unmid8j with empty current/new/confirmation fields. A separate live Suggestions tab loaded the protected form and My Submissions with zero records before any password change. Both agent-created tabs are retained for user entry and the subsequent revocation check. No user draft was altered.

Credential entry and submission are awaiting the user; no current-to-new password change, old-password rejection, post-change login or Google password setup is counted as passed. The previously delivered 9:17 PM email is outside its documented one-hour lifetime at this scheduled run and must not be presented as a fresh recovery link. If recovery is necessary, request a new link through the normal flow without overriding the cooldown. The connected browser inventory currently has Mercado Chrome but no Gina administrator session; administrator credentials are not required or modified for this test.

## Subsequent administrator check — user-performed credential change

The user clarified that they changed the administrator password in Chrome, not the prepared disposable-account form in Codex. They reported automatic logout following the change, rejection of the exact previous password, successful new-password login opening Admin Panel, and continued login after refresh. These are recorded as user-performed live acceptance results for the administrator account, not agent-entered credentials or completed disposable-account tests.

The agent independently observed Admin Admin authenticated on the public homepage, then created a separate Mercado Chrome administrator tab to avoid disturbing the user's ongoing sign-in. That separate tab loaded Dashboard Overview and its statistics, and returned to the same authenticated administrator dashboard after a reload. No Forbidden response remained. The agent did not read, enter, reset or submit any administrator password. An earlier refresh of the user-owned tab coincided with active sign-in/navigation and is not counted as a clean independent persistence check; the separate-tab recheck is the observed result.

The administrator-password login and refresh checks are now covered by the above user results and independent dashboard observation. Cross-device revocation beyond the reported automatic logout, the unchanged disposable test account, and the Google-to-password lifecycle still require their own evidence.

## Google-linked password acceptance — 2 October 2026

After release b7913bcbb009b06ad28b4830631aae580fb44a20, the user explicitly selected kevinmercado987@gmail.com for this check. The administrator session was first logged out using the new dashboard button, with protected-route rejection observed separately. The agent then selected the authorized Mercado Kevin Google account through the normal provider chooser. The branded Dr. Ai signing-in screen returned to the authenticated contributor homepage. Account settings showed email kevinmercado987@gmail.com and username mercado_kevin_b67e52; these identifiers form the baseline for subsequent login comparisons. No provider-only metadata or previous absence of a usable password is inferred.

The settings Email a password link action completed with its neutral recovery response. A focused Gmail search using in:anywhere, the exact recipient, the Herbal-Ai reset subject and newer_than:1h found one matching email, labelled Inbox and timestamped 12:08 AM Philippine time on 2 October. The message addressed Mercado Kevin and linked to the expected live herbalaiph.vercel.app/reset-password route with a one-hour expiry. No email token or credential is stored in this report or Git.

The linked live form rendered New Password, Confirm New Password and Reset Password. The user must enter and submit the new Herbal-Ai credential themselves; it does not change their Google password. The form and the still-signed-in pre-change contributor tab are retained for the next checks. Actual password creation/recovery, prior-session revocation, email/password login, continuing Google login with matching account identifiers, and used-link rejection remain pending at this entry. The agent has not entered or submitted a new password.

The user subsequently reported completing the form. Inspection found the reset tab on /signin. The pre-change contributor tab still held its old homepage/modal state until navigation; navigating it to /suggest triggered the session check and redirected to Sign In without rendering the protected form. This is observed protected-page rejection after the reset, not a claim that every tab immediately changed its cached public UI.

The resulting sign-in tab is prepared with kevinmercado987@gmail.com and an empty password field for the user to enter the newly chosen password themselves. The transient reset-success message was not captured before redirect. Successful new-password login, account-identity comparison after login, continuing Google login and live used-link rejection still await their respective actions; no password or token was entered by the agent.
