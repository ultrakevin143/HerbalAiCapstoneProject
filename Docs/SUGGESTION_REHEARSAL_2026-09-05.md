# Suggestion approval rehearsal — 5 September 2026

## Result

The local desktop browser workflow passed after correcting the approval notification destination from the nonexistent `/library/{id}` route to `/library?id={id}`. The existing library reads the `id` query parameter to open herb details.

Verified with two separate headless Chrome sessions and temporary contributor/admin accounts:

- Contributor filled the suggestion form and submitted successfully (HTTP 201).
- Contributor approval attempt was forbidden (HTTP 403).
- Admin selected the specific test suggestion and clicked Approve & Publish (HTTP 200).
- Database suggestion status became Approved, the published herb matched the test record, and the approval audit record existed.
- Contributor received the live notification without reloading the page.
- Clicking its link opened the correct herb details and persisted the notification as read.
- The backend logged `email_suppressed` with mode `log`; no real email delivery was attempted.

The initial run reached the details view but its final assertion matched both the card title and modal title. That was a test-selector issue, corrected before the successful rerun. Cleanup completed after both runs.

## Isolation and cleanup

Each run provisioned two unique temporary users with `.invalid` email addresses and unguessable non-login passwords. Authenticated browser cookies were generated for these fixtures: this did not test password login or OAuth. Test herb text explicitly stated it was not medicinal information and must not be consumed. Approval exercised the normal embedding-generation path, so the test requires the configured AI service or its existing failure fallback. No images were uploaded.

Published test herbs were deleted through the API to invalidate library caches. Only matching test suggestions and created user IDs were deleted afterward; associated notifications and audit records cascade from those users. Zero matching herbs, suggestions and users remained at cleanup verification. No pre-existing records were removed.

## Regression evidence and limits

Backend build and lint passed; existing backend automated tests passed 37/37. `scripts/rehearse-suggestion.mjs` is the reproducible local browser/integration check. Run it only with the local demo backend's EMAIL_DELIVERY_MODE explicitly set to log. It creates and removes database fixtures; it is not a read-only test.

Still pending: suggestion image upload, detailed validation cases, authenticated mobile layouts, and real email delivery. These results do not mark those features or the whole system accepted.

## Rejection and bulk-read follow-up

Run with `REHEARSAL_REJECT=1` and the local backend in email log mode. The extended browser script passed:

- A temporary contributor submitted a suggestion through the form; contributor approval was forbidden.
- The separate administrator rejected that specific suggestion through the pending-suggestions UI.
- HTTP 200, saved Rejected status, absence of a corresponding library herb and a REJECT_SUGGESTION audit record were verified.
- The contributor saw the rejection notification arrive without reloading.
- A second rejection attempt returned HTTP 400.
- Mark all read returned HTTP 200 and marked both of the contributor's unread notifications read. One was the real rejection notification; the other was a seeded test fixture.
- The other account's seeded unread notification remained unread, verifying account isolation.
- After contributor page reload, notifications still displayed and the Mark all read control was absent.
- Rejection email suppression was confirmed in the server log. No real email or image upload occurred.

All temporary users and suggestions were deleted and zero matching records remained; associated fixture notifications and audit records cascade from those users. No herb was published by rejection. Test services were stopped afterward. No application defect was found in this tested path, so no application change was made. Script syntax and git whitespace checks passed; the backend suite was not rerun because only rehearsal code/documentation changed.
