# Accessibility and Performance Audit — 4 September 2026

## Executive result

- **Rendered structural accessibility:** 72/72 rule checks passed across 9 representative routes after remediation (100% of the tested structural rules).
- **Performance requirements:** 2/5 have provisional local browser passes and 3/5 remain failed or unaccepted. This is **40% provisionally meeting the SRS performance targets**, not final production acceptance.
- **Code verification:** frontend lint, separate TypeScript checking, and the 18-route production build passed after the accessibility changes.

## Accessibility scope and method

The production build was inspected in Chrome on `/`, `/library`, `/about`, `/signin`, `/chat`, `/community`, `/messenger`, `/suggest`, and `/admin`. Each route was checked for:

1. one visible H1;
2. one main landmark;
3. sequential visible heading levels;
4. `alt` attributes on visible images;
5. accessible names for visible form fields;
6. accessible names for visible buttons;
7. accessible names for visible links; and
8. duplicate element IDs.

The final run found no failure in these 8 structural rule groups on any of the 9 routes. Across the main authenticated/public run, all 21 visible images had `alt` attributes and no visible field, button, or link lacked an accessible name.

### Remediations made

- Corrected skipped heading levels on Home, About, Library, and Dr.Ai.
- Normalized generated Dr.Ai section headings to H3 beneath the page's H1/H2 structure.
- Added explicit accessible names to Community search, Library search/category filter, and Messenger conversation search.
- Added a main landmark to Library and all authentication flow pages.

### Accessibility boundary

The 100% figure applies only to the listed structural rules and routes. It is not a full WCAG certification. Formal color-contrast measurement, complete keyboard-only traversal, screen-reader testing, zoom/reflow, and mobile breakpoint testing remain separate acceptance work.

## Performance environment and method

- Local production frontend and backend processes on Windows.
- Remote PostgreSQL database and configured external services.
- Reusable runner: `scripts/run-local-load-test.mjs`.
- Stages: 10, 50, 100, 250, and 500 simultaneous requests.
- Per-request timeout: 15 seconds.
- Safety stop: stop an endpoint after more than 5% errors or p95 reaches the timeout.
- Known-result requests recorded: 3,730; errors: 127, all from the 500-request authenticated stage.

## Load results

| Endpoint | Concurrency | Requests | p50 | p95 | Errors |
|---|---:|---:|---:|---:|---:|
| `/api/test` | 10 | 10 | 62.5 ms | 67.1 ms | 0% |
| `/api/test` | 50 | 50 | 88.9 ms | 109.1 ms | 0% |
| `/api/test` | 100 | 100 | 127.8 ms | 163.8 ms | 0% |
| `/api/test` | 250 | 250 | 451.9 ms | 517.2 ms | 0% |
| `/api/test` sustained repeat | 500 | 500 | 2,314.9 ms | 2,433.8 ms | 0% |
| `/api/herbs?limit=12` (warmed cache) | 10 | 10 | 12.9 ms | 17.7 ms | 0% |
| `/api/herbs?limit=12` (warmed cache) | 50 | 50 | 36.4 ms | 67.8 ms | 0% |
| `/api/herbs?limit=12` (warmed cache) | 100 | 100 | 85.7 ms | 141.5 ms | 0% |
| `/api/herbs?limit=12` (warmed cache) | 250 | 250 | 180.8 ms | 329.1 ms | 0% |
| `/api/herbs?limit=12` (warmed cache) | 500 | 500 | 574.8 ms | 884.5 ms | 0% |
| `/api/auth/me` | 10 | 10 | 2,574.7 ms | 3,157.7 ms | 0% |
| `/api/auth/me` | 50 | 50 | 984.0 ms | 1,562.4 ms | 0% |
| `/api/auth/me` | 100 | 100 | 1,615.7 ms | 2,867.1 ms | 0% |
| `/api/auth/me` | 250 | 250 | 3,706.7 ms | 6,798.4 ms | 0% |
| `/api/auth/me` | 500 | 500 | 11,475.3 ms | 15,095.5 ms | 25.4% |

The 500-request health stage initially produced 663.9 ms p95, then rose to 2,433.8 ms during the sustained repeat. The report uses the repeat value to avoid presenting only the more favorable run. The cached herb endpoint remained below one second p95 with no failures at 500 requests.

Five warmed homepage HTTP-response samples ranged from 6.4 to 19.0 ms (median 6.9 ms). This supports a local server-response pass but does not substitute for browser Largest Contentful Paint measurement. After load, the frontend used approximately 85.4 MB working set and the backend approximately 95.3 MB.

## SRS performance decision

| Requirement | Local result | Decision |
|---|---|---|
| PR-001 landing page <= 3 s | Initial Chrome run passed at 2,532 ms p95, but later cold-profile repeats ranged from 3,588–4,552 ms p95 | Fail / Unstable |
| PR-002 herb search <= 2 s | Rendered Lagundi filtering p95 32.1 ms over 10 samples | Provisional Pass |
| PR-003 Dr.Ai begins <= 1.5 s for 95% | After streaming remediation, first grounded visible text p95 529.9 ms | Provisional Pass |
| PR-004 95% standard auth/data API <= 1 s | Warm `/api/auth/me` passes through 100 concurrent requests, but p95 is 1,078.4 ms at 250 and 2,219.8 ms at 500 | Fail |
| PR-005 500 concurrent users | Warm `/api/auth/me` reached 500 with 0% errors, but staging latency acceptance is not met/approved | Fail / Improved |

