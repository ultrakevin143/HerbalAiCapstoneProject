# Herbal AI Test Execution Log

## External staging public smoke test — 21 September 2026

The Vercel frontend and Railway backend passed public external smoke testing. Six frontend route behaviors, backend health, herb retrieval, exact-origin credentialed CORS, signed-out authorization, timing headers, live library search/details/close behavior, protected Dr. AI redirect and the custom 404 were verified. Authenticated contributor checks then passed for route retention, grounded Lagundi retrieval, Messenger, Community, notification categories, suggestion access, contributor denial from Admin, logout and post-logout redirects. The unknown-herb refusal correctly withheld dosage but displayed unrelated FAQ citations; this is logged as `DEF-AI-02`. Multi-account real-time and administrator mutation checks remain pending. See `EXTERNAL_STAGING_SMOKE_TEST_2026-09-21.md`.

## Defense preflight regression — 21 September 2026

The defense preflight completed with **zero failures**. All required presentation and controlled-document artifacts were present, both environment files existed without exposing values, Google Chrome was available, and the 15-slide PowerPoint deck opened successfully. The full automated gate passed: **173/173 backend tests across 31 files**, backend TypeScript production build, frontend ESLint and TypeScript checks, and the **20-route** Next.js production build. Three expected warnings remain: the local demo services were intentionally stopped on ports 3000 and 5000, and the working tree contains reviewed local changes. Real participant UAT, staging performance, production recovery evidence, physical-device acceptance, and reviewer signatures remain separate human/environment gates.

## Cold-start diagnosis and UAT preparation — 7 September 2026

Bounded layer measurements identified 2.1–4.0s fresh remote database connections and ~260–281ms warm query p95. Warming the configured pool plus Prisma query path before listen reduced one measured first authenticated request from 3503.9ms to 535.2ms; following request p95 was 18.3ms. A socket-only intermediate did not help and was superseded. A 10/50/100 distinct-user run had zero errors and p95 322.7/468.3/2413.4ms, so 100-user acceptance still fails. All 250 diagnostic/load fixtures were cleaned. Backend build/lint and local presentation rehearsal passed. Created controlled five-participant UAT script, result form and unsigned summary; UAT remains Not Started pending real participants. See `PERFORMANCE_COLD_START_DIAGNOSIS_2026-09-07.md` and `UAT_TEST_SCRIPT.md`.

## Bounded session lookup batching — 6 September 2026

Implemented a nominal 5ms/100-ID uncached profile lookup batcher, retaining cache TTL and immediate mutation invalidation. Added mapping, bounds, failure/retry, in-flight isolation and stale-ban race tests. Full backend suite **77/77 across 13 files, 67.95 seconds**; build/lint passed. Smaller sequential 50/100-user p95 samples improved to 467.5/572.6ms, but cold/larger runs still fail. Captured ECONNREFUSED/ETIMEDOUT at 500 clients; a backlog experiment was reverted and explicit IPv4 did not resolve failures. All 1700 load fixtures cleaned. See `SESSION_LOOKUP_BATCHING_2026-09-06.md`; performance is not accepted.

## Chrome mobile regression and performance retest — 6 September 2026

Mobile comments, Messenger, notifications, admin permissions/tabs and logout workflows passed again with temporary-record cleanup. Homepage LCP: 2556/748/692/724/728ms. Distinct-user load: 910 requests, 95 failures at 500 concurrency; automatic safety stop and 500-fixture cleanup passed. Bounded diagnostic follow-up: 160/160 successful requests, 100-fixture cleanup passed; 50/100 concurrency p95 still above 1000ms. Performance remains unaccepted. Load runner gained preflight enforcement, error-stop status, stronger cleanup and application/error-code instrumentation. See `EMULATED_MOBILE_PERFORMANCE_2026-09-06.md`.

## Delivered links and mobile accessibility — 6 September 2026

Kevin confirmed successful use of actual verification/reset emails for an isolated Gmail test alias. Account activation and consumed tokens were confirmed in the database; the alias account was deleted. Mobile axe-core scan initially found contrast and keyboard-scroller issues. Following targeted fixes and a clean frontend build, **26/26 page-width scans** (13 routes at 320/390 pixels) reported zero violations/overflow; three repaired scroll regions passed Tab/focus/End checks. Frontend lint, separate TypeScript and production build passed. Manual contrast-review items and Samsung A73 physical keyboard results remain pending; no full WCAG claim. See `MOBILE_ACCESSIBILITY_FOLLOWUP_2026-09-06.md`.

