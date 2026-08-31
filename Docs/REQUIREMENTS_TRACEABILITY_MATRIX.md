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
| FR-HERB-003 | Images and preparation guidance; herb pages | TC-HERB-03 | Each displayed herb has usable image and preparation information | Pending Verification |
| FR-HERB-004 | DOH status; herb model and library UI | TC-HERB-04 | Every public card/detail page shows its approval status | Pending Verification |
| FR-HERB-005 | Detail fields; herb detail page | TC-HERB-05 | Detail view displays all required names, use, dosage, warnings, and image fields | Pending Verification |
| FR-CHAT-001 | Gemini chat; `chat.routes.ts`, AI services | TC-CHAT-01 | Authenticated user receives a successful non-empty chat response | Verified |
| FR-CHAT-002 | Grounded preparation/dosage answers | TC-CHAT-02 | Test prompts produce source-grounded, safety-bounded guidance | Pending Verification |
| FR-CHAT-003 | Safety disclaimer; chat page and prompt | TC-CHAT-03 | Disclaimer is visible before/during each chat session | Pending Verification |
| FR-CHAT-004 | Quick prompts; chat page | TC-CHAT-04 | Selecting a chip inserts/submits its intended prompt | Pending Verification |
| FR-CHAT-005 | RAG knowledge base; `services/ai/knowledge-base/` | TC-CHAT-05 | Admin-managed knowledge entry is retrievable in a relevant response | Pending Verification |
| FR-SUG-001 | Suggestion form/routes | TC-SUG-01 | Logged-in user can submit all required herb data | Pending Verification |
| FR-SUG-002 | Pending workflow; suggestion controller | TC-SUG-02 | New suggestion remains hidden from public library until approval | Pending Verification |
| FR-SUG-003 | Upload middleware | TC-SUG-03 | JPEG/PNG up to 5 MB accepted; invalid type/oversize rejected | Pending Verification |
| FR-SUG-004 | Status notification flow | TC-SUG-04 | Submitter receives in-app/email notification after approve or reject | Pending Verification |
| FR-ADMIN-001 | RBAC; auth and role middleware | TC-ADMIN-01 | Non-admin access is denied; admin access is allowed | Verified |
| FR-ADMIN-002 | Approval/rejection/editing; suggestion controller | TC-ADMIN-02 | Admin decision correctly changes publication/status state | Pending Verification |
| FR-ADMIN-003 | Herb catalog management | TC-ADMIN-03 | Admin can create, edit, and delete a herb; change appears in catalog | Pending Verification |
| FR-ADMIN-004 | Audit repository/controller | TC-ADMIN-04 | Every listed admin action stores actor, timestamp, action, and target | Pending Verification |
| FR-ADMIN-005 | User management | TC-ADMIN-05 | Admin can view/manage user account state only through authorized route | Pending Verification |
| FR-ADMIN-006 | Statistics controller/dashboard | TC-ADMIN-06 | Dashboard statistics agree with database/API totals | Pending Verification |
| FR-ADMIN-007 | RAG knowledge base management | TC-ADMIN-07 | Admin can create, edit, and delete a knowledge-base entry | Pending Verification |
| FR-COMM-001 | Forum route/controller | TC-COMM-01 | Authorized user can create a thread and it persists | Pending Verification |
| FR-COMM-002 | Replies/comments | TC-COMM-02 | Authorized user can create a reply and it appears in its thread | Pending Verification |
| FR-COMM-003 | Thread/reply likes | TC-COMM-03 | Like action is persisted and duplicate behavior is controlled | Pending Verification |
| FR-MSG-001 | Message route/controller | TC-MSG-01 | Two authorized users can exchange a private message | Pending Verification |
| FR-MSG-002 | Message repository | TC-MSG-02 | Conversation history contains only messages for the selected participants | Pending Verification |
| FR-MSG-003 | Socket.io messaging | TC-MSG-03 | Recipient receives message in real time without a page reload | Pending Verification |
| FR-COM-001 | Herb comments; component/routes | TC-COM-01 | Authorized user can add a comment to an herb | Pending Verification |
| FR-COM-002 | Comment replies | TC-COM-02 | Authorized user can reply to an existing herb comment | Pending Verification |
| FR-COM-003 | Comment likes | TC-COM-03 | Like action persists and is shown accurately | Pending Verification |
| FR-AUTH-001 | Registration; auth service | TC-AUTH-01 | Valid unique registration succeeds; duplicate/invalid submissions fail clearly | Pending Verification |
| FR-AUTH-002 | Sign-in/JWT | TC-AUTH-02 | Valid login returns usable session; invalid credentials are denied | Pending Verification |
| FR-AUTH-003 | RBAC | TC-AUTH-03 | Protected admin route denies contributor and anonymous requests | Verified |
| FR-AUTH-004 | Profile UI/API | TC-AUTH-04 | User can view and save allowed personal profile changes | Pending Verification |
| FR-AUTH-005 | Logout/token invalidation | TC-AUTH-05 | After logout, protected requests using the invalidated session fail | Pending Verification |
| FR-AUTH-006 | Refresh tokens | TC-AUTH-06 | Valid refresh token issues a new access token; invalid/expired token is denied | Pending Verification |
| FR-AUTH-007 | Email verification | TC-AUTH-07 | Unverified account is restricted; valid verification enables privileges | Pending Verification |
| FR-AUTH-008 | Password reset | TC-AUTH-08 | Valid reset token changes password once; invalid/expired token is denied | Pending Verification |
| FR-AUTH-009 | Google OAuth | TC-AUTH-09 | OAuth callback creates/signs in the intended user account | Pending Verification |

## Quality requirements

| ID | Test case | Acceptance criterion | Status |
|---|---|---|---|
| UR-001 | TC-UX-01 | At least 5 UAT participants complete core tasks without assistance | Pending Verification |
| UR-002 | TC-UX-02 | Core pages work at 320px, 768px, 1024px, and 1440px widths | Pending Verification |
| UR-003 | TC-A11Y-01 | All meaningful herb images have non-empty, descriptive alt text | Pending Verification |
| UR-004 | TC-UX-03 | Invalid form submission shows clear, actionable feedback | Pending Verification |
| UR-005 | TC-UX-04 | Navigation is consistent and role-appropriate on each core page | Pending Verification |
| PR-001 | TC-PERF-01 | Landing page load is <= 3 seconds under recorded normal conditions | Pending Verification |
| PR-002 | TC-PERF-02 | Herb search response is <= 2 seconds under recorded normal load | Pending Verification |
| PR-003 | TC-PERF-03 | Dr. Ai starts rendering within <= 1.5 seconds for 95% of measured prompts | Pending Verification |
| PR-004 | TC-PERF-04 | 95% of standard authentication/data API requests complete in <= 1 second | Pending Verification |
| PR-005 | TC-PERF-05 | 500 concurrent connections meet the agreed error-rate and latency threshold | Pending Verification |

## Automated evidence boundary

The current automated suite verifies the following acceptance behavior directly: herb listing/filtering/pagination/search, unauthenticated access rejection for selected protected routes, invalid signup/login validation, and selected Dr. Ai, forum, messaging, notification, statistics, and audit-log access behavior. It does not yet prove the success path of registration, login, suggestion creation, email/OAuth, uploads, browser interaction, or external-service workflows.

## Phase 2 evidence required

1. Add the test case ID to the automated test name or manual test form.
2. Record test date, tester, test data, actual result, evidence link/screenshot, defect ID, and reviewer sign-off in the V&V report.
3. Do not change a status to **Verified** without preserving the evidence.
