# MVP backlog audit — 3 October 2026

## Current status

The user requested a targeted scan of unresolved MVP checks and repairs for confirmed failures. This report reconciles historical evidence with the current release, then records the first backend repair batch. It does not claim an exhaustive security assessment or zero remaining bugs.

Production and remote main/deployment branches remain at `e51942c35c573438c09a91104a40d4951f36fa50`. The repairs below are local, uncommitted and unpublished. No hosting variable, migration, account credential, role, live database record or frontend styling was changed. The unrelated Desktop checkout and earlier dirty reports were preserved.

## Confirmed failure ledger — batch 1

All four groups are treated as medium-severity functional/recovery defects in this bounded audit. Verification delivery recovery receives the first release-review priority because it affects account access. No new critical authorization bypass was reproduced; that is not proof that none exists.

| ID | Scenario and baseline evidence | Location | Focused repair | Status |
| --- | --- | --- | --- | --- |
| B01 | Approval/rejection/change requests used permissive `parseInt`; `7junk` or `7.5` could reach record 7. Edit/resubmit accepted alternate numeric spellings and integers above PostgreSQL Int range. Controlled HTTP handlers reached repository lookups rather than rejecting the path. | `herbalaibackend/src/controllers/suggest.controller.ts:14`; all five ID-based mutation handlers | One strict positive decimal, safe-integer, maximum-2147483647 parser, used before database/provider work. Invalid paths return 400; valid and maximum-range IDs still reach the existing workflow. | Reproduced and fixed locally; not deployed |
| B02 | Cloudinary upload promises had no application deadline. A missing callback stayed pending after 20 seconds; duplicate errors logged twice. Installed SDK source defaults its transport timeout to 60 seconds, exceeding the existing 30-second shared frontend request budget. | `herbalaibackend/src/services/cloudinary.service.ts:4` | Add a 20-second application deadline and SDK transport timeout, clear timers on settlement, settle/log once, destroy failed upload streams, and ignore late callbacks. Existing safe MEDIA_UPLOAD_UNAVAILABLE response remains 503. | Reproduced and fixed locally; not deployed |
| B03 | Verification resend revoked previous links before saving and delivering a replacement. Replacement persistence or delivery failure could invalidate the user's existing unexpired link. Suppressed mail was reported as sent. | `herbalaibackend/src/services/auth.service.ts:350`, `herbalaibackend/src/repositories/token.repository.ts:124`, `herbalaibackend/src/utils/error-response.ts:7` | Prepare the replacement first; preserve prior links on failure, revoke the failed replacement, reject suppressed delivery, retire only earlier links after accepted delivery, and return a static safe 503 recovery message. | Reproduced and fixed locally; not deployed |
| B04 | Resend verification had no route schema validation. A missing request body returned 500; object/array/number/invalid email values passed to the service in intercepted HTTP tests. | `herbalaibackend/src/routes/auth.routes.ts:71` | Reuse the existing email-link schema before the controller, while retaining the existing IP limiter and neutral successful response. Malformed input now returns 400 before account lookup/mail. | Reproduced and fixed locally; not deployed |

The first ID/upload baseline run had 47 failing and 26 passing assertions across 73 cases. The resend delivery-ordering baseline had 6 failing and 2 passing assertions. The resend route-validation baseline had 6 failing and 4 passing assertions. These are regression-case counts, not 59 distinct defects. No malformed production mutation or deliberately stalled production provider was used to obtain these results.

## Recovery safeguards and limits

