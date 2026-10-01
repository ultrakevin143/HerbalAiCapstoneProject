# Queued request cancellation — 1 October 2026

## Plan and scope

1. Finish the backend lifetime release evidence and confirm authenticated live restoration.
2. Attempt the outstanding controlled browser session-outage/retry gate without interrupting production.
3. Reproduce and repair the next shared-request cancellation failure, run regressions, and retain the reviewed changes locally.

Baseline is published commit `b95122a3a1bf486bd0f86e903f1a01c02808d788`. Work uses the selective-release-check worktree; the unrelated primary checkout is untouched. This repair changes the shared HTTP interceptor, not UI styling, backend configuration, authentication permissions, credentials, migrations, or production data. Publication is not automatic.

## Reproduced failure

An unauthorized request queued behind the shared token refresh did not observe its AbortSignal until refresh settled and Axios attempted replay. When refresh stalls, navigating away or canceling that queued operation leaves its promise pending until the refresh's ten-second budget ends. The prior regression proved only that an aborted request was not replayed; it did not assert prompt cancellation.

The new baseline test executed the actual transpiled Axios module with its installed library. It held refresh behind a deferred promise, queued a second request, aborted that request, then checked settlement after one event-loop turn while refresh remained pending. It failed with `canceled request is still waiting for the stalled shared refresh`. This is one controlled functional failure, not an observed production outage.

## Focused repair

- Queued requests register an abort listener, immediately reject with Axios `ERR_CANCELED`, and remove themselves from the queue when canceled.
- Successful refresh, failed refresh, and cancellation all remove the queue's signal listener.
- Queue draining first takes ownership of its snapshot and clears the shared queue. Canceling one caller does not skip or cancel the remaining callers.
- The shared refresh remains available to other callers. Existing timeout budgets, cookie credentials, one-retry guards, terminal-session handling, and non-replayed timeout writes are retained.

This fix is limited to requests waiting in the shared queue. It is not proof that an already submitted server operation is canceled, or that the original refresh-owning caller now settles early when it aborts. That owner-path behavior requires a separate regression before any broader refactor.

## Executed checks

- The targeted baseline cancellation test failed before repair and passed afterward.
- Five new regression cases cover prompt rejection, preservation of the neighboring queued callers, and listener cleanup after refresh success/failure/cancellation.
- `node --test scripts/auth-refresh.test.mjs scripts/messenger-sync.test.mjs scripts/dr-ai-stream.test.mjs`: **73 passed**, consisting of 22 shared-session cases, 30 Messenger cases, and 21 streaming cases. These execute the actual implementations; the five new cases are included in the total.
- The isolated real loopback stalled-refresh case remains passing: both pending callers time out, the queue unlocks, and a later request recovers. No database, mail, real account, provider key, or production outage is involved.
- `git diff --check` passed after the repair. Full frontend lint/typecheck/build results are recorded below after completion.

## Controlled browser gate and cleanup

The existing temporary memory fixture was started on `127.0.0.1:4311`. An initial production preview on `127.0.0.1:4312` started, but its existing build still rewrote requests to loopback port 5000, not the prepared fixture. It was stopped rather than testing the wrong backend. A fresh Next.js build with `NEXT_PUBLIC_API_URL=http://127.0.0.1:4311/api` completed successfully and generated 22 routes.

Starting the rebuilt preview was then explicitly blocked by the execution policy. No alternate launcher or security bypass was attempted. The temporary fixture was stopped; neither test port remained listening at the subsequent check. No patched browser outage/retry pass is claimed. The loopback build is an ignored local artifact and must never be deployed as a production build.

The preceding backend release's live answer completion, matching stream abort on navigation, protected Suggestions restoration, and administrator statistics were recorded separately in `DR_AI_BACKEND_LIFETIME_2026-10-01.md`. The new cancellation repair is not deployed, and that prior live result cannot validate this uncommitted change.

## Remaining gates

Review the new shared-request diff and documentation, then run isolated CI before any authorized publication. Controlled browser outage/retry remains blocked. The original refresh-owner cancellation path is a separate candidate, not included in the queued-caller pass. Historical forgotten-old-password rejection, genuine human tab resume, and participant acceptance remain distinct; no password, physical-device, or participant result is invented.

## Final executed validation

Full frontend ESLint, standalone `tsc --noEmit`, and the production Next.js build all completed with exit code zero after the cancellation repair. The final build generated 22 routes and used only the explicit loopback fixture URL. The combined suite passed all 73 cases with zero failures, cancellations, or skips. The temporary fixture and preview were stopped. The reviewed local diff contains the shared Axios module, its regression file, this report, and release-evidence/gate follow-ups; no new commit or push was performed for this batch. Production remains at `b95122a3a1bf486bd0f86e903f1a01c02808d788`.

## Owner-path follow-up

`REFRESH_OWNER_CANCELLATION_2026-10-01.md` supersedes the pending owner-path audit: a new baseline test reproduced delayed cancellation of the initiating request, and the local interceptor now gives every caller independent cancellation while preserving one shared refresh. Twelve additional cases bring the combined frontend total to 85 passes, including an actual loopback HTTP owner-cancellation/remaining-caller recovery check. Publication and the policy-blocked browser outage/retry gate remain separate.
