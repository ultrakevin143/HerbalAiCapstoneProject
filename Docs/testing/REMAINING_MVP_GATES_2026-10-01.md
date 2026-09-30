# Remaining MVP regression gates — 1 October 2026

This follows the dated evidence in `LIVE_ADVERSARIAL_AUDIT_2026-09-30.md`. Results below are not participant UAT or a guarantee of error-free operation. Work uses the managed release worktree; the unrelated primary checkout remains untouched.

## Catalog regression exclusion

The existing catalog-remediation test queried permanent database records without creating fixtures. Fresh CI applies migrations to an empty database, so data-only UPDATE migrations cannot produce the thirteen records that its assertions expect. The suite was consequently excluded from CI.

The revised test creates connection-local temporary Herb, HerbSource, and HerbComment tables from the migrated schema, inserts explicitly labeled legacy test identities, and runs the five committed catalog data migrations on those temporary tables. Existing assertions cover the ten official catalog records, corrected Yerba Buena identity, evidence-specific additional herbs, and source/image metadata. A new assertion checks retention of a duplicate identity's comment and source. The source ID sequence is temporary; fixtures do not consume the permanent source sequence. Cleanup rolls the transaction back and closes the connection. No seed administrator, embedding provider, email, or live database is used.

The test refuses any database other than the loopback `herbalai_test` database in test mode. CI now runs the full backend suite without excluding this file. Local type/lint checks and isolated-database CI results will be recorded after execution; there is no local PostgreSQL/Docker runtime available in this worktree.

## Community last-page recovery

The production page already clamps a requested page to the returned last page and refetches. A controlled local browser scenario will model a last-page item disappearing between requests without creating or deleting dozens of public discussions. Such a result is frontend response-handling evidence, not proof of an actual live moderator deletion. Live deletion/refetch remains separate until safely exercised.

## Password recovery/session revocation

The real isolated-database recovery suite covers old-password rejection, access-session invalidation, refresh revocation, expiry, and concurrent single-use redemption with mail intercepted in the test process. The newest live contributor's fresh password reset, new-password login, refresh restoration, and used-link rejection passed in the previous record. Old-password rejection and invalidation of a previously authenticated live session remain unobserved for that account. Another live password change needs the tester to enter and submit both credentials privately; do not record passwords or reset URLs in this document.

## Acceptance boundary

Five-participant UAT is unrecorded. The prior physical-phone check was user-reported. Neither is replaced by CI, a browser fixture, or approval to continue development. No production migration or credential change is included in this batch.

## Executed results

- Local TypeScript checking, targeted catalog-test ESLint, and whitespace validation passed. There was no local database execution; the worktree has no PostgreSQL/Docker runtime.
- Commit `d8fab98dd0d3ab4ecf01b32da7f49a750277a325` passed CI run `36742292316` on the temporary branch. Its isolated Vitest step ran without the catalog exclusion and passed, including the four fixture-backed catalog cases and the existing real-database account-recovery/session-revocation checks. Frontend lint/typecheck/build also passed. This closes the previously excluded automated catalog gate, not a new audit of the live catalog's data.
- After ancestry checks, that commit was pushed to `main` and `codex/readability-accessibility`. Their CI runs `36742957765` and `36742957569` passed; Vercel and Railway both reported successful deployment. The commit changes only CI, tests, and documentation, not production application logic, migrations, or environment variables.
- Local Community browser recovery passed with controlled loopback responses. The initial page-1 response reported two pages. Clicking Next requested page 2; that response reported one page with no records. The client automatically requested page 1 again, rendered the remaining labeled fixture discussion, and removed obsolete pagination controls. The fixture request log confirmed the sequence 1 → 2 → 1. This covers last-page response recovery without deleting a live post; the actual live last-page deletion scenario remains unrun.
- Mercado Chrome restored the existing Herbal QA contributor session on live Suggestions. One fresh reset request for that existing disposable account returned the neutral response. The exact new email arrived in Gmail Inbox at 12:15 AM Philippine time on 1 October, and its form opened successfully. The earlier signed-in Suggestions tab was preserved. The tester must privately submit the new password before live revocation and old/new-password sign-in can be checked. No password or reset token is recorded here; email delivery does not prove the reset has been redeemed.

The temporary pagination server and Next dev process are stopped after testing. The credential handoff is the only pending action in this batch; do not mark the live password/session gate complete until its outcome is observed.
