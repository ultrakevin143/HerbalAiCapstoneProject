# Library category/cache continuation — 4 October 2026

## Scope

The user excluded mail recovery and requested the next development batch. Work stayed in the selective-release-check checkout, preserving unrelated local changes. This batch covers Library read/cache consistency, publication-reference regressions, the first prioritized source review and credential-free live read checks. No account password, provider variable, hosting configuration, migration, production content or media was changed. No commit or push was performed.

## Reproduced functional issue

`herbalaibackend/src/repositories/herb.repository.ts` normalized category whitespace for its cache key but passed the original category into the database equality filter. A whitespace-only category shared the ordinary unfiltered list's cache key while querying for a whitespace category. With populated fixtures, that query cached an empty response; the subsequent normal listing returned zero records from the same cache entry. A padded real category also cached zero records under the canonical category key. The issue affects matching search, page, limit and DOH-filter cache variants; it is not a claim that every live Library request was observed empty.

The baseline regression run failed six of eleven cases. A separate, stronger sequential check then reproduced the exact blank-category → ordinary-list poisoning path: the normal second request returned an empty list instead of the two fixture records. Repository/database calls were intercepted locally. The harmful sequence was deliberately not sent to production to avoid temporarily changing other visitors' cached results.

## Focused repair

Normalize the category once, before both cache-key construction and query filtering. Empty/whitespace categories and case-insensitive All now mean the same unfiltered query and cache entry. Real categories are trimmed before equality filtering and retain case-insensitive matching. Publication/verification restrictions, pagination, source inclusion, cache TTL and mutation invalidation are unchanged. Frontend source, styling and layout are untouched.

`tests/herb-category-cache.test.ts` covers normalized/blank/All variants, independent category entries, published-only query restrictions, mutation invalidation, and actual Express/Supertest request sequences through the Library controller. These are HTTP/repository regressions with mocked Prisma, not real PostgreSQL acceptance or evidence of a patched live release.

The additional seventeen `suggestion-review-edit.test.ts` regressions verify each required field independently, distributed citation coverage, duplicate-identity limitations, legacy-tag rejection, malformed citations and the twenty-reference limit. No prospective-publication guard change was needed; these checks exercise the existing guard rather than asserting that metadata tags prove a source supports a claim.

## Live read-only observations

The existing deployed backend returned the following results without authentication credentials or writes:

| Request | Expected and observed |
| --- | --- |
| Public catalog, limit 100 | 200 |
| Lagundi search, limit 5 | 200 |
| Repeated search filter values | 400 |
| Nonexistent herb detail | 404 |
| Anonymous Suggestions API | 401 |
| Anonymous audit-log API | 401 |

The current catalog still returned 38 records. The first ten source reviews and their boundaries are recorded in `LIBRARY_SOURCE_AUDIT_2026-10-04.md`. These healthy live reads do not prove the unpublished category fix is deployed or certify all MVP write flows.

## Database-runtime limitation

An initial broader run selected eight files and also included two PostgreSQL-dependent suites, suggestion-validation and herb-governance. Six files passed 104 cases; the SQL files could not validate their fixture operations, with five failed cases, thirteen skipped cases and failing setup/cleanup hooks. Local PostgreSQL/Docker executables were unavailable. This is not a newly identified production database failure. Those suites must run in isolated PostgreSQL CI; do not substitute mocked repository tests, the preceding release's CI, or a live production database.

## Publication boundary

Intended production change: `herbalaibackend/src/repositories/herb.repository.ts` only.

Regressions: `herbalaibackend/tests/herb-category-cache.test.ts` and `herbalaibackend/tests/suggestion-review-edit.test.ts`.

Documentation: this report and the Library source-audit update. Earlier mail/password changes and historical documentation are not included in this non-mail batch and remain untouched. The next release gates are reviewed isolated SQL CI, authorization to publish the intended batch, then safe live normalization checks after deployment.

## Final executed validation

| Check | Result |
| --- | --- |
| Focused backend regression run, nine database-independent files | 129 passed, zero failed. Includes all thirteen category/cache cases and seventeen new reference-coverage cases. |
| Source lint and build | Passed. |
| Strict typecheck of the new category/cache HTTP test | Passed, including unchecked-index and exact-optional settings. |
| Focused tracked diff whitespace check | Passed; existing LF/CRLF warnings only. |
| Six credential-free live GET checks | All returned the expected status. |
| Real PostgreSQL tests for this batch | Not passed locally; requires isolated SQL CI. |
| Patched live category normalization | Not tested: the repair is not published. |

