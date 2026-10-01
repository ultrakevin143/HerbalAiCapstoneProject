# Dr. Ai streaming recovery — 1 October 2026, scheduled review

## Scope

Reviewed baseline: released commit `fcf424e8243695e1754a6628b7e7d11ea17317ff`, plus the uncommitted shared/session recovery changes described in `SESSION_REFRESH_RECOVERY_2026-10-01.md`. Work stays in the existing selective-release-check worktree; the primary checkout and its unrelated changes are preserved. No commit, push, migration, environment change, email, password operation, or live model-generation request is performed.

The repair is frontend behavior only: `lib/dr-ai-stream.ts`, the existing chat send/lifecycle callbacks, a new regression file, and its CI step. Normal UI markup, colors, spacing, medical-safety copy, retrieval, model selection, and backend authorization are unchanged.

## Reproduced issue groups and focused repairs

1. **Unbounded stream waits.** Fetch and reader waits lacked a cancellation signal or deadline. The helper now forwards an optional caller signal and bounds response headers to 30 seconds, initial stream data to 90 seconds, gaps after received bytes to 30 seconds, and the entire call including its optional authentication retry to 120 seconds. The first-data allowance accommodates the backend's retrieval/model-selection phase; it is not a measured production latency guarantee. Raw bytes reset the gap timer but never the total timer.
2. **Completion still waits for transport EOF.** The old parser recorded done but continued reading. A valid answer followed by done on a connection left open stayed pending. Validated done now finishes immediately, cancels the unused reader, releases its lock, and clears timers/listeners. An answer ending without done remains a failure.
3. **Abandoned or failed work leaks reader/lifecycle ownership.** Provider errors left the reader locked, and leaving the chat did not abort an active request. All helper exits clean up resources; unmount aborts the page-owned controller and ignores late callbacks/final state updates. This is client cancellation, not proof of cancellation of the remote Gemini job or its cost.
4. **Unvalidated payloads and unbounded event buffers.** Null or malformed sources, chunk text, or history could be accepted and passed into rendering. Recognized events now validate their consumed fields; empty completed answers fail instead of being accepted. Incomplete buffered data is bounded to 1,048,576 JavaScript string characters. Unknown event names are ignored. UTF-8 decoding, split CRLF, multiple events per chunk, and final done without a trailing blank line remain supported.
5. **Duplicate sends before React rerenders.** Two calls of the actual send callback with its unchanged isSending closure submitted two requests. An active-controller ref now provides an immediate lock in addition to the existing state-based control.
6. **Interrupted answers lose the question draft.** The old handler cleared the input, removed an incomplete model reply, and left no input to retry. Failure now removes that unsuccessful user/model exchange, restores the question without overwriting a newer draft, leaves model history unchanged, and unlocks the composer using the existing factual error message. Only a validated successful completion commits model history.

The original fifteen stream tests produced three passes and twelve failures before the helper repair. Separately, three actual page-callback tests failed before the page repair: duplicate calls, lost draft, and absent unmount cancellation. These are failing checks across six issue groups, not fifteen independent live incidents. No production outage was induced to reproduce them.

## Authentication and resource safeguards

- Same-origin `/api/chat/stream`, POST JSON, and credentials include are retained.
- Only the first HTTP 401 permits an authentication refresh and one replay. Refresh receives the same cancellation signal and a ten-second Axios timeout. The total deadline is not reset. A repeated 401 or HTTP 503 is surfaced; generation is not retried on network/provider failure.
- An already aborted call makes no network request. Success does not abort the caller-owned controller.
- Error details remain behind the chat's existing generic failure message; no credential, private token, or medical test data is added to documentation.
- Provider work after client disconnection, embedding-request budgets, full live response quality, and terminal-session navigation are separate server/system audit candidates. This batch does not certify them.

Implementation semantics were checked against [AbortController.abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) and [reader cancellation](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/cancel), and the installed Next.js client-boundary documentation was read before editing.

## Executed local evidence

- Combined command: `node --test scripts/dr-ai-stream.test.mjs scripts/auth-refresh.test.mjs scripts/messenger-sync.test.mjs` — **67 passed**: twenty stream/page cases, seventeen shared/session cases, and thirty Messenger cases.
- Tests execute the actual transpiled stream helper and actual chat callbacks/lifecycle cleanup, using native ReadableStream/Response objects. No replacement application business logic or real account is introduced.
- Deterministic timer tests manually fire the actual configured deadlines. They test deadline behavior without claiming a real 120-second wait or a browser/device measurement.
- A real Node HTTP server on an ephemeral loopback port stalled a native fetch response after partial data. Triggering the helper deadline rejected with TimeoutError. A subsequent valid done-but-open response completed successfully, and both server response-close events were observed. The server and sockets were cleaned up.
- Cancellation, error cleanup, malformed payloads, buffer limits, fragmented UTF-8/CRLF, truncation, one-retry 401, no-retry 503, duplicate-submit prevention, failure draft/history handling, unmount ownership, and normal successful history/composer behavior passed.
- Full frontend lint/typecheck and the production build completed with exit code zero; twenty-two routes generated. One previously existing eslint-disable became unnecessary after the callback repair and was removed. The clean lint/typecheck rerun after removing it is recorded in the follow-up below.
- The build uses a loopback backend URL and contains no production credential or demo-database configuration. It is a local artifact, not a deployment.