## Production recovery browser and email follow-up — 6 September 2026

Production browser signup/verification/reset lifecycle and negative states passed; 15 account-page viewport checks passed with no uncaught browser errors. Fixed expected 4xx errors being masked as internal server errors in production; 5xx details remain hidden. Full backend suite: **72/72 across 12 files, 75.49 seconds**; build/lint passed. Temporary accounts were cleaned. A separate authorized delivery probe was SMTP-accepted and Kevin confirmed receipt; delivered recovery-link clicking and spam placement remain pending. See `ACCOUNT_RECOVERY_REHEARSAL_2026-09-06.md`.

## Account recovery regression — 6 September 2026

Added six API/database scenarios with intercepted mail. Deterministically overlapping initial token lookups reproduced double acceptance for verification and password-reset links (both HTTP 200). Atomic token claim/account-update transactions corrected this; each concurrent pair now yields one 200 and one 400, with only the winning password saved. Expired/replaced/reused/wrong-purpose links, unverified login, generated email links, old-password rejection and refresh revocation passed. Full `npm test`: **61/61 passed across 11 files, 69.21 seconds**. Backend build/lint passed; temporary accounts and cascading token records cleaned. Actual inbox delivery remains pending. See `ACCOUNT_RECOVERY_REHEARSAL_2026-09-06.md`.

## Mobile layout and functional rehearsal — 6 September 2026

`scripts/rehearse-mobile-workflows.mjs` passed herb comment/reply/like/deletion and ownership checks, mobile Messenger back/send/touch-edit interactions, admin ban/unban/self-ban safeguards, six mobile admin tabs, and logout cookie clearing/refresh-token revocation/protected-route redirects. Fixed mobile/tablet clipping and first-message action-menu obstruction. Test selectors/refresh endpoint were corrected during rehearsal; temporary data was cleaned after each attempt. Desktop community/Messenger and the 23-check public rehearsal passed again. Frontend lint, separate type checking and production build passed. Backend code unchanged. See `MOBILE_FUNCTIONAL_REHEARSAL_2026-09-06.md` for layout evidence and exclusions.

## Community reply deletion regression — 6 September 2026

Browser testing reproduced deleted reply text reappearing after reload. The repository now masks deleted reply content before returning the public thread response, including previously soft-deleted replies. The new regression failed before the repair and passed afterward. Full backend suite: **55/55 passed, 10 files, 26.53 seconds**; backend lint and production build passed. Browser retest confirmed the deleted placeholder survives reload and the unauthenticated detail API does not expose the original reply. Active reply text and chronological ordering are covered by regression tests. No database migration or historical-record rewrite was required.

## Community and Messenger browser rehearsal — 6 September 2026

`scripts/rehearse-community-messaging.mjs` exercised two isolated contributor browser sessions against the local production build. Topic/reply creation, like/unlike persistence, owner-only deletion, message text/image live delivery and deletion, text editing, reload persistence, image preview/opening and 55-message pagination passed. The first browser run exposed DEF-FORUM-01; subsequent runs verified the repair. Test selectors were also narrowed to distinguish sidebar previews from message bubbles and contact-picker rows. Temporary accounts/data and the uploaded Cloudinary asset were cleaned after each run. See `COMMUNITY_MESSAGING_REHEARSAL_2026-09-06.md` for scope and exclusions.

## Dr. AI reliability regression — 6 September 2026

Final `npm test` in herbalaibackend: **53/53 passed, nine files, 24.37 seconds**. Includes live grounded/multi-turn/SSE replies plus five mocked fallback/abort checks. Backend build and lint passed. See `DR_AI_RELIABILITY_2026-09-06.md`. Historical 45/47 AI-timeout results are superseded by this run, but external provider reliability and staging latency remain subject to further measurement.

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

## Optimization regression run

| Field | Record |
|---|---|
| Run ID | OPT-2026-09-01-01 |
| Date | 1 September 2026 |
| Scope | Cache/deduplication, production builds, image configuration, message pagination, query/vector indexes, request timing, and Dr. AI timing/source relevance |
| Result | **33 passed / 33 total across 6 backend test files; backend/frontend lint and production builds passed** |
| Database | Query-performance and HNSW migration deployed successfully |
| Performance evidence | Herb API measured approximately 6034 ms cold, then 18 ms and 11 ms cached |

