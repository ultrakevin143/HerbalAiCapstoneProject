# Preparation CI gate and clean source review

Date: 2026-10-06. The newest CI-only result is recorded first; the initial local-only review below is retained as historical evidence. No live content was changed.

## Final authorized CI-only result

The user approved the reviewed twenty-four-file bundle. It was committed/pushed to `codex/mvp-acceptance-ci` as `397f7b7742d632b2d4151577a5030f67afcff16c`, with exactly the approved path set. The first dedicated SQL stage failed. General CI showed six passing and two failing preparation PostgreSQL tests, with 1,148 passing / two failing backend tests across 88 files; frontend CI passed. The failures shared one cause: catalog identity comparison sorted database identities but not the reviewed catalog, incorrectly rejecting identical records in different array orders.

Both lists are now parsed and sorted by ID without mutating their inputs. Missing/extra/duplicate records, changed names/species/IDs and malformed identities remain refused. Eleven added boundary regressions passed. The correction passed 104 focused tests and a fresh source-only snapshot's 1,037 non-database tests, strict tooling/test TypeScript, build and lint. Only two preparation source/test files and the existing database-gate report were committed/pushed as `3776993e80134816b0b147157a44f4e003ea316a`; all three paths belong to the original approved bundle.

Final outcomes observed at 2026-10-06 00:58:53 UTC:

- [Dedicated PostgreSQL gate](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37396535432): **success**. Tooling types/lint, 104 boundary regressions, client generation, isolated migrations and all three guarded validation stages passed.
- [Full general CI](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37396535092): **success**. **1,161 backend tests passed across 88 files**, 59.64 seconds, including **all eight real preparation PostgreSQL tests**. Frontend typecheck, lint, all its scheduled native regression steps and build passed.
- The previously failing repeatable-read/concurrent-edit and PostgreSQL READ ONLY cases now pass. The fixtures were not skipped or relaxed. Expected serialization, division-by-zero and read-only errors in the isolated PostgreSQL container logs are intentional regression inputs, not production outages.
- Main and `codex/readability-accessibility` remained at `95cf80761106f95ea4faaca0437fb4ddc348896f`. No provider variable, live herb, image or real embedding changed. The real index is empty; unrelated workflow/auth/mail/UI and fifty-candidate research changes remain local.

`HERB_PREPARATION_CI_RESULT_2026-10-06.json` records the exact commits, run/job identifiers, counts and remaining gates. This final-result ledger and continuation/readiness updates are saved locally after CI completion, not included in the two pushed commits. The committed database-gate report records the first failure and corrective validation; this newer result supersedes its pending-retry statement.

The isolated database gate is now satisfied for this corrected source commit. It is not a live preparation update, medical clearance, fifty-herb publication, fresh all-state duplicate check or manual MVP/physical-device/UAT pass. Next privately reconfirm the target and review a fresh backup/snapshot, field/source changes and genuine embeddings before any separately authorized live application.

## Initial local-only review

## Work completed

Local inspection again found no usable Docker/PostgreSQL binaries or MSVC C++ build-tool installation through the inspected paths. A Docker-named directory and Visual Studio directory did not establish usable runtimes. No database or build tool was installed, and the live database was not substituted for an isolated fixture.

Added a standalone `.github/workflows/herb-preparation-ci.yml` rather than folding the work into the already-modified general CI workflow. The existing unrelated offline research-generator change in `.github/workflows/ci.yml` was preserved and excluded from the clean source review.

The preparation-only job:

