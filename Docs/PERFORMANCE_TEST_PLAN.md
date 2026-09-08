# Herbal AI Performance Test Plan

## Targets from the SRS

| Test case | Target | Metric |
|---|---|---|
| TC-PERF-01 | Landing page load <= 3 seconds | Largest Contentful Paint / page-load time |
| TC-PERF-02 | Herb search <= 2 seconds | API response time and rendered-results time |
| TC-PERF-03 | Dr. Ai begins rendering <= 1.5 seconds for 95% of prompts | Time to first streamed content |
| TC-PERF-04 | 95% of normal authentication/data API calls <= 1 second | p95 response time |
| TC-PERF-05 | 500 concurrent users | Error rate, p95 latency, connection stability |

## Method

1. Use a staging deployment with production-like database data and environment settings.
2. Run browser checks for landing page and search on a stable network; record device, browser, and network conditions.
3. Use an HTTP load-testing tool against authenticated and unauthenticated API endpoints. Start with 10, 50, 100, 250, then 500 concurrent virtual users.
4. Measure p50, p95, error rate, CPU, memory, database connections, and WebSocket disconnects for each stage.
5. Do not use real patient data or production credentials.

## Result record

| Run ID | Endpoint/workflow | Concurrent users | Requests | p50 | p95 | Error rate | Target met | Evidence |
|---|---|---:|---:|---:|---:|---:|---|---|
| PERF-___ |  |  |  |  |  |  |  |  |
| PERF-2026-09-04-01 | `/api/test` sustained repeat | 500 | 500 | 2314.9 ms | 2433.8 ms | 0% | Capacity only; no 1 s health target defined | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md` |
| PERF-2026-09-04-02 | `/api/herbs?limit=12` warmed cache | 500 | 500 | 574.8 ms | 884.5 ms | 0% | Yes for cached API response | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md` |
| PERF-2026-09-04-03 | `/api/auth/me` | 500 | 500 | 11475.3 ms | 15095.5 ms | 25.4% | **No** | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md` |
| PERF-2026-09-07-01 | `/api/auth/me`, distinct users after startup warm-up | 10 / 50 / 100 | 10 / 50 / 100 | 318.4 / 455.7 / 172.7 ms | 322.7 / 468.3 / 2413.4 ms | 0% | Pass at 10/50; **No at 100** | `Docs/PERFORMANCE_COLD_START_DIAGNOSIS_2026-09-07.md` |
| PERF-2026-09-07-02 | Homepage, fresh Chrome contexts after hydration-boundary refactor | 1 per context | 5 | 820 ms | 2636 ms | 0% | **Provisional local pass**; staging/device pending | `Docs/PERFORMANCE_FOLLOWUP_2026-09-07.md` |
| PERF-2026-09-07-03 | `/api/auth/me` immediately after password login | 1 | 3 | 19.7 ms | 37.5 ms | 0% | Yes for primed post-login session path | `Docs/PERFORMANCE_FOLLOWUP_2026-09-07.md` |
