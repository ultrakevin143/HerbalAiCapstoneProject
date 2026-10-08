# Refresh-owner cancellation — 1 October 2026

## Scope and baseline

Production remains at `b95122a3a1bf486bd0f86e903f1a01c02808d788`. The prior uncommitted queue-cancellation repair and documentation are preserved in the selective-release-check worktree. The primary checkout is untouched. This batch extends cancellation handling in the shared Axios interceptor; it changes no layout, styling, backend, migration, live credential, or database record.

Plan: reproduce cancellation of the request that initiates refresh; repair it without canceling another caller's refresh; test owner/queue settlement and cleanup; document actual validation without automatic publication.

## Reproduced failure

The prior local fix gave queued callers an independent abort listener, but the request initiating refresh still directly awaited the refresh POST. Aborting that original operation did not settle its promise until refresh completed or reached its ten-second timeout.

The new baseline regression held refresh behind a deferred promise, started an owner and another unauthorized caller, aborted the owner, and checked its result before releasing refresh. The assertion failed: `canceled refresh owner is still waiting for shared refresh`. The remaining caller could subsequently succeed; the defect was delayed owner cancellation, not an inability to refresh an active session.

## Focused repair

- Every eligible unauthorized caller, including the initiating request, now waits through the same abort-aware queue. Each keeps its existing one-retry flag.
- The shared refresh job settles the queue independently of any individual caller. Canceling an owner immediately rejects that caller with Axios `ERR_CANCELED`, removes its listener/queue entry, and does not cancel refresh needed by other callers.
- A caller arriving after owner cancellation still joins the same active refresh rather than starting another request. Canceled callers are never replayed.
- Refresh success and failure clear the lock and drain the remaining queue. Refresh failures are handled even when all callers have canceled, preventing an unobserved refresh rejection.
- Existing ten-second refresh and thirty-second request budgets, credential cookies, terminal 400/401/403 handling, bootstrap logout suppression, transient-failure handling, and non-replayed timed-out writes are preserved. The redundant rethrow-only queue catch was removed.

If every caller cancels, an already started refresh may continue until its existing finite deadline. This is intentional shared-operation ownership, not proof that the backend or a cookie-rotation transaction was canceled. An already submitted business operation is not undone by rejecting its client promise.

## Executed regression evidence

The targeted baseline test failed before repair and passed afterward. Twelve additional cases extend the previous combined total of 73 to **85 passing cases**: 34 shared-session tests, 30 Messenger tests, and 21 Dr. Ai stream tests. The counts overlap previous batches and must not be added together as separate unique coverage.

New checks cover prompt owner rejection while another caller remains active; owner listener cleanup on success/failure/cancellation; remaining-caller behavior after refresh HTTP 400/401/403/503; subsequent recovery; a caller arriving after owner cancellation; observed refresh failure after its sole caller cancels; a pre-canceled request entering neither adapter nor refresh; and native HTTP behavior. Existing queue cancellation, single-refresh/one-retry, invalid-login non-recursion, transient session state, timeout-write, route-guard, and native stalled-refresh regressions remain passing.

The native HTTP fixture bound an ephemeral loopback port and used the installed Axios HTTP adapter without accelerating its ten-second refresh budget. The server deliberately held the refresh response open. The owner was canceled and rejected with `ERR_CANCELED` before a separate one-second assertion deadline, while the refresh response was still open. Releasing that response allowed the remaining caller to complete with HTTP 200; exactly one refresh occurred and no logout event was emitted. The fixture destroyed its sockets and closed its server in finally. No real account, cookie, email, production database, or external provider was used.

`node --test scripts/auth-refresh.test.mjs scripts/messenger-sync.test.mjs scripts/dr-ai-stream.test.mjs` completed with 85 passes, zero failures, cancellations, or skips. `git diff --check` passed. Full lint, typecheck, and production build results are recorded after completion below.

## Release and browser boundaries

No commit or push is performed for this local repair. The prior policy-blocked controlled browser session-outage/retry gate is not reclassified as passed by native HTTP or actual-callback tests. No alternate preview launcher or policy bypass was attempted. A loopback-only build artifact must not be deployed; any authorized release must rebuild using production configuration and pass isolated CI before publication.

Historical forgotten-old-password rejection, genuine human tab resume, and participant acceptance retain their distinct evidence boundaries. This repair does not claim a new full live account lifecycle or participant/device result.

## Final executed validation

Full frontend ESLint, standalone `tsc --noEmit`, and the production Next.js build completed with exit code zero after the owner-path repair. The build generated 22 routes and used an explicit loopback API URL, not a production credential. The final combined regression run passed all 85 cases. `git diff --check` passed; CRLF conversion notices are not failures.

A read-only request to the published frontend's `/api/health` returned status success. This checks the existing release only; it does not validate the unpublished cancellation repair. No new browser tabs, preview processes, live writes, emails, or password operations were initiated in this batch. The focused source/test changes and documentation remain local for review and isolated CI before authorized publication.

## Combined review and CI-only gate

