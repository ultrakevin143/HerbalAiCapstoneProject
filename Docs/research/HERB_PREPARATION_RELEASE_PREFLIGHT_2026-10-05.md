# Preparation release preflight

Date: 2026-10-05. This report distinguishes a CI branch push from a production content release.

## Target mismatch observed

The connected Neon browser remained unresponsive. A read-only PostgreSQL transaction used the existing primary-checkout backend configuration, without displaying or copying its credentials. It returned 37 Herb rows, all published, with 20 generic preparation placeholders. The same check fetched the live public API: 38 published records. Exact identity/content comparison failed. The transaction was rolled back and the client closed; no writes or database-setting changes occurred.

The browser-selected historical Neon branch and the local configuration also name different endpoints. Neither a matching subset of twenty built-in records nor an old snapshot proves the current Railway target. Do not publish to the local connection, manufacture a connection URL, or test mutations against it.

## Reviewed CI-only bundle

- Existing batch-02 preparation descriptions, source attribution and safety exclusions; no new plant IDs.
- Named/stored-alias retrieval and preparation relevance changes, including regression tests.
- Shared embedding-text and per-source access-date validation helpers used by the existing importer.
- The 38-record dated coverage ledger and preparation audit/validation documents.
- No authentication, email, frontend, workflow, credential, media-upload or fifty-candidate staging changes.

The CI branch is codex/mvp-acceptance-ci. main and codex/readability-accessibility must remain unchanged during this CI-only review. No production bootstrap or importer is authorized merely by a successful CI run. Software tests are not independent clinical clearance.

## Validation and release gates

The current working-tree run passed 1,028 non-database tests across 73 files; the five preparation-focused suites passed 116 tests. Build, lint and strict importer/test typechecks passed. Seventeen local database suites were excluded. The exact staged snapshot must be checked separately, because the working tree also contains unrelated code and untracked research tests.

After the exact staged snapshot passes, push only this bundle to the existing CI branch and record the remote SHA and full isolated PostgreSQL CI outcome. Production release is still blocked on independently confirming Railway's database target, retaining a rollback snapshot, using a selective existing-record update that preserves images and reviewer metadata, refreshing accepted embeddings, and checking the updated Library/Dr. Ai responses live. The current broad bootstrap can overwrite fields and is not a preparation-only updater.

Kalingag's licensed/identity-verified photo assignment and the Tanglad/Indian Heliotrope preparation-support labels remain pending. The separate fifty-candidate expansion remains unpublished.

## Exact staged snapshot validation

The index contained exactly the fifteen reviewed files, with no unrelated workflow, authentication, frontend or research-queue changes. `git checkout-index` exported that indexed tree to a new local scratch directory. Its dependency junction reused the installed backend dependencies; no environment file or database credentials were copied. The test process used an unused loopback PostgreSQL URL and an empty Gemini key.

- Preparation-focused suites: 116 tests passed across five files in 3.90 seconds.
- Broad non-database suites: 920 tests passed across 65 files in 106.59 seconds, with the same seventeen database-suite exclusions listed in the validation report.
- Backend build, lint and strict standalone importer/five-test TypeScript checks passed.
- Staged whitespace, exact path allowlist and private-path/token checks passed. Pattern checks are not a guarantee that every possible secret format is detectable.

The 920-test snapshot result, rather than the larger unrelated working-tree result, is the local release evidence for this bundle. Full PostgreSQL CI remains pending at this checkpoint. The planned push changes only codex/mvp-acceptance-ci; it does not release the twenty preparation updates to the public database.
