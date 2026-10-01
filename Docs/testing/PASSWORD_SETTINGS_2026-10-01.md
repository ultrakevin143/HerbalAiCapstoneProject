# Account password settings — 1 October 2026

## Scope and release state

The user requested password changes for email/password accounts, password creation for Google accounts, and email/password login after creation. Implementation is local in the selective-release-check worktree on top of `f3ec55af291f72f929e556cd9b82ef3598d09b50`. No commit, push, deployment, production environment change, or live password change was performed in this batch. Three existing session-recovery evidence edits were preserved, and the primary checkout was untouched.

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