## Safe live checks and release boundaries

The published site's `/api/health` returned HTTP 200/status success. One credential-free POST with an empty JSON body to `/api/chat/stream` returned HTTP 401/status error. Code review confirms authentication runs before the rate limiter and chat generation. These observations cover the existing deployed health route and anonymous-access protection only; no authenticated Gemini request, quota-consuming adversarial run, or production outage was manufactured.

Local browser preview startup was blocked during the preceding session-recovery batch. No alternate launch bypass was attempted, and no new browser rendering, physical-device, or patched-live acceptance pass is claimed here. The original user Suggestions tab/drafts were not navigated or reloaded.

The combined shared-session/stream batch remains local and uncommitted. Proposed next gate: review the thirteen explicitly intended application/test/CI/documentation files, then obtain authorization for selective publication and observe isolated CI before release. After release, verify authenticated browser completion, navigation cleanup, protected-route recovery, and user-session persistence. Do not count existing live health checks as validation of code that has not been deployed.

Historical forgotten-old-password rejection and manual participant/tab-resume checks retain their previously documented limitations. No results are invented.

## Final validation follow-up

The clean frontend ESLint and standalone TypeScript rerun completed with exit code zero and no warning output after removing the unnecessary directive. The preceding successful build includes all behavioral repairs; that final removal changes only a lint comment. Six targeted backend tests passed across `chat-provider-error.test.ts` and `dr-ai-system-prompt.test.ts`, using mocked provider failures and local prompt assertions. No backend database suite or real Gemini integration test was run or claimed. The combined sixty-seven frontend regressions passed again after the real-response-close assertion was added.

`git diff --check` passed. The combined intended local batch comprises thirteen files: the CI workflow; four frontend pages (admin, chat, new discussion, Suggestions); the Axios and stream helpers; two regression scripts; and four testing reports/gates (New Chat release evidence, remaining gates, shared-session recovery, this report). No generated build, memory fixture, credential, or primary-checkout file belongs to that proposed push.

## Authorized publication and live acceptance follow-up

On 1 October 2026, the user authorized the reviewed combined release. Only the thirteen intended files were committed as `d8b701e40584d748855aa8cbec8aed1013ab46f2` (`fix(auth): bound session and Dr Ai stream recovery`). The primary checkout was not changed or staged. Local frontend lint/typecheck and all sixty-seven frontend regressions passed again before publication.

Temporary-branch CI [36851748995](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36851748995) passed before the exact commit was fast-forwarded to main and the existing deployment branch. Its actual logs recorded **458 backend tests across 61 files** against isolated CI PostgreSQL, and **67 frontend tests** (30 Messenger, 17 shared/session, 20 stream/page), with lint, typecheck, and builds successful. Main CI [36852041749](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36852041749) and deployment-branch CI [36852041668](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36852041668) subsequently completed successfully. GitHub commit statuses reported both Vercel and Railway successful. No production environment, migration, or database change was made for this frontend batch.

Post-deployment checks used a fresh agent-created test tab at `https://herbalaiph.vercel.app/chat`, reloaded after deployment, with the existing Herbal QA contributor session:

- **Offline failed-send recovery passed.** Only this browser tab was temporarily placed offline through its developer network control. A generic Lagundi question failed using the existing error notice; the unsuccessful exchange was absent, the exact question returned to the composer, and Send message was enabled. Online networking was restored in a finally block. No backend outage was induced.
- **Online completion passed.** Retrying that retained question online displayed a completed answer with source citations and the existing safety notice. The composer unlocked and was empty afterward; Send was disabled because there was no draft. This observes UI/transport completion, not an independent medical accuracy or comprehensive answer-quality certification.
- **Navigation cancellation passed on the client.** A second generic quick prompt visibly entered the source-checking state. Navigating to Suggestions while it was active produced a matching stream-request `Network.loadingFailed` event with `canceled: true` and `net::ERR_ABORTED`. Suggestions loaded normally. This confirms browser-side cancellation, not cancellation of remote Gemini computation or billing.
- **Protected-form refresh persistence passed.** Suggestions and the new-discussion form both loaded and restored the same contributor after agent-tab reloads. No suggestion or public discussion was submitted.
- **Gina administrator refresh passed.** The existing Admin Admin session restored after reloading the agent-created admin tab. Dashboard statistics loaded without Forbidden. The Rejected filter loaded eleven records and page two correctly showed the eleventh existing rejected test record; no decision was changed. Administrative Audit Logs loaded without Forbidden; no new audit write was exercised.

Evidence screenshots are saved outside Git in the local visualization workspace: `dr-ai-release-offline-recovery-20261001.png`, `dr-ai-release-completion-20261001.png`, and `admin-release-refresh-20261001.png`. These testing-document follow-ups remain local for the next documentation batch rather than triggering another deployment merely to record its results.

The original user Suggestions tab/drafts were not navigated or reloaded. Agent-created test tabs are cleaned up after checks. No new signup, verification email, password recovery, credential entry, upload, ban, deletion, or production write was performed. The prior email/recovery evidence remains historical rather than being relabeled as a new pass. Controlled outage/retry for protected forms, server-side provider cancellation/embedding budgets, forgotten-old-password rejection, genuine human tab resume, and participant/physical-device evidence remain bounded separately.
