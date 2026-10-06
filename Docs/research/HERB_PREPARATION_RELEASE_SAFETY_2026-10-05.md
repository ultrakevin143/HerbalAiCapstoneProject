# Preparation-only release safety follow-up

Date: 2026-10-05. Local safeguards and regression validation; not a live content release.

Newer gate: `HERB_PREPARATION_DATABASE_GATES_2026-10-05.md` records a subsequently reproduced connection-string override bypass and its repair, 180 passing preparation tests, and eight authored PostgreSQL checks (not yet run). The seventeen-file/977-test clean-export result below is the earlier checkpoint, not validation of that newer code.

## Reproduced release-tool gaps

The release CLI was audited before allowing any production write. Its existing parsing, backup-location check and read-only orchestration were extracted without repairing their behavior first. After correcting the new parameterized test so each complete argument list was actually supplied, the reproduction run produced **11 failed / 11 passed tests**. That result concerns release tooling, not eleven observed production incidents.

| Gap | Focused repair |
| --- | --- |
| Duplicate flags, stray positional values, mixed help/apply arguments and apply-only options during prepare could be ignored or ambiguously accepted | Strict argument parser rejects them before loading provider configuration or opening a connection. Help must be standalone. |
| A malformed reviewed digest was accepted by argument parsing and only checked later | Require a lowercase 64-character SHA-256 digest and a nonblank reviewer before apply proceeds. |
| A lexical outside-repository export path could resolve through a Windows directory junction into the repository | Resolve the physical root and export parent, reject repository-contained destinations and nonregular/linked existing files, and pass the physical outside filename to the CLI. Missing export parents fail early. Exclusive backup creation remains unchanged. |
| Read-only prepare used the default isolation level and read identity, herb and source rows in separate statements | Use one REPEATABLE READ, READ ONLY transaction for identity comparison and the full selected-record/source snapshot. Always end it with ROLLBACK; no content write or COMMIT exists in this path. |
| Connection timeout alone did not bound subsequent preparation reads | Configure client query, server statement, lock and idle-transaction timeouts for the release-only pool; also set local statement/lock limits in the prepare transaction. No stalled production query was manufactured to test this. |

