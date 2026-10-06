# Preparation database gate follow-up

Date: 2026-10-05. Local release-tool repair and authored isolated PostgreSQL checks; no live content write.

## Reproduced connection guard bypass

The installed `pg` connection-string parser gives a query-string `host` precedence over the URI hostname. Constructing a client without connecting demonstrated that `postgresql://localhost/herbalai_test?host=example.invalid` selects `example.invalid`, while the previous preparation target guard accepted the apparent localhost target. This affected the unpublished preparation release tool and its isolated-test guard. It is not evidence of a production database redirect or leaked credential.

The new regressions reproduced **11 failing / 17 passing tests** before the repair. These are rejected-input cases, not eleven independent live incidents. The first repaired run had one remaining failure because an existing protocol-rejection assertion expected the old message; the assertion now matches the centralized configuration error without weakening rejection.

The repair centralizes preparation connection-URL validation:

- Require a PostgreSQL scheme, nonempty host and database path, and no fragment.
- Permit only the existing TLS query keys `sslmode`, `channel_binding` and `uselibpqcompat`, with no duplicate keys. Unknown parameters are rejected, including routing overrides, socket/file settings, alternate credentials, session options and execution-timeout overrides.
- Keep ordinary pooled/direct Neon target comparison and normal TLS URLs supported. Existing TLS-mode semantics were not changed by this repair.
- Validate before release-pool construction and before the isolated database test constructs its pool. The existing loopback-only `herbalai_test` restriction remains mandatory.
- Keep failures generic: no connection URL, password or provider secret is printed.

The parser was inspected in the project's installed dependency, and the official [node-postgres connection documentation](https://node-postgres.com/features/connecting) identifies its connection-string parser. [PostgreSQL connection documentation](https://www.postgresql.org/docs/current/libpq-connect.html) explains connection parameters and session options. The reproduced precedence above specifically concerns the installed JavaScript driver, not a claim that every libpq keyword has identical behavior in that driver.

This is narrowly scoped to preparation release tooling. Existing application connection initialization and unrelated authentication/database suites were not changed. It does not replace provider-access control, independent target confirmation or database-backed transaction validation.

## PostgreSQL checks prepared, not passed

`herbalaibackend/tests/herb-preparation-update-database.test.ts` now contains eight isolated database checks:

1. Preserve images, names, reviewer attribution, uncited fields and original sources; refresh the vector and audit record.
2. Roll back preparation and source changes after an intercepted audit failure.
3. Refuse a source change committed after the reviewed snapshot.
4. Allow exactly one of two concurrent applications of the same reviewed snapshot.
5. Roll back two records, sources and audit rows after an actual PostgreSQL division-by-zero failure on the second audit.
6. Refuse a banned reviewer without altering the reviewed snapshot.
7. Keep herb and source reads on one repeatable-read snapshot while a separate connection commits changed warnings and an added source between those reads.
8. Have PostgreSQL enforce READ ONLY against an accidental write, then verify rollback leaves the connection usable and the record unchanged.

The last two tests capture the test catalog from the real transaction's identity query to avoid races with other CI fixtures; they exercise real transaction isolation/read-only enforcement, not an independently fetched public API catalog. Existing non-database tests cover public-catalog mismatch and malformed responses separately. Artificial vectors, records, reviewer accounts and errors belong only to the isolated test database, never a production release.

Inspection found no usable local PostgreSQL binaries, Docker CLI/runtime or installed WSL distribution. A Docker-named directory alone did not establish an available Docker runtime. No runtime was installed or production database used as a substitute. **All eight database tests remain unrun.** Type checking them does not establish SQL correctness or concurrency safety.

## Observed local validation

- Combined preparation subset: **180 tests passed across eight files**, 15.20 seconds. This includes the installed-driver no-connection reproduction and rejection tests; it excludes PostgreSQL-backed tests.
- Strict TypeScript checking passed in the working tree and clean export, including the guarded CLI, release tests, updater tests and the eight authored database tests, using `--strict`, `--exactOptionalPropertyTypes` and `--noUncheckedIndexedAccess`.
- Backend build and lint passed in the working tree and clean export.
- Clean eighteen-file source bundle: **989 non-database tests passed across 68 files**, 50.24 seconds. Eighteen database-dependent suites were explicitly excluded. The exported tree contained no environment files; tests used an unused loopback database URL and an empty Gemini API key. Installed backend dependencies were shared by a local junction, not reinstalled.
- Negative isolated-suite guard check: with a synthetic localhost URL containing `host=example.invalid`, Vitest exited with the intended generic connection-parameter error before registering or running any database fixtures (zero tests). This verifies fail-closed startup, not a successful SQL test. No credentials or reachable provider address were supplied.
- Narrow changed-file credential-pattern and whitespace checks passed. They are not a comprehensive security audit.
- The first temporary-index export command had an incorrectly formed PowerShell prefix argument and failed before exporting files. The corrected quoted prefix successfully exported the exact eighteen-file allowlist. The real Git index remained empty and HEAD stayed `f98c498d0c62998b2f5129557f038a79345cd9bd`. This report's final validation entries were added after the clean run; no runtime code changed afterward.
- No successful database-backed result, remote CI result, deployment or live preparation change is claimed.

## Next gate

The proposed preparation-only allowlist is the previous seventeen-file bundle plus this report. Use a temporary Git index to verify it without staging unrelated changes. Existing CI on `codex/mvp-acceptance-ci` already runs Vitest against an isolated `pgvector/pgvector:pg16` service; it must discover and pass all eight database tests with no provider URL or Gemini key. A separately authorized CI-only commit/push is still needed; no automatic commit or push occurred in this follow-up.

After that gate passes, privately reconfirm the actual Neon target, prepare a fresh physical outside-repository backup and reviewed snapshot, generate genuine embeddings, and apply only the twenty existing generic-baseline records. Retain the separately reviewed scope for already-populated food records and Tanglad. Verify live Library preparation fields/citations and Dr. Ai retrieval after caches expire. Do not count fifty new herbs as imported or provide an unsupported recipe to satisfy a missing-field check.
