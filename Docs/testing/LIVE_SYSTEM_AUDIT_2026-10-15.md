# Live system testing — 15 October 2026

Testing found issues requiring repair. This is a broad live and local audit, with explicit limits on unexecuted workflows; it is not a certification that every possible defect has been eliminated.

Local repair follow-up: see [LIVE_FIXES_2026-10-15.md](LIVE_FIXES_2026-10-15.md) for tested code changes, source-link remediation and remaining limitations. The original results below describe the pre-repair state; repairs have not yet been deployed.

The live target was **https://www.herbalai.site**. The older `herbalaiph.vercel.app` address redirected there. The public site's CSP identified the current production Railway backend. Authenticated browser checks used Mercado Kevin's contributor session and Admin Kevs in the Gina Chrome profile. Gmail delivery was verified in the user's Mercado mailbox. Times below use Asia/Manila.

The local checkout was `codex/readability-accessibility`, HEAD `c536983`, with pre-existing edits to the chat controller and several frontend files. Those application edits were preserved. Local source results must be distinguished from deployed behavior: live chat deducted credits correctly during this run, while the edited local controller failed its credit safeguards.

## Confirmed findings

| ID | Priority and scope | Finding | Evidence and reproduction |
|---|---|---|---|
| QA-01 | High; local release blocker | The existing edited chat controller removes credit reservation/settlement/replay, disconnect/deadline handling, structured recovery errors, and bounded safety-context retention. | Current code failed 41 checks across four focused suites and eight additional real-PostgreSQL wallet checks. In an isolated copy, changing only this controller to its committed HEAD version made all 144 tests in those five suites pass. See the comparison below. |
| QA-02 | Medium; live administrator UI | Audit history is truncated with no paging control. | The actual authenticated response reported `total: 155`, `logs.length: 50`, `limit: 50`, `offset: 0`. The rendered page contained 50 rows and zero Next buttons. Consequently, 105 older records were inaccessible through this screen. Open Admin → Audit Logs. Local source requests `/admin/audit-logs` without offset and discards pagination metadata. |
| QA-03 | Low; live administrator UI | Audit search cannot find a displayed target ID. | Copy an ID from a visible audit row and paste it into “Filter audit logs.” The row disappears and zero matches remain. The frontend filter checks action, target type, actor and details, but omits `targetId`. |
| QA-04 | Low; live administrator UI | An unmatched audit filter produces a blank table without an empty-state message. | Search `qa-no-audit-match-20261015`. The table header remains with no rows, result count, explanation or clear-search control. See the audit screenshot. |
| QA-05 | Editorial review; live catalog | 107 of 238 records have source URLs that all resolve structurally to website homepages, or lack an individual source URL. | Every public record was inspected. For example, some citations name a specific plant while linking only to the StuartXchange homepage. This weakens precise verification; it does not establish that the medicinal statements are incorrect. The JSON receipt lists every affected record. |
| QA-06 | Dependency maintenance; local dependency graph | npm audit reports affected packages in both apps. Deployment exposure was not established. | Backend: one critical and one high package entry. Frontend: seven high package entries, including transitive duplicates of the same advisory. Details below distinguish runtime and tooling dependencies. |

Relevant local implementation locations are `herbalaibackend/src/controllers/chat.controller.ts`, `herbalaifrontend/app/admin/page.tsx` (audit fetch near line 420 and filtering near line 2201), and `herbalaibackend/src/controllers/audit.controller.ts` (existing limit/offset response).

### Controller regression comparison

| Suite | Edited local controller | Committed controller in isolated comparison |
|---|---:|---:|
| `chat-cancellation.test.ts` | 6 failed / 6 | Passed |
| `chat-provider-error.test.ts` | 3 failed / 3 | Passed |
| `credits-chat.test.ts` | 29 failed / 30 | Passed |
| `pediatric-conversation-help.test.ts` | 3 failed / 43 | Passed |
| `credits-database.test.ts` | 8 failed / 62 | Passed |
| Total | **49 failed, 95 passed / 144** | **144 passed / 144** |

The real database failures included HTTP 200 instead of HTTP 402 at zero balance, duplicate generation on an idempotent replay, missing reservation/refund records, incomplete recovery metadata, and missing disconnect signals. The mock providers used synthetic content and credentials. These tests did not call Gemini or PayMongo.

