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

The temporary pagination server and Next dev process are stopped after testing. The reset handoff above was pending at the time of that observation; subsequent results are recorded below rather than inferred from email delivery.

## Subsequent live recovery results

- After the tester privately submitted the fresh reset, the reset tab returned to Sign In. Reloading the previously authenticated Suggestions tab redirected to Sign In, demonstrating revocation of that preserved live session.
- The tester signed in with the new password. The homepage opened, a full reload restored the Herbal QA contributor, and protected Suggestions opened successfully. No password or reset URL was saved in this record.
- Previous-password rejection remains **not observed live**. The tester first confirmed they had not tried it, and later confirmed that the separate sign-in attempt used the new password. Reaching the homepage from that attempt is not evidence of previous-password acceptance or rejection. Isolated-database automated coverage is separate from this missing manual result.
- The recovered Suggestions tab is retained for the tester. A screenshot of its protected page is saved outside Git as `herbalai-recovered-suggestions-20261001.png` in the local temporary directory.

## New frontend release-check finding

The documentation-only commit `86b37645cfb3ae543c1df291b7304fb826c2f5b1` passed main CI (`36743249598`) and deployment-branch CI (`36743249091`), and Vercel/Railway reported successful deployments. However, its temporary-branch run `36743248644` failed the frontend build while backend checks passed. The failing job reported a missing `@vercel/turbopack-next/internal/font/google/font` module and `next/font/google queries have exactly one entry` during the Plus Jakarta Sans font transform. This is a captured intermittent build failure, not a proven network outage; the deeper Turbopack cause is not established.

The focused repair replaces the Google font transform with pinned Fontsource WOFF2 assets through `next/font/local`. It retains Newsreader normal/italic, Plus Jakarta Sans, JetBrains Mono, the existing CSS variables, and swap behavior. No authentication, backend, database, or page-layout logic changes. The first local frontend lint and production build passed after the font change.

Dependency audit then identified two additional findings: Next.js 16.3.4 was in the affected range of [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), and ESLint's transitive brace-expansion versions were affected by [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) and related recursion advisories. No `next/og` or `ImageResponse` use was found in the app/components source scan; the advisory does not establish that this app was exploitable. The release repair updates Next.js and its ESLint config together to the non-major patch 16.3.8 and updates brace-expansion within its existing dependency ranges. Final audit, build, browser, CI, and deployment outcomes must be recorded after execution.

### Local validation of the release repair

- Next.js and eslint-config-next resolve to 16.3.8; brace-expansion resolves to 1.1.21 and 5.0.12. `npm audit` reports zero vulnerabilities in the frontend dependency tree. This is a registry audit result, not a guarantee that no vulnerabilities exist.
- Frontend ESLint, `tsc --noEmit`, and the production build passed with the updated dependencies. Impeccable's scoped detector reported no findings for the edited root layout; Git whitespace validation passed.
- The production-built Sign In page was inspected at 1366 × 768 and 320 × 740. Both retained the existing typography and layout without horizontal overflow. Computed heading/body families resolve to the local Newsreader and Plus Jakarta Sans definitions. All four emitted WOFF2 assets, including Newsreader italic and JetBrains Mono, returned HTTP 200 from the local production server.
- This is a bounded check of the changed global font loader, not a repeat of every route/device test. No credentials were entered into the local preview and no local database was used. Release CI and live deployment verification are pending at this point.

### Published repair and live smoke results

- Repair commit `d7de89df8b81213e67aafd6c6976f5b79e5b309b` passed temporary-branch CI `36745965057`, including frontend lint/typecheck/build and the full isolated-database backend suite. After remote ancestry checks it was pushed to `main` and `codex/readability-accessibility`; their CI runs `36746297243` and `36746296608` both passed. Vercel and the Railway service `herbal-ai-staging - HerbalAiCapstoneProject` reported successful deployment for that exact commit.
- The live Sign In page, all four emitted local WOFF2 assets, and the frontend-proxied `/api/health` returned HTTP 200. These are smoke checks, not substitutes for authenticated write-flow evidence.
- Reloading the recovered Mercado contributor's live Suggestions tab initially showed session checking, then restored Herbal QA, the protected form, and My Submissions with zero records. Computed heading/body families matched the new local font definitions. The evidence screenshot was refreshed outside Git; no new public suggestion was created for this font/dependency-only repair.
- The local production preview server was stopped. The unrelated primary checkout, production credentials, verification setting, and database were not modified in this batch.
- Remaining boundaries: previous-password rejection has still not been observed live; the actual live community last-page deletion scenario is still unrun; five-participant UAT remains unrecorded. Existing automated coverage, successful recovery, and the user's earlier phone inspection do not close those distinct gates.

## Community moderation follow-up

`COMMUNITY_MODERATION_REGRESSION_2026-10-01.md` records the next released backend batch: current database roles replace stale token roles for author-or-administrator checks; administrator forum deletions transact their audit records; deleted comments cannot be moderated repeatedly; compatible Engine.IO, brace-expansion, and ip-address patches are tested. Four new real-database workflow cases and three loopback Socket.IO cases passed full CI, and public live API smoke checks passed after deployment.

Authenticated live moderation checks are pending because Chrome profiles were not connected. The latest backend audit still reports four high-severity entries in the Prisma tooling chain; a forced Prisma downgrade was not applied. See the follow-up report for reproduced failures, exact commits/runs, remaining dependency scope, and live-versus-isolated evidence boundaries.

## Prisma dependency follow-up

`PRISMA_DEPENDENCY_REMEDIATION_2026-10-01.md` supersedes that historical four-entry dependency count: parent-scoped patched versions now pass a clean install, actual Prisma configuration/generation checks, focused regressions, and both backend audits with zero findings. Prisma remains on stable version 7.10.0; frontend files and database connection settings are unchanged. Isolated CI, deployment, and live outcomes must be read from that report rather than inferred from the local audit. Previously unobserved old-password rejection and live browser moderation remain separate gates.

## Messenger validation follow-up

`MESSENGER_VALIDATION_REGRESSION_2026-10-01.md` records four reproduced backend validation groups: permissive message-ID parsing, missing edit-length enforcement, malformed send bodies/multipart text returning 500, and missing recipient eligibility checks before media upload. Sixteen focused local cases passed after repair; four new real-database cases require isolated CI. Consult that report for final CI/release results and the separately recorded message-race/timestamp-pagination/forum-ID candidates. Frontend source and live credentials remain unchanged.

## Messenger atomicity and pagination follow-up

`MESSENGER_ATOMICITY_PAGINATION_2026-10-01.md` records the next backend-only batch: conditional owner/non-deleted mutations, suppression of duplicate deletion broadcasts, and time-plus-ID history pagination. Read its executed results for the distinction between local mocks, isolated PostgreSQL concurrency fixtures, and live checks. No frontend or production credential change is included.
