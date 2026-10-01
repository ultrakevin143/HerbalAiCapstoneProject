# Shared request and session recovery — 1 October 2026

## Scope and baseline

Baseline: released commit `fcf424e8243695e1754a6628b7e7d11ea17317ff`. This batch changes frontend HTTP behavior and two protected-page recovery guards, not the normal page layout, palette, database, backend, production credentials, or deployment settings. The dirty primary checkout is untouched.

## Reproduced issue groups

1. **Unbounded HTTP and authentication refresh.** The shared Axios instance inherited timeout zero. A real loopback server returned 401 and deliberately never answered refresh; both callers remained pending until the test deadline. The instance now has a 30-second request timeout, with an explicit ten-second automatic refresh timeout. These are per-request budgets, not a promise that a whole initial request, refresh, and replay takes only ten or thirty seconds. Existing explicit caller timeouts still override the default. Direct refresh calls made outside this interceptor inherit the default budget.
2. **Queued unauthorized requests can refresh twice.** The primary caller set its retry flag, but callers queued behind it did not. The actual interceptor, executed with two concurrent unauthorized requests and a still-unauthorized queued replay, performed two refreshes. All eligible callers now set the one-retry flag before entering the queue. A replayed 401 is returned rather than initiating another refresh cycle.
3. **Two protected routes mistake an outage for logout.** Executing the actual Suggestions and new-discussion route-guard callbacks with loading false, authentication false, and sessionUnavailable true redirected both to sign-in. Both now preserve the route during a transient session-check failure and use the same existing SessionUnavailable component and forced checkSession retry as Messenger, Dr. Ai, and Admin. Confirmed unauthenticated access still redirects; loading and authenticated states do not.

The initial twelve-case suite had eight passes and four baseline failures covering the first two issue groups. The subsequently added two page-guard cases failed against the old page callbacks. These are six failing checks across three issue groups, not six independent production incidents.

## Repair safeguards

- Cookie credentials and same-origin `/api` routing are retained.
- Refresh HTTP 400/401/403 still settles the queue as session invalidation; a temporary HTTP 503 or timeout does not dispatch logout. Initial session bootstrap retains its existing invalid-session handling rather than duplicating navigation.
- Failed refresh releases the shared lock and queue so a later request can recover. Canceled queued requests are not replayed after refresh.
- Network failures/timeouts do not automatically retry a write. A timeout does not prove that a signup, suggestion, reset, or other write failed to commit on the server; inspect its result before submitting again.
- Knowledge-base import generates embeddings sequentially for up to fifty facts. Its existing request now explicitly allows a longer finite 120-second timeout rather than silently inheriting the new 30-second default. No import was submitted to production, and this client timeout is not proof of server-side job completion or cancellation.
- Existing styling is preserved. The shared connection-error component is reused; no replacement visual design is introduced.

## Executed validation

- `node --test scripts/auth-refresh.test.mjs scripts/messenger-sync.test.mjs`: **47 passed**, comprising seventeen new session/request/page-guard cases and thirty existing Messenger regressions.
- The new suite executes the actual transpiled Axios module with the installed Axios library, the actual AuthContext session-check callback, and actual route-guard/retry expressions. It does not duplicate those implementations as replacement business logic.
- Concurrent refresh success, queued terminal 401, refresh HTTP 400/401/403/503, recovery after failure, invalid login non-recursion, cancellation, non-replayed timed-out writes, retained existing-session state, initial unavailable-session state, restored profile, forced retry, and longer import budget passed.
- A real memory-only HTTP server bound to loopback on an ephemeral port stalled refresh. The test adapter retains and asserts the configured ten-second refresh timeout, then accelerates positive timeout budgets to 150 milliseconds for deterministic execution. Both callers rejected with ECONNABORTED, no logout was dispatched, and a later request succeeded. No real account, cookie, email, database, or external API is used by this server.
- CI configuration now runs the new regression file as a separate frontend step. No remote CI result is implied until the reviewed batch is pushed and its run is observed.
- The first production build passed; it predates the final two route-guard repairs. Final lint, typecheck, and build results will be recorded after their completion.

