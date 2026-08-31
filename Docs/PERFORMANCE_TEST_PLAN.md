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