- Suggestion ownership, administrator authorization, optimistic revisions, reference requirements, evidence classes and publication transactions are unchanged. The integer check is not a replacement for authorization.
- Multipart HTTP tests cover new suggestion and owner resubmission timeouts. Both return safe 503 without calling the create/resubmit persistence operation or issuing a notification. Successful image paths still save one pending record. This establishes application persistence ordering, not automatic deletion of an asset a provider might finish creating late.
- An actual Cloudinary SDK request sent dummy bytes/credentials only to a temporary 127.0.0.1 HTTP fixture. The fixture withheld a response. The application rejected with MediaUploadError, and the native HTTP connection subsequently closed. The fixture was closed and the test-process environment restored. No real Cloudinary image, account or API key was used.
- That loopback check establishes the installed SDK's stalled-connection behavior, not immediate termination of all possible provider work or hosting-proxy behavior. Other upload consumers use the same helper, but their live image flows were not repeated here.
- Verification resend removes older links only after accepted mail. Cleanup excludes the replacement and any later-created token, so an older request finishing last cannot invalidate a newer delivered link. Tokens with identical creation timestamps are deliberately not mutually revoked; they retain the existing expiry/single-use redemption rules. This avoids leaving concurrent requests with no usable link.
- If older-link cleanup fails after accepted delivery, the service does not falsely report that delivered mail failed. Earlier links may remain valid until expiry. Failed-replacement cleanup is also best effort; failures are logged without mail credentials or token URLs. It is not claimed that persistence cleanup always succeeds during a database outage.
- The mail provider's acceptance is not proof of Inbox placement. The retryable error message is fixed application text and is safe in production; arbitrary provider errors remain redacted. Unknown/already verified addresses retain their neutral successful response. This is not a claim of eliminating every account-existence timing/error side channel.
- Password-reset cooldown, eight-character/new-password validation, token lifetime, single-use redemption, password change, session revocation, OAuth linking and Google permissions were not changed.

## Executed validation

| Check | Observed result | Boundary |
| --- | --- | --- |
| Final selected backend regression run | 523 passed across 57 files; 0 failed | Unit, intercepted HTTP, repository predicates and real loopback transport. Sixteen database-dependent files were deliberately excluded. |
| Real SDK stalled-upload fixture | Passed within the selected run | Actual installed Cloudinary SDK and native loopback HTTP; no real provider request. |
| Multipart suggestion upload recovery | 4 passed | Actual upload middleware/schema/controller/error mapping with intercepted SDK callbacks and persistence; no live database. |
| Final frontend/harness regression run | 243 passed; 0 failed | Existing nine native scripts, including auth feedback, password settings, session refresh, Messenger, Dr. Ai, library keyboard and deployment harnesses. Frontend source was not modified. |
| Backend ESLint and TypeScript build | Passed after the combined repair | No production startup or migration applied. |
| Git whitespace check | Passed during review | Existing line-ending warnings are not functional test failures. |
| Real PostgreSQL recovery regression | Added, not run locally | New case in account-recovery.test.ts verifies that the original email token remains redeemable after an intercepted resend failure. Requires isolated database CI. |
| Full remote CI/new release | Not run/published for this batch | Must not be counted as passed from the earlier release's CI. |

The broad backend run explicitly set DATABASE_URL and DIRECT_URL to a dummy loopback port with no database and suppressed external mail. It never used the live Neon URL. The excluded suites were account-recovery, auth, chat, audited-mutations, herb-governance, knowledge-authenticated-flow, forum-moderation-flow, herb-catalog-remediation, profile, review-publication-transaction, herbs, message-authenticated-flow, password-settings-database, suggestion-validation, system-features and session-rotation. Docker/PostgreSQL tools were not available in this environment. Failed baseline assertions and expected intercepted-provider logs are not counted as current failures.

## Current live baseline — read-only

Remote main and `codex/readability-accessibility` were checked and both still matched e51942c. Anonymous, credential-free requests observed:

1. Railway `/api/health`: 200, success.
2. `/api/herbs?search=Lagundi&limit=1`: 200, success.
3. `/api/forum/threads/999999999`: 404, Discussion thread not found.
4. `/api/suggest`: 401, Authentication required.

These are baseline checks of the unchanged release. They do not validate the unpublished repairs, mail delivery, authenticated uploads or suggestion publication. No browser session was disturbed and no new live record/email/password change was made in this pass.

## Reconciled MVP backlog

