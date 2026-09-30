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

CI/release outcomes will be appended after execution. Public unauthenticated live checks cannot substitute for a two-user authenticated Messenger browser check. The last browser inventory had no connected Chrome profiles; no live private-message mutation is authorized by merely observing that a public endpoint is healthy.

## Next candidates to reproduce separately

These are code-inspection follow-ups, not claimed fixed or production exploit demonstrations:

- Messenger repeated deletion lacks the deleted-state guard already used for edits. Edit/delete repositories update by ID after a controller read, so a concurrent deletion/edit needs a database-conditional regression.
- Chat history sorts/cursors by timestamp without an ID tie-breaker. Equal timestamps at a page boundary may skip messages; reproduce with isolated deterministic timestamps before choosing a backward-compatible cursor.
- Forum IDs are checked as positive safe integers but not bounded to PostgreSQL Int, unlike this scoped Messenger repair. Check out-of-range public requests with a local HTTP/database test rather than intentionally causing live database errors.

Previous-password rejection, authenticated live moderation, and live community last-page browser recovery remain separate evidence gaps in the dated MVP reports. No participant acceptance result is inferred from these automated tests.
