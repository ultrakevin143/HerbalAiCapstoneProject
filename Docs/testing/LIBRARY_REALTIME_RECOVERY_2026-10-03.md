# Library realtime recovery — 3 October 2026

## Scope and publication boundary

Continued the delayed/out-of-order Library update audit requested after LIBRARY_TIMING_GUARDS_2026-10-03.md. Worktree: C:/Users/Hp/.codex/worktrees/selective-release-check/CAPSTONE PROJECT, branch codex/mvp-acceptance-ci. All Batch 1–4 repairs and unrelated working-tree changes were retained. No staging, commit, push, deployment, migration, credential, mail, account or production-record change occurred.

Main and codex/readability-accessibility still resolve to e51942c35c573438c09a91104a40d4951f36fa50. Anonymous Vercel /library and Railway /api/health GETs returned 200. Those checks validate the unchanged live baseline, not these local repairs.

## Failing baseline and repair groups

Six new behavioral checks failed against the preceding source; the twelve existing reply-retention cases passed. The failures were expected/actual assertions, not missing harness variables:

- Delayed reaction payload overwrote a fetched count of 3 with an older 0.
- Two same-comment clicks issued two POSTs instead of one in-flight write.
- Successful POST without a socket event issued no canonical refresh.
- Reconnect had no connect listener to recover missed events.
- Failed POST plus failed GET left an invented optimistic reaction/count.
- Duplicate creation acknowledgements marked an unchanged comment as a new mutation.

| ID | Priority | Focused local repair |
| --- | --- | --- |
| B13 | Medium | Reactions are treated as invalidations, not trusted count snapshots. Refresh after local completion, remote creation/reaction events and socket connect/reconnect. Coalesce bursts and perform a follow-up read when another invalidation arrives during an in-flight snapshot. |
| B14 | Medium | Synchronously guard one in-flight toggle per comment; disable both root/reply controls and expose aria-busy. Show confirmed fetched counts rather than optimistic arithmetic that can survive failures. Refresh after successful or failed POST without automatically replaying a possibly committed write. |
| B15 | Medium | Track known comment IDs separately from mutation versions. Duplicate creation/socket/HTTP acknowledgements no longer falsely protect an old count from a newer fetched snapshot. |

Additional lifecycle hardening cancels pending reads when the discussion closes, checks abort state before applying results, rejects obsolete socket listeners and stops a previous lifecycle's queued follow-up. A current 404 clears obsolete discussion contents; a transport/server failure retains the last confirmed snapshot. Failure does not certify that retained counts are current. The user can retry after the pending control clears; this is not durable offline synchronisation or a guarantee of successful recovery during a sustained outage.

## Exact changes and compatibility

- herbalaifrontend/components/HerbComments.tsx: canonical invalidation handling, known-ID deduplication, single-flight reaction state, bounded cancellation/lifecycle ownership and 404 clearing. Existing comment/reply drafts, deletion tombstones and reply-retention reconciliation are preserved. The Library page already keys this component by selected Herb ID; no page change was required.
- herbalaifrontend/lib/library-discussion.ts: createDiscussionRefresh serialises reads, coalesces same-turn invalidations and drains a dirty follow-up before completing callers. An active-lifecycle predicate prevents obsolete queues from starting another read. A rejected read releases the queue so a later explicit request can recover.
- herbalaibackend/src/controllers/herb.controller.ts: adds herbId to comment_liked alongside the existing commentId, likes and userLikes. Event name and legacy fields remain intact; old clients can ignore the new field. New clients still accept old events without herbId and refresh canonical data, while scoped events for another herb are ignored.
- scripts/library-discussion.test.mjs: actual extracted callback/effect/helper tests, now 33 cases. The effect harness uses the real append/removal/refresh callbacks, not substitute business logic. Twelve preceding retention cases remain included.
- herbalaibackend/tests/herb-comments-http.test.ts: one event-scope/legacy-payload regression; suite now 81 cases. The prior batch's CI step already runs the native Library script, so another workflow change was unnecessary.

No database column, migration, dependency, environment setting, route, event name or private-room membership was changed. Global deletion ID events keep the preceding compatibility/tombstone behavior. This audit did not infer that public comment broadcasts are private-data disclosure, nor claim that a scoped herbId changes transport-level audience permissions.

Socket counts and delayed POST receipt bodies are not used as authoritative snapshots. A canonical read after a local toggle handles lost acknowledgements without repeating the write. When a socket event arrives during that read, the coalesced follow-up settles to a fresh snapshot. This avoids requiring a reaction-version database migration or assuming that broadcast arrival order matches SQL commit order.

