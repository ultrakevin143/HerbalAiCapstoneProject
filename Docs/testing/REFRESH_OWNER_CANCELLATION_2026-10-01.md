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