| Item | Current evidence/status | Next action |
| --- | --- | --- |
| Latest auth-feedback render/recovery defects | Repaired and deployed in e51942c; AUTH_FEEDBACK_2026-10-03.md | Do not reopen superseded local-only notes as current defects. |
| Suggestion request changes, owner resubmit, rejection and audit | Actual live ID 63 lifecycle passed in LIVE_MVP_ACCEPTANCE_2026-10-03.md | After authorized release, bounded valid-ID regression smoke; keep the synthetic record rejected. |
| Image upload/rejection | Earlier actual live image suggestion ID 61 passed, documented in LIVE_ADVERSARIAL_AUDIT_2026-09-30.md. Not a newly failed Cloudinary signature/configuration. | After release, a separately authorized, labeled image-upload/rejection test. Do not infer a current credential problem from an old failure. |
| Approval-to-library | Existing isolated transaction/governance coverage and historical approved records; not newly exercised in the current live cycle. | Run full isolated PostgreSQL CI first. Live publication needs a specifically approved, factually sourced plant/reference; never approve synthetic QA data. |
| Signup and verification delivery | Earlier Gmail-backed acceptance exists; the latest live cycle tested missing/invalid token recovery, not a new inbox delivery. B03/B04 are local repairs. | After release, one authorized disposable account/inbox cycle with user-completed credential entry. Do not induce a real mail outage. |
| Password change/recovery | User reported administrator old-password rejection, new-password login and refresh persistence. Separate disposable recovery/revocation/used-link evidence exists. Historical exact old password for mvpqa_unmid8j was forgotten. | Do not label forgotten-password testing as a defect. A fresh known-current-to-new comparison needs user participation; never infer exact old-password rejection from a random wrong password. |
| Google plus app-password lifecycle | Authorized link delivery, user-submitted setup and prior-session rejection recorded in PASSWORD_SETTINGS_2026-10-01.md; user reports the request action works. Complete matched-identity evidence is not supplied by a generic done reply. | Reconcile the same account's actual email/password and continuing Google sign-in before repeating mail. User must enter any private new password. |
| Messenger, Community and healthy AI completion | Latest live bidirectional delivery/edit, persisted comment, reversible like and cited AI completion passed; LIVE_MVP_ACCEPTANCE_2026-10-03.md | These passing workflows are not a reason for a styling rewrite or another synthetic public discussion. |
| Genuine tab resume / controlled timing races | Reloads and local callback tests exist, but exact human focus/timing evidence remains separate. | Bounded manual tab-resume check when available; do not claim deterministic regressions prove every live race. |
| Higher-page Community deletion | Existing regressions; live Community had four discussions at 25 per page. | Retain isolated coverage instead of manufacturing many public posts or deleting user content. |
| Hosting/provider termination and capacity | Controlled local deadlines/cancellation tests and healthy live checks; no sustained traffic or quota exhaustion. | Record as infrastructure/provider limits, not automatically as an application bug. Do not induce production outages. |
| Physical-device / participant acceptance | Prior user phone spot-check is a self-report; participant campaign was declined. | Keep prepared handoff checklist. Do not invent participant records or call browser emulation a phone test. |
| Primary root/media/formal docs | Earlier root review identified unrelated local media and dirty academic documents; RELEASE_REVIEW_2026-10-03.md | Separate privacy/reference/content audit, not part of this backend release. No personal files or broad cleanup were published. |

## Batch 1 selective release proposal

Production source files (six):

- herbalaibackend/src/controllers/suggest.controller.ts
- herbalaibackend/src/services/cloudinary.service.ts
- herbalaibackend/src/services/auth.service.ts
- herbalaibackend/src/repositories/token.repository.ts
- herbalaibackend/src/routes/auth.routes.ts
- herbalaibackend/src/utils/error-response.ts

Regression files (nine):

- herbalaibackend/tests/cloudinary.service.test.ts
- herbalaibackend/tests/cloudinary-lifetime-loopback.test.ts
- herbalaibackend/tests/suggestion-id-boundaries-http.test.ts
- herbalaibackend/tests/suggestion-upload-recovery-http.test.ts
- herbalaibackend/tests/verification-resend-delivery.test.ts
- herbalaibackend/tests/verification-resend-repository.test.ts
- herbalaibackend/tests/verification-resend-validation-http.test.ts
- herbalaibackend/tests/error-response.test.ts
- herbalaibackend/tests/account-recovery.test.ts

