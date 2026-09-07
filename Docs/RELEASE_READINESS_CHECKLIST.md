# Herbal AI Release and Defense Readiness Checklist

## Evidence gates

| Gate | Required proof | Status |
|---|---|---|
| Code baseline | Backend tests, lint, type checks, and frontend production build pass | Complete |
| Requirements traceability | Every SRS requirement has an evidence row and reviewer outcome | In progress |
| End-to-end workflows | Suggestions, audit log, notifications, messaging, email, and OAuth evidence recorded | Complete for recorded local workflows; remaining CRUD/profile variants stay in traceability backlog |
| UAT | At least 5 participant records and issue resolutions recorded | Pending — script/form/unsigned summary prepared in `UAT_TEST_SCRIPT.md`, `UAT_RESULT_FORM.md`, and `UAT_SUMMARY.md`; 0/5 participants recorded |
| Performance | PR-001 to PR-005 results recorded | In progress — streamed PR-003 passes locally; PR-001 is cold-start unstable, PR-004 fails, and PR-005 is not accepted on staging |
| Deployment | URL, health checks, TLS, logs, and rollback result recorded | Blocked — Docker/target host unavailable locally |
| Recovery | Successful database backup and restore test recorded | Blocked — requires running PostgreSQL container or managed database |
| Documentation | SRS/SPMP updated to current evidence; supporting documents complete | In progress |

## Defense-day checklist

1. Use dedicated contributor/admin accounts; never expose personal accounts or secrets.
2. Confirm the database has the 10 DOH plants and one safe demo suggestion.
3. Open two browser profiles for notifications and messaging.
4. Run `npm test` before the defense and retain output/screenshot.
5. For the currently selected local demo, verify `http://localhost:3000`, library database retrieval and backend health. Public URL/HTTPS verification is deferred with deployment; it is not marked passed.
6. Prepare screenshots/recordings for Gemini, email, and Google OAuth in case of network disruption.
7. Label workflows without recorded evidence as pending verification.

## Completion decision

Local rehearsal passed again on 7 September after startup warm-up. Dated browser evidence also covers authenticated suggestions, comments/community, Messenger, notifications, admin ban/unban, logout, Google OAuth and delivered recovery links. Participant UAT, remaining CRUD/profile variants, staging performance, deployment/recovery and reviewer sign-off are still pending.

Final acceptance requires every gate to be **Complete** or an adviser/panel-approved exception.