The 129-case count is the final unique passing run for this non-mail batch, not combined with earlier mail/password tests, the intermediate 127-case run, baseline failures or past release CI. There is one reproduced and repaired application issue, plus a redundant-cache-entry inefficiency closed by the same normalization. No UI redesign or new medicinal guidance was introduced.

## Authorized release and live validation — 4 October 2026

The user authorized the five-file CI-first release. Commit `95cf80761106f95ea4faaca0437fb4ddc348896f` contains only the Library repository repair, its new cache regression file, the suggestion-reference regression additions and the two Library reports. Mail/password changes, historical dirty reports, local fixtures and credentials were excluded. The initial sections above describe the pre-release investigation; this appendix supersedes their pending SQL/publication status.

Before committing, the nine-file 129-case run, backend lint and build passed again. A focused credential-pattern scan found no matches in the five release files; this is not a comprehensive secret audit of the unrelated working tree. The Git index was checked against the exact approved file list, and the staged whitespace check passed.

[Isolated CI run 37198444984](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37198444984) completed successfully for the exact release SHA before production promotion. Its disposable pgvector/PostgreSQL 16 database applied all 21 migrations successfully. All 78 backend files passed, totaling 922 tests. The twelve frontend/native test commands passed 332 tests with zero failures, followed by frontend typecheck, lint and a successful 22-page production build. There are 1,254 unique tests in this CI run; the separate 129-case local subset is not added to that number.

The passing commit was promoted with a non-force atomic push to `main` and `codex/readability-accessibility`. Remote verification showed both branches and `codex/mvp-acceptance-ci` at the exact release SHA. The subsequent [main run 37198604033](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37198604033) and [deployment-branch run 37198604021](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37198604021) also completed successfully.

Railway deployment `699716eb-913c-4790-ae31-ca511c9a47e6` became Active, displayed Deployment successful, linked to the exact GitHub commit and passed its `/api/health` deployment healthcheck. Vercel deployment `GzG1HDd1M1pPBxvnkfuBCuVuctx4` displayed Ready, Production, the same commit and the public `herbalaiph.vercel.app` domain. No provider variables, database connection targets or hosting plans were changed.

### Live HTTP checks

Eighteen read-only requests/assertions completed successfully at 19:26:44 Philippine time. The normalization sequence was sent only after the patched Railway deployment was confirmed active.

| Check | Observed result |
| --- | --- |
| Blank-category first request, then ordinary catalog, through Railway and the Vercel API proxy | Both returned the same 38 record IDs and totals. |
| Padded, uppercase All through both routes | Matched the ordinary catalog IDs and total. |
| Padded Digestive first request, then canonical Digestive through both routes | Returned nonempty matching Digestive IDs/totals, with no other category. |
| Padded All with DOH filter through both routes | Nonempty result containing only DOH-listed, verified, PUBLISHED records. |
| Backend health | 200. |
| Repeated category and repeated search parameters | 400 for each request. |
| Nonexistent herb detail | 404. |
| Anonymous Suggestions and audit-log APIs | 401 for each request. |

### Live browser checks and limits

Mercado Chrome restored the existing Mercado Kevin contributor session. Library showed 38 records; selecting Digestive produced one Kalingag record and its detail dialog opened with the existing educational limitation text and two references. Returning to All restored 38 records. Reload retained the signed-in account and populated catalog. The protected Suggestions page opened and My Submissions loaded six existing records without changing any submission or publishing content. The previously recorded legacy `awdsawd` approval remains a separate provenance follow-up, not a new public Library record.

Screenshot saved outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/library-95cf807-live-20261004.jpg`.

No new failure was reproduced in this bounded release smoke test. Gina/admin Chrome was not connected during this run, so no new authenticated admin write, moderation/audit event or two-account Messenger test is claimed. Mail work remains excluded as requested. The remaining 28 source records and additional warning attribution still require the documented content review. Physical-device and real-participant checks retain their previous evidence limits; browser checks are not a replacement for them.

The five-file release, including the pre-release reports, is already pushed. This post-release evidence appendix is saved locally after validation and is not part of deployed commit `95cf807`; unrelated working-tree changes remain untouched.
