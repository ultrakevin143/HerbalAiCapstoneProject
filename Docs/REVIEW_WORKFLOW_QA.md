# Review workflow QA — September 14, 2026

The database-backed scenario in `herbalaibackend/prisma/check-review-workflow.ts` passed these checks:

- Pending submission creation; pending submissions cannot be resubmitted.
- Request changes preserves reviewer notes.
- Another user cannot resubmit the returned submission.
- The owner can resubmit, returning the entry to Pending.
- Resubmission clears previously reviewed references.
- Admin edits save two references with distinct claim scopes.
- An outdated revision cannot overwrite the saved edit.
- An edit audit record is saved.
- Published herb count stays unchanged.

This scenario uses disabled synthetic QA accounts and does not send email or publish herbs. It leaves one pending fixture for browser inspection. Run with `--cleanup` afterward to remove only the fixture and its QA accounts/audit records. Do not approve the synthetic fixture.

After the user signed in again, authenticated browser checks verified the pending QA card, two references with distinct scopes, prefilled edit fields, validation when a citation was removed, successful saving through the editor, and the resulting audit record attributed to the signed-in administrator. The audit UI initially displayed nested snapshots as `[object Object]`; it now expands readable before/after details. Frontend TypeScript validation passed.

The temporary submission and disabled QA accounts were removed after testing. The browser-generated audit entry under the real administrator remains as a record of the test action. No synthetic herb was published. Contributor browser resubmission and approval/publication remain unverified by this scenario.

## Transactional publication verification — September 16, 2026

`herbalaibackend/tests/review-publication-transaction.test.ts` passed against the configured database. Run it from the backend with `npx vitest run tests/review-publication-transaction.test.ts`.

The test exercises the real repository functions inside one database transaction, routing their nested transaction callbacks into that transaction. It verifies owner-only resubmission, reference reset, stale-edit rejection, approval with the reviewed revision, published content and provenance, two independently scoped references, embedding persistence, and request-changes/edit/approval audit records. It also verifies that approved submissions cannot be edited or resubmitted.

An intentional rollback discards every synthetic account, submission, herb, reference, and audit record, even when an assertion fails. Post-rollback assertions confirm that the synthetic accounts and herb are absent. No test herb is committed to the public library and no email is sent.

This is repository/database integration coverage, not an authenticated browser or HTTP end-to-end test. The embedding is a synthetic vector, so it verifies database persistence rather than Gemini generation or semantic quality. Contributor browser resubmission and authenticated approval through the UI remain the next checks.

## Authenticated admin checks — September 16, 2026

Using temporary suggestion 32 in the signed-in administrator's browser:

- Approve & Publish without an evidence classification was blocked with the expected message; no publication was attempted beyond this validation guard.
- Request Changes without notes was blocked with the minimum-length message.
- Request Changes with explicit synthetic QA notes initially failed with a transaction-start timeout. A single retry succeeded and removed the item from the pending queue. The timeout's root cause remains undiagnosed; retry success does not establish production reliability.
- The audit screen showed REQUEST_CHANGES_SUGGESTION under the signed-in administrator, with the exact submitted notes in its expanded details.

The fixture cleanup removes the synthetic submission and disabled QA accounts, retaining the real administrator's audit event. No synthetic herb was published. Contributor browser resubmission and successful UI approval remain unverified; the latter must use an isolated test environment or a genuinely reviewed submission, not synthetic medical content in the public library.

## Transaction acquisition mitigation

The Prisma client now explicitly configures its transaction acquisition wait through `DB_TRANSACTION_MAX_WAIT_MS` (default 12000 ms, bounded to 1000–60000 ms). This gives the default 10000 ms pool connection attempt room to complete rather than relying on Prisma's shorter default acquisition window. If the pool connection timeout is increased, review this setting too. Restart the backend after configuration changes.

This only changes how long transactions wait to start; it does not increase transaction execution time or automatically retry writes. It is a mitigation, not proof of the original timeout's cause. Connection latency and pool saturation still require observation under load. Configuration boundary tests and the rolled-back publication scenario cover the change without committing synthetic library content.

## Handoff investigation and regression fixes — September 16, 2026

The dedicated read-only transaction diagnostic reproduced the same acquisition timeout with a held connection and the old 2000 ms wait. The configured 12000 ms wait handled a 2500 ms hold successfully. Measured cold/warm transaction times were 5076/850 ms, and recovery under the configured wait took 3365 ms. This confirms a plausible mechanism, not the untraced original incident's cause. See `prisma/diagnose-transactions.ts` and `Docs/ASTRA_ISSUE_HANDOFF.md`.

Return, rejection, and approval now claim only the expected Pending revision; conflicted actions return 409 before notification. Rejection and its audit now commit or roll back together. API review actions require a revision, and the admin page supplies it. Database failures are redacted in development and production, with safe 503 messages for temporary failures and structured server diagnostics correlated to slow-request logs.

The focused regression run passed 56 tests across error responses, decisions, HTTP handling, rollback publication, validation, resubmission, edits, and configuration. Backend build and frontend TypeScript checks passed. Whitespace cleanup passes `git diff --check`. Tests use mocked external notifications/email/embedding and rolled-back database fixtures, leaving no synthetic herbs in the library. Contributor browser and real-provider publication verification remain outstanding.

After adding already-decided conflict cases and email failure coverage, `npx vitest run tests/review-http.test.ts tests/suggest.test.ts` passed 20 tests, and the backend build passed again. This follow-up overlaps the earlier run.