## Dr. Ai formatting remediation regression

| Field | Record |
|---|---|
| Run ID | REG-2026-09-04-01 |
| Date | 4 September 2026 |
| Scope | Line-aware Dr. Ai Markdown heading/list rendering; documentation evidence synchronization |
| Backend tests | **33 passed / 33 total across 6 files** |
| Frontend lint | Passed |
| Backend lint | Passed |
| Backend production build | Passed |
| Frontend TypeScript | Passed separately with `tsc --noEmit` |
| Frontend production build | Passed; 18 routes generated using the constrained single-worker mode after the separate type check |
| Browser retest | **Passed** — authenticated Chrome retest rendered semantic headings, unordered/ordered lists, and a horizontal rule without exposing raw Markdown markers |

## Authenticated-session cache regression

| Field | Record |
|---|---|
| Run ID | REG-CACHE-2026-09-05-01 |
| Date | 5 September 2026 |
| Scope | Short-lived authenticated-user cache, request coalescing, mutation invalidation, and real API ban enforcement |
| Backend tests | **35 passed / 35 total across 7 files** |
| Backend production build | Passed |
| Immediate ban test | Passed — cached user returned HTTP 403 on the first `/api/auth/me` request after administrator ban |
| Temporary data | Test user deleted; no load-test users remain |

## Accessibility and load baseline