## `/api/auth/me` bottleneck profile

Run `PERF-PROFILE-2026-09-04-01` isolated the authenticated endpoint into JWT verification, database connection, warm database round trip, repository query, and full HTTP request. It used the local production API with the configured remote PostgreSQL database and a valid administrator session.

| Component | Samples | p50 | p95 |
|---|---:|---:|---:|
| JWT verification | 10,000 | 1.8 ms | 4.2 ms |
| Fresh PostgreSQL connection | 3 | 2,206.5 ms | 2,211.1 ms |
| Warm PostgreSQL `SELECT 1` | 15 | 265.3 ms | 278.5 ms |
| Prisma `findUserById` | 10 | 284.9 ms | 3,067.5 ms |
| Full `/api/auth/me` HTTP request | 10 | 284.2 ms | 2,539.0 ms |
| Server-reported request duration | 10 | 275.9 ms | 2,435.5 ms |

At the median, JWT verification accounts for about **0.6%** of server time and the remote database path accounts for approximately **99%**. A warm network/database round trip alone costs about 265 ms, while establishing a fresh PostgreSQL connection costs about 2.2 seconds. The matching multi-second spikes in the repository and HTTP measurements show that connection establishment/re-establishment is the main tail-latency risk. The user lookup is a single indexed `findUnique` query, so application computation and query complexity are not the primary bottlenecks.

The concurrent Prisma batch figures were not used to estimate production throughput because simultaneous identical `findUnique` calls may be combined by Prisma's request batching. The earlier HTTP load result remains the authoritative PR-004/PR-005 evidence. Reusable profiler: `scripts/profile-auth-me.mjs`.

### Bounded pool remediation (5 September 2026)

Run `PERF-POOL-2026-09-05-01` replaced implicit driver defaults with an environment-controlled PostgreSQL pool: minimum 2 warm connections, maximum 10 connections, 5-minute idle retention, 10-second connection timeout, 30-minute maximum lifetime, and TCP keepalive. Production SQL query logging was disabled while error/warning logging remains enabled. Slow-request records now include pool `total`, `idle`, `waiting`, `connected`, `removed`, and `errors` values; a configurable periodic metrics event is also available.

The pool instrumentation was verified after a real query (`total=1`, `idle=1`, `waiting=0`, `connected=1`, `errors=0`). Backend compilation and all 33 automated tests passed. A repeated 500-request authenticated stage still failed acceptance: p50 3,067.1 ms, p95 9,172.6 ms, and 31.8% client transport errors. Therefore, bounded in-process pooling improves observability and connection reuse but **does not close DEF-PERF-01 or PR-004/PR-005**. The remaining structural limit is the approximately 265 ms remote database round trip through only 10 safe connections; deployment near the database and/or a production transaction pooler is required before retesting.

### Distinct-user authenticated load (5 September 2026)

Run `PERF-DISTINCT-2026-09-05-01` created 500 isolated, verified contributor accounts under a unique reserved load-test prefix, issued a separate JWT for each account, and queried `/api/auth/me` once per user at each stage. The runner deleted all 500 exact user IDs afterward. This removes repeated-user cache or identical-query batching as an explanation for the earlier result.

| Distinct users | Successes | Errors | p50 | p95 | Throughput |
|---:|---:|---:|---:|---:|---:|
| 10 | 10 | 0 | 2,520.7 ms | 2,589.5 ms | 3.8/s |
| 50 | 50 | 0 | 831.1 ms | 1,361.7 ms | 35.6/s |
| 100 | 100 | 0 | 1,493.7 ms | 2,823.0 ms | 33.9/s |
| 250 | 250 | 0 | 3,835.0 ms | 6,779.8 ms | 34.6/s |
| 500 | 335 | 165 (33.0%) | 2,969.3 ms | 8,851.3 ms | 51.0/s |

All 165 failures at the 500-user stage were client transport `TypeError` failures rather than HTTP application responses. The API remained responsive after the run. The result confirms both PR-004 and PR-005 remain failed in the current local-API/remote-database topology. Reusable runner: `scripts/run-distinct-user-load-test.mjs`.

### Short-lived authenticated-user cache (5 September 2026)

Run `PERF-CACHE-2026-09-05-01` added a bounded 5-second cache for `findUserById` session profiles (maximum 2,000 entries) with in-flight request coalescing. Application-managed ban/unban, email-verification, and password changes invalidate the affected user immediately. A real API security test warmed a temporary user's profile, banned the account through the administrator endpoint, and verified that the next cached-token `/api/auth/me` request returned HTTP 403. The temporary account was deleted.

