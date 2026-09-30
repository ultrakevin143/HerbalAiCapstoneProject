# Messenger validation regression — 2026-10-01

## Reproduced findings

This backend-only follow-up uses the release worktree, not the dirty primary checkout. No live private messages, recipients, or account roles were changed to reproduce failures.

| ID | Finding | Repair |
| --- | --- | --- |
| MSG01 | Edit/delete parse IDs with `parseInt`, so a suffix such as `7abc` or a decimal such as `7.5` is treated as message 7. Zero, negative, unsafe, and PostgreSQL Int overflow values also reach the repository. | Parse a complete positive decimal integer and bound it to PostgreSQL's signed Int range before any lookup/write. |
| MSG02 | Sends enforce 2000 characters, but edits do not. A mocked real-route edit with 2001 characters succeeds. | Apply the same limit to trimmed edited text before loading or writing the message. |
| MSG03 | Missing request bodies and object/array multipart text accompanied by an image can reach destructuring or `.trim()` and produce HTTP 500. | Treat an absent body as empty input; require supplied content to be text even for image messages; return 400 before upload/write. Preserve image-only messages with omitted content. |
| MSG04 | The user picker excludes unavailable/banned recipients, but sending directly does not perform that eligibility check before uploading and writing. The mocked router never calls the recipient lookup and accepts the request. A missing-user write can instead fail a real database foreign key. | Use the existing messageable-recipient lookup before media upload; return the same neutral 404 for missing/banned recipients without exposing ban status. |

The initial real-router/mocked-dependency suite had **12 failing and 2 passing cases**. It reproduced the validation failures and absence of eligibility checks, not successful foreign-key writes to nonexistent real users. After repair all 14 cases pass, and the existing two message/notification tests pass. Mocks intercept Cloudinary, socket broadcasts, and database dependencies; test attachments are deliberately non-image byte strings labeled TEST ONLY with an allowed MIME type, not proof of image decoding or actual Cloudinary delivery.

## Production change and compatibility

Only `src/controllers/message.controller.ts` changes production behavior. Existing authenticated middleware, sender-only edits/deletes, deleted-message edit rejection, notification transaction, and socket event names are retained. Text is trimmed once; send/edit share the existing 2000-character limit. Receiver IDs are trimmed and cannot be empty or self-targeting. No frontend source, dependency, schema, migration, credential, live environment setting, or mail configuration is changed.

The pre-upload recipient check is not a claim of atomic exclusion of every simultaneous ban/deletion; database/provider races remain possible. No blind write retry is introduced and upload/provider failures remain handled by the existing error path.

## Automated evidence

- Local focused HTTP and notification suites: **16 tests across two files passed**. Backend source lint, targeted changed-test lint, TypeScript build, and whitespace validation passed.
- Four new authenticated database cases use the real application/router, cookie login, repositories, and database. They cover send/notification persistence, private history isolation, contributor/admin non-owner denial, edit-length boundaries, soft-deletion masking, malformed IDs without mutation, missing/banned recipients without messages/notifications/uploads, and legitimate image-only persistence. Only Cloudinary and socket emission are mocked; actual provider delivery is not certified.
- Database fixtures require `NODE_ENV=test`, a loopback hostname, and database name `herbalai_test` before any write. Unique TEST ONLY accounts are deleted with their cascading records afterward, and the pool closes. Passwords are generated per run and not recorded. There is no local PostgreSQL runtime, so these four cases require full isolated GitHub Actions CI; they are not counted as locally executed.

Public unauthenticated live checks cannot substitute for a two-user authenticated Messenger browser check. The preceding browser inventory had no connected Chrome profiles; later in this batch the Mercado and Gina profiles became available. Their observed checks are recorded below rather than inferred from public health or earlier sessions.

## Release and executed live results

- Code commit `3667de7f37459a9f5e949774620a4d003732c72e` passed temporary-branch CI `36792408145`. The backend log confirms **386 tests across 59 files passed**, including all four new authenticated Messenger cases, with migrations successfully applied to the isolated PostgreSQL/pgvector service. Frontend checks also passed; no frontend source changed.
- An initial GitHub fetch returned an empty network reply before promotion; a bounded retry succeeded. After remote ancestry checks, the tested commit was pushed to `main` and `codex/readability-accessibility`. CI runs `36792625302` and `36792625013` passed, and both Vercel and Railway reported successful deployment of the exact commit.
- Six non-destructive live checks passed through the frontend API proxy: health GET 200; anonymous conversation/history GETs 401; anonymous message POST 401; anonymous malformed-ID PUT/DELETE 401. Those write-shaped requests contained no authentication and were denied before any mutation; they do not prove authenticated malformed-input handling on production.
- The Mercado contributor restored as Herbal QA in live Messenger. Gina restored as Admin Admin in the live Admin Panel, and a deliberate full admin reload returned to Dashboard Overview without a forbidden/sign-in error. This is refreshed authenticated read evidence, not a new moderation/audit-write check.
- Using the already authorized QA workflow and these two controlled accounts, one nonmedical `TEST ONLY — Messenger validation QA 20261001; no action needed.` message was sent to the user's admin account. It appeared in the receiving account's conversation/history. The sender changed it to `TEST ONLY — edited Messenger QA 20261001; no action needed.`; the already-open receiver updated without a page reload and displayed the edited marker. No other recipient or existing message was modified.
- The recipient's notification list showed the new Herbal QA direct-message notification, and its View link selected that contributor conversation. Viewing a notification did not automatically mark it read; no unrelated notification or Mark all read action was used.
- Live deletion is **not yet confirmed**. Deleting only the new QA message opened the expected browser confirmation. Browser automation stalled while handling that modal; the receiver still showed the edited text in the last observation. The tester was asked to click OK for only that new record. Both tabs were retained for this handoff. This is an automation/confirmation limitation, not evidence that the backend deletion failed, and it is not counted as a live deletion pass.
- The sender screenshot is stored outside Git as `herbalai-messenger-sent-20261001.jpg` in the local temporary directory and was shown in the chat. No password, reset token, private cookie, or production credential was captured in the report. The QA message/notification can remain in live storage until the targeted deletion is confirmed.

## Next candidates to reproduce separately

These are code-inspection follow-ups, not claimed fixed or production exploit demonstrations:

- Messenger repeated deletion lacks the deleted-state guard already used for edits. Edit/delete repositories update by ID after a controller read, so a concurrent deletion/edit needs a database-conditional regression.
- Chat history sorts/cursors by timestamp without an ID tie-breaker. Equal timestamps at a page boundary may skip messages; reproduce with isolated deterministic timestamps before choosing a backward-compatible cursor.
- Forum IDs are checked as positive safe integers but not bounded to PostgreSQL Int, unlike this scoped Messenger repair. Check out-of-range public requests with a local HTTP/database test rather than intentionally causing live database errors.

Previous-password rejection, authenticated live moderation, and live community last-page browser recovery remain separate evidence gaps in the dated MVP reports. No participant acceptance result is inferred from these automated tests.
