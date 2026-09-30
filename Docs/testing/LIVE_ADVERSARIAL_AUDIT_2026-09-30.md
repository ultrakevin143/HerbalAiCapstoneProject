# Live adversarial audit — 30 September 2026

Release under test: `07fc88a` on `main` and `codex/readability-accessibility`; Vercel and Railway reported success. This is a bounded production audit, not a penetration test or formal user acceptance. No high-volume traffic, production deletion, password change, account ban, or medicinal-plant publication was performed. No credentials or private tokens are recorded here.

## Confirmed findings

| ID | Priority | Finding and reproduction | Expected behavior / proposed fix |
| --- | --- | --- | --- |
| A01 | High | `GET /api/forum/threads/999999999` returns HTTP 500 `DATABASE_ERROR`; an older `/community/14` link also returns 500 and displays a misleading database-failure message. A valid `/community/16` returns 200. `getThreadDetail` calls `incrementThreadViews` before confirming that a visible thread exists; Prisma `update` fails for a missing row. | Return 404 for absent/deleted threads without a database-error banner. Look up the visible thread before incrementing, handle a delete race, and add a missing-ID API regression test. |
| A02 | Medium | `GET /api/herbs?page=-1&limit=1000` returns HTTP 200 with `page=-1`, `limit=1000`, and all 37 records. `/api/forum/threads?page=-1&limit=1000` behaves likewise with all three threads. Both public list controllers pass unbounded positive `limit` values to repositories. | Normalize page to at least 1, set a finite maximum and default page size, and report normalized metadata. Add boundary tests. Do not silently truncate without consistent pagination metadata. |
| A03 | Medium; review for safety | An English, generic Lagundi question received a mostly Filipino/Tagalog answer and listed child-age ingredient quantities despite no child age in the question. The checked-in Dr. Ai instructions require the latest question's language and say not to choose an age-table amount without child context. A separate explicit three-year-old question did advise professional care and said the finished-liquid dose was missing, but also supplied an age-specific preparation. This is a prompt-compliance and presentation concern, not a claim that the source quantities are medically incorrect. | Recheck retrieval context and language selection; add deterministic response/evaluation cases for English-only questions, generic age tables, and pediatric requests. Keep source-grounding and the warning against inventing a finished dose. |
| A04 | Low | After suggestion ID 60 was rejected in the admin session, its already-open contributor `My Submissions` list still displayed `Pending`. Refresh changed it to `Rejected`. | Refetch submission status on focus/notification or expose an explicit refresh control; avoid leaving an outdated review state visible indefinitely. |

## Hardening observation

