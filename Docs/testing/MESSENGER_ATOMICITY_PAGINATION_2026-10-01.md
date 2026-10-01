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
