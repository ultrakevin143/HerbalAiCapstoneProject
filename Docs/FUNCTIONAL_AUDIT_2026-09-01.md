# Herbal AI Functional and Cleanup Audit

Audit date: 1 September 2026

## Outcome

The backend/API regression suite and the connected-browser workflow passed for the major contributor and administrator paths. Google OAuth was verified with a real contributor session, and the administrator console was exercised with the seeded administrator account. A follow-up remediation pass tightened Dr. AI retrieval and source grounding, added per-user forum reactions, corrected institutional-endorsement wording, and parallelized the administrator dashboard's initial requests. All browser-audit records were removed afterward, including the audit herb, approved suggestion, knowledge-base fact, forum topic/reply, herb comment, and private message. The contributor account used for the temporary ban test was restored to active status.

## Automated regression results

| Check | Result |
|---|---|
| Backend Vitest suite | 33/33 tests passed across 6 files |
| Backend lint | Passed |
| Backend TypeScript | Passed |
| Frontend lint | Passed with no warnings |
| Frontend TypeScript / production build | Passed; 18 routes generated |
| Frontend dependency audit | 0 known vulnerabilities |

## End-to-end API workflow results

The clean rerun passed 34/34 exercised checks:

- Health endpoint, herb library, DOH filter, and herb search.
- Account login state, profile retrieval, refresh-token rotation, logout, and contributor/admin RBAC.
- Admin statistics and user-list access.
- Forum thread create/detail/like/delete and reply create/like/delete.
- Herb comment create/like/delete.
- Private message send/history/edit/delete.
- Herb suggestion submit/list/reject.
- Notification retrieval and mark-all-read.
- Administrative audit-log retrieval.
- Knowledge-base listing.
- Live Dr. Ai response using the configured AI service.
- Per-user topic/reply like, status, unlike, and persisted reaction-state behavior.
- Dr. AI source-relevance checks: a Lagundi question cited only Lagundi, a cough query retrieved Lagundi, and an unknown-herb query returned no source cards or invented dosage.

The initial signup request also created the dedicated contributor and the first login attempt correctly returned HTTP 403 until the audit account was marked verified in the test database.

## Connected-browser workflow results

The following UI workflows were manually exercised in the connected browser:

- Google OAuth account selection, callback, authenticated homepage, and contributor RBAC.
- Herb-library loading, search, DOH filter, category options, detail modal, warnings, and Dr. AI citation navigation.
- Dr. AI question/response flow and retrieval of a temporary knowledge-base fact.
- Notifications, community empty state, discussion validation, topic creation, reply creation, and topic reaction.
- Herb comment creation and like/unlike toggle.
- Messenger conversation loading, recipient selection, and text-message sending.
- Suggestion required-field validation, administrator submission, moderation approval, publication, search, and editing.
- Administrator dashboard, pending queue, herb management, user management, knowledge base, and audit-log access.
- Temporary ban/unban of the contributor OAuth account; the final account status was verified as active.
- Mobile navigation at a 390 x 844 viewport, followed by restoration of the normal viewport.

The browser-created audit records and two older obvious junk herbs (`Herbal Test Mint` and `awdsawd`) were removed. The library returned to 14 records and no named audit records remained.

## Fixes applied