Review this report with those fifteen files. CI already discovers tests/**/*.test.ts, so no CI workflow, dependency, schema, migration, frontend file or production variable change is required. Do not stage all dirty documents or include local fixture settings/credentials.

Next gate: authorization for an exact selective commit/push to the isolated CI branch, full PostgreSQL-backed CI, then reviewed fast-forward release if main/deployment still match the expected baseline. Retain e51942c as rollback reference. After deployment, verify normal suggestion review/upload behavior, invalid-path validation without modifying real records, and one authorized verification resend/inbox check. Record only observed outcomes and preserve private credential handoffs. No commit or push occurred during this audit.

## Batch 2 — Library discussion — accumulated, not published

The user's latest instruction is to note fixes for a later combined push and continue the next job first. This supersedes any implication that the proposal above is authorization to stage, commit or release. The index remains empty and main/deployment still match e51942c. Unrelated working-tree changes are preserved.

Detailed evidence: LIBRARY_DISCUSSION_REGRESSION_2026-10-03.md.

| ID | Priority | Reproduced group / repair | Validation boundary |
| --- | --- | --- | --- |
| B05 | High | Library comment content, parent ownership/deletion and action-ID validation | Controlled HTTP tests pass; numeric/string valid parent compatibility and auth/ownership checks retained. |
| B06 | High | Published/verified herb scope for comment reads/writes and reaction eligibility | Controlled predicates and 404 responses pass; no hidden-target live mutation. |
| B07 | Medium | Reaction and count persisted together, row-lock intent before lookup, count recomputed | Local wiring/order/failure tests pass; actual PostgreSQL concurrency and rollback tests pending. |
| B08 | Medium | Socket broadcast failures no longer turn saved writes into false HTTP failures | Local create/like/delete success and real persistence-failure acknowledgement tests pass. |

Current combined validation: 587 backend non-DB tests in 58 files passed; 243 native/frontend/deployment harness tests passed; backend lint/build and whitespace checks passed. This supersedes the earlier 523-test local backend total, not the status of unexecuted database or live-release gates. Seventeen DB-dependent files were excluded, including the new five-case Library database suite, which refuses a non-isolated/non-loopback database.

Additional review files are HerbController, herb-comments-http.test.ts, herb-comments-database.test.ts and the new Library regression report. No schema, dependency, migration, frontend source or production environment change was made. Preserve the exact Batch 1 list above for the future combined review; do not stage the whole root.

Safe live baseline checks found health 200, a published Lagundi search result and comments 200/success with zero records on unchanged e51942c. They do not validate either unpublished batch. No browser session, real password, email, account, media or discussion record was changed.

Next source-level audit candidates: Library administrator comment-deletion audit coverage and immediate parent-delete/reply retention. These are explicitly not counted as fixed or accepted. See the Library report for the observed gap and proposed reproduction. Required before publication: complete isolated PostgreSQL CI and selective review; afterward only authorized, bounded live checks. No automatic push is scheduled by this report.

## Batch 3 — manual continuation, moderation and reply retention

The missed one-time automation was deleted and work resumed manually at the user's request. No scheduler cause is asserted. Release hold remains in effect; nothing was staged, committed, pushed or deployed.

| ID | Priority | Reproduced group / repair | Validation boundary |
| --- | --- | --- | --- |
| B09 | Medium | Missing administrator Library comment audit; conditional deletion and same-transaction audit; duplicate/deleted-target handling | Eight added HTTP cases included in 72 passing Library cases; real SQL atomicity/rollback/concurrency remains pending. Existing stale-role demotion protection was preserved, not newly fixed. |
| B10 | Medium | Replies temporarily disappear when their parent is removed from client state; shared SetNull-compatible reconciliation | Four behavioral baseline failures; twelve actual-callback/helper regressions pass. No mounted/physical-browser pass claimed. |

