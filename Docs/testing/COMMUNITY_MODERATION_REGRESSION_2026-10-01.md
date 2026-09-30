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

## Isolated database CI result

Commit `bfff93428d234e185cf0bd9fe4d18f6133dd6d36` passed CI `36788693083`, with both backend and frontend jobs successful. The four real-database community workflow cases ran as part of the complete backend suite. This adds genuine isolated deletion/pagination, authenticated nested-comment/reaction, current-role, persisted-audit, and rollback evidence. It does not claim that those writes were performed on the live database.

## Dependency findings discovered during the batch

The backend audit initially reported seven package entries: six high and one moderate. Three compatible lockfile updates resolve Engine.IO to 6.6.11, brace-expansion to 5.0.12, and ip-address to 10.7.2. The [Engine.IO advisory](https://github.com/advisories/GHSA-2gc4-cqfq-p2gv) affects mismatched protocol revisions during transport upgrades; patched versions start at 6.6.10. A loopback-only Socket.IO regression checks ordinary protocol-4 polling, rejects a protocol-3 or missing-revision upgrade for that protocol-4 session, and checks the HTTP server remains available. No crash or adversarial protocol test is sent to production.

Four high-severity audit entries remain in the installed Prisma tooling chain: prisma, @prisma/config, deepmerge-ts, and mysql2. These represent upstream dependency findings, not four demonstrated application exploits. They also appear in this installation's `npm audit --omit=dev` tree; do not call the production dependency audit clean. Prisma 7.10.0 pins mysql2 3.15.3 and @prisma/config pins deepmerge-ts 7.1.5. The application's database runtime uses PostgreSQL through the Prisma PG adapter; the source review did not find public-route imports of mysql2 or deepmerge-ts. That is a scope observation, not proof they can never be reached.

The automated fix proposes downgrading Prisma to 6.19.3, a breaking change. It was not applied, and no forced major override was introduced. A separate reviewed Prisma/tooling compatibility change remains necessary before claiming zero backend audit findings. Final local regression and CI results for the compatible lockfile update must be recorded after execution.

The compatible update passed **25 assertions across seven local suites**, including all three actual Socket.IO protocol-boundary cases, moderation authorization, deletion masking, current-role enforcement, IP rate limits, and notification regressions. Backend and targeted test-file ESLint and the TypeScript production build passed again. The local protocol server closes during test cleanup. No frontend file changed. Complete database-backed CI remains required for this final lockfile revision before release.

## Release and observed live results

- Final code/lockfile commit `47bc40cb99da4f6697f0d2a1c0ae28bb8b794118` passed temporary-branch CI `36789216944`. Its full backend job included all four real-database community cases and all three Socket.IO protocol cases; frontend checks also passed despite no frontend changes.
- After remote ancestry checks, the reviewed batch was pushed to `main` and `codex/readability-accessibility`. Their CI runs `36789504512` and `36789504228` passed. Vercel and Railway reported successful deployment of the same commit.
- Five read-only live API checks passed: `/api/health` 200; paginated public forum listing 200; anonymous administrator audit access 401; invalid thread ID `0` 400; absent in-range thread ID `2147483647` 404. These checks use the public frontend API proxy, not private credentials.
- Browser discovery found only the in-app browser and MCP Apps, with no connected Chrome profiles. New authenticated live moderation/audit-write and refresh checks are therefore not counted as passes. A reconnect handoff was offered; no password was requested or entered, no user role was changed live, and no live record was deleted.
- The four Prisma-chain audit findings above remain open. The earlier live previous-password and actual last-page browser-deletion evidence gaps also remain distinct. The isolated suite provides additional coverage, not fabricated live or participant results.
