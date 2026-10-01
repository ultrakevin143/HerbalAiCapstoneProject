# Messenger atomic mutations and history pagination — 1 October 2026

## Reproduced findings

1. **Edit after deletion:** controller ownership/deleted-state checks and the repository update were separate. The update matched only the message ID, allowing a deletion between those operations to be followed by a write restoring text to a deleted record.
2. **Repeated deletion:** an already-deleted message could be updated and broadcast again. Concurrent deletes had no authoritative non-deleted predicate in the database.
3. **History gaps:** history ordered and paginated only by time. A page ending within a group of equal timestamps excluded the remaining siblings on the next request.

Before repair, the focused HTTP/repository checks produced **11 failures and 23 passes across 34 cases**. These were controlled router and repository-boundary reproductions, not deliberate destructive requests to production. The later real-database fixtures verify actual PostgreSQL behavior separately.

## Repairs and compatibility

- Both mutations now match ID, authenticated sender, and `isDeleted: false` in the database update. Only Prisma's actual `P2025` missing-match error becomes a null result; unrelated failures still propagate. A lost mutation race returns HTTP 409 without a socket broadcast. A subsequent delete of an already-deleted message returns 404; editing a message already known to be deleted retains the existing 400 response. Deletion still clears text and image URL together.
- History uses descending `(time, id)` order and a matching tuple boundary, then returns each page chronologically as before. `nextBefore` now contains `ISO timestamp|message ID`. The current frontend already forwards this string through URL encoding without parsing it, so no frontend change is necessary.
- Previous canonical ISO timestamp cursors remain accepted with their original strict-before semantics. They cannot retroactively recover siblings skipped by an old timestamp-only cursor. Newly returned cursors include the tie-breaking ID. Empty, repeated, invalid-calendar, extra-part, zero-ID, and oversized-ID cursors are rejected before database queries.
- The tuple boundary is combined with, rather than substituted for, both directions of the authenticated user's conversation. A cursor is not an authorization token. No schema migration, environment-variable change, dependency update, or frontend edit is included.

## Validation scope

- Local focused Messenger tests: **38 passes across three files** after repair, covering HTTP authorization/input/state handling, exact repository predicates, cursor ordering, and existing notification behavior.
- Backend build, source lint, targeted test lint, and Git whitespace validation are checked before release. No PostgreSQL/Docker service is available locally; local mocked repository checks are not claimed as database concurrency proof.
- Four additional real-database cases use the existing guarded loopback `herbalai_test` fixture: wrong-owner/stale-state mutations, simultaneous deletions, edit/delete concurrency, and eight history records including six equal timestamps plus an unrelated conversation. Fixtures clean up their uniquely identified users and associated records. Cloudinary and socket delivery are mocked in that isolated suite; no live mail or provider calls are made.
- Full isolated CI, deployment, and live outcomes are pending at this point and must be recorded below after observation. No bulk equal-timestamp fixture is inserted into the public database.

## Remaining evidence boundaries

The prior two-profile live send/edit check passed. Its native delete confirmation stalled browser automation, so deletion remains unobserved there until the tester clears the prompt or a fresh controlled check succeeds. This browser-tool limitation is not counted as a backend failure. Other historical manual gaps and unrecorded participant UAT remain separate; this report does not claim every system flow is error-free.

## Executed CI and release results

- Code commit `a58cf1d3454045d0c79255ece929ae508f2cb03b` passed temporary-branch CI run `36794997024`. The complete backend suite passed **412 tests across 60 files**, including all eight authenticated Messenger database cases, nine repository-boundary cases, and 27 HTTP validation cases. PostgreSQL concurrency and timestamp-tie fixtures therefore passed against the isolated migrated database, not only mocks. Frontend lint/typecheck/build also passed without frontend source changes.
- After fetching and checking remote ancestry, the same commit was pushed to `main` and `codex/readability-accessibility`. Main CI `36795179643` and deployment-branch CI `36795179612` passed. Both `Vercel` and `herbal-ai-staging - HerbalAiCapstoneProject` reported successful deployment for that exact commit.
- Live `/api/health` returned 200. Anonymous conversation/history reads and deletion of the controlled QA message returned 401 before mutation. These authorization smoke checks are not substitutes for authenticated mutation tests.

## Live authenticated observations

- A fresh tab in the existing Mercado Chrome profile restored the Herbal QA contributor without credential entry. It loaded the controlled conversation with Admin Admin after a full reload. The older sender tab remained blocked by the browser automation's focus command; using a fresh tab resolved ordinary navigation and editing.
- The existing, agent-created TEST ONLY message was edited through the normal live UI twice; both observed `/api/messages/380` responses were HTTP 200. The Gina administrator's full reload loaded the first saved edit from history. The second edit arrived in Gina without another reload, confirming realtime delivery after the receiver reconnected.
- **New reconnect follow-up:** Gina's already-open pre-deployment conversation did not display the first edit until reloaded, although that edit was saved successfully. After reload, realtime delivery worked again. This is an observed stale-tab behavior across deployment, not proof of the specific socket failure cause. Inspect reconnect/history reconciliation in a separate frontend-authorized batch; the present backend-only release does not claim to fix that behavior.
- Targeted deletion of only the disposable message opened the expected native confirmation. Both the high-level dialog handler and the supported raw dialog command stalled on the browser automation's focus setup. The tester has been asked to click OK in the new Mercado QA tab. **Deletion is still pending live confirmation**, not counted as passed; isolated authenticated deletion/concurrency coverage passed separately.
- A supplemental read-only browser navigation to the authenticated API history URL was blocked by the browser client before a page loaded. It is not counted as a live cursor result or application defect. Equal-timestamp pagination is verified by the isolated database fixtures; no bulk production messages were created to exercise it.
- A screenshot of the Gina receiver after the successful second edit is saved outside Git as `herbalai-messenger-atomic-edit-20261001.png` in the local temporary directory. No credentials, password reset links, or provider secrets are stored in this report.

Source inspection confirms the Messenger client currently logs `connect` but does not reconcile history there. That missing reconciliation is a candidate explanation for missed events during downtime, not a complete diagnosis of the observed connection state. No frontend code was changed in this backend-only batch.
