# Fifty-herb draft import — 7 October 2026

## Actual result

The missing importer is implemented, tested and **executed successfully against the live Neon target**. It committed fifty private drafts at `2026-10-07T02:41:32.762Z`; independent post-commit validation passed at `2026-10-07T02:43:55.327Z`. The public Library still has 38 herbs because draft staging is deliberately separate from publication.

Chrome remained inaccessible. The guarded CLI used existing credentials from the same Neon project, in memory only, against the already independently confirmed live compute. A read-only check returned database `neondb`, 38 Herb rows and 17 SuggestedHerb rows before staging. The different branch configured in local `.env` was not used or modified. TLS used `verify-full`; no credentials were saved in import files, documentation, chat or Git.

The writer captured a fresh all-state insert-only backup at `2026-10-07T02:37:18.270Z`, rechecked duplicate identities and the active administrator inside the locked transaction, and committed **50 drafts, 193 sources and 50 audit rows** without updating existing herbs or generating embeddings. No SQL Editor write was submitted.

Read-only validation compared every proposed herb field, source title/publisher/URL/citation/support tag and staging audit against the reviewed plan: **zero failures**. It verified all 50 preparation descriptions, 41 covers, null embeddings and DRAFT/unverified status, and retained all 38 preexisting herb identities. The public catalog returned HTTP 200 with 38 herbs and no new draft IDs; a new draft's public detail returned HTTP 404. The first verification attempt returned a generic failure without a detailed cause; a read-only rerun passed. No second import was attempted.

See `HERB_FIFTY_LIVE_STAGE_VERIFICATION_2026-10-07.json` for the actual receipt. This is genuine live draft staging, **not** public publication or AI retrieval acceptance.

## Focused implementation

- `herbalaibackend/src/content/herb-expansion-draft-import.ts`: validated insert-only transaction and guarded SQL export, all-state duplicate protection, active-admin check, atomic source/audit insertion, immutable existing herbs and explicit draft-only flags.
- `herbalaibackend/prisma/load-herb-expansion-plans.ts`: loads the existing five held plans and checked photo receipts without rewriting their historical evidence.
- `herbalaibackend/prisma/import-herb-expansion-drafts.ts`: strict `--plan`, `--stage` and `--export-sql` modes; no publish mode. Direct staging accepts only explicitly supplied `HERBALAI_IMPORT_DATABASE_URL`, never inherited production variables.
- New unit and database regressions cover fifty-row preparation/source preservation, duplicate identities, rollback after a real SQL error, competing concurrent imports, all four suggestion states, banned administrators, wrong targets/digests, existing backups, SQL string quoting, changed catalogs, expired snapshots and backup-before-export behavior.

The import contains 50 distinct private drafts, 193 source rows, 50 nonblank preparation descriptions, 41 selected Cloudinary covers and 50 staging audit records. It does not convert documented food/laboratory methods into safe human treatment instructions. Missing covers, occurrence data and review decisions remain explicit gaps; nothing is fabricated.

## Observed validation

- Broad targeted herb regressions: **695 passed, 41 files**, 10:24:52 local start, 23.29 seconds.
- Real PostgreSQL importer tests: **15 passed, 1 file**, 10:24:41 local start, 5.50 seconds.
- Backend `npx tsc --noEmit -p tsconfig.json`: passed.
- CLI and both new test files: explicit NodeNext TypeScript check passed.
- Focused ESLint on the three implementation files and both test files: passed.
- Working-tree `git diff --check`: passed; existing CRLF notices are not failures.
- Native PostgreSQL 17.6 was obtained from the official EDB download source, used only at `127.0.0.1:55479/herbalai_test` in a temporary cluster outside Git. Tests used separate temporary schemas. No production connection or credentials were involved.

Limitations: the isolated fixture contains the relevant enums, constraints and tables, but its nullable embedding column is text rather than pgvector. These results demonstrate real insert/lock/rollback behavior, not full project migration, embedding or end-to-end production acceptance. No physical-device, participant or clinical-review result is implied.

## Confirmed live target

