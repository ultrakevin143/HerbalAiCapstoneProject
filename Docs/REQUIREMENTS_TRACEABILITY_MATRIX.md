# Herbal AI Requirements Traceability Matrix

## Status definitions

- **Implemented:** code exists; no formal evidence has been recorded yet.
- **Verified:** repeatable automated or manual evidence meets the stated criterion.
- **Pending Verification:** code may exist but final evidence is still required.

## Functional requirements

| ID | Requirement / implementation evidence | Test case | Acceptance criterion | Status |
|---|---|---|---|---|
| FR-HERB-001 | Verified herb repository; `herb.routes.ts` | TC-HERB-01 | Public list returns only approved, paginated herb records | Verified |
| FR-HERB-002 | Search/filter; herb route and library page | TC-HERB-02 | Name, Cebuano-name, and ailment searches return matching records | Verified |
| FR-HERB-003 | Images and preparation guidance; herb pages | TC-HERB-03 | Each displayed herb has usable image and preparation information | Verified — browser Library detail and image checks |
| FR-HERB-004 | DOH status; herb model and library UI | TC-HERB-04 | Every public card/detail page shows its approval status | Verified — cards/detail reviewed in browser rehearsals |
| FR-HERB-005 | Detail fields; herb detail page | TC-HERB-05 | Detail view displays all required names, use, dosage, warnings, and image fields | Verified — Lagundi/detail workflow and responsive modal checks |
| FR-CHAT-001 | Gemini chat; `chat.routes.ts`, AI services | TC-CHAT-01 | Authenticated user receives a successful non-empty chat response | Verified |
| FR-CHAT-002 | Grounded preparation/dosage answers | TC-CHAT-02 | Test prompts produce source-grounded, safety-bounded guidance | Verified |
| FR-CHAT-003 | Safety disclaimer; chat page and prompt | TC-CHAT-03 | Disclaimer is visible before/during each chat session | Verified |
| FR-CHAT-004 | Quick prompts; chat page | TC-CHAT-04 | Selecting a chip inserts/submits its intended prompt | Verified — exact prompt payload, streamed rendering, source/disclaimer and 320px layout passed |
| FR-CHAT-005 | RAG knowledge base; `services/ai/knowledge-base/` | TC-CHAT-05 | Admin-managed knowledge entry is retrievable in a relevant response | Verified — live stream cited the exact active KB source and included its unique fact |
| FR-SUG-001 | Suggestion form/routes | TC-SUG-01 | Logged-in user can submit all required herb data | Verified — suggestion browser/API rehearsal |
| FR-SUG-002 | Pending workflow; suggestion controller | TC-SUG-02 | New suggestion remains hidden from public library until approval | Verified — pending/public/approval lifecycle rehearsal |
| FR-SUG-003 | Upload middleware | TC-SUG-03 | JPEG/PNG up to 5 MB accepted; invalid type/oversize rejected | Verified — signature/type/size validation and browser image workflow |
| FR-SUG-004 | Status notification flow | TC-SUG-04 | Submitter receives in-app/email notification after approve or reject | Verified — in-app state plus approved-email evidence; rejection delivery remains a variant |
| FR-ADMIN-001 | RBAC; auth and role middleware | TC-ADMIN-01 | Non-admin access is denied; admin access is allowed | Verified |
| FR-ADMIN-002 | Approval/rejection/editing; suggestion controller | TC-ADMIN-02 | Admin decision correctly changes publication/status state | Verified — approve/reject lifecycle and publication checks |
| FR-ADMIN-003 | Herb catalog management | TC-ADMIN-03 | Admin can create, edit, and delete a herb; change appears in catalog | Verified — submission/approval, public visibility, edit persistence, RBAC and deletion passed |
| FR-ADMIN-004 | Audit repository/controller | TC-ADMIN-04 | Every listed admin action stores actor, timestamp, action, and target | Verified — admin mutation/audit API and browser evidence |
| FR-ADMIN-005 | User management | TC-ADMIN-05 | Admin can view/manage user account state only through authorized route | Verified — ban/unban, self-ban and contributor denial rehearsal |
| FR-ADMIN-006 | Statistics controller/dashboard | TC-ADMIN-06 | Dashboard statistics agree with database/API totals | Verified — API totals and rendered dashboard checks |
| FR-ADMIN-007 | RAG knowledge base management | TC-ADMIN-07 | Admin can create, edit, and delete a knowledge-base entry | Verified — create/edit/status/delete, RBAC, audit trail and 320px editor passed |
| FR-COMM-001 | Forum route/controller | TC-COMM-01 | Authorized user can create a thread and it persists | Verified — two-account community rehearsal |
| FR-COMM-002 | Replies/comments | TC-COMM-02 | Authorized user can create a reply and it appears in its thread | Verified — live/reload/deletion rehearsal |
| FR-COMM-003 | Thread/reply likes | TC-COMM-03 | Like action is persisted and duplicate behavior is controlled | Verified — like/unlike and reload persistence rehearsal |
| FR-MSG-001 | Message route/controller | TC-MSG-01 | Two authorized users can exchange a private message | Verified |
| FR-MSG-002 | Message repository | TC-MSG-02 | Conversation history contains only messages for the selected participants | Verified |
| FR-MSG-003 | Socket.io messaging | TC-MSG-03 | Recipient receives message in real time without a page reload | Verified |
| FR-COM-001 | Herb comments; component/routes | TC-COM-01 | Authorized user can add a comment to an herb | Verified — mobile/two-user browser rehearsal |
| FR-COM-002 | Comment replies | TC-COM-02 | Authorized user can reply to an existing herb comment | Verified — live reply and reload checks |
| FR-COM-003 | Comment likes | TC-COM-03 | Like action persists and is shown accurately | Verified — like/unlike persistence checks |
| FR-AUTH-001 | Registration; auth service | TC-AUTH-01 | Valid unique registration succeeds; duplicate/invalid submissions fail clearly | Verified — API and production browser recovery rehearsal |
| FR-AUTH-002 | Sign-in/JWT | TC-AUTH-02 | Valid login returns usable session; invalid credentials are denied | Verified — browser login plus automated auth tests |
| FR-AUTH-003 | RBAC | TC-AUTH-03 | Protected admin route denies contributor and anonymous requests | Verified |
| FR-AUTH-004 | Profile UI/API | TC-AUTH-04 | User can view and save allowed personal profile changes | Verified — persistence, validation, protected-field rejection and 320px dialog passed |
| FR-AUTH-005 | Logout/token invalidation | TC-AUTH-05 | After logout, protected requests using the invalidated session fail | Verified — cookies cleared, refresh revoked and four routes redirected |
| FR-AUTH-006 | Refresh tokens | TC-AUTH-06 | Valid refresh token issues a new access token; invalid/expired token is denied | Verified — automated lifecycle and revoked-token browser/API checks |
| FR-AUTH-007 | Email verification | TC-AUTH-07 | Unverified account is restricted; valid verification enables privileges | Verified — actual Gmail link, database state and single-use tests |
| FR-AUTH-008 | Password reset | TC-AUTH-08 | Valid reset token changes password once; invalid/expired token is denied | Verified — actual Gmail link plus expiry/reuse/concurrency tests |
| FR-AUTH-009 | Google OAuth | TC-AUTH-09 | OAuth callback creates/signs in the intended user account | Verified |