| Warmed session requests | Successes | Errors | p50 | p95 |
|---:|---:|---:|---:|---:|
| 10 | 10 | 0 | 23.6 ms | 44.5 ms |
| 50 | 50 | 0 | 309.8 ms | 324.3 ms |
| 100 | 100 | 0 | 211.8 ms | 381.9 ms |
| 250 | 250 | 0 | 598.8 ms | 1,078.4 ms |
| 500 | 500 | 0 | 1,397.1 ms | 2,219.8 ms |

Compared with the pre-cache repeated-session run, the 500-request error rate improved from 31.8% to **0%** and p95 improved from 9,172.6 ms to **2,219.8 ms** (75.8% lower). PR-004 passes through 100 concurrent warmed session requests but remains above one second at 250 and 500. PR-005 reliability is provisionally improved, but it is not closed because its agreed latency threshold still needs staging acceptance. First-time distinct-user requests remain database-bound by design.

This invalidation guarantee applies to mutations performed through this API instance. A horizontally scaled deployment must use shared cache invalidation (for example Redis pub/sub) or keep the cache disabled (`AUTH_USER_CACHE_TTL_MS=0`) until that mechanism exists.

### Browser performance measurements (5 September 2026)

Run `PERF-BROWSER-2026-09-05-01` used the production frontend/backend builds in Google Chrome headless at 1440x900. Browser cache was disabled for five homepage samples. Ten library searches measured the time from entering `Lagundi` until the filtered card was present. Three authenticated Dr.Ai prompts measured submission to API response start and visible completed response.

| Browser metric | Samples | p50 | p95 | Requirement result |
|---|---:|---:|---:|---|
| Homepage Largest Contentful Paint | 5 | 196.0 ms | 2,532.0 ms | PR-001 provisional pass (<=3 s) |
| Homepage First Contentful Paint | 5 | 196.0 ms | 2,532.0 ms | Supporting evidence |
| Homepage load event | 5 | 180.9 ms | 931.8 ms | Supporting evidence |
| Rendered `Lagundi` search | 10 | 27.0 ms | 32.1 ms | PR-002 provisional pass (<=2 s) |
| Dr.Ai API response start | 3 | 18,774.3 ms | 18,946.1 ms | PR-003 fail (<=1.5 s) |
| Dr.Ai visible response | 3 | 18,847.7 ms | 19,013.0 ms | PR-003 fail (<=1.5 s) |

All three Dr.Ai requests returned HTTP 200, but the UI cannot begin rendering the answer until the complete JSON response arrives. A diagnostic request reported 738.2 ms embedding, 276.1 ms retrieval, and 10,859.2 ms generation within an 11,879.2 ms server request. Generation represented **91.4%** of that request, confirming the principal remediation is model-output streaming and/or a faster generation configuration rather than database retrieval optimization.

The visible Windows computer-control bridge was unavailable after its required retry, so the measurements used a clean headless Chrome profile. This is valid browser instrumentation but remains local evidence; final acceptance should be repeated against the deployed staging URL under the agreed network/device profile. Reusable runner: `scripts/run-browser-performance-test.mjs`.

### Dr.Ai streaming remediation (5 September 2026)

Run `PERF-STREAM-2026-09-05-01` added an authenticated SSE endpoint while retaining the original JSON endpoint for compatibility. The frontend now renders chunks progressively, handles one refresh-token retry, and presents a truthful source-derived lead-in while Gemini expands the database material. Explicit verified-herb questions use the cached herb catalog directly instead of paying for an unnecessary embedding/vector search. The low-latency model order is configurable through `DR_AI_CHAT_MODELS`, and output is capped at 1,024 tokens to keep answers focused and cost-bounded.

| Streamed Dr.Ai metric | Samples | p50 | p95 |
|---|---:|---:|---:|
| API/SSE response start | 3 | 241.8 ms | 458.4 ms |
| First grounded visible text | 3 | 353.8 ms | **529.9 ms** |
| Completed visible answer | 3 | 3,033.1 ms | 3,225.0 ms |

All three responses returned HTTP 200. Compared with the original non-streaming first-visible p95 of 19,013.0 ms, first grounded text improved by **97.2%** and now provisionally passes PR-003 locally. Full-answer completion improved by approximately **83.0%**. The result is intentionally classified as provisional until repeated with a larger prompt set against staging.

Repeated fresh-Chrome runs exposed a separate PR-001 cold-start variance: later five-sample LCP p95 values were 4,552, 3,588, 3,936, and 3,780 ms. The earlier 2,532 ms result is therefore not sufficient to retain a pass; homepage cold-start optimization remains necessary.

## Recommended remediation order

1. **Completed:** profile `/api/auth/me` and separate JWT, connection, query, and total request timing.
2. **Completed locally:** configure and instrument bounded database pooling. A production transaction pooler and API/database colocation remain deployment actions.
3. **Completed:** test with 500 distinct staged users instead of one repeated administrator token.
4. **Completed for the single API instance:** add short-lived user-profile caching and request coalescing with immediate invalidation on application-managed security changes. Shared invalidation remains required before horizontal scaling.
5. **Completed locally:** measure Chrome LCP, rendered search, and Dr.Ai response start. Repeat on staging after deployment.
6. **Completed locally:** stream grounded Dr.Ai responses and retest first-visible latency. Final staging acceptance and homepage cold-start remediation remain.