- Runs for backend/workflow changes on `codex/mvp-acceptance-ci` and relevant pull requests to `main`, `master` or `develop`.
- Uses an ephemeral `pgvector/pgvector:pg16` service with the synthetic test user and the dedicated `herbalai_test` database, mapped to loopback port 5432. The Linux-runner/service-port arrangement follows [GitHub's PostgreSQL service documentation](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).
- Grants only `contents: read`, uses no provider secrets, and bounds the job to fifteen minutes. Trigger, permission and concurrency fields were checked against [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
- Installs the locked backend dependencies, strictly typechecks the preparation CLI/runner and tests excluded from the application tsconfig, and explicitly lints the new tooling/test files.
- Runs the boundary regressions with both URLs pinned to the local test database, dotenv disabled and Gemini access empty.
- Runs `npm run test:preparations:database`, which validates its explicit isolated target, generates the client, migrates only that test database and executes the eight preparation PostgreSQL tests.
- Does not seed/import/publish herbs, generate embeddings, change provider settings or continue after a failed gate.

This workflow is authored and locally inspected, not executed by GitHub yet. A passing workflow-contract test is not a PostgreSQL result.

## Regression and validation evidence

Seven new tests in `herbalaibackend/tests/herb-preparation-ci.test.ts` check service/permissions/time bounds, branch/path triggers, the guarded invocation, strict tooling coverage, isolated boundary-test settings, failure propagation/order and all eight enabled SQL tests. Before the new workflow existed, six contract tests failed and one fixture-content check passed. These were missing-new-workflow assertions, not six production defects or SQL failures.

- Final working-tree preparation subset: **93 tests passed across four files**, 10.60 seconds.
- Strict tooling/test TypeScript passed, including the runner, update CLI, CI contract test, runner test and actual database-fixture test. This checks types, not database execution.
- Explicit tooling/test ESLint passed. Its first invocation reported `no-regex-spaces` for the new test's two-space indentation matcher; using `{2}` resolved that local lint issue without changing the assertion's scope.
- Standalone YAML parsing and parsed trigger/service/command structure checks passed using the locally available `js-yaml` module. The bundled Python runtime lacked PyYAML; no parser package was installed. The Vitest contract tests do not rely on that external parser.
- **Clean source snapshot: 1,026 non-database tests passed across 70 files**, 49.06 seconds. Eighteen database-dependent suites were explicitly excluded. Strict tooling/test TypeScript, explicit tooling/test ESLint, backend build and backend source lint also passed in that snapshot.
- This clean count is intentionally separate from the earlier dirty-tree 1,185-test result. The snapshot excludes unrelated authentication/email/UI changes, fifty-candidate research tooling and unpublished research ledgers.
- All **eight actual PostgreSQL tests remain unrun locally**. No concurrency, rollback, SQL read-only enforcement, remote CI, live preparation update or live Dr. Ai retrieval pass is claimed.

## Exact source-isolation boundary

A fresh temporary Git index outside the checkout was populated from HEAD `f98c498d0c62998b2f5129557f038a79345cd9bd`, then only the reviewed twenty-four paths were overlaid. The real index hash was unchanged and the real index remained empty. No branch or commit was created.

The source allowlist is the seventeen paths enumerated in `HERB_PREPARATION_RELEASE_SAFETY_2026-10-05.md`, plus:

- `Docs/research/HERB_PREPARATION_DATABASE_GATES_2026-10-05.md`
- `herbalaibackend/package.json`
- `herbalaibackend/prisma/test-herb-preparations.ts`
- `herbalaibackend/tests/herb-preparation-isolated-runner.test.ts`
- `Docs/research/HERB_PREPARATION_ISOLATED_RUNNER_2026-10-06.md`
- `.github/workflows/herb-preparation-ci.yml`
- `herbalaibackend/tests/herb-preparation-ci.test.ts`

Snapshot: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/tmp/preparation-ci-gate-a8d9dd41632b4bc08dd7114966493f68/snapshot`.

The adjacent `manifest.json` contains the actual SHA-256 hashes for all twenty-four overlaid paths; those hashes were independently rechecked. Private dotenv files were absent. A local junction shared already-installed backend dependencies; this is not a fresh dependency-install or Linux validation result. Tests used an intentionally unavailable loopback database URL, disabled dotenv loading and an empty Gemini key. No provider credential was exported or selected.

This new report and the continuation/readiness documentation updates were written after the clean run and are not included in that twenty-four-file manifest. No runtime code changed after validation. A future reviewed push can include this report as separately reviewed evidence; do not silently include every dirty file.

## Next required gate

The preparation-only source bundle is ready for a separately authorized CI-branch commit/push, not a production release. That actual GitHub run must discover and pass the eight PostgreSQL fixtures before applying any preparation update live. The old f98c498 CI result does not cover the uncommitted safeguards or new job.

After the real database gate passes, independently reconfirm the intended Neon target, take a fresh reviewed snapshot and physical outside-repository backup, review field/source changes, generate genuine current-field embeddings and apply only the accepted existing twenty-generic-preparation records. Then check live Library text/citations and Dr. Ai retrieval. The fifty new candidates still require their separate clinical/taxonomy, media, duplicate and staging clearances; nothing in this CI job approves a medicinal recipe or publishes a new herb.
