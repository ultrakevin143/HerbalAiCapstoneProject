# Focused repairs — 15 October 2026

These changes repair the confirmed code defects from `LIVE_SYSTEM_AUDIT_2026-10-15.md`. They are local and have not been deployed. The source-link migration has been validated on isolated PostgreSQL; it has not been run against production.

## Repairs

| Finding | Change | Verification |
|---|---|---|
| QA-01: local chat safeguards removed | Restored only `src/controllers/chat.controller.ts` to the committed `c536983` implementation. This restores credit reservation, settlement, refunds, idempotent replay, cancellation/deadlines, recovery metadata and bounded safety history. The replaced local version is backed up in `output/live-fixes-2026-10-15/chat.controller.before.ts`. AI services were unchanged. | All 144 previously compared chat/wallet checks pass in the primary checkout, including the real isolated wallet database tests. |
| QA-02: first 50 audit rows only | Added Previous/Next controls and server result totals. Pagination uses 50 rows per page and the existing API limits. Ordering now breaks timestamp ties by ID so records cannot be skipped or repeated merely because timestamps match. | Real database fixture reaches 155 unique records across four pages. Local production-build browser preview reaches the final five records. |
| QA-03: audit target IDs absent from search | Added bounded, parameterized search over the complete audit history, including target ID, action, type, actor name/email/username and JSON details. Search waits 250 ms and starts at page one; stale responses cannot replace current results. Administrator authorization and audited mutation behavior are unchanged. | HTTP validation, real database literal `%`/underscore and nested JSON searches, SQL-looking input, stale-request and contributor-denial checks pass. Browser preview finds the oldest target from page four. |
| QA-04: blank unmatched search | Added no-match feedback, a result count and Clear search. | Browser preview verifies zero results, clearing the search, whitespace-only input, pagination disabling and a 320px layout. |
| QA-05: homepage-only sources | Added a migration for 83 exact species/source links. The remaining 17 generic homepage links become non-clickable historical citations with a dated notice that the plant-specific reference is unverified. Guard conditions preserve already precise links, other publishers and historical PITAHC references. The one-off importer uses the same verified links and review notice. | All 83 destination pages returned HTTP 200 and contained the relevant species identity or an explicitly reviewed synonym. On a disposable schema populated from the 238 public records, exactly 83 precise links and 17 review notices are applied; all clinical fields remain identical, and a second run changes zero rows. This verifies reference precision, not medical claims or dosage accuracy. |
| QA-06: dependencies with available patches | Scoped overrides update backend `proxy-addr` to 2.0.8, both `source-map-js` copies to 1.2.2 and frontend `sharp` to 0.35.5. Package lockfiles are updated. | Backend npm audit: zero findings. Frontend production-only audit: zero findings. Image encoding smoke check, builds, lint and type checks pass. |

Existing edits to the About page, home page, HomeHero and Navbar were preserved. No redesign, authentication rewrite, credential change, payment, email or unrelated application change was made.

## Remaining limitations

- The frontend full development audit still reports five affected package entries for one `braces` advisory, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), through ESLint's glob tooling. The registry has no patched release. A forced ESLint/Next downgrade would change the working toolchain and was not applied. Production-only audit is clear.
- Seventeen imported species still lack a verified species-specific StuartXchange reference. Their existing medicinal content was not rewritten. Their citations now explicitly flag this limitation when the migration runs. The review queue and the 83 verified URL receipts are in `herbalaibackend/content/herbs/verified-source-links-2026-10-15.json`. Shared common names and unrelated species pages were rejected rather than substituted. The resumed review verified one additional exact identity at [Kindayohan / Celosia argentea](https://www.stuartxchange.org/Kindayohan).
- Seven of the original 107 link-review records are intentional historical PITAHC references: an earlier migration records the directory's observed HTTP 404 and removes its broken hyperlink. These are separate from the 100 imported homepage-only StuartXchange references and remain unchanged. The new migration handles all 100 imported homepage links with either a precise destination (83) or an explicit review notice (17).
- Full application PostgreSQL/pgvector migration acceptance and controlled live write workflows remain unexecuted. The portable PostgreSQL runtime has no pgvector extension. Browser evidence below uses a clearly synthetic loopback administrator and data fixture, not the deployed administrator API.

## Validation receipts

`output/live-fixes-2026-10-15/` contains:

- `focused-backend.log`: **239/239 passed** across seven suites, including the 144 chat/wallet checks, audit HTTP checks and real audit database checks.
- `node-tests.log`: **581/581 passed**, including seven new audit request/state regressions. CI now includes those regressions and strict audit acceptance fixture typechecking.
- `dependency-boundaries-final.log`: **96/96 passed** across four dependency/protocol/API boundary suites, bringing the focused backend total to **335 passed**. The initial run had two fixture failures because the local `.env` enables test credits while the API-wide fixture assumes credits are off and does not mock wallet transactions. The final run explicitly sets `DR_AI_CREDITS_MODE=off`, matching that fixture's intended configuration. No application code was changed to accommodate it.
- `backend-build.log`, `frontend-build.log`, `backend-lint.log`, `frontend-lint.log`: completed checks. Backend source typechecking, strict audit acceptance fixture typechecking and importer typechecking also pass.
- `backend-audit.json`, `frontend-audit.json`, `frontend-production-audit.json`: dependency receipts, including the remaining development advisory.
- `source-migration-validation.log`: exact URL count, idempotence and preservation checks on a transactionally disposable schema.
- `source-links-resume.log`: **18/18 passed** in the new permanent StuartXchange database regression suite and existing PITAHC preservation suite. CI now includes strict typechecking for the new fixture. This adds 18 passing checks to the earlier 335 focused backend checks.
- `source-render-resume.log`: **4/4 passed**, including two new checks that render all 100 references through the actual reference component, confirming precise links and visible review notices without homepage hyperlinks. No frontend component was changed. The importer passes its existing typechecking settings; an additional exploratory `noUncheckedIndexedAccess` check reports pre-existing indexed-loop warnings, so those unrelated working lines were left unchanged.
- `verified-source-pages.json`: fetched source-page identity evidence, with a separate unresolved list. Species identity is required; a common-name match alone is insufficient.
- `audit-last-page.png`, `audit-search-320.png`: local browser proof. The synthetic API fixture is loopback-only and rejects non-preview mutations.

The full frontend production build and focused backend tests ran after the dependency patches. The SQL change updates only `HerbSource.url` and the 17 unverified-source citation notices; it does not modify herb descriptions, doses, preparations, warnings, image fields, evidence classification or publication state. No production database or deployment was modified during these repairs.

Temporary audit, wallet and source-validation schemas were confirmed absent. The loopback frontend/API preview and portable PostgreSQL were stopped, the browser viewport override was cleared and the agent-created preview tab was closed. All backups and validation receipts remain available.