Evidence: LIBRARY_MODERATION_REPLY_RETENTION_2026-10-03.md. Combined local totals superseding previous totals: 595 backend non-DB tests in 58 files and 255 native harness tests in ten scripts, zero failed. Backend/frontend lint and source typechecks/builds passed; frontend build used only a process-local loopback API endpoint. Mechanical frontend detector and whitespace checks passed. The Library isolated DB suite now has nine cases, all locally unexecuted; the seventeen excluded DB-dependent files remain a release gate.

Additional source: herb-comment.repository.ts, audit.repository.ts, HerbComments.tsx and library-discussion.ts. The accumulated HerbController and two Library test files also changed; a native library-discussion.test.mjs and the new report were added. No schema, dependency, migration or production variable change is required by this batch. Eight unrelated existing evidence diffs and Desktop local/private files remain excluded from the tentative combined release list.

Read-only live health/Library returned 200 on unchanged e51942c. Root follow-up found 123 untracked files and sixteen media files; corrected basename scans retained twelve referenced QA screenshots and identified two screenshots without scoped documentation references. No media was deleted or published; full privacy/content review is pending. No live table was inspected or dropped.

Next: reproduce remaining Library creation/publication timing and realtime consistency cases, complete isolated CI after authorized selective publication to the CI branch, and retain the conditional production/manual acceptance gates. B01–B10 are local repair groups, not a claim of complete system acceptance.

## Batch 4 — Library transaction-time eligibility

Detailed evidence: LIBRARY_TIMING_GUARDS_2026-10-03.md. B11 (high) adds publication row locks to creation/reactions and the publication predicate to the comment read itself. B12 (medium) adds same-herb/nondeleted parent validation and locking in the insertion transaction. Five controlled baseline checks failed; the revised HTTP suite passes 80 cases. Actual PostgreSQL race results remain pending, not inferred from these mocks.

Combined executed totals now supersede earlier local totals: 603 backend non-DB cases in 58 files and 255 native harness cases in ten scripts, zero failed; backend lint/build and whitespace checks passed. No frontend source change was made in this phase. The isolated Library suite now has thirteen prepared/unexecuted cases and its error fixture uses the production errorResponse helper. Seventeen DB-dependent suites are still excluded locally. CI now explicitly runs the prior batch's native Library reply-retention script.

Anonymous live Library/health GETs returned 200; main/deployment still match e51942c. No production mutation, staging, commit or push occurred. Added selective review files: .github/workflows/ci.yml and the new timing report, in addition to the already accumulated controller/repository/Library tests and this ledger/work plan. Next: delayed/out-of-order Library realtime reconciliation; full isolated SQL CI remains a release gate.

## Batch 5 — Library realtime recovery

Evidence: LIBRARY_REALTIME_RECOVERY_2026-10-03.md. Six native baseline failures grouped into B13 (medium: canonical reaction/event/reconnect refresh), B14 (medium: one in-flight toggle and no stranded optimistic counts), and B15 (medium: duplicate creation acknowledgements must not advance mutation versions). Focused native Library cases now pass 33; actual-route controlled Library HTTP cases pass 81. Additive herbId reaction scoping preserves old fields/events and old-payload compatibility. Cancellation, obsolete socket/queue retirement, Strict Mode cleanup/setup and 404 clearing are covered locally.

Latest fresh combined results supersede earlier local totals: 604 non-DB backend cases in 58 files and 276 native cases in ten scripts, zero failed. Both applications lint/typecheck/build pass; frontend generated 22 static pages with only a process-local loopback API. Detector/whitespace checks pass; all 48 JSX class expressions match HEAD after line-ending normalisation. No mounted browser, real reconnect, SQL, physical-device or participant pass is inferred.

