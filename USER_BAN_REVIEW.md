# Custom temporary and indefinite user bans

Prepared: 8 October 2026, Asia/Manila. Status: local implementation and selective-release preflight; production results must be appended after actual deployment and testing.

## Requested behavior

- Temporary ban: the administrator enters a whole-number duration and chooses minutes, hours or days. This is not restricted to presets. The validated safety ceiling is 365 days.
- Indefinite ban: no end time; an administrator must explicitly unban the account.
- Both require a reason and confirmation. Account/content records are preserved; this is not account deletion.
- The end time is calculated by the backend and stored as a UTC timestamp. Access is restored at expiry without requiring a scheduled job.

## Implementation

The additive `20261008030000_add_temporary_user_bans` migration introduces nullable `User.banReason` and `User.banExpiresAt` fields. Existing `isBanned=true` accounts with no expiry retain indefinite-ban semantics; historical reasons are not invented.

Ban/unban, session-version changes, token revocation and audit recording use one transaction. A conditional version write rejects concurrent moderation/password changes. Successful commits invalidate the safe-user cache and notify the existing Socket.IO session-invalidation listener. Access/refresh sessions are not restored by expiry or unban; users must sign in again. Active refresh and password-reset links are revoked when banning.

Login, verified Google login, protected requests, administrator role checks, password settings and message-recipient eligibility recognize expiry. Cached session profiles recalculate it when read. Password login reveals the ban reason only after a correct password; invalid credentials retain the neutral credential error. Recovery requests for active bans retain their neutral response without sending new reset tokens.

Expiry is effective-state evaluation: the stored historical `isBanned` flag may remain true after a temporary end time, while supported authentication and eligibility paths treat the account as active. No synthetic administrator-unban event or invented reviewer is logged for clock expiry; the original ban audit records its scheduled end. Direct database edits/older maintenance scripts that inspect only the boolean are not the application authorization policy.

The admin UI reuses `AccessibleDialog` and existing theme classes. It provides custom duration/unit inputs, two options, a reason, confirmation, localized expiry display, in-dialog errors and duplicate-submit protection. It uses returned server state, invalidates users/audit caches and updates displayed expiry status without polling the API every second.

## Executed local checks

- 98 focused backend regressions passed, covering policy, repository transaction contracts, HTTP authorization/validation, login/Google boundaries, expired sessions, cache behavior and adjacent password/message predicates.
- 20 native frontend regressions passed, executing the actual dialog handlers with a controlled hook/API harness and rendering its output. These are not real-browser or real-database results.
- Prisma client generation and backend/frontend TypeScript checks passed. Focused source lint passed.
- Initial fixture-contract failures were corrected for the new expiry selects and transactional ban options; one login test initially mocked the wrong password utility, which was corrected. They were not reported as production defects.

## Required release gates

Clean-candidate preflight passed: **1,384 non-database backend tests across 82 files**, **366 native frontend regressions**, complete backend/frontend source lint and TypeScript checks, Prisma generation and production frontend build. The administrator-logout harness was updated to load the new actual ban policy and initialize lazy state correctly; its seven original checks pass. An initial all-frontend run exposed that harness dependency gap, not a deployed logout failure.

Read-only production migration preflight found exactly one pending migration, `20261008030000_add_temporary_user_bans`, and neither new column exists yet. Applied migration hashes were verified, accepting only LF/CRLF representation differences for historical Windows-generated checksums; no previous migration or database checksum was rewritten. The schema has not yet been changed by this preflight.

1. Export a clean candidate from the verified live branch. Preserve unrelated password-feedback changes, workflow edits, herb research, credentials and fixtures outside the release.
2. Run clean-candidate lint, typecheck, regressions and production build.
3. Run isolated PostgreSQL CI, including the new guarded database tests for rollback, concurrency, token revocation, expiry and explicit unban. No local PostgreSQL/Docker runtime was available at the preflight check; do not claim those tests ran locally.
4. Inspect pending production migrations and apply only the reviewed additive migration to the confirmed live database. Do not seed, import or rewrite accounts/content.
5. Release the identical passing candidate to the live deployment branch; leave `main` and provider configuration unchanged.
6. Use the user-authorized administrator session to test only a clearly labeled disposable contributor account. Verify temporary/custom duration, expiry, indefinite ban, explicit unban and audit details; restore its original active status. Do not change the administrator password or touch real users.

The user explicitly authorized the selective CI push, live release and disposable-account tests. Live outcomes, final commit, CI links, exact account identity and restoration receipt are pending and must not be invented.

## Evidence locations

- Backend policy: `herbalaibackend/src/lib/user-ban.ts`.
- Transaction: `herbalaibackend/src/repositories/user.repository.ts`.
- Backend regressions: `herbalaibackend/tests/user-ban-*.test.ts` and updated adjacent contract tests.
- UI: `herbalaifrontend/components/UserBanDialog.tsx`, `herbalaifrontend/lib/user-ban.ts`, `herbalaifrontend/app/admin/page.tsx`.
- Executable UI regression: `scripts/user-ban.test.mjs`, scheduled in the reviewed CI candidate.

Do not put credentials, account-reset URLs, private production connection strings or full environment files in this review. Later receipts are appended rather than rewriting historical test outcomes.
