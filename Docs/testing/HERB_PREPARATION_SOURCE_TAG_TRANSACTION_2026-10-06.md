# Guarded preparation source-tag transaction — 6 October 2026

## Release boundary

Implemented locally; not applied to Neon and not deployed, committed or pushed. No live account, provider setting, frontend styling, historical migration or unrelated working-tree file was changed. The existing read-only proposal CLI still has no apply mode. The new release helper is not wired into application routes, startup or deployment scripts.

The proposed change remains three additive `preparationMethod` support tags: Indian Heliotrope source 21 and Tanglad sources 19/20. WHO source 22 stays warnings-only. This fixes reference coverage, not the availability of a safe household recipe. Indian Heliotrope remains withheld; Tanglad's clinical formulations are not rewritten as home preparation instructions. The fifty-herb expansion and regional-name work are not completed by this batch.

## Implemented safeguards

- `herbalaibackend/src/content/herb-preparation-source-tag-release.ts` reuses the reviewed source/species/URL bindings and rejects extra herbs, missing references, noncanonical plans and already-completed releases.
- Preparation uses a repeatable-read, read-only transaction and full `to_jsonb` herb/source rows, retaining otherwise unknown columns and the textual embedding value. Target host, database and port must match the actual client's connection parameters; SQL separately checks `current_database()`.
- Recovery files must be outside the repository, regular files rather than links, created exclusively with restricted file mode. Apply requires the exact reviewed plan digest, matching recovery file, independently confirmed target and a plan at most fifteen minutes old. No connection URL or password is written into the recovery file. On Windows, file mode alone is not a substitute for private directory ACLs.
- Apply uses a serializable transaction with bounded lock/statement/idle-transaction timeouts. It locks the active, unbanned administrator and selected herb/source rows; any changed full baseline aborts rather than merging an unreviewed edit.
- SQL modifies only existing `HerbSource.supports`, with an old-array equality condition and exactly-one-row check. Existing tags are preserved and only `preparationMethod` is appended. It writes one `UPDATE_HERB` audit per affected herb, carrying the source IDs, operation and plan digest.
- A post-write full-row comparison checks all selected herb/source columns. Preparation wording, dosage, warnings, identity, media, publication and embedding must remain unchanged. A trigger that rewrites a protected field causes rollback.
- A lost COMMIT acknowledgement or unconfirmed rollback throws `SourceTagOutcomeUncertainError`. The caller must discard that database connection and reconcile source/audit rows; it must not automatically retry or claim that a committed transaction was undone. There is no automatic replay.

## Observed local validation

The installed optional Prisma development dependency already supplies PGlite and its vector extension. No package, service or dependency was installed or changed. Tests used an in-memory PostgreSQL WASM engine, minimal SQL fixture tables and real `vector(768)` values; no TCP listener or live database connection was used. Fixture content is test-only and is never imported into the production catalog.

- **31 new regression cases passed**: consistent read-only snapshots, database-enforced read-only rejection, additive commit/audit attribution, no duplicate replay, real SQL-error rollback, conditional-update rollback, changed herb/source baselines, a protected-field-changing SQL trigger, ineligible reviewers, target/client/database mismatches, stale/future plans, tampered plan/backup, recovery path/overwrite restrictions and uncertain commit/rollback handling.
- Final combined selection: **14 files / 410 tests passed**, run started at **4:08 PM Manila**, duration **18.19 seconds**. This includes the prior source planner, beginner-guidance, RAG/source-context, Gemini transport/fallback and preparation/expansion regressions. Provider-dependent checks in that selection are mocks, not actual live Gemini acceptance.
- Backend TypeScript build and lint passed after the release helper/read-only preparation implementation. Additional typechecking of the new SQL test files and shared fixture passed.
- Temporary recovery files were removed individually and their now-empty temporary directory was removed. No recursive workspace cleanup was performed. Git's index remained empty.

PGlite has an exclusive backend. These results prove observed SQL atomicity and protected fixture values, **not** independent-session locking, PostgreSQL 16 migration compatibility, a complete production-schema test or live release success.

## Native database gate prepared, not executed locally

`herbalaibackend/tests/herb-preparation-source-tag-release-database.test.ts` contains three native PostgreSQL checks: real vector preservation, a competing committed source edit while the release waits for a row lock, and a concurrent administrator ban blocked until the transaction ends. The tests observe real lock waits through `pg_stat_activity` using separate connections. They create only a random test schema and remove it afterward.

The file refuses connections unless the target is loopback and the database is exactly `herbalai_test`. It requires the existing CI PostgreSQL/pgvector service. Native PostgreSQL, psql and Docker executables are unavailable locally. **These three cases have not been run or counted as passing.** Run them in the existing isolated database CI job or an equivalent local pgvector test service; never substitute Neon or a production connection string.

## Next work, in order

Continuation: `Docs/testing/HERB_SOURCE_TAG_TRANSACTION_RECOVERY_2026-10-06.md` records a reproduced/fixed lost-BEGIN acknowledgement cleanup defect, native-suite runner wiring and the later 445-test local validation. The three native concurrency/vector cases remain unexecuted locally; no live tags were applied.

1. Run the native concurrency/vector suite and review any failures before authorizing source writes. The new helper and tests are local, so existing remote CI has not validated them yet.
2. Obtain an independently confirmed fresh database target and complete read-only snapshot/recovery file using `prepareSourceTagRelease` and `writeSourceTagBackup`. The earlier public selected-field baseline is not a recovery export. A new reviewed digest is required; do not reuse a stale plan or bypass freshness through test-only clock overrides.
3. After the database gate and review, apply only these three tags with a confirmed active administrator and immediately reconcile the two audits and all protected values. Discard and reconcile any uncertain connection outcome before considering another operation.
4. Separately review the uncommitted beginner-guidance batch for selective deployment, then inspect actual public preparation references and generated Dr. Ai beginner answers after cache expiry. Offline prompt/transport tests do not establish live model compliance.
5. Continue the held fifty-herb content, identity and cleared-image work. Do not fabricate recipe steps, medicinal doses or regional names to fill a blank field.
