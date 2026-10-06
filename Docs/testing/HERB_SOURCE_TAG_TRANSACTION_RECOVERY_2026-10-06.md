# Source-tag transaction recovery continuation — 6 October 2026

## Scope and release state

Resumed the interrupted herb-preparation source-tag validation work, not the reserved defense study material. This continues `Docs/testing/HERB_PREPARATION_SOURCE_TAG_TRANSACTION_2026-10-06.md`.

All changes remain local and uncommitted. No live database, deployment, account, secret, image, herb wording, frontend or applied migration was changed. Source tags 21, 19 and 20 remain proposed, not applied. The helper is not part of a live application route or startup task; the reproduced defect described below is in this unreleased helper, not an observed production outage.

## Reproduced transaction lifecycle defect

The SQL engine could accept `BEGIN` while the calling client failed to receive its acknowledgement. The preparation path issued `BEGIN` outside its cleanup block; the apply path marked the transaction started only after the acknowledgement. Both could therefore leave an open transaction after that error.

Two new regression cases first failed against the preceding implementation. After the simulated acknowledgement loss, actual SQL `SHOW transaction_isolation` returned `repeatable read` for preparation and `serializable` for apply, rather than the expected default `read committed`. The tests explicitly cleaned up their own fixture afterward; no live outage was manufactured.

The repair moves read-only `BEGIN` inside its cleanup scope and marks apply's transaction attempt before awaiting `BEGIN`. A shared rollback helper is now used by both paths. If rollback is acknowledged, the original operation error remains visible. If rollback cannot be confirmed, the helper reports `SourceTagOutcomeUncertainError` with `reconciliationRequired: true`; the caller must discard the connection and reconcile instead of automatically retrying.

Four regressions cover the two operation modes with acknowledged rollback or lost rollback acknowledgement. They verify actual SQL transaction settings return to defaults, no herb/source/audit mutation occurs, and the uncertain case attempts only BEGIN and ROLLBACK rather than replaying the operation.

## Required native suite is now part of the isolated runner

`herbalaibackend/prisma/test-herb-preparations.ts` previously ran only the older preparation-update database suite. It now requires four stages, in order:

1. Prisma client generation.
2. Isolated schema migrations.
3. Existing preparation-update PostgreSQL regressions.
4. Source-tag PostgreSQL regressions, including independent-session lock/concurrent-ban checks and real vector preservation.

The explicit loopback `herbalai_test` target, sanitized child environment, timeout limits, fail-fast behavior and refusal to fall back to provider connection variables are preserved. Runner tests now assert both suite filenames and prove a failure in the fourth stage prevents a successful completion result.

This wiring is tested using controlled subprocess/executor outcomes; it is not evidence that the actual native database stages ran locally.

## Observed validation

- Initial reproduction: **2 failed cases**, with actual SQL isolation settings demonstrating the open-transaction state.
- Focused post-repair selection: **3 files / 96 tests passed**, including 35 source-tag SQL fixture cases, 30 source-planner cases and 31 isolated-runner cases.
- Final combined selection after the rollback refactor: **15 files / 445 tests passed**. Run started **4:27 PM Manila**, duration **23.54 seconds**. No selected cases were skipped. Native PostgreSQL test files were intentionally outside this local selection and are not included in that count.
- Backend lint and TypeScript build passed. Additional strict typechecking of the new SQL fixture/native test files and the isolated runner test passed. Scoped tracked-file whitespace checks passed; Git's index remained empty.
- SQL fixture cases used the installed PGlite PostgreSQL WASM engine and vector extension, including `vector(768)` fixture values. Provider-dependent AI tests used mocks. Temporary recovery artifacts were individually removed by the tests.

## Remaining database gate and continuation

Native PostgreSQL, psql and Docker were not found on this machine. The WSL launcher exists but explicitly reports no installed Linux distribution. No runtime, distribution, service or dependency was installed to work around that limitation.

The three native source-tag cases remain **unexecuted**, not passed. They must run against the existing isolated PostgreSQL/pgvector CI service, or an equivalent isolated loopback service, before source metadata is applied live. The runner requires `HERBALAI_TEST_DATABASE_URL` explicitly; a production Neon connection must never be supplied as a substitute.

Next: run that native gate, review the local source-only and beginner-guidance release bundle, obtain an independently confirmed fresh full recovery snapshot and reviewed digest, then apply only the three reviewed tags and reconcile audit/protected fields. Publication and actual public/Dr. Ai acceptance remain separate gates. Fifty-herb expansion completion and sourced regional names remain pending; this recovery repair does not complete them.

## Combined release run — subsequent local validation

The reviewed 24-file bundle was copied over a clean archive of commit `3776993`, without environment files or unrelated working-tree changes. This is a subsequent checkpoint, not a replacement for the historical results above.

Review reproduced another unreleased defect: the reviewer query compared the real Prisma role enum against `ADMIN`, but the schema permits `admin` and `contributor`. The original fixture used permissive text and concealed the mismatch. After replacing it with the actual enum contract, the focused commit test failed with `invalid input value for enum "Role": "ADMIN"`. The helper now uses `Role.admin`; the fixture and a new contract regression use the schema's real values.

Final clean-snapshot validation passed **72 files / 1,120 tests**, with no skipped cases, followed by backend build, lint and strict preparation-tooling typechecking. The 20 native/mixed database suites were explicitly excluded because no isolated native server is available locally. An earlier name-pattern exclusion missed mixed suites and failed against an intentionally unreachable loopback database; those failures are not production findings and were not bypassed by altering integration tests.

The dedicated CI workflow now typechecks and lints the source-tag tooling and includes the source planner, SQL fixture, beginner-guidance and Gemini fallback regressions before its guarded native PostgreSQL stage. Native concurrency, full database integration and production acceptance remain separate gates at this checkpoint.

The exact reviewed bundle was committed as `1b3a7a8` and pushed only to `codex/mvp-acceptance-ci`. General CI run `37438530355` passed both backend and frontend jobs. Dedicated run `37438530396` failed before native tests: a fresh install had not generated Prisma's schema-derived `Role` export before strict tooling typechecking. Local dependencies already had that client, so the local checks did not expose this setup ordering defect. No live mutation or promotion occurred after this failed gate.

A new workflow-ordering regression first failed, then passed after adding explicit Prisma generation with synthetic loopback-only URLs before typechecking. The guarded runner remains responsible for migrations and native suites; no production variables or migration bypass was introduced. The focused workflow/runner selection passed **39 tests across 2 files**, with scoped lint and strict typechecking passing. A new CI run is required after this repair.