- Upgraded frontend Next.js and `eslint-config-next` to 16.3.4 and updated dependencies; frontend npm audit is clean.
- Updated backend dependencies within declared non-breaking ranges, including upload-related packages.
- Replaced deprecated `middleware.ts` with `proxy.ts`.
- Corrected the protected community route from nonexistent `/forums` to `/community/new`.
- Replaced Google sign-in JavaScript navigation with a normal external authentication link, removing the lint warning.
- Removed the published fixed administrator password. Database seeding now requires `ADMIN_PASSWORD` of at least 12 characters.
- Added `ADMIN_EMAIL`/`ADMIN_PASSWORD` deployment configuration and documentation.
- Corrected the administrator herb-submission success screen, which previously claimed immediate publication even though the record was still pending moderation.
- Corrected administrator audit-log rendering to use the API's `createdAt` field and refresh whenever the audit tab is opened.
- Added chart minimum-width constraints to prevent Recharts invalid-size warnings during initial layout.
- Replaced the unsupported dashboard claim of "100% efficiency" with a factual health-check summary.
- Corrected outgoing Messenger conversation previews so the recipient is retained instead of displaying the sender as the contact.
- Hardened Messenger edit/menu button event handling and explicit button types.
- Added `ThreadLike` and `ThreadCommentLike` records with unique user/content pairs, transactional counter updates, like-status retrieval, and frontend like/unlike state.
- Completed the previously non-interactive reply-like UI and restored each user's reply-reaction state on page reload.
- Tightened Dr. AI retrieval using a maximum distance, relative-distance margin, explicit-name preference, and lexical relevance checks. This prevents unrelated source cards while preserving relevant symptom retrieval.
- Replaced Dr. AI's unsupported claim of PITAHC authority and uncited model-knowledge fallback with strict database grounding, transparent no-source responses, and non-endorsement language.
- Tuned Dr. AI to turn short retrieved entries into clearer, well-structured explanations while preserving the source's meaning and refusing to invent missing facts.
- Replaced public-facing PITAHC endorsement claims with accurate wording that the project uses publicly available DOH/PITAHC reference materials and is not institutionally endorsed.
- Parallelized independent administrator dashboard requests to reduce avoidable sequential loading time.
- Added a bounded five-minute herb API cache and shared frontend GET cache with in-flight request deduplication. Herb approval, editing, and deletion invalidate cached results.
- Verified cache impact on the remote database path: the first measured herb request took about 6.0 seconds, followed by cached responses of about 18 ms and 11 ms.
- Added production backend compilation/start scripts and Windows demonstration start/stop scripts with build and health verification; corrected the backend Docker image to run compiled production code.
- Added responsive AVIF/WebP image optimization for key local, Cloudinary, Unsplash, and Google-hosted images.
- Added 50-message cursor pagination, composite indexes for high-use list/conversation queries, and HNSW cosine indexes for herb and knowledge-base vectors. Migration `20260901143000_add_query_performance_indexes` was deployed successfully.
- Added structured slow-request logging, API `Server-Timing`/`X-Response-Time` headers, and Dr. AI embedding/retrieval/generation timing metadata without logging question text.
- Added regression coverage for cache deduplication/invalidation, messaging cursors, invalid cursor handling, Dr. AI source/timing behavior, and response timing headers.
- Added environment-aware email delivery controls so local audits log mail by default instead of sending to placeholder accounts; production retains live delivery and controlled tests can use an explicit recipient allowlist.

## Cleanup performed

- Removed temporary audit-account setup/cleanup scripts after test-data deletion.
- Removed the obsolete `verify-all-features.ts` script, which duplicated and under-tested current functionality.
- Moved obsolete document versions from the project root to `Docs/archive` rather than permanently deleting them.
- Removed generated frontend build/cache artifacts after final verification.

## Limitations and remaining evidence

- The Messenger attachment and edit recheck was completed on 4 September 2026. Text send/edit, edited-state persistence, valid PNG upload, Socket.io delivery, image rendering/opening, and reload persistence passed; see `Docs/MESSENGER_BROWSER_TEST_2026-09-04.md`.
- The remote database can still take several seconds on its first cold connection, but herb-list caching now reduces repeated API responses to tens of milliseconds. Production demo mode removes development compilation delays.
- Outbound Gmail SMTP was observed, but the placeholder `admin@herbalai.ph` mailbox returned a delayed-delivery notice. A real mailbox (or configured domain mail service), production deployment/TLS, backup/restore, stakeholder UAT, accessibility review, and formal load testing still require external setup or participants.
- Backend npm audit reports three high-severity findings under Prisma's development CLI dependency chain. npm offers only a breaking downgrade to Prisma 6.12; this was not applied because runtime tests use Prisma 7.10 and the offered change is unsafe without a migration project.
