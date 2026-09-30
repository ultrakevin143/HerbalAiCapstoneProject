# Community moderation regression — 1 October 2026

## Scope and reproduced findings

This batch follows `REMAINING_MVP_GATES_2026-10-01.md`. It uses the managed release worktree and does not change the frontend, database schema, credentials, or verification setting.

1. **Stale moderation authority:** forum deletion routes used the role embedded in the access token. Session validation checked the current account's ban/session version but did not replace the token's role. Unlike the separate administrator-role middleware, forum author-or-admin checks could therefore retain an old administrator role after demotion, or refuse a newly promoted administrator. A real Express/router/auth/controller test with the database lookup mocked reproduced HTTP 200 for a demoted administrator deleting another user's thread and HTTP 403 for a promoted one. These are controlled HTTP results, not modifications of live user roles.
2. **Missing moderation audit:** administrator thread/comment deletions called plain soft-delete updates and produced no audit entry. The controller did not forward an audit actor. Comment deletion also returned success for an already deleted comment, permitting misleading repeat actions.

Five of the six new HTTP assertions failed before repair. One of those failures checked the new optional audit-actor argument for contributor self-deletion; it is a contract assertion, not five distinct security vulnerabilities.

## Focused repair

- Access-session validation now selects the current database role in its existing lookup and places that role in the authenticated request payload. Token verification, session-version revocation, expiry, and ban checks remain unchanged; no extra database lookup is added.
- Administrator moderation uses the existing audited-mutation transaction helper. Thread deletion records `DELETE_THREAD` / `Thread`; comment deletion records `DELETE_THREAD_COMMENT` / `ThreadComment`, with its thread ID. If the audit write fails, the deletion rolls back. Deleted comment text is not copied into audit details.
- Contributors may still soft-delete their own content; those actions are not falsely attributed to an administrator. An already deleted comment returns 404. Repository writes also require `isDeleted=false`, preventing repeat audit writes for the same record.
- Audit target types are extended only in TypeScript. The existing database fields are strings, so no migration is needed.

## Validation and evidence boundaries

- The six repaired HTTP cases and existing deletion, current-role, missing-like-target, and thread-detail regressions passed: **30 assertions across five files**. Backend ESLint and production TypeScript build passed. The new test files also passed targeted ESLint and Git whitespace checks.
- A new real-database/API suite uses only loopback `herbalai_test` in test mode. It creates unique nonmedical test users and 26 pagination fixtures, signs in normally, and checks owner/administrator authorization, last-page deletion metadata and refetch, comment/reply masking, reaction handling, persisted moderation logs, current-role changes, and audit-failure rollback. Socket emits are intercepted; there is no Gmail, Gemini, Cloudinary, or production database interaction. Cleanup targets only that suite's generated users and cascaded records.
- There is no local PostgreSQL/Docker runtime. The database-backed cases must pass isolated GitHub CI before any production release. They are not counted as local passes.
- Even a successful isolated last-page deletion does not close the separate actual live browser moderator-deletion gate. Live role changes, moderation writes, or permanent test-record cleanup are not inferred from permission to continue development.
- Previous-password rejection remains unobserved live; formal five-participant UAT remains unrecorded. No claim of complete or error-free acceptance is made here.
