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