- Railway service: `HerbalAiCapstoneProject`; project `49a41584-6098-4e37-8431-1d749a52947f`, environment `5b714e12-a15a-4441-b976-835f3a1e5f31`.
- Neon project: `falling-block-62836604`.
- Neon branch: `br-still-waterfall-aqtagztm`, named `pre-railway-deploy-2026-09-20`.
- Compute host: `ep-icy-sound-aqfe958d.c-8.us-east-1.aws.neon.tech`.
- Database: `neondb`.

Railway's masked database variable was inspected only to compare sanitized host/database identifiers, then masked again. The Neon default production branch points to a different compute and must not be used for this import.

The read-only live query captured 55 identities and an active authorized administrator at `2026-10-07T02:17:56.671Z`. The import generator found no conflicts against this complete snapshot. No private account email, password, connection credential or OAuth secret is present in the runtime import artifacts.

## Saved execution artifacts

All paths below are relative to `herbalaibackend/tmp/` and are Git-ignored:

- `herb-fifty-draft-import-plan-2026-10-07.json`: reviewed plan; canonical SHA-256 `bd47dbc24515ad9b052e544a774fe063b05218b29bb183985241f772f8a91f64`.
- `herb-fifty-live-identity-snapshot-2026-10-07.json`: target, capture time and all-state identities.
- `herb-fifty-refresh-identity-snapshot.sql`: read-only refresh query; preserve its exact confirmed target.
- `herb-fifty-stage-backup-2026-10-07-v2.json`: saved full plan and identity snapshot before SQL export; insert-only operation, no overwritten herb records.
- `herb-fifty-stage-neon-2026-10-07-v2.sql`: executable draft-only transaction with catalog comparison and execution-time snapshot expiry. Canonical script-string digest `8aaca07c676fdd11b6978be2d4491cce89b6b1a43bf8f134d8327edbf257646c`.
- `herb-fifty-direct-stage-backup-2026-10-07.json`: fresh all-state backup used by the successful direct transaction; retains all preexisting identities and planned new IDs.
- `herb-fifty-live-stage-validation-2026-10-07.json`: successful read-only post-commit validation receipt, copied into the research evidence directory without credentials.

The superseded first SQL script was removed to avoid accidentally using the version without execution-time snapshot expiry. Its backup remains as historical evidence. Neither script was submitted to Neon.

## SQL Editor fallback — historical, do not execute again

The following handoff was prepared before the direct import succeeded. It is no longer pending work. **Do not execute the saved SQL or rerun `--stage`: the fifty records now exist.** Keep the artifacts as evidence. Remaining work is the publication clearance in item 7.

1. Reconnect Mercado Chrome with the existing signed-in Neon SQL Editor. This requires no new password, permission change or Cloudinary login.
2. Confirm the selected branch/database match the target above. Preserve any existing user query by opening a new query.
3. If the saved snapshot is older than one hour, run the saved read-only refresh query and download its result. Extract `target`, `capturedAt` and `identities` into a fresh snapshot file; retain its separately returned active administrator ID for the reviewer flag. Export a new script and backup to unused filenames. Never modify timestamps to bypass freshness checks.
4. Use `npx tsx prisma/import-herb-expansion-drafts.ts --export-sql` with the reviewed plan digest, confirmed host/database, fresh snapshot, active reviewer ID and new backup/output paths. Exporting does not connect to a database.
5. Load the generated SQL through the browser's local-file view into Neon SQL Editor and run it once. The transaction rejects a changed identity catalog, expired snapshot, inactive reviewer or wrong database. Do not blindly rerun after an ambiguous timeout; inspect the planned IDs first.
6. Record the actual result: 50 drafts, 0 unexpectedly published, 0 embedded, 193 source rows, 50 matching staging audit rows, all preparation descriptions present, 41 covers. Independently check that the existing public Library remains unchanged. If execution fails, record the exact error and verify no partial draft/source/audit batch exists.
7. Keep publication separate. Nine cover gaps, Lokoloko occurrence, two secondary-source identity holds, category assignment and final evidence/content review still prevent claiming all fifty are publication-ready. Publish only individually cleared records, then validate public details and AI retrieval without inventing beginner quantities or doses.

No commit or push was made. Unrelated auth, frontend, CI and documentation changes remain untouched.
