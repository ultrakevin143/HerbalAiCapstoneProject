# Herbal AI Release and Defense Readiness Checklist

## Evidence gates

| Gate | Required proof | Status |
|---|---|---|
| Code baseline | Backend tests, lint, type checks, and frontend production build pass | Complete |
| Requirements traceability | Every SRS requirement has an evidence row and reviewer outcome | In progress |
| End-to-end workflows | Suggestions, audit log, notifications, messaging, email, and OAuth evidence recorded | Pending |
| UAT | At least 5 participant records and issue resolutions recorded | Pending |
| Performance | PR-001 to PR-005 results recorded | Pending |
| Deployment | URL, health checks, TLS, logs, and rollback result recorded | Blocked — Docker/target host unavailable locally |
| Recovery | Successful database backup and restore test recorded | Blocked — requires running PostgreSQL container or managed database |
| Documentation | SRS/SPMP updated to current evidence; supporting documents complete | In progress |

## Defense-day checklist

1. Use dedicated contributor/admin accounts; never expose personal accounts or secrets.
2. Confirm the database has the 10 DOH plants and one safe demo suggestion.
3. Open two browser profiles for notifications and messaging.
4. Run `npm test` before the defense and retain output/screenshot.
5. Verify deployed URL, HTTPS certificate, and `/api/test` response.
6. Prepare screenshots/recordings for Gemini, email, and Google OAuth in case of network disruption.
7. Label workflows without recorded evidence as pending verification.

## Completion decision

Final acceptance requires every gate to be **Complete** or an adviser/panel-approved exception.