## Quality requirements

| ID | Test case | Acceptance criterion | Status |
|---|---|---|---|
| UR-001 | TC-UX-01 | At least 5 UAT participants complete core tasks without assistance; use `Docs/UAT_TEST_SCRIPT.md`, one `UAT_RESULT_FORM.md` copy per participant, and `UAT_SUMMARY.md` | Pending Verification — 0/5 recorded |
| UR-002 | TC-UX-02 | Core pages work at 320px, 768px, 1024px, and 1440px widths | Verified — 63 layout checks, 26 accessibility width scans and mobile workflows |
| UR-003 | TC-A11Y-01 | All meaningful herb images have non-empty, descriptive alt text | Verified — 21/21 visible images in the representative rendered route audit had `alt` attributes |
| UR-004 | TC-UX-03 | Invalid form submission shows clear, actionable feedback | Verified — signup/reset/link/upload negative browser states |
| UR-005 | TC-UX-04 | Navigation is consistent and role-appropriate on each core page | Verified — public/contributor/admin responsive navigation rehearsals |
| PR-001 | TC-PERF-01 | Landing page load is <= 3 seconds under recorded normal conditions | Provisional Pass — after server/client-boundary refactor, five fresh local Chrome contexts measured 744–2,636 ms; staging/device acceptance remains pending |
| PR-002 | TC-PERF-02 | Herb search response is <= 2 seconds under recorded normal load | Provisional Pass — rendered Lagundi filtering p95 32.1 ms |
| PR-003 | TC-PERF-03 | Dr. Ai starts rendering within <= 1.5 seconds for 95% of measured prompts | Provisional Pass — streamed first grounded text p95 529.9 ms over 3 local prompts |
| PR-004 | TC-PERF-04 | 95% of standard authentication/data API requests complete in <= 1 second | Failed — warmed `/api/auth/me` exceeds 1 s p95 at 250 and 500 requests |
| PR-005 | TC-PERF-05 | 500 concurrent connections meet the agreed error-rate and latency threshold | Failed / Improved — warmed session reached 500 with 0% errors, but p95 was 2,219.8 ms and staging acceptance is pending |

