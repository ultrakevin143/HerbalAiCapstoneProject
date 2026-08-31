# Herbal AI Test Execution Log

## Automated test run

| Field | Record |
|---|---|
| Run ID | AUTO-2026-08-31-01 |
| Date | 31 August 2026 |
| Environment | Local development environment; Node.js/Vitest |
| Command | `npm test` in `herbalaibackend` |
| Result | **28 passed / 28 total; 5 test files passed** |
| Result classification | Pass |
| Notes | PostgreSQL SSL-mode compatibility warnings were emitted; no test failed. |

## Deployment preflight record

| Field | Record |
|---|---|
| Run ID | DEPLOY-PREFLIGHT-2026-08-31-01 |
| Date | 31 August 2026 |
| Root Compose `.env` | Not present locally; `.env.example` is available and root `.env` is ignored by Git |
| Docker availability | Not installed/available in this local environment |
| Compose syntax check | Not executed because Docker is unavailable |
| JWT Compose control | Verified statically: `docker-compose.yml` requires explicit `JWT_SECRET` and `JWT_REFRESH_SECRET`; no predictable fallback secret remains |
| Result | Blocked — requires a Docker-enabled staging/production host and configured environment values |
| Next action | Copy `.env.example` to root `.env` on the target host, set real credentials, then execute the deployment and recovery checks in `RELEASE_READINESS_CHECKLIST.md`. |

## Manual end-to-end test record

Copy one row per execution. Store screenshots, recording links, or API logs in the Evidence column.

| Run ID | Test case | Tester | Preconditions | Expected result | Actual result | Evidence | Defect ID | Status | Date |
|---|---|---|---|---|---|---|---|---|---|
| MAN-001 | TC-SUG-04 |  | Two accounts: contributor and admin; email and notification channels configured | Contributor receives status-change notification after approval/rejection |  |  |  | Not Run |  |
| MAN-002 | TC-ADMIN-04 |  | Admin account and auditable action available | Audit log stores actor, timestamp, action, and target |  |  |  | Not Run |  |
| MAN-003 | TC-MSG-03 |  | Two signed-in users in separate browser sessions | Recipient receives message without reload |  |  |  | Not Run |  |
| MAN-004 | TC-AUTH-07 |  | New test email mailbox | Verification link enables account privileges |  |  |  | Not Run |  |
| MAN-005 | TC-AUTH-08 |  | Test email mailbox | Password-reset link changes password once; expired link fails |  |  |  | Not Run |  |
| MAN-006 | TC-AUTH-09 |  | Google OAuth test client configured | OAuth callback signs in/creates correct account |  |  |  | Not Run |  |
| MAN-007 | TC-UX-02 |  | Browser responsive mode | Core pages work at 320, 768, 1024, and 1440 px |  |  |  | Not Run |  |
| MAN-008 | TC-A11Y-01 |  | Browser accessibility inspector | Meaningful herb images have descriptive alt text |  |  |  | Not Run |  |

## UAT session record

| Field | Record |
|---|---|
| Session ID | UAT-___ |
| Participant role | Guest / Contributor / Administrator |
| Device and browser |  |
| Tasks attempted | Sign up/sign in; find herb; ask Dr. Ai; submit suggestion; forum/message as applicable |
| Completion without assistance |  |
| Issues observed |  |
| Overall rating (1–5) |  |
| Participant sign-off |  |
| Tester/date |  |

## Defect register

| Defect ID | Severity | Requirement/Test | Description | Owner | Status | Retest evidence |
|---|---|---|---|---|---|---|
| DEF-___ | Critical / Major / Minor |  |  |  | Open / Fixed / Retested / Closed |  |
