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
| Backend automated tests | **82 passed / 82 total across 14 files** | Vitest run on 7 September 2026; includes profile authorization/validation plus cache invalidation |
| Frontend lint | **Passed** | ESLint run on 4 September 2026 |
| Backend lint | **Passed** | Latest recorded regression run |
| Backend TypeScript/production build | **Passed** | `npm run build` on 6 September 2026 |
| Frontend TypeScript/production build | **Passed** | Separate `tsc --noEmit`, lint, and constrained production build; 18 routes generated on 7 September 2026 |
| Functional API audit | **34 passed / 34 exercised checks** | `Docs/FUNCTIONAL_AUDIT_2026-09-01.md` |
| Browser checklist | **13 passed / 13 leaf checks; Messenger attachment/edit follow-up passed** | `Docs/BROWSER_CHECKLIST_REPORT_2026-09-02.md`; `Docs/MESSENGER_BROWSER_TEST_2026-09-04.md` |
| Community/Messenger desktop rehearsal | **Tested cases passed after deleted-reply repair** | Two contributor browsers; `Docs/COMMUNITY_MESSAGING_REHEARSAL_2026-09-06.md` |
| Mobile workflows and layout remediation | **Tested cases passed** | Herb comments, ban/unban/self-ban, logout/refresh revocation, touch Messenger and responsive layouts; `Docs/MOBILE_FUNCTIONAL_REHEARSAL_2026-09-06.md` |
| Google OAuth, Dr. Ai grounding, and response rendering | **Passed** | OAuth callback, authenticated chat, Lagundi-only source, unknown-herb refusal, and semantic Markdown rendering verified; formatting regression retested on 4 September 2026 |
| Profile editing and Dr. Ai quick prompts | **Passed** | Allowed-field persistence, protected-field rejection, exact quick-prompt submission, streamed UI and 320px visual review; `Docs/PROFILE_QUICK_PROMPTS_REHEARSAL_2026-09-07.md` |
| Full herb CRUD and KB CRUD/RAG retrieval | **Passed** | Public herb lifecycle, KB lifecycle/status/RBAC/audit, and live retrieval of an exact admin-managed fact; `Docs/ADMIN_CRUD_RAG_REHEARSAL_2026-09-07.md` |
| Production deployment | Pending | Requires deployed URL, logs, health checks, and rollback evidence |
| Performance/load testing | **In progress** | Local staged results recorded through 500 requests; PR-004 and PR-005 failed and require remediation before staging acceptance |

## Automated verification scope

The latest executed automated suite contains 82 passing tests in 14 files:

| Test suite | Evidence covered |
|---|---|
| `tests/auth.test.ts` | Validation, invalid credentials, and unauthorized session rejection |
| `tests/herbs.test.ts` | Herb listing, DOH filter, pagination, search, and unknown-herb handling |
| `tests/suggest.test.ts` | Authentication checks for suggestion submission, listing, approve, and reject actions |
| `tests/chat.test.ts` | Chat authentication enforcement |
| `tests/system-features.test.ts` | Chat behavior, herb search, forum listing, message users, notifications, dashboard statistics, and audit-log RBAC |
| `tests/ttl-cache.test.ts` | TTL cache hit, expiry, deduplication, and invalidation behavior |
| `tests/user-session-cache.test.ts` | Cached user-session behavior and invalidation |
| `tests/suggestion-validation.test.ts` | Required fields and upload client errors |
| `tests/gemini-fallback.test.ts` | Provider fallback, timeout aborts and interrupted-stream handling |
| `tests/forum-deletion.test.ts` | Deleted reply text is masked in public results; active content and chronological order remain unchanged |
| `tests/account-recovery.test.ts` | Registration/verification, expiry/resend/reuse, password reset and refresh revocation, atomic concurrent redemption; mail intercepted |
| `tests/error-response.test.ts` | Eleven cases for production client-error messages, hidden server details, invalid status codes and development diagnostics |
| `tests/batched-lookup.test.ts` | Four cases for ID mapping/deduplication, 100-ID bounds, failure/retry and no in-flight reuse; an additional session-cache regression covers stale results after ban invalidation |
| `tests/profile.test.ts` | Unauthenticated rejection, allowed-field persistence, protected-field rejection, invalid/empty input validation and immediate session visibility |

These tests establish a backend API baseline. Browser evidence separately verifies public pages, Google OAuth, delivered Gmail verification/reset links, profile editing, the authenticated Dr. Ai interface and quick prompts, source relevance, unknown-herb refusal, the safety disclaimer, Messenger workflows and emulated-mobile accessibility. Physical-device/full WCAG, performance acceptance, deployment, recovery, and UAT evidence are still required.

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

The code-quality baseline is healthy: 82 backend tests, lint/build checks, the 34-check API audit, browser workflow suites and 26/26 emulated-mobile accessibility scans pass within their scopes. Every listed functional traceability row now has local evidence, including full herb CRUD and live retrieval from an admin-managed KB record. Startup warm-up reduced one first authenticated sample to 535.2ms, but 100-user p95 remained 2413.4ms; PR-001/PR-004/PR-005 are not accepted. The remaining gates are 0/5 participant UAT, physical-device/full WCAG, staging performance, deployment, backup/restore, formal DOCX visual QA and final reviewer sign-off.
