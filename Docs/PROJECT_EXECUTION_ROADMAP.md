# Herbal AI Project Execution Roadmap

## Current baseline — 7 September 2026

The application is in the **Integration, Stabilization, Testing, and Deployment Preparation** phase.

Verified evidence from the current repository:

- Backend automated tests: **83/83 passed** across 14 test files on 8 September 2026.
- Frontend lint: **passed**.
- Backend lint: **passed**.
- Production builds and TypeScript checks: **passed** for backend and frontend.
- Frontend production build generated **18 application routes**.
- Functional API audit: **34/34 exercised checks passed**.
- Browser checklist: **13/13 leaf checks passed**, including Google OAuth and grounded Dr. Ai responses.
- Docker, Prisma migrations, CI workflow, deployment scripts, and deployment guide: present.

## Phases

| Phase | Objective | Exit evidence | Status |
|---|---|---|---|
| 1. Baseline and consistency | Make project status match repository evidence | Updated status register and test baseline | Complete |
| 2. Traceability and acceptance | Map every requirement to implementation, test, and pass criteria | Requirements traceability matrix | In progress |
| 3. Verification and validation | Produce formal QA evidence, UAT records, defect log, and performance results | V&V report and signed test evidence | In progress |
| 4. Technical documentation | Complete SDD, installation, deployment, privacy, backup, and maintenance documentation | Approved technical document set | Complete |
| 5. Final readiness | Verify deployment, complete user manual, defense artifacts, and final consistency review | Release checklist and defense package | In progress |

## Priority backlog

7 September pair: startup now warms the configured database pool and Prisma query path before accepting traffic. One measured first authenticated request improved from 3503.9ms to 535.2ms, but a bounded distinct-user run still failed the <=1s p95 target at 100 users (2413.4ms, zero errors). Performance remains In Progress. Five-participant UAT script/result/summary documents are ready, but UAT remains Not Started until real participant evidence exists. See `PERFORMANCE_COLD_START_DIAGNOSIS_2026-09-07.md` and `UAT_TEST_SCRIPT.md`.

Latest performance implementation: bounded 5ms/100-ID batching reduces cold session-lookup query volume without changing cache TTL or mutation invalidation. Targeted race/mapping/failure tests and full 77-test suite passed. A sequential 50/100-user comparison improved p95 to 467.5/572.6ms, but larger/cold runs still fail acceptance. Both localhost and explicit IPv4 reproduced 500-user connection refusals. A larger listen-backlog experiment was reverted because it did not resolve failures. See `SESSION_LOOKUP_BATCHING_2026-09-06.md`; PR-004 remains open.

Local browser acceptance now covers every listed functional traceability row, including full herb CRUD and full KB CRUD with live Dr. Ai retrieval. Responsive workflows and 26/26 automated mobile accessibility scans pass within scope. Physical-device/full WCAG, participant UAT, staging capacity and deployment remain separate.

Staging preparation: frontend Compose URLs now flow into Docker build arguments, runtime retains Next image configuration, and dotenv variants are excluded from the frontend image. The deployment script now fails on errors, applies versioned migrations before replacing application containers, requires backup acknowledgement, retains old images and performs bounded internal health checks. All 15 static/mocked deployment checks and Bash syntax checks passed. Docker is unavailable locally; actual container builds, migrations and restore drills remain pending. VPS/domain purchase and live staging are deferred at the user's request; prioritize local presentation workflows and UAT.

Historical performance runs remain available in their dated reports. The current result is `PERFORMANCE_COLD_START_DIAGNOSIS_2026-09-07.md`: startup warm-up materially improves one first-request sample, while 100-user p95 and 500-user capacity remain unaccepted.

1. Complete remaining accessibility/admin-dialog acceptance. Chrome-emulated core workflows are verified; physical-device testing is deferred in favor of emulation at Kevin's request and remains unverified.
2. Remediate PR-001 cold-start and PR-004 high-concurrency latency, then repeat local browser/load measurements—including the provisionally passing streamed PR-003—on staging; full WCAG acceptance remains pending.
3. Conduct and record UAT with at least five participants.
4. Execute production deployment, TLS, rollback, and database backup/restore proof (deferred).
5. Complete final reviewer sign-off, clean generated artifacts, and create a stable release commit/tag.

## Documentation correction log

Earlier SRS revisions contained stale statements saying no automated suite existed and frontend lint still failed. Current repository evidence on 8 September 2026 shows 83 backend tests passing, frontend/backend lint and builds passing, a 34-check API audit, dated browser workflows and 26/26 automated mobile accessibility scans. Later revisions must preserve the latest baseline while labeling older numbers as historical.

## Status vocabulary

Use only: **Not Started**, **In Progress**, **Implemented**, **Verified**, and **Accepted**. “Implemented” means code exists; “Verified” means test evidence exists; “Accepted” means the responsible reviewer has approved the result.
