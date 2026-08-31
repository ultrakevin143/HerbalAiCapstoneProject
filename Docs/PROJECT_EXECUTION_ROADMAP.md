# Herbal AI Project Execution Roadmap

## Current baseline — 31 August 2026

The application is in the **Integration, Stabilization, Testing, and Deployment Preparation** phase.

Verified evidence from the current repository:

- Backend automated tests: **28/28 passed** across 5 test files.
- Frontend lint: **passed**.
- Backend lint: **passed**.
- TypeScript compilation: **passed** for backend and frontend.
- Frontend production build: **passed**; 18 application routes generated.
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

1. Correct stale SRS statements that say automated tests do not exist.
2. Correct the README test count and testing description.
3. Create `Docs/REQUIREMENTS_TRACEABILITY_MATRIX.md`.
4. Create `Docs/VERIFICATION_VALIDATION_REPORT.md`.
5. Define measurable acceptance criteria for all functional, usability, security, and performance requirements.
6. Complete the SDD and production deployment evidence.

## Documentation correction log

The current SRS contains two statements that are now stale: it says no automated test suite exists and that frontend lint still has errors. Repository evidence on 31 August 2026 shows 28 backend tests passing, frontend lint passing, both TypeScript checks passing, and a successful frontend production build. Update the next SRS revision during Phase 4; this log preserves the evidence until the controlled DOCX revision is made.

## Status vocabulary

Use only: **Not Started**, **In Progress**, **Implemented**, **Verified**, and **Accepted**. “Implemented” means code exists; “Verified” means test evidence exists; “Accepted” means the responsible reviewer has approved the result.