Anonymous live availability remains 200 on unchanged e51942c. No staging, commit, push or live write occurred. Additional source/test scope: HerbComments.tsx, library-discussion.ts, HerbController's additive reaction field, library-discussion.test.mjs, herb-comments-http.test.ts and this batch's report/ledger/work-plan updates. The prior CI step already invokes the native Library script. Seventeen excluded SQL suites, including thirteen Library cases, remain a release gate. Next bounded audit: MVP cache/account isolation and notification invalidation; root/media and academic content review remain separate.

## Batch 6 — account-scoped notification recovery

Evidence: NOTIFICATION_CACHE_RECOVERY_2026-10-03.md. Ten failing baseline cases grouped into B16 (high: owner-partitioned cache and notification lifecycle), B17 (medium: canonical totals/read-action race correctness) and B18 (medium: coalesced event/reconnect/tab recovery with fresh socket credentials). Owner keys supplement existing backend authorization and auth cache invalidation; no production leak is asserted. Library and notification refreshes reuse one coordinator. No stylesheet, layout, schema, migration, package or production variable change.

Fresh combined results supersede earlier totals: 604 backend non-DB cases in 58 files and 311 native cases in twelve scripts, zero failed. Focused total is 68 (33 Library, 12 cache, 23 notifications). A real loopback Socket.IO reconnect with synthetic credentials and controlled reads passes; it is not a mounted/authenticated live browser or SQL test. Frontend lint/typecheck/build pass, 22 static pages generated; 34 notification className expressions match HEAD and detector/whitespace checks pass. CI explicitly runs the added scripts and installs the already locked backend server dependencies with scripts disabled in the frontend test job. GitHub execution is still pending, not claimed passed.

Additional review scope: NotificationBell.tsx, request-cache.ts, notification-state.ts, refresh-coordinator.ts, Library's compatibility export/test loader, two new native scripts, CI and this batch's report/status appendices. All earlier batches and eight unrelated evidence diffs remain preserved. Index empty; no commit/push/live write. Anonymous Library/health returned 200 on unchanged e51942c; do not deploy the local loopback .next output. Seventeen SQL suites remain locally excluded. Next: reproducible notification HTTP ID/limit boundaries; source parseInt candidates are not yet counted as repaired or as ownership bypasses.

## Batch 7 — notification HTTP input boundaries

Evidence: NOTIFICATION_API_BOUNDARIES_2026-10-03.md. Thirty of sixty-two baseline HTTP checks failed before repair. B19 (medium) rejects malformed/noncanonical/out-of-Int action IDs; B20 (medium) rejects malformed/noncanonical/non-scalar or out-of-range list limits. Omitted limit remains 30; explicit limit is 1–100. Owner predicates, cookie/bearer authentication, revoked/banned-session rejection, global unread counts, safe failure mapping and idempotent zero-row acknowledgements are preserved. No authorization bypass or live Prisma failure is asserted from mocked persistence.

Final focused suite: 77 passing cases. Fresh combined totals supersede earlier totals: 681 backend non-DB cases in 59 files plus 311 native cases in twelve scripts, zero failed (992 unique cases in the combined runs). Backend lint/typecheck/build and whitespace checks pass. Seventeen SQL suites remain locally excluded; controlled predicates are not actual database acceptance. No frontend source, package, schema, migration or production setting changed. CI already discovers the new backend test.

Additional selective scope: notification.controller.ts, positive-int.ts, notification-boundaries-http.test.ts and this batch's report/ledger/work-plan appendices. All earlier changes and eight unrelated evidence diffs preserved; index empty. No commit/push/live write. Anonymous Library/health are healthy on unchanged e51942c. Next source candidate: administrator audit-log limit/offset boundaries, with role/session/demotion protection retained. Root/media and academic traceability remain separate; publication hold and SQL/manual evidence gates remain in effect.

## Batch 8 — administrator audit pagination and access

Evidence: ADMIN_AUDIT_PAGINATION_2026-10-03.md. Fifty-one of seventy-eight baseline HTTP checks failed before repair. B21 (medium) restricts explicit limits to canonical integers 1–100, retaining default 50. B22 (medium) restricts explicit offsets to canonical integers 0–10000, retaining default 0. Repeated/structured/alias/unsafe input receives 400 before audit queries. The shared Batch 7 integer parser is reused. Existing cookie/bearer auth, current-role checks, demotion/ban/deletion denial, safe failure mapping, global totals and administrator profile selection are preserved, not claimed as newly fixed vulnerabilities. No audit record was changed.

