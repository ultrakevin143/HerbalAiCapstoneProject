# New Chat search and pagination recovery — 1 October 2026

## Baseline and scope

Baseline application commit: `07a1811bdeb9f66f26e68a924bc0333808895ee7`. Focused audit of the existing Messenger New Message picker. The main checkout, palette, surrounding page layout, credentials, database schema, and deployment configuration are preserved. No new dependency or migration is required.

## Reproduced problems and repairs

1. **Failed-page retry skips users.** The old Load more handler incremented the offset before the request. Executing that actual handler and request callback with a failed second page showed the next retry requesting offset 40 instead of 20. The repaired loader advances the next offset only after a successful response and retries the failed offset unchanged.
2. **Overlapping pages duplicate contacts.** The old callback concatenated rows without checking IDs. A controlled overlapping response produced Alpha twice. Pages now merge by contact ID, while the offset advances by the server row count, not the deduplicated UI count.
3. **Failures appear as empty results.** Initial request failures only logged to the console; malformed response rows were accepted unchecked. The picker now shows a factual error and Retry loading users, preserves successfully loaded rows, and validates the response before changing rows, offsets, or pagination. It does not label a failed lookup No users found.
4. **Requests have no explicit timeout.** User lookup now has a ten-second Axios timeout, with the same retry path for failure. Search is trimmed and capped at the API's 100-character boundary. A current-request lock prevents overlapping loads; query generations retain stale-response protection across searches, closing, and reopening.
5. **Name/username patterns do not match literal-search expectations.** PostgreSQL-backed Prisma contains filters previously received raw percent, underscore, and backslash characters. The repository now escapes these characters before applying the existing case-insensitive name-or-username filter. Self exclusion, banned-user exclusion, selected public profile fields, deterministic ordering, take-plus-one pagination, and offsets remain unchanged.

Existing cancellation of superseded search requests was already present; it is not counted as a newly discovered stale-search bug. The new regression verifies that its replacement also prevents an old completion from clearing a newer loading state. Dialog, close-control, and search names are made explicit for accessibility and reliable testing; this is not a full keyboard-accessibility certification.

## Automated local evidence

- Five new baseline frontend cases failed against the actual old page callbacks: offset-40 retry, duplicate row, missing visible error, missing request timeout, and malformed response handling. All existing 23 frontend cases passed.
- After repair, all 30 frontend Messenger cases passed, including seven new picker cases for those failures, stale search completion, concurrent-request locking, and an empty final page.
- All 50 targeted backend tests passed across message repository boundaries, message HTTP validation, and message notifications. Five added query-contract cases cover percent, underscore, backslash, combined punctuation, and apostrophes, together with visibility predicates, ordering, selected fields, and pagination options.
- Backend source/test-file lint and TypeScript build passed. Frontend lint, typecheck, and the first production build passed. A final empty-error-spacing adjustment is included in the subsequent CI build.

## Controlled browser evidence

Only a memory fixture on loopback ports 4311/4312 was used. Its 23 labeled contacts are not database users and were not sent to the public site.

- Initial lookup returned 20 contacts. A one-time HTTP 503 at offset 20 displayed the error and Retry loading users while retaining those contacts.
- Retry returned the remaining three contacts. The modal contained 23 profile buttons plus Close; Load more and Retry disappeared at the final page.
- Fixture logs confirmed user-list offsets **0 → 20 → 20**, then a new space-padded uppercase ALPHA search at offset 0. No offset-40 request was made during failed-page recovery.
- The new search displayed only TEST ONLY Alpha.
- Reopening after a one-time offset-0 failure showed the recoverable error, not an empty search. Retry restored the first 20 contacts and Load more.
- Desktop and a verified 390 × 844 browser viewport were inspected. At the narrow viewport, actual window/document width was 390 px with visual scale 1 and no horizontal overflow. This is emulation, not physical-phone evidence. The temporary viewport override was cleared.

Screenshots remain outside Git in the local temporary directory: `herbalai-picker-page-error-20261001.png` and `herbalai-picker-mobile-20261001.png`. The local browser test tab was closed. Fixture controls, dummy authentication, and the fixture-configured build are not release artifacts.

## Isolated database gate

The existing authenticated Messenger suite adds a guarded database case with 22 eligible contacts, one banned contact, and a temporarily matching current-user name. It checks 20/2/final-empty pagination, repeatable ordering, lowercase search, literal punctuation in names and username search, and exclusion of self and banned users. It restores the current user's name and deletes only its isolated fixture IDs in finally. The suite rejects targets other than test-mode loopback `/herbalai_test`.

No local database run is claimed: PostgreSQL/Docker is absent here. The new real-database assertions must pass GitHub isolated CI before deployment. At this observation, this batch is local and the public site still runs the previous reviewed commit. Deployment and live smoke evidence will be recorded after observation, not inferred from local tests.