The next user-authorized step reviews the combined queued/owner cancellation repairs and runs isolated CI on the existing `codex/mvp-acceptance-ci` branch only. Main and the deployment branch are not updated by this gate. The intended seven files comprise the shared Axios module, its regression file, the two cancellation reports, and the three prior-release evidence/session/gate follow-ups. No fixture executable, ignored build output, credential, migration, unrelated primary-checkout file, or application styling change is included.

Review identified a possible timing race in the native HTTP test: receiving a request on the fixture server did not prove the client had processed its 401 and joined refresh. The fixture now signals when the actual HTTP adapter rejects that second request, then allows its interceptor microtasks to settle before aborting/releasing the owner. This is a deterministic test-fixture safeguard, not a newly reproduced production failure. The reviewed combined suite again passed all 85 cases. CI outcomes and the exact tested commit are recorded only after observation.

## Observed combined CI result

The reviewed seven-file batch was committed as `f3ec55af291f72f929e556cd9b82ef3598d09b50` and pushed only to the existing `codex/mvp-acceptance-ci` branch. GitHub Actions run `36859603474` completed successfully. Actual job logs report **481 backend tests across 63 files** against isolated PostgreSQL and **85 frontend regressions**: thirty Messenger, thirty-four shared-session, and twenty-one streaming cases. Backend/frontend lint and typechecks, all regression steps, and the frontend production build passed. Local lint/typecheck/build also passed again after combined review.

The backend job was `110360282490`; the frontend job was `110360282874`. Run evidence: https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36859603474 . No live database or mail/provider credential was supplied to the isolated CI suites.

Remote refs confirmed main and `codex/readability-accessibility` remain at `b95122a3a1bf486bd0f86e903f1a01c02808d788`, while only the CI branch advanced to the reviewed commit. No production release is claimed. This closes combined review and isolated-CI gates, not post-release authenticated browser acceptance or the policy-blocked controlled browser-outage/retry check. This exact post-CI evidence is a local documentation follow-up, not a second commit or deployment.

## Authorized release and live checks

The user subsequently authorized release. The exact CI-tested commit `f3ec55af291f72f929e556cd9b82ef3598d09b50` was atomically fast-forwarded to main and `codex/readability-accessibility`; no force push or new production code change was included. Main CI `36860420196` and deployment-branch CI `36860419767` completed successfully. Vercel and Railway commit statuses both reported success. The two pre-existing local post-CI evidence edits were preserved and were not added to this release. No ignored loopback build, fixture executable, credential, migration, or primary-checkout file was pushed.

After both deployments reported success, agent-created test tabs reloaded the live contributor Suggestions page and the Gina administrator dashboard. Herbal QA restored its protected form and My Submissions; `/api/auth/me` returned HTTP 200. Admin Admin restored its dashboard statistics without Forbidden. Rejected suggestions displayed the existing eleven records and page two of two loaded. Administrative Audit Logs loaded its table (eighteen DOM rows, not eighteen newly created audit entries) without Forbidden. No administrative mutation or suggestion/discussion submission was performed.

A controlled connection-failure check used CDP request blocking only in the isolated contributor test tab. Blocking that tab's `/api/auth/me` request while reloading Suggestions displayed `Connection interrupted`, retained `/suggest`, and offered Try again. The captured matching request had `blockedReason: inspector`; it was not a server rejection, expired token, or production outage. Blocking was removed in finally. Clicking Try again restored the same contributor, protected form, and My Submissions without another login.

The same tab-only check on `/community/new` retained that route, displayed the connection-recovery screen, and restored Start a Discussion and its fields through Try again after removing the block. These are actual browser initial-session connection-failure/retry observations. They do not force a token-refresh 401 or stalled refresh, and therefore do not replace the native/CI evidence for prompt owner/queued cancellation and shared-refresh timing.

Messenger restored the contributor, retrieved conversations with HTTP 200, and displayed the existing administrator test conversation and persisted test message after selection. The initial empty sidebar was transient while data loaded, not a lost-history result. Its composer was enabled and Send remained disabled for empty text. No message was sent, edited, or deleted; opening existing history can use the application's normal read-receipt and socket requests. A later buffered network read reported truncated older events, so it was not treated as an exhaustive request trace; the captured HTTP responses and visible history are the bounded evidence.

Live `/api/health` returned HTTP 200/status success. No new functional failure was observed in these checks. Actual screenshots are saved outside Git at `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/session-release-unavailable-20261001.png` and `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/session-release-recovered-20261001.png`. All request blocks were removed, network instrumentation disabled, and both agent-created tabs closed. The original user's Suggestions tab and any drafts were untouched.

This closes reviewed publication and bounded authenticated acceptance for this batch, plus browser connection-failure/retry on these two protected forms. It does not claim a fresh signup/email/reset lifecycle, live refresh-timeout/owner-abort reproduction, actual provider interruption, physical-device acceptance, old-password rejection, or participant UAT. This post-release evidence remains local for the next documentation batch; no second push was made solely to record results.