## Automated evidence boundary

The 83-test backend suite plus dated browser rehearsals verify every listed functional row within its recorded local scope, including full herb CRUD, admin-managed KB retrieval and credential-safe post-login cache priming. Exhaustive input/browser combinations are not implied. UAT, physical-device/full WCAG, staging capacity and deployment/recovery remain separate gates.

## Recorded browser evidence

| Date | Test cases | Result | Evidence |
|---|---|---|---|
| 2 September 2026 | TC-CHAT-01, TC-CHAT-02, TC-CHAT-03, TC-AUTH-09 | Authenticated chat passed; Lagundi cited only Lagundi; unknown herb returned no source or dosage; disclaimer visible; Google OAuth callback succeeded | `Docs/BROWSER_CHECKLIST_REPORT_2026-09-02.md` |
| 5–6 September 2026 | TC-SUG-01–04, TC-COMM-01–03, TC-COM-01–03, TC-MSG-01–03, TC-AUTH-01–08, TC-UX-02–04 | Dated suggestion, messaging/community, recovery-email and responsive/accessibility rehearsals passed within their recorded scopes | `Docs/SUGGESTION_REHEARSAL_2026-09-05.md`; `Docs/COMMUNITY_MESSAGING_REHEARSAL_2026-09-06.md`; `Docs/ACCOUNT_RECOVERY_REHEARSAL_2026-09-06.md`; `Docs/MOBILE_FUNCTIONAL_REHEARSAL_2026-09-06.md` |
| 7 September 2026 | TC-AUTH-04, TC-CHAT-04 | Profile allowed-field persistence/protected-field rejection and quick-prompt exact submission/stream rendering passed at desktop and 320px widths | `Docs/PROFILE_QUICK_PROMPTS_REHEARSAL_2026-09-07.md` |
| 7 September 2026 | TC-ADMIN-03, TC-ADMIN-07, TC-CHAT-05 | Full herb CRUD, full KB CRUD/status/RBAC/audit, and live retrieval from the exact active KB source passed | `Docs/ADMIN_CRUD_RAG_REHEARSAL_2026-09-07.md` |

## Phase 2 evidence required

1. Add the test case ID to the automated test name or manual test form.
2. Record test date, tester, test data, actual result, evidence link/screenshot, defect ID, and reviewer sign-off in the V&V report.
3. Do not change a status to **Verified** without preserving the evidence.