The final validation command subsequently completed with exit code zero: full frontend ESLint, `tsc --noEmit`, and the production Next.js build all passed with both route-guard repairs included. Twenty-two routes were generated. `git diff --check` also passed; line-ending conversion notices are not test failures. The final build used a loopback backend URL, not a production credential or the stalled memory fixture. It is a local build artifact, not a deployment.

## Browser and release boundaries

A separate local memory fixture was prepared outside Git for a browser-level stalled-refresh check. The environment rejected the local frontend preview-start command. No alternate launch mechanism or security bypass was attempted. The fixture process was stopped; no local browser recovery pass is claimed. The isolated HTTP and actual-callback tests above remain executed evidence, not a replacement claim for real browser/device acceptance.

This batch is local and uncommitted at this observation. The live site still runs the previous reviewed release; no published verification/reset link, live session, database credential, production outage, or destructive write was manufactured for this test. Publication and patched live checks remain separate release gates.

A read-only request to the live frontend's `/api/health` subsequently returned HTTP 200 and status success. This confirms the existing Vercel-to-backend health route responds; it is not proof that the uncommitted repairs are deployed or that every business/database/email flow passes.

## Remaining focused work

- After reviewed publication and CI, smoke-test restored sessions on both protected forms and Messenger. A controlled browser outage/retry observation remains pending because preview startup was blocked.
- Audit the direct Dr. Ai streaming fetch/reader timeout and cancellation path separately; this batch bounds Axios, not a streaming fetch or reader.
- Historical forgotten-old-password rejection, genuine human tab-resume behavior, and participant/physical-device evidence retain their previously documented boundaries. No result is invented or reclassified by this batch.

## Combined release follow-up

The user-authorized combined shared-session/Dr. Ai release is now on main and the deployment branch as `d8b701e40584d748855aa8cbec8aed1013ab46f2`. Temporary-branch CI `36851748995` passed before release (458 isolated backend tests and 67 frontend regressions); main CI `36852041749` and deployment CI `36852041668` also passed. Vercel and Railway commit statuses both reported success. See `DR_AI_STREAM_RECOVERY_2026-10-01.md` for the exact publication sequence and observed live results.

After deployment, fresh agent test tabs restored the existing contributor on Suggestions and the new-discussion form after reload, and restored the Gina administrator with dashboard statistics. Messenger also restored its heading and signed-in contributor after reload. Its initial view displayed an empty-conversation state before subsequent data settled; that transient view is not evidence that the account has no history. Existing message history was not opened or retested in this release check. These are healthy-network session-persistence checks, not an induced session-refresh outage/retry result. Local controlled regression evidence remains the basis for queued-refresh and transient-session behavior. No password/email operation or live administrative mutation was performed. The original user tab and primary checkout remain untouched; this evidence follow-up stays local for a later documentation batch.

## Queued cancellation follow-up

`QUEUED_REQUEST_CANCELLATION_2026-10-01.md` records the next locally reproduced failure: a canceled queued caller remained pending behind refresh despite being ineligible for replay. Its focused interceptor repair now rejects promptly and releases its listener without disrupting other callers. Five new cases increase the combined frontend regression total to 73. This is an uncommitted local repair, not a new live release. A fresh fixture-only build succeeded, but starting that rebuilt browser preview was explicitly blocked; the controlled browser outage/retry gate remains open.

`REFRESH_OWNER_CANCELLATION_2026-10-01.md` extends that local repair to the initiating request. A failing owner-cancellation baseline was repaired by independent caller waits around the shared refresh job. All 85 combined frontend cases pass, including native HTTP recovery with another caller still active. No new live release or browser outage/retry pass is implied; consult that report for final lint/build results and remaining gates.