Fresh focused total: 155 passed (78 audit, 77 notification). Fresh combined results supersede earlier totals: 759 backend non-DB cases in sixty files plus 311 native cases in twelve scripts, zero failed (1070 combined cases). Backend lint/typecheck/build and whitespace checks pass. Seventeen DB suites remain locally excluded; no actual SQL consistency/concurrency/rollback or signed-in live administrator result is inferred. Anonymous audit route returns 401, Library/health 200 on unchanged e51942c.

Additional selective scope: audit.controller.ts, audit-pagination-http.test.ts and this batch's report/ledger/work-plan appendices. Include the preceding positive-int.ts dependency in the combined review. No frontend, schema, package, migration, environment or middleware change. All preceding changes and eight unrelated evidence diffs remain preserved; index empty and no commit/push/live write. Next: read-only root/media/reference and accumulated release-bundle review, excluding local credentials, fixtures, generated output and unrelated files. Full isolated SQL CI and later authorized authenticated acceptance remain release gates.

## Root/media review and combined release proposal

See ROOT_MEDIA_AUDIT_2026-10-03.md and COMBINED_RELEASE_REVIEW_2026-10-03.md. Desktop remains at aae460b, forty-five commits behind the checked e51942c baseline, with 123 untracked files and fifty-six tracked diff entries. Do not bulk-push that checkout. All fifty application image routes passed safe live HEAD checks; all thirty-seven catalog image URLs map to local assets. Four of fourteen visually inspected QA screenshots contain personal account details and remain excluded pending redaction. Six legacy images totaling 2549700 bytes are archival candidates only; no asset was removed. Ten existing formal-document relocations were checked: eight byte-identical, two Markdown files with additional text changes. No new formal content/visual acceptance claimed.

The exact proposal contains forty-seven paths: eighteen source, sixteen regression, one CI workflow and twelve evidence/proposal files. Eight unrelated dirty evidence docs and all Desktop/private/demo/generated material are excluded. A bounded secret-pattern scan identified only an intentional synthetic database-error fixture; no comprehensive credential/history certification is claimed. No new application change or test-count inflation: latest executed combined count remains 1070. Index empty, no commit/push/delete/move/production variable/database change. Next: obtain exact selective CI-branch authorization after checking provider isolation, then close all seventeen SQL-suite gates before production publication.

## Batch 9 — CI coverage and release isolation preflight

See CI_RELEASE_PREFLIGHT_2026-10-03.md. B23 (medium, release-validation gap) reproduced two native deployment regression scripts omitted from CI: one new coverage assertion failed while seven existing configuration cases passed. Added an explicit workflow step for both scripts; sixteen focused cases and all 312 native cases pass, zero skipped. Source application repairs are unchanged; prior 759 backend cases were not rerun in this CI-only batch. Parsed YAML using existing js-yaml after the separate yaml package proved unavailable; no dependency installed.

Read-only provider inspection confirms both live production surfaces watch codex/readability-accessibility; Vercel lists codex/mvp-acceptance-ci as Preview. Railway is Online, Wait for CI is OFF, and its dashboard shows Trial with 15 days or $4.28 left. Hosting continuity and an optional provider CI gate need owner review; neither setting was changed. No database identity inferred from project descriptions. Remote main, production and CI refs remain e51942c.

The proposal supersedes forty-seven with forty-nine paths, adding scripts/deployment-config.test.mjs and the preflight report. Eight unrelated document diffs, raw screenshots, Desktop/demo/private/generated material remain excluded. No stage/commit/push/provider/database change. Next: exact selective CI-only authorization, full isolated database acceptance, then separate production approval and bounded authenticated live checks. Seventeen SQL-suite and manual evidence gates remain open; no universal defect-free or defense-ready claim.
