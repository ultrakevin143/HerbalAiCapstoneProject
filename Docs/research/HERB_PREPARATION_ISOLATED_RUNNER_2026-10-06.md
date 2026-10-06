# Isolated preparation-test runner

Date: 2026-10-06. Local test-tool repair only. No live database connection, provider configuration change, herb publication, embedding request, commit or push occurred in this batch.

## Reproduced hazard

The existing `herbalaibackend/prisma.config.ts` deliberately chooses `DIRECT_URL || DATABASE_URL`. A local migration command that sets only a loopback `DATABASE_URL` can therefore still select an inherited non-local `DIRECT_URL`.

The no-connection reproduction loaded that config with two synthetic URLs: a loopback `herbalai_test` URL and an `example.invalid` direct URL. It returned `isolatedDatabaseSelected: false`, `inheritedDirectUrlSelected: true`, `connectionAttempted: false`. This is a local test invocation hazard, not evidence that production was redirected or that any provider credential was exposed. The production direct-connection configuration remains unchanged.

Prisma's [configuration reference](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference) documents the CLI datasource URL and explicit environment loading. The precedence above is this project's expression, not a universal Prisma rule.

## Focused repair

New runner: `herbalaibackend/prisma/test-herb-preparations.ts`, exposed as `npm run test:preparations:database`.

- Require `HERBALAI_TEST_DATABASE_URL` explicitly. Do not fall back to existing `DATABASE_URL`, `DIRECT_URL` or repository `.env` files.
- Reuse the existing centralized URL guard. Only `localhost`, `127.0.0.1` or `[::1]` with the exact database path `/herbalai_test` and explicit test credentials are permitted. Reject provider hosts, other databases, fragments, duplicate query keys and query-string target/execution overrides before any subprocess starts.
- Pin both child `DATABASE_URL` and `DIRECT_URL` to the validated test target.
- Copy only runtime/OS environment keys, set `NODE_ENV=test`, clear Gemini access, and direct dotenv loading to the OS null device. Do not inherit PostgreSQL overrides, Node preload hooks, authentication secrets, cloud credentials or alternate dotenv settings.
- Invoke installed Node CLI entry points with fixed argument arrays, the backend working directory, `shell: false` and hidden Windows processes. The [Node child-process documentation](https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options) describes these process controls.
- Run Prisma generation, schema migration and only `tests/herb-preparation-update-database.test.ts`, in that order. Do not seed, bootstrap, import research candidates, generate embeddings or run unrelated suites.
- Stop immediately on nonzero exit, launch error, timeout or termination. Child output is withheld to prevent accidental credential disclosure; the failed stage is named. A stopped sequence is not a database-test pass.
- Bound generation and migration to 180 seconds each, the regression stage to 300 seconds, and captured child output to 8 MiB.

The unit tests inject controlled executors for order/failure checks; these are not real migration or SQL outcomes. Two real no-database child-process checks load the actual Prisma config with the isolated environment and reject a provider-only CLI environment. Neither opens a database connection.

## Observed validation

- **30 new runner regressions passed.** These cover missing explicit input, allowed loopback hosts, unsafe or ambiguous targets, inherited provider settings, stage order, failed stages, timeout/termination, environment mutation isolation, the actual Prisma config and CLI refusal without credential output.
- **86 focused tests passed across three files.** These include the runner, selective updater and release boundary tests; they exclude PostgreSQL-backed fixtures.
- **1,185 non-database tests passed across 86 files**, 58.03 seconds, in the current dirty working tree. Eighteen database-dependent suites were explicitly excluded. This is not a clean release-bundle or remote CI result.
- Strict TypeScript checking of the runner and its test passed with `strict`, `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`. An initial mock-return fixture included an explicit `error: undefined` incompatible with strict optional-property types; the fixture now omits that property when absent. This was a local test typing issue, not a SQL or production failure.
- Explicit ESLint validation of both new files passed. Backend build and source lint also passed; ordinary backend build/lint do not themselves cover the Prisma tooling and test files.
- No `docker`, `psql`, `postgres` or `initdb` executable was found, and the loopback port 5432 probe returned no listening connection. The eight actual preparation PostgreSQL tests remain **unrun**, not failed or passed. No runtime was installed and production was not used as a fixture.

## Running the pending gate

Use a dedicated local PostgreSQL database named `herbalai_test` with the pgvector extension available. Existing CI uses `pgvector/pgvector:pg16`. The runner migrates that test database; it is not a read-only probe. The suite creates TEST ONLY fixtures and attempts cleanup of its own records and temporary backup files. Do not put real accounts or valuable data in this database.

From `herbalaibackend`, after the isolated service exists:

```powershell
$env:HERBALAI_TEST_DATABASE_URL = 'postgresql://test_user:test_password@127.0.0.1:5432/herbalai_test?sslmode=disable'
npm run test:preparations:database
```

The credentials above are synthetic local-example credentials, not a provider URL. The runner does not provision a database, install Docker, enable pgvector externally or bypass a failed migration. Use the database's actual local-only test credentials. Do not use the live Neon URL or `deploy:bootstrap` for this gate.

If using remote CI instead, separately review and authorize the CI-only source bundle. The existing PostgreSQL CI service can exercise the eight tests, but its prior result predates this uncommitted repair. This continuation does not authorize or perform a new commit/push.

## Remaining content gates

After real transaction/rollback/concurrency checks pass, independently reconfirm the live target, take a fresh reviewed snapshot and outside-repository backup, and apply only the separately reviewed existing twenty-generic-preparation batch with genuine embeddings. Verify preparation fields, citations and Dr. Ai retrieval live afterward. The fifty new research candidates are a different scope: methods not established, clinical/taxonomy holds, fresh all-state duplicate checks and thirteen media holds still prevent automatic staging/publication. Do not turn a laboratory description or food-use mention into an invented medicinal recipe.
