# Suggestion publication reference coverage — 4 October 2026

## Finding

Read-only live administrator review found an old Approved submission named `awdsawd` whose stored preparation, dosage and medicinal-use text were not credible. It is not in the rendered public 38-herb catalog, so this is not a public-library correction or a confirmed Dr. Ai retrieval issue.

The current review workflow already required a non-empty source field and at least one structured reference before publishing. It did not, however, require the structured references to declare support for every mandatory public claim field. A reviewer could therefore attach an identity-only reference and publish identity, medicinal-use, preparation and dosage text without structured coverage for the latter fields.

## Local repair

The approval controller now blocks publication unless valid structured references collectively cover:

- botanical identity;
- medicinal uses;
- preparation method; and
- dosage; and
- safety warnings when the record includes written warning text.

Editors can still save partial review work. The stricter rule applies only at the irreversible publication action. It does not infer that a citation is authoritative; the reviewer remains responsible for applying `Docs/HERB_CONTENT_STANDARD.md` to assess source quality and wording.

The follow-up review found that a direct repository call could bypass the controller guard. The database transaction now rechecks the references on the claimed suggestion before creating its Herb and audit entry. A validation exception causes the transaction to roll back its status/revision claim. The obsolete fallback that invented support labels from a plain information-source string has been removed; only explicitly reviewed reference scopes are copied into the published Herb.

An initial regression run reproduced three direct-call bypass cases: empty references, identity-only references and an unsafe URL. Each reached Herb creation rather than rejecting publication. After the repository guard was added, all three rejected before Herb or audit creation in the modeled transaction tests. Written-warning coverage is checked at both controller and repository boundaries. Reference coverage may be distributed across multiple reviewed sources.

The legacy `awdsawd` record was not edited, rejected or deleted. Its status means the new guard would not run retroactively. Any archival or retention action needs a separate exact-target review because it is historical user data and may be associated with audit records.

## Validation

- Initial controller-only batch: 22 focused tests passed; this is historical evidence and is not added to the final test count.
- Expanded final run: `npm test -- --run tests/review-http.test.ts tests/review-decisions.test.ts tests/suggestion-review-edit.test.ts tests/suggestion-id-boundaries-http.test.ts tests/suggestion-resubmit.test.ts tests/suggestion-upload-recovery-http.test.ts`: 114 passed across six files, zero skips/failures.
- `npm run lint`: passed.
- `npm run build`: passed.
- Separate strict TypeScript check of the changed database test files: passed. The normal application build excludes tests, so this is an additional compile check, not a database execution.
- `git diff --check`: passed; line-ending warnings concern pre-existing workspace files.

`tests/suggestion-validation.test.ts` could not run locally because its integration setup needs PostgreSQL and the local database service is unavailable. Its failure occurred during test-fixture user creation before the submission assertions. The isolated PostgreSQL GitHub CI must run before publication; no live approval or production database change was attempted for this repair.

The database governance suite now contains three actual rollback checks for unsupported direct approval. They verify Pending status, unchanged revision/reviewer state, zero Herb creation and zero audit entries after failure. The existing successful governance/publication fixtures now supply explicit source scopes, preserving their source/provenance/embedding assertions. These database suites were typechecked, but were not executed in this environment. The mocked transaction tests do not prove PostgreSQL rollback by themselves.

Public list/detail and embedding retrieval code were inspected: they select verified PUBLISHED Herb records rather than reading the SuggestedHerb archive. Existing role, revision, ownership, resubmission and duplicate-decision checks remain in their routes and transactions. The expanded local tests exercised stale decisions, ID validation, reference validation, side-effect ordering, resubmission and upload recovery. Authenticated role enforcement and real SQL behavior remain part of isolated database CI; no new live acceptance pass is claimed.

## Release scope

The local change set is limited to:

- `herbalaibackend/src/schema/suggest.schema.ts`;
- `herbalaibackend/src/controllers/suggest.controller.ts`;
- `herbalaibackend/src/repositories/suggest.repository.ts`;
- `herbalaibackend/tests/review-http.test.ts`;
- `herbalaibackend/tests/review-decisions.test.ts`;
- `herbalaibackend/tests/herb-governance.test.ts`;
- `herbalaibackend/tests/review-publication-transaction.test.ts`;
- `herbalaibackend/tests/suggestion-review-edit.test.ts`; and
- this report.

The release report also records a short cross-reference to this batch. Existing uncommitted historical reports were preserved. This batch needs isolated database CI and review before deployment. No migration or frontend change is required. Nothing in this batch is committed, pushed or deployed.

## Authorized release continuation

The user authorized proceeding with isolated database CI, the focused release and live acceptance on 4 October. The release scope is the eight backend files above and this report only. Unrelated historical documentation and hosting notes are excluded. Local preflight was repeated: all 114 focused tests passed, backend lint/build and the strict database-test typecheck passed. The CI branch, main and the watched deployment branch were verified at `58ebe66` before release work. Production refs will remain unchanged until the new commit passes isolated CI.

The initial connected-browser inventory contains Mercado Chrome with Gmail and Facebook, but no open Herbal-Ai session or connected Gina administrator browser. Fresh session availability must be observed before authenticated live checks are counted; old reports alone do not establish current sessions.

## Remaining project gates

| Gate | Current disposition |
| --- | --- |
| Citation coverage at controller and repository | Locally repaired and tested; pending isolated SQL CI and deployment. |
| Real transaction rollback and governed successful publication | Database regression cases prepared and typechecked; execution pending. |
| Actual source authority and scientific/medical wording | Human reviewer checks against `HERB_CONTENT_STANDARD.md`; source tags do not establish factual accuracy. |
| Legacy approved archive record | Retained, absent from the previously inspected public catalog; historical-data decision remains pending. |
| New live acceptance for this guard | Pending deployment; previous live results apply to 58ebe66. |
| Railway continuity | Owner decision remains pending; see `HOSTING_CONTINUITY_2026-10-03.md`. |
| Genuine Suggestions tab-return, physical-device evidence and participant UAT | Existing evidence limits remain open or deferred in the release report. |