For the comparison, the current backend sources, tests and required configuration were copied into a temporary directory. Only `src/controllers/chat.controller.ts` was replaced there with `git show HEAD:...`. The same installed dependencies and isolated database were used. The primary checkout's controller was never replaced. The comparison log was retained and the temporary source copy and dependency junction were removed afterward.

### Dependency audit interpretation

| Package/path | Installed version | Reported issue | Scope |
|---|---:|---|---|
| Express → `proxy-addr` | 2.0.7 | Critical [IP trust-subnet advisory](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) | Runtime dependency. The advisory concerns particular IPv4-mapped IPv6 trust-subnet configurations. This source uses numeric `trust proxy = 1`; this audit did not demonstrate the advisory's exploitation in the application. |
| Vitest/Vite/PostCSS → `source-map-js` | 1.2.1 | High [indexed source-map denial-of-service advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | Backend development tooling; also appears in frontend build dependencies. |
| Frontend ESLint → fast-glob/micromatch → `braces` | 3.0.3 | High [nested-pattern stack-exhaustion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Development tooling. npm counts affected parent packages separately. |
| Next → `sharp` | 0.35.4 | High [librsvg dependency advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | Runtime image dependency; no exploit test was performed. |

The raw audit JSON files preserve npm's affected ranges and proposed fixes. Do not apply its suggested ESLint-config major-version change blindly: this project uses Next 16. A package audit is evidence of affected dependencies, not proof of a successful attack or an inventory of the live deployment's installed packages.

## Executed checks

| Area | Observed result |
|---|---|
| Public live API, images and HTTP routes | **539/539 checks passed**. All 238 herb detail endpoints and all 238 unique images returned successfully. Complete catalog pagination had no duplicate IDs or exact scientific-name strings after trimming and case normalization. Required fields and source presence passed. |
| Transport and security boundaries | **15/15 passed**: trusted/untrusted CORS, cross-origin mutation rejection, HTTP→HTTPS, Google OAuth redirect and protected state cookies, install manifest and icons, polling handshakes, rejection of mismatched/missing Socket.IO protocol revisions, and subsequent API health. |
| Browser catalog pagination | All **20 pages / 238 unique cards** visited. Final page contained ten cards; Next was disabled. |
| Public responsive geometry | **27 page/width observations**: nine pages at 320, 768 and 1440 pixels. No document horizontal overflow, unnamed buttons or completed broken images were detected at capture. This was a limited structural check, not an axe/WCAG audit. |
| Anonymous protected routes | Chat, Messenger, Suggestions, Credits and Admin redirected to sign-in. The four contributor routes preserved their callback. Admin redirected without a callback. |
| Authentication | Empty signup validation, empty login validation, neutral invalid-credential feedback, actual contributor logout, protected-route denial after logout, actual Google account selection and successful return to `/suggest` passed. The user's session was restored. |
| Gmail recovery delivery | One recovery request was accepted; the email arrived in Inbox at **8:57 PM**. Links used `https://www.herbalai.site/reset-password`, contained a token and stated one-hour expiry. The token was not used, copied into the report or displayed in screenshots. No password was changed. |
| Live Dr. Ai | Known-plant answer completed with source links. Invented `moonflower xyz` request refused unsupported guidance and displayed no source cards for that answer. The wallet changed 6 → 5 → 4 test credits. |
| Saved answers | The latest answer reopened correctly, and the wallet stayed at four credits. The same four-credit balance remained after logout and Google sign-in. |
| Library interactions | Search, unknown-search empty state, DOH results, Lagundi detail, source disclosure and Escape dismissal exercised. API checks also covered scientific/common-name search, surrounding whitespace and category filters. |
| Suggestions | Required empty-form validation identified all seven required controls. Existing submission/history UI and phone geometry inspected; no submission was created or moderated. |
| Messenger | Conversation list and recipient selector loaded. Whitespace-normalized administrator search worked. Selection, empty-send disabling, 320px composer bounds and back navigation passed. No message was sent. |
| Community | Search empty state and new-discussion form inspected. Blank publication was prevented by all three required controls. No discussion or reply was published. |
| Account and notifications | Protected identity fields were read-only in settings. The profile dialog fit within 320px. Notification categories rendered on phone width. Existing alerts were not bulk-cleared. |
| Administrator | Dashboard totals loaded: 238 herbs, 15 users, 40 KB facts. Moderation counts and empty pending queue loaded. Herb search/editor, user-search empty state, KB empty state, required KB publication validation, and audit defects above exercised. No existing record was saved or deleted. |
| Frontend/root Node regressions | **574/574 passed** on the final full run. |
| Backend filtered regression run | **2,380 passed, 41 failed, six skipped across 142 files**. The four failing files were the controller suites listed above. Known external-database suites were explicitly excluded from this run. |
| Isolated PostgreSQL wallet suite | **54 passed, eight failed / 62** against loopback `herbalai_test` on port 55438. This minimal wallet schema does not replace the full application migration/pgvector gate. |
| Focused committed-controller comparison | **144/144 passed** across five files, including the real wallet suite. |
| Backend lint, source TypeScript and production build | Passed; lint/typecheck repeated after dependency installation was reconciled. |
| Frontend lint, TypeScript and production build | Passed. |
| Offline research-generator Python regressions | **7/7 passed**. |

The initial broad backend attempt produced 2,458 passes, 71 failures and 225 skipped tests across 174 files. It included unavailable-database failures and stale installed dependencies and must not be presented as a clean full-suite pass. Installing the existing backend lockfile with `npm ci --ignore-scripts`, then generating Prisma, resolved the installed Prisma/Socket.IO drift: all eight focused compatibility/protocol tests passed. The final filtered run and real database comparison above distinguish the remaining application regression from those setup issues.

The initial Node run also found five failures caused by a missing `userJustSubmittedRef` in the extracted chat-handler test context. Adding that one reference to `scripts/dr-ai-stream.test.mjs` repaired the harness; it did not change application behavior. One intermediate rerun overlapped dependency installation and could not load Socket.IO. The final sequential rerun passed all 574 tests.

The public audit's preliminary expectation for `search[x]` was corrected: Express treats that key as an unknown parameter, rather than a non-string `search` value. A repeated-key query (`search=a&search=b`) exercised the intended invalid-filter contract and returned 400. The saved JSON contains the correction note.

At concurrency three, the 238 public detail requests had client-observed p50 **328 ms**, p95 **385 ms**, and maximum **743 ms**. These are measurements from this bounded availability audit, not a production stress-test or capacity acceptance result.

## Coverage still requiring a separate execution

The full PostgreSQL/pgvector migration suite remains unexecuted in this environment. The available portable PostgreSQL instance has no pgvector extension. No live create/approve/reject/resubmit/ban/delete cycle, new-message real-time delivery, attachment upload, payment checkout/fulfillment, password replacement, new-account verification activation, production outage, backup/restore or destructive recovery exercise was performed. Existing automated coverage is useful but does not certify these live end-to-end flows.

Physical-device keyboard behavior, assistive-technology acceptance, comprehensive WCAG testing, high-concurrency load, stakeholder UAT and the factual correctness of all medical content were outside this execution. Saved-answer buttons also share the same accessible name (“Open saved answer”); adding date/context to each label would improve navigation, but no replay failure was observed.

## Evidence and final state

Receipts are in `output/live-qa-2026-10-15/`:

- `public-api-audit.json`: all 539 public checks and the 107 source-link review records.
- `transport-security.json`: all 15 transport/security outcomes.
- `public-layouts.json`, `library-pagination.json`, `anonymous-protected-routes.json`, `browser-execution.json`: browser receipts.
- `baseline-comparison.log`: 144 passing focused tests with only the committed controller substituted in a temporary copy.
- `gmail-recovery-delivered.png`, `recovery-request-320.png`, `oauth-restored.png`, `chat-320.png`, `admin-herb-editor-320.png`, `audit-filter-empty.png`: screenshots.

Additional logs in `output/` have the prefix `live-qa-2026-10-15-`: `backend.log`, `backend-nondb.log`, `wallet-database.log`, `node-final.log`, `frontend-build.log`, `dependency-retest.log`, `backend-audit.json`, `frontend-audit.json` and `python.log`.

Two AI answers and one recovery email were the intentional live test effects. Two test credits were consumed; four remained after sign-in was restored. No catalog/forum/message content was published or edited, and no payment was submitted. The user's existing local application edits, credentials and deployment settings were preserved. Browser viewport overrides were cleared, the Gina page was returned to its dashboard, temporary baseline files were removed, the isolated wallet schemas were verified absent, and the portable PostgreSQL server was stopped.

Recommended repair order: reconcile the local controller with the required credit/cancellation/safety contracts; add administrator audit pagination and complete filtering/empty states; review affected dependencies with compatible patches; then improve precise source links. Re-run the full isolated pgvector gate and controlled live write workflows before treating a release as fully accepted.
