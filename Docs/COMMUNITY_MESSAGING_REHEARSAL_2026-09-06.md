# Community and Messenger browser rehearsal

Date: 6 September 2026. Tester: Codex automated browser rehearsal.

## Environment and scope

Local production frontend at `http://localhost:3000`, backend at `http://localhost:5000`, configured remote PostgreSQL and Cloudinary. Headless desktop Chrome controlled through Playwright in two isolated, authenticated contributor contexts. Temporary accounts were created directly for this run; this does not retest sign-in or Google OAuth. Email remained in log mode.

Repeat with the existing local services running:

```powershell
node scripts/rehearse-community-messaging.mjs
```

The script creates uniquely labelled accounts/data and cleans its records and uploaded asset in `finally`. Set `MESSAGING_ONLY=1` only for a targeted Messenger rerun. Normal execution covers both areas. Backend `dist` must be rebuilt after backend edits; local services must use that build.

Final combined run exited successfully with all six workflow/cleanup checkpoints passing and no captured uncaught page errors. Earlier selector-only failures were corrected and their temporary records cleaned before this final run.

## Verified workflows

| Area | Exercised checks | Result |
|---|---|---|
| Topic creation | Contributor publishes a topic; second contributor opens its detail page | Pass |
| Topic likes | Second contributor likes/unlikes; both states persist after reload | Pass |
| Replies | Second contributor submits a reply; first contributor sees it and likes/unlikes; both like states persist | Pass |
| Ownership | Other contributor receives 403 when attempting to delete the topic or reply | Pass |
| Deletion | Author deletes reply/topic; reply stays masked after reload and public API response excludes its original text; topic database flag is set | Pass after repair |
| History pagination | 55 seeded messages; first page excludes oldest records; Load older messages produces all 55 in order with no duplicates | Pass |
| Text messages | Browser send, live receive in another browser, edit, live edit update, reload, delete, live deleted placeholder, reload persistence | Pass |
| Message ownership | Recipient cannot edit/delete sender's message (403) | Pass |
| Images | PNG preview, remove, reselect, upload with caption, live receive/render, open in new tab, reload, delete, live disappearance and persisted deletion | Pass |
| Cleanup | Temporary users, topics, replies and messages removed; uploaded test asset destroyed in Cloudinary | Pass |

## Defect repaired: DEF-FORUM-01

Deleting a reply changed its visible content to a placeholder only in local UI state. The database retained the original content with `isDeleted=true`, and the public thread-detail API returned that original content. Reloading therefore displayed the deleted text again.

`findCommentsByThreadId` now replaces deleted reply content with the existing UI placeholder before returning results. This also covers previously soft-deleted replies, preserves discussion ordering and active content, and requires no migration or historical-data rewrite. Original text remains stored under the existing soft-deletion design; this repair prevents its disclosure through the public detail response, not permanent erasure from database backups.

`tests/forum-deletion.test.ts` reproduced the defect before the fix and passed afterward. Full backend suite: **55/55 passed across 10 files, 26.53 seconds**. Backend build and lint passed. Frontend application code was unchanged during this repair.

## Limits and remaining work

These are automated desktop interaction checks, not stakeholder UAT or a full visual/accessibility audit. They do not establish mobile Messenger usability, performance acceptance, simultaneous like conflicts, equal-timestamp pagination, offline/reconnect behavior, all upload formats or authorization combinations. Only a small valid PNG was used for the Messenger upload.

Messenger soft deletion clears the stored image URL but does not itself destroy the Cloudinary asset. The rehearsal tracks its own uploaded URL and explicitly destroys that test asset during cleanup. Cloudinary acknowledged deletion/invalidation; global CDN invalidation was not independently measured. A production attachment-retention policy remains a separate consideration.

Next local browser work: herb comments, administrator ban/unban safeguards, logout/session behavior and authenticated mobile layouts. Controlled-mailbox delivery and participant UAT still need separate evidence. Live hosting remains deferred.