| Field | Record |
|---|---|
| Run ID | PERF-A11Y-2026-09-04-01 |
| Scope | Nine representative rendered routes; local load stages 10, 50, 100, 250, and 500 |
| Accessibility | **72/72 structural rule checks passed after remediation** |
| Public/cached load | 0% errors through 500 simultaneous requests; cached herb p95 884.5 ms at 500 |
| Authenticated load | `/api/auth/me` p95 15,095.5 ms with 25.4% timeouts at 500 |
| SRS performance | PR-001/PR-002 provisional pass; PR-003 pending; PR-004/PR-005 fail |
| Evidence | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md` |

## Functional API audit run

| Field | Record |
|---|---|
| Run ID | API-E2E-2026-09-01-01 |
| Date | 1 September 2026 |
| Accounts | Dedicated temporary contributor and administrator; deleted after execution |
| Scope | Authentication, herbs/comments, forum, messaging, suggestions, notifications, audit, statistics, knowledge base, and Dr. Ai |
| Result | **34 passed / 34 exercised checks** on the clean rerun |
| Evidence | `Docs/FUNCTIONAL_AUDIT_2026-09-01.md` |
| Limitation | Browser/UI automation was unavailable; external OAuth/email/upload/deployment/load evidence remains pending |

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

### Public-page browser checklist

| Field | Record |
|---|---|
| Run ID | UI-CHECK-2026-09-02-01 |
| Date | 2 September 2026 |
| Scope | Homepage, Library search/detail, About, Sign In controls, Google OAuth control, and Dr. Ai route access |
| Result | **13 of 13 leaf checks passed (100%)**; known- and unknown-herb grounding prompts also passed |
| Authentication | Google OAuth callback completed after user account selection; authenticated Dr. Ai UI verified |
| Finding | Minor `DEF-UI-01` was observed during this run and closed after the 4 September 2026 remediation retest |
| Evidence | `Docs/BROWSER_CHECKLIST_REPORT_2026-09-02.md` |
| Data impact | No test records or user data created |

Copy one row per execution. Store screenshots, recording links, or API logs in the Evidence column.

| Run ID | Test case | Tester | Preconditions | Expected result | Actual result | Evidence | Defect ID | Status | Date |
|---|---|---|---|---|---|---|---|---|---|
| MAN-001 | TC-SUG-04 |  | Two accounts: contributor and admin; email and notification channels configured | Contributor receives status-change notification after approval/rejection |  |  |  | Not Run |  |
| MAN-002 | TC-ADMIN-04 |  | Admin account and auditable action available | Audit log stores actor, timestamp, action, and target |  |  |  | Not Run |  |
| MAN-003 | TC-MSG-03 | Codex | Authenticated contributor Chrome session and authenticated administrator API session | Recipient receives message without reload | Image message arrived through Socket.io in the already-open contributor conversation; rendering, opening, and reload persistence passed | `Docs/MESSENGER_BROWSER_TEST_2026-09-04.md` |  | Pass | 2026-09-04 |
| MAN-004 | TC-AUTH-07 | Kevin + Codex | Unique authorized Gmail plus-alias | Verification link enables account privileges | Delivered link activated the isolated account; database state confirmed verification and consumed token | `Docs/ACCOUNT_RECOVERY_REHEARSAL_2026-09-06.md` |  | Pass | 2026-09-06 |
| MAN-005 | TC-AUTH-08 | Kevin + Codex | Unique authorized Gmail plus-alias | Password-reset link changes password once; expired link fails | Delivered reset succeeded; token consumption confirmed; API/browser reuse and expiry cases passed; temporary account cleaned | `Docs/ACCOUNT_RECOVERY_REHEARSAL_2026-09-06.md` |  | Pass | 2026-09-06 |
| MAN-006 | TC-AUTH-09 | Codex + user | Google OAuth test client configured | OAuth callback signs in/creates correct account | Account selection completed and callback returned to authenticated Herbal AI homepage | `Docs/BROWSER_CHECKLIST_REPORT_2026-09-02.md` |  | Pass | 2026-09-02 |
| MAN-007 | TC-UX-02 | Codex | Browser responsive mode | Core pages work at 320, 768, 1024, and 1440 px | Multi-width layout plus comments, Messenger, notifications, admin and logout workflows passed; physical-device behavior remains outside scope | `Docs/MOBILE_FUNCTIONAL_REHEARSAL_2026-09-06.md`; `Docs/MOBILE_ACCESSIBILITY_FOLLOWUP_2026-09-06.md` |  | Pass | 2026-09-06 |
| MAN-008 | TC-A11Y-01 | Codex | Automated accessibility inspector | Meaningful herb images have descriptive alt text | Final 26 route/width axe scan reported zero violations/overflow after contrast and keyboard-region repairs; not a full WCAG certification | `Docs/MOBILE_ACCESSIBILITY_FOLLOWUP_2026-09-06.md` |  | Pass | 2026-09-06 |
| MAN-009 | TC-AUTH-04 | Codex | Isolated contributor in local production build | Allowed profile fields persist; protected account fields cannot be changed | Name/avatar/bio persisted after reload; invalid name blocked; role/email/ban injection returned 400; 320px dialog passed after clipping repair | `Docs/PROFILE_QUICK_PROMPTS_REHEARSAL_2026-09-07.md` |  | Pass | 2026-09-07 |
| MAN-010 | TC-CHAT-04 | Codex | Authenticated production browser; deterministic SSE response | Selecting a quick prompt submits its exact intended text and renders the chat response | Three choices rendered; Lagundi payload matched exactly; stream, source, disclaimer and 320px layout passed after scroll repair | `Docs/PROFILE_QUICK_PROMPTS_REHEARSAL_2026-09-07.md` |  | Pass | 2026-09-07 |
| MAN-011 | TC-ADMIN-03 | Codex | Isolated admin/contributor; uniquely named temporary herb | Admin creates, publishes, edits and deletes a herb; public state follows; contributor is denied | Submission/approval, Library visibility/detail update, edit persistence, contributor HTTP 403, deletion and 320px editor passed | `Docs/ADMIN_CRUD_RAG_REHEARSAL_2026-09-07.md` |  | Pass | 2026-09-07 |
| MAN-012 | TC-ADMIN-07 / TC-CHAT-05 | Codex | Isolated admin/contributor; unique temporary KB fact; live Gemini | Admin manages active KB entry and Dr. Ai retrieves it as the relevant source | Create/edit/status/RBAC/audit/delete passed; live stream cited exact updated question and included unique `green-nine` fact | `Docs/ADMIN_CRUD_RAG_REHEARSAL_2026-09-07.md` |  | Pass | 2026-09-07 |

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
| DEF-UI-01 | Minor | Dr. Ai response presentation | Markdown headings, lists, and horizontal rules were displayed as raw markers | Frontend | **Closed — Retest Passed 2026-09-04** | Authenticated Chrome prompt `Explain the verified uses and safety warnings for Lagundi.` rendered heading elements, list elements, and a visual separator with no raw `###`, `*`, or `---`; `Docs/BROWSER_CHECKLIST_REPORT_2026-09-02.md`; REG-2026-09-04-01 |
| DEF-FORUM-01 | Major | Community reply deletion / SP-09 | Soft-deleted reply text reappeared after reload and remained exposed by the public detail API | Backend | **Closed — Retest Passed 2026-09-06** | Public response now masks deleted text; `tests/forum-deletion.test.ts` red/green regression and two-session browser retest |
| DEF-PERF-01 | Major | PR-004 / PR-005 | Authenticated session lookup exceeds the 1 s p95 target and times out under 500-request load | Backend/Infrastructure | Open | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md`; PERF-A11Y-2026-09-04-01 |
| DEF-AI-02 | Moderate | Dr. AI unknown-source boundary | Unknown `moonflower xyz` correctly returns an insufficient-evidence refusal and no dosage, but the UI still displayed unrelated FAQ citations for commercial remedies and Niyog-niyogan | Backend/AI | **Fixed locally — staging retest pending** | Retrieval now requires meaningful lexical overlap in addition to vector distance; two regressions added; 175/175 backend tests, lint and build passed on 21 September 2026 |

### Performance profiling record

| Run ID | Scope | Result | Evidence | Date |
|---|---|---|---|---|
| PERF-PROFILE-2026-09-04-01 | Split `/api/auth/me` into JWT, fresh DB connection, warm DB round trip, repository query, and total HTTP timing | Database path is approximately 99% of median server time; fresh connection p50 2,206.5 ms; warm round trip p50 265.3 ms; JWT p50 1.8 ms | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md`; `scripts/profile-auth-me.mjs` | 2026-09-04 |
| PERF-POOL-2026-09-05-01 | Configure and instrument bounded PostgreSQL pooling, then repeat authenticated load | Build and 33 tests passed; metrics verified; 500-request `/api/auth/me` stage still failed with p95 9,172.6 ms and 31.8% client errors | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md`; `scripts/run-local-load-test.mjs` | 2026-09-05 |
| PERF-DISTINCT-2026-09-05-01 | `/api/auth/me` with separate temporary account/token per request at 10, 50, 100, 250, and 500 users | Zero errors through 250 users; 500 users had p95 8,851.3 ms and 33.0% client transport errors; all 500 temporary users deleted | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md`; `scripts/run-distinct-user-load-test.mjs` | 2026-09-05 |
| PERF-CACHE-2026-09-05-01 | Warmed authenticated-session cache at 10, 50, 100, 250, and 500 requests plus immediate ban invalidation | 0 errors at every stage; 500-request p95 2,219.8 ms; real API ban test returned 403 immediately after a cached profile was banned | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md`; `scripts/verify-auth-cache-invalidation.mjs` | 2026-09-05 |
| PERF-BROWSER-2026-09-05-01 | Chrome LCP, rendered library search, and authenticated Dr.Ai response timing | PR-001/PR-002 provisional pass; PR-003 fail with response-start p95 18,946.1 ms; all Dr.Ai samples returned 200 | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md`; `scripts/run-browser-performance-test.mjs` | 2026-09-05 |
| PERF-STREAM-2026-09-05-01 | Authenticated Dr.Ai SSE streaming and post-remediation Chrome timing | 3/3 HTTP 200; first grounded text p95 529.9 ms (97.2% improvement); completed answer p95 3,225.0 ms | `Docs/ACCESSIBILITY_PERFORMANCE_AUDIT_2026-09-04.md`; `scripts/run-browser-performance-test.mjs` | 2026-09-05 |
| PERF-HOME-2026-09-07-01 | Server/client homepage boundary refactor; five fresh Chrome contexts | LCP 744–2,636 ms; all five samples below the 3,000 ms local target; desktop and 320px layouts had zero horizontal overflow | `Docs/PERFORMANCE_FOLLOWUP_2026-09-07.md` | 2026-09-07 |
| PERF-LOGIN-2026-09-08-01 | Credential-safe session cache priming after password login | First `/api/auth/me` 37.5 ms end-to-end / 9.1 ms application; next two 19.6–19.7 ms; identity/no-password assertions and exact cleanup passed | `Docs/PERFORMANCE_FOLLOWUP_2026-09-07.md`; `scripts/measure-post-login-session.mjs` | 2026-09-08 |