- The live frontend response has HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`, but no Content Security Policy. The direct Railway backend response lacks HSTS and CSP while retaining the other tested basic headers. No exploit was demonstrated. A CSP requires review of the existing inline theme script and third-party connections; do not add a blanket policy that breaks sign-in, images, or sockets.

## Checks that passed

- Isolated-database backend suite: 301/301 tests passed before release. GitHub's four CI jobs and the Vercel/Railway deployment statuses passed for `07fc88a`.
- Fifteen direct live guest API checks returned the expected 200 or 401, including denial for admin users, audit logs, knowledge-base listing, stats, suggestions, messaging, notifications, and chat. The Vercel `/api` proxy returned 200 for health/catalog and 401 for unauthenticated profile/audit requests.
- Six bounded negative-input checks returned expected 400, 404, or anti-enumeration 200. A hostile `Origin` was not reflected in `Access-Control-Allow-Origin`; the configured frontend origin was returned instead.
- Live signup form blocked a seven-character password and invalid username. Two browser-intercepted signup XHRs sent **no real signup**: a malformed 201 response showed the uncertainty/sign-in guidance, while a valid 201 verification response showed the expected success message. The interception was cleared afterward.
- Contributor session survived refresh. A contributor opening `/admin` saw Access Denied. The administrator could load 33 knowledge-base facts and move from page 1 to 2 and back; audit records were visible. The 500-record legacy endpoint boundary was tested locally, not by inserting hundreds of production records.
- A clearly labeled nonmedicinal suggestion (ID 60) went from Pending to Rejected; the admin pending count returned from 1 to 0, the rejected count rose from 8 to 9, and a `REJECT_SUGGESTION` audit entry appeared. Public herb search found zero matching records both before and after rejection. The rejected test record remains in live storage; no image was uploaded.
- Dr. Ai refused to invent a dose for an unknown test-only plant. The pediatric probe did not invent a finished-liquid dose and advised professional care. A valid forum thread and notification/audit views loaded; no contributor-console error was observed.
- Browser viewport spot checks at 320, 390, 768, and 1280 CSS pixels found no document-level horizontal overflow on home, signup, library, and a valid community thread. The 320-pixel valid-thread screenshot was visually checked. This is browser emulation, not physical-device evidence.

## Not exercised on production

Actual signup-to-inbox verification, password-reset credential changes, the `>500` knowledge-base response, Cloudinary upload, account banning, destructive moderation, and sustained traffic/rate limits were not repeated in this audit. Avoid creating hundreds of live records or deliberately exhausting quotas just to test a boundary. These are not reported as passed.

Fix A01 first because an invalid or historical thread URL currently looks like a database outage. Then address A02 and the Dr. Ai evaluation cases, followed by the stale contributor status. Retest each fix against the isolated database before a selective release and a bounded live smoke check.

## Local follow-up (not deployed)

- A01: The view counter now uses `updateMany` with `isDeleted: false`, so an absent/deleted thread yields count zero and an HTTP 404 instead of a Prisma update exception. Controller, repository, and mocked HTTP regression tests passed, including the delete-between-update-and-read case.
- A02: Public herb/forum pages normalize invalid page numbers, default to 25 items, and cap at 100. Response metadata matches the effective values. The community page now has previous/next controls so later threads remain reachable; changing pages cancels the previous request. Helper and mocked HTTP tests passed.
- A03: The latest-question language rule is repeated in the grounded request. Generic herb context omits the dosage field unless asked. Pediatric questions use a deterministic clinician-directed answer without generated preparation/dosing; fallback no longer dumps raw dosage text. Prompt, RAG-context, and mocked Gemini transport tests passed. This is a risk reduction, **not proof** that a generative reply can never include unwanted content; a live post-release evaluation remains necessary.
- A04: `My Submissions` now reloads on browser focus, visibility return, or the new Refresh status button. Frontend lint and production build passed. No browser-level cross-account timing test was run for this local change.
- Backend focused unit/mock-HTTP checks passed (38 tests across 7 files); backend build/lint and frontend lint/build passed. Two database-backed test files (`herbs.test.ts`, `system-features.test.ts`) could not run in this checkout because no isolated test database URL is configured. They are **not** counted as passed. A guarded non-live database suite and post-deployment live checks are still required before claiming release readiness.

## MVP regression follow-up (local, not deployed)

The documented UAT script defines Home, Library, Dr. Ai, signup/verification/recovery, suggestions/review, Community, Messenger, notifications, and administrator tasks as core workflows. This follow-up exercised the available no-database and mocked tests for those paths; it did not substitute automated checks for five participant sessions.

| ID | Reproduced gap | Local repair and evidence |
| --- | --- | --- |
| M01 | Forum URL/body IDs such as `16abc` were parsed as valid `16`; malformed parent comment IDs could point to another reply. | Strict positive safe-integer parsing now covers thread detail, likes, deletes, comments, and parent replies. Malformed-ID HTTP/controller cases return 400 before writes. |
| M02 | Non-string forum content and repeated/non-string public search filters could call `.trim()` on an array/object and become 500 errors. An invalid `isDohApproved` value was silently treated as false. | Forum text and public catalog/forum query inputs are type-checked; malformed values return 400. Mocked HTTP and controller regression cases pass. |
| M03 | Liking a missing, deleted, or hidden-thread comment could return a server error or mutate a record users cannot see. | Like repositories check visible targets before writing; controllers return 404 when absent. Repository/controller tests cover denial and an ordinary valid like. |
| M04 | The verified Lagundi FAQ itself contains child-age ingredient quantities, so omitting only the herb dosage field did not prevent generic Dr. Ai context/fallback from exposing them. | Age-table sentences are withheld from retrieved FAQ/herb preparation text in generated context and fallback. The bundled Lagundi and nine-herb FAQ records plus a generic-question and provider-failure case were tested. Abbreviated child ages and immediate pediatric follow-ups use the clinician-directed non-generative answer. This is bounded by pattern matching and is not a medical-content certification. |
| M05 | Two overlapping `My Submissions` refresh requests could let the older response overwrite the newer review status. | Only the latest request may update status/error state. Frontend lint/build passed; a real two-browser timing check is still pending. |
| M06 | When a contributor had no submissions, the entire `My Submissions` section disappeared, hiding a fetch error and its refresh control. | The section now remains visible with a no-submissions state, an error, or the submissions list, and wraps its controls on narrow screens. Frontend lint/build passed; browser confirmation is pending. |
| M07 | If the last item on the current Community page was deleted, the API could return an empty page and the page controls disappeared. | The client now moves to the last available page and refetches when its requested page exceeds the current total. Frontend lint/build passed; live browser confirmation is pending. |

A follow-up test confirms that multiline pediatric age tables are withheld from Dr. Ai's retrieved text. The focused forum, pagination, prompt, and RAG regression set passed **63/63 tests across 8 files** after this adjustment.

An additional local safety case found that a `6-month-old` question did not match the deterministic pediatric route. The route now includes newborn and month-old phrasing, with a regression asserting the model is not called. This is a narrow language-pattern fix, not a clinical safety certification.

The final broad no-database/mock MVP regression set passed **262/262 tests across 38 files**. Backend lint/build and frontend lint/build passed. These are local tests, not full end-to-end acceptance. Database-backed tests cannot run without an explicitly isolated, non-live PostgreSQL database; the primary checkout's unverified Neon connection was deliberately not used. The earlier attempt to run database-backed files in this worktree failed at database connection, not at an application assertion. No changes have been pushed, so the current public deployment has not received these repairs.

## MVP acceptance gate (pre-release snapshot)

The `Docs/UAT_TEST_SCRIPT.md` scenarios are the acceptance reference. This table separates a current observed pass from prior evidence and work still needed; it does not mark formal participant UAT complete.

| Workflow | Current evidence | Remaining gate |
| --- | --- | --- |
| Guest Home and Library | Live Home loaded; Library showed 37 published records across four pages. Searching Lagundi returned one result, and its detail showed preparation, cautions and a source control. | Post-release guest smoke and physical-device judgment. |
| Forum and Community | An existing live thread loaded in the earlier audit; missing thread still returns 500 on the pre-release backend. Local 404, pagination, input, and like regressions pass. | Isolated-database CI, release, and live 404/page checks; bounded create/comment/like checks. |
| Dr. Ai | Local prompt, grounding, pediatric, fallback and multilingual-path regressions pass. | Post-release live provider answer evaluation in English and Filipino; generative accuracy cannot be guaranteed by unit tests. |
| Account creation and recovery | Earlier live signup-to-inbox and recovery evidence exists in dated release records. | Bounded post-release verification/reset check with a controlled test account; no password or token in documentation. |
| Suggestions and admin | Earlier live rejected TEST ONLY suggestion and audit record observed; contributor status eventually updated on refresh. | Post-release focus/refresh status, admin review, audit, and optional image-upload check without publishing a fake herb. |
| Messenger and notifications | Earlier dated live/desktop evidence exists; not repeated in this pass. | Bounded two-session post-release check if sessions remain available. |
| Formal UAT | Script, forms and summary are prepared; no new participant result collected here. | Five real participant records and reviewer sign-off; browser automation is not a substitute. |

At the time of this snapshot, live `/api/health` is 200, `/api/herbs?page=-1&limit=1000` still reports `page=-1`, `limit=1000`, and `/api/forum/threads/999999999` still returns 500. These are the old deployment, not a failure of the local candidate. A fresh no-isolated-database test run had 271 passing assertions but nine database-backed files could not connect; those files are not counted as passed. The focused post-adjustment set passed 63/63 tests, and both application lint/build gates pass.

The connected administrator session loaded the live dashboard (37 herbs, 0 pending suggestions, 33 FAQ facts), navigated to Suggestions, All Herbs, Users, Knowledge Base, and Audit Logs, and returned to the dashboard after a full page reload without a sign-in redirect. This checks navigation and session restoration, not write permissions or the candidate's undeployed changes. The new month-old pediatric regression passed with the focused backend set (43/43 tests across three files), followed by backend lint and build.

The final focused backend set passed **64/64 tests across eight files**. `git diff --check` passed. No commit, push, or production deployment occurred during this follow-up.
