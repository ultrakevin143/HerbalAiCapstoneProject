# Herbal AI Release and Defense Readiness Checklist

## Evidence gates

| Gate | Required proof | Status |
|---|---|---|
| Code baseline | Backend tests, lint, type checks, and frontend production build pass | Complete — 176/176 backend tests and 20-route frontend build passed on 22 September 2026 |
| Requirements traceability | Every SRS requirement has an evidence row and reviewer outcome | In progress |
| End-to-end workflows | Suggestions, audit log, notifications, messaging, email, OAuth, profile and administration evidence recorded | Complete for the recorded local scope, including herb and knowledge-base CRUD lifecycle checks |
| UAT | At least 5 participant records and issue resolutions recorded | Pending — script/form/unsigned summary prepared in `UAT_TEST_SCRIPT.md`, `UAT_RESULT_FORM.md`, and `UAT_SUMMARY.md`; 0/5 participants recorded |
| Performance | PR-001 to PR-005 results recorded | Complete for defense staging scope — post-deploy 20-request sample recorded in `DEFENSE_READINESS_COMPLETION_2026-09-22.md`; not a high-concurrency production certification |
| Deployment | URL, health checks, TLS, logs, and rollback result recorded | Staging complete on Vercel/Railway with HTTPS, health, CORS, security-header and browser evidence; destructive rollback execution remains an operational limitation |
| Recovery | Successful database backup and restore test recorded | Complete for application-table data — 17 tables/169 rows restored and compared in an isolated Neon schema; full provider-level disaster restore remains recommended |
| Documentation | SRS/SPMP updated to current evidence; supporting documents complete | Complete locally — four formal DOCX files and the 15-slide defense deck passed application-level visual QA; adviser/panel acceptance remains external |

## Defense-day checklist

1. Use dedicated contributor/admin accounts; never expose personal accounts or secrets.
2. Confirm the database has the 10 DOH plants and one safe demo suggestion.
3. Open two browser profiles for notifications and messaging.
4. Open `Herbal_AI_Capstone_Defense_v1.pptx`, confirm all 15 slides, and run `npm test` before the defense; retain the actual test output or screenshot.
5. Verify both the local fallback at `http://localhost:3000` and the live Vercel/Railway staging URLs before presenting.
6. Prepare screenshots/recordings for Gemini, email, and Google OAuth in case of network disruption.
7. Label workflows without recorded evidence as pending verification.

## Completion decision

Local responsive browser rehearsal, live staging deployment, security review, staging performance, and isolated database restore passed on 22 September. Dated browser evidence also covers authenticated suggestions, comments/community, Messenger, notifications, admin workflows, profile updates, logout, Google OAuth and delivered recovery links. Five-participant UAT, physical-device sign-off, and adviser/reviewer approval remain pending.

Final acceptance requires every gate to be **Complete** or an adviser/panel-approved exception.