## Observed validation

| Check | Result and evidence boundary |
| --- | --- |
| Baseline native cases | 12 passed, 6 failed before repair. |
| Focused native Library cases | 33 passed after repair. Includes delayed counts, duplicate clicks, success without socket, failure recovery, reconnect, bursts, follow-up ordering, queue rejection/lifecycle retirement, cross-herb events, creation/reaction ordering, delete/read overlap, aborted late reads, Strict Mode cleanup/setup, pending controls and prior reply retention. |
| Focused actual-route HTTP suite | 81 passed, including additive herb scope and unchanged legacy reaction fields. Persistence/Socket.IO transport are controlled mocks, not a live SQL/browser transport. |
| Combined backend non-DB suites | 604 passed in 58 files, zero failed. Seventeen database-dependent suites excluded, including the thirteen prepared Library SQL cases. |
| Combined native frontend/deployment suites | 276 passed across ten scripts, zero failed. Totals are fresh combined runs, not sums of baseline/focused runs. |
| Backend lint/build | Passed. Source build excludes database/test files. |
| Frontend lint and standalone typecheck | Passed. Initial lint caught render-time factory/ref handling; refresh queue creation was moved into the effect lifecycle, without disabling the lint rule. A cleanup-counter advisory was removed by using the abort/lifecycle guard rather than mutating the fetch counter in cleanup. |
| Frontend production build | Passed, 22 static pages generated. NEXT_PUBLIC_API_URL=http://127.0.0.1:1/api was process-local; no .env change. The ignored .next artifact is local-only and must not be copied/deployed. |
| Mechanical frontend check | Impeccable detector returned an empty findings list. |
| Styling preservation | All 48 JSX className expressions match HEAD after normalising line endings. The first raw comparison differed because of CRLF/LF, not a changed class. No copy/class/token/CSS redesign; only pending disabled/aria-busy attributes were added to reaction buttons. This static comparison is not rendered visual acceptance. |
| Whitespace/index | git diff --check passed; index empty. |
| Anonymous live baseline | Library and Railway health 200; remote main/deployment remain e51942c. No live write. |

Automated callback/effect extraction exercises actual source with controlled state and deferred promises. It is not a mounted React browser, real Socket.IO reconnection, physical phone or participant UAT run. No new real-password, Gmail, admin or physical-device result is claimed. No screenshot or manual test was fabricated.

## Repeatable local commands

From the worktree root:

```powershell
node --test scripts/library-discussion.test.mjs
$files=@(Get-ChildItem scripts -Filter '*.test.mjs' | ForEach-Object {$_.FullName})
node --test --test-concurrency=2 @files
```

From herbalaifrontend: npm run lint; npx tsc --noEmit; then build with a process-local loopback API endpoint. From herbalaibackend, the focused HTTP and combined non-DB suites used DATABASE_URL/DIRECT_URL=postgresql://qa_only:qa_only@127.0.0.1:1/unused_qa?sslmode=disable, NODE_ENV=test, EMAIL_DELIVERY_MODE=log and an empty Gemini key. These are synthetic, local-only settings, not production credentials. Full SQL execution instructions and the thirteen unexecuted Library cases remain in LIBRARY_TIMING_GUARDS_2026-10-03.md; never run them against live Neon.

## Remaining acceptance and next bounded audit

1. Full isolated PostgreSQL CI must pass before the combined production release. No local PostgreSQL/Docker is available; mock ordering does not prove actual row locks/rollback.
2. After authorised publication, use connected sessions for a bounded Library reply/reaction/reviewer deletion/reload check and a healthy reconnect/tab-resume check. Do not manufacture a production outage or delete actual user content.
3. If the read remains unavailable after a write, the display retains its last confirmed snapshot. A further feedback/explicit-retry refinement may be assessed separately; no perpetual retry loop or additional notification redesign was introduced here.
4. Continue the remaining MVP cache/account-isolation and notification invalidation audit, starting with reproducible owner/account-switch cases rather than assuming a new defect. Root/media privacy review and factual academic traceability remain separate tasks.
5. Preserve the deferred participant UAT and user-reported phone boundaries. These local tests do not make the whole system defect-free or satisfy those gates.

Include only these reviewed source/tests, this report and the appended backlog/work-plan status in the accumulated selective proposal. Keep the preceding batches and their exact review lists; do not stage unrelated documents, Desktop media, secrets, fixtures or generated build output. Publication remains on hold.
