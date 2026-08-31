# Herbal AI Verification and Validation Report

## Testing team and contribution allocation

| Member | Role in verification | Contribution |
|---|---|---:|
| Kevin C. Mercado | Test planning, backend/API verification, integration review, documentation consolidation | 50% |
| Devon Descipulo | Backend test support, defect investigation, API/database verification | 25% |
| Eumar Cabaluna | Frontend verification, responsive/UI checks, usability-test support | 25% |
| **Total** |  | **100%** |

Each allocation is above 20% and should match the team's actual documented work.

## Baseline execution record

| Check | Result | Evidence |
|---|---|---|
| Backend automated tests | **28 passed / 28 total** | Vitest run on 31 August 2026 |
| Frontend lint | **Passed** | ESLint run on 31 August 2026 |
| Backend lint | **Passed** | ESLint run on 31 August 2026 |
| Backend TypeScript compilation | **Passed** | `npx tsc --noEmit` run on 31 August 2026 |
| Frontend TypeScript compilation | **Passed** | `npx tsc --noEmit` run on 31 August 2026 |
| Frontend production build | **Passed** | `npm run build`; 18 routes generated on 31 August 2026 |
| Production deployment | Pending | Requires deployed URL, logs, health checks, and rollback evidence |
| Performance/load testing | Pending | Requires timed and concurrent-user test results |

## Automated verification scope

The executed automated suite contains 28 passing tests in 5 files:

| Test suite | Evidence covered |
|---|---|
| `tests/auth.test.ts` | Validation, invalid credentials, and unauthorized session rejection |
| `tests/herbs.test.ts` | Herb listing, DOH filter, pagination, search, and unknown-herb handling |
| `tests/suggest.test.ts` | Authentication checks for suggestion submission, listing, approve, and reject actions |
| `tests/chat.test.ts` | Chat authentication enforcement |
| `tests/system-features.test.ts` | Chat behavior, herb search, forum listing, message users, notifications, dashboard statistics, and audit-log RBAC |

These tests establish a backend API baseline. They do not replace browser-based workflow, external email/OAuth, accessibility, performance, deployment, or UAT evidence.

## Release gates

The project must not be marked **Accepted** until:

1. Every SRS requirement has a traceability row.
2. Every functional requirement has a repeatable test and recorded result.
3. Pending notification and audit-log workflows are verified end to end.
4. Performance targets PR-001 through PR-005 have measured results.
5. UAT participants, scenarios, defects, corrections, and sign-off are recorded.
6. Deployment, backup, restore, and rollback procedures have been executed once.

## Defect severity

- **Critical:** security, data loss, broken authentication, or unusable deployment.
- **Major:** a required feature fails or produces unsafe/inaccurate behavior.
- **Minor:** workaround exists; usability or cosmetic issue.

## Current conclusion

The code-quality baseline is healthy: backend tests, lint, TypeScript checks, and the frontend production build pass. The project is not yet fully verified because traceability, UAT, performance, deployment, notification, and administrative audit evidence remain incomplete.