[PostgreSQL's BEGIN documentation](https://www.postgresql.org/docs/current/sql-begin.html) documents explicit isolation/read-only transaction modes. [node-postgres client documentation](https://node-postgres.com/apis/client) documents the timeout options. Real SQL isolation/timeout enforcement remains a PostgreSQL acceptance gate, not something a mocked client proves.

The public catalog fetch remains a bounded no-store read and occurs before the database transaction. Invalid/incomplete/duplicate catalog responses are refused. Matching database identities are now read inside the preparation snapshot rather than before it. The apply path retains the existing SERIALIZABLE transaction, full before-state hash checks, reviewer authorization, source append-only behavior, real-vector requirement and no automatic replay.

## Boundaries deliberately unchanged

- Only the twenty selected generic-baseline BUILT_IN records are eligible for the existing updater. Already-populated records, contributor content, new identities and the fifty-new-herb queue remain refused.
- The three batch-01 food additions and Tanglad proposal still require their own reviewed exact-baseline update; this repair does not broaden the generic-only CLI.
- No UI styling, account/session flow, email sender, production database/environment, images, migration history or deployment bootstrap was changed.
- No credential was printed or added to Git. The physical export path is an extra accidental-leak safeguard, not protection against a hostile local filesystem administrator.
- Failed transaction cleanup or a lost commit response must still be reconciled privately before any retry. No rollback/retry promise is made for a server outcome that cannot be observed.

## Validation actually observed

- Corrected pre-repair suite: 22 tests, 11 failures / 11 passes.
- Initial repaired release/updater subset: 42 tests passed across two files.
- Final combined preparation subset: **168 tests passed across eight files**, 16.92 seconds, including 27 release-boundary regressions. Real CLI child processes exercised standalone help and malformed requests with an intentionally invalid database URL. These did not connect to a provider.
- Windows directory-junction cases passed on this host; all fixtures were under newly created temporary test directories.
- Snapshot, SQL-order and timeout-configuration assertions use mocks. They do not establish real database rollback, concurrent-writer behavior, server cancellation or clinical safety.
- Strict standalone CLI/test TypeScript checking, backend build and backend lint passed in both the working tree and the clean export described below. Narrow private-key/database-password/API-key and trailing-whitespace checks passed on the three new/changed release-tool files; not a comprehensive security scan.
- Broad working-tree non-database run: **1,110 tests passed across 81 files**, 204.11 seconds. This includes unrelated local research tests and is not the proposed release-bundle count.
- Clean preparation-only export: **977 tests passed across 68 files**, 54.46 seconds. Eighteen database-dependent suites were explicitly excluded. The process used an unused loopback database URL and no Gemini API key; no production credential was exported or used.
- The first clean-export invocation incorrectly passed exclusion flags through `npm exec`; npm interpreted them instead of forwarding them to Vitest. That invocation attempted the database suites against the intentionally unavailable loopback endpoint, failed, and was stopped. The corrected invocation called `node node_modules/vitest/vitest.mjs run` directly with explicit exclusions. Only the corrected, completed run is counted above; neither invocation accessed a live database.

There is no local Docker, psql, initdb, pg_ctl or PostgreSQL service available through the inspected commands. The four isolated preparation-update database tests remain authored but unrun. No production database was used as a substitute.

## Reviewable bundle and next gate

A seventeen-file allowlist was staged only into a temporary Git index outside the checkout, checked for unexpected paths and whitespace, and exported against HEAD `f98c498d0c62998b2f5129557f038a79345cd9bd`. The real working-tree index remained empty, and HEAD was not changed. The clean snapshot excluded all environment files and used a junction to the existing installed backend dependencies; this is source-isolation validation, not a fresh dependency-install or remote CI result.

The allowlist contains:

- `Docs/research/HERB_PREPARATION_RELEASE_SAFETY_2026-10-05.md`
- `Docs/research/HERB_PREPARATION_SOURCE_FOLLOW_UP_2026-10-05.json`
- `Docs/research/HERB_PREPARATION_SOURCE_FOLLOW_UP_2026-10-05.md`
- `Docs/research/LIVE_LIBRARY_PREPARATION_FOLLOW_UP_2026-10-05.json`
- `Docs/research/LIVE_PREPARATION_REMEDIATION_2026-10-05.md`
- `Docs/research/PUBLISHED_HERB_PREPARATION_COVERAGE_2026-10-05.json`
- `herbalaibackend/content/herbs/expansion-batch-01.json`
- `herbalaibackend/content/herbs/expansion-batch-02.json`
- `herbalaibackend/prisma/update-herb-preparations.ts`
- `herbalaibackend/src/content/herb-preparation-release.ts`
- `herbalaibackend/src/content/herb-preparation-update.ts`
- `herbalaibackend/tests/herb-preparation-rag.test.ts`
- `herbalaibackend/tests/herb-preparation-release.test.ts`
- `herbalaibackend/tests/herb-preparation-review.test.ts`
- `herbalaibackend/tests/herb-preparation-source-follow-up.test.ts`
- `herbalaibackend/tests/herb-preparation-update-database.test.ts`
- `herbalaibackend/tests/herb-preparation-update.test.ts`

Unrelated workflow/auth/mail/frontend changes, fifty-candidate tooling and raw downloads remain excluded. This report's final validation entries were added after the clean run; no runtime code changed afterward. Nothing was committed, pushed or applied to production.

Next gate: run that exact reviewed bundle against isolated PostgreSQL CI before any live application. The older f98c498 CI result does not cover these uncommitted safeguards. A passing local non-database suite is not authorization to bypass this gate or broad-bootstrap the catalog.

After isolated CI passes, privately reconfirm Railway's actual Neon target, take a fresh full snapshot and exclusive backup, review source/field changes and generate genuine embeddings. Apply only the accepted existing records, account for caches, and verify live Library fields/citations and authenticated Dr. Ai retrieval. The last observed public catalog still had 38 identities and twenty generic preparations; this work does not claim they changed.
