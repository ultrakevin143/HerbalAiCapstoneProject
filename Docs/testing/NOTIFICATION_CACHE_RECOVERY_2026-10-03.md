# Notification cache and recovery — 3 October 2026

## Scope and release hold

The user requested the next accumulated MVP repair batch. This work audits account-scoped in-memory cache behavior and notification lifecycle, unread counts, read actions and reconnect recovery. It preserves the existing notification UI styling and preceding Library repairs. All changes are local in the selective-release-check worktree on codex/mvp-acceptance-ci; nothing was staged, committed, pushed or deployed.

Remote main and codex/readability-accessibility were rechecked and both remain e51942c35c573438c09a91104a40d4951f36fa50. Anonymous GETs to https://herbalaiph.vercel.app/library and https://herbalaicapstoneproject-staging.up.railway.app/api/health returned 200. These are unchanged-release availability checks, not acceptance of the local fixes or authenticated notification behavior.

## Reproduced baseline

Before production repairs, seventeen native cache/notification cases executed: seven passed and ten failed. The failures were:

1. Two owners requesting the same private URL shared the pending/cache entry because the key was only the URL.
2. The notification read did not supply an explicit account scope.
3. The bell calculated unread totals from the returned page instead of using the server's total; a page containing one unread item lost a total of 120.
4. Duplicate socket payloads duplicated rows and inflated counts.
5. An event addressed to another account entered local state and could request a sound.
6. A delayed initial snapshot overwrote newer event state.
7. Reading an already-read row decremented unrelated unread notifications.
8. A read-all acknowledgement marked a notification arriving after the server operation as read locally.
9. Reconnection lacked a canonical notification refresh.
10. The rendered bell was not keyed to the authenticated account, leaving its state lifecycle independent of account replacement.

These cases use actual source callbacks/helpers with controlled state, promises and payloads. Account keying is a source assertion, not a mounted React account-switch test. The tests do not establish that a production account leaked data; existing login/logout cache invalidation and backend ownership predicates already provide additional protection. Previously passing TTL, invalidation and pending-retirement behavior was preserved, not newly repaired.

## Repair groups

| ID | Priority | Repair | Evidence boundary |
| --- | --- | --- | --- |
| B16 | High | Partition notification cache/pending reads by owner; key the bell to the authenticated owner; reject malformed/foreign snapshots and events; retire old lifecycle callbacks and token requests. | Controlled source/helper checks pass. Backend authorization is unchanged; owner keys are memory partitions, not access control. |
| B17 | Medium | Use canonical unread totals, deduplicate rows/events, stop optimistic count subtraction/read-all rewriting, guard duplicate/conflicting read actions and refresh after successful or ambiguous writes. | Deferred mutation/snapshot cases pass, including already-read and notification-arrival races. Real DB commit ordering was not induced. |
| B18 | Medium | Reuse a serialized dirty-refresh coordinator; canonical refresh on reconnect, events and visible tab/focus; request fresh socket credentials for each authorization attempt. | Callback tests and an actual loopback Socket.IO reconnect pass. No production outage or authenticated live reconnect was manufactured. |

## Exact review scope

Production files:

- herbalaifrontend/components/NotificationBell.tsx: owner-keyed child; lifecycle-safe snapshots; canonical counts/refresh; fresh Socket.IO auth callback; single-flight read controls. Existing layout, strings and all 34 JSX className expressions match HEAD after line-ending normalization. Only functional disabled/aria-busy attributes were added to read controls.
- herbalaifrontend/lib/request-cache.ts: optional fourth ownerId argument, collision-safe serialized [ownerId-or-null, URL] key, URL-aware invalidation across owner scopes. Public/unscoped consumers remain compatible. Existing AuthContext invalidation and shared Axios authentication/timeout handling are unchanged.
- herbalaifrontend/lib/notification-state.ts: validated owner payloads, deduplicated notification snapshots and bounded-shape unread-count handling. Invalid snapshots fail closed without displaying another account's rows/counts. Error text contains no private payload.
- herbalaifrontend/lib/refresh-coordinator.ts: shared serialized refresh factory extracted without changing the preceding Library queue semantics.
- herbalaifrontend/lib/library-discussion.ts: preserves createDiscussionRefresh as a compatibility export of the shared factory; reply reconciliation remains unchanged.

Regression/CI files:

- scripts/request-cache.test.mjs: twelve isolated actual-helper cases covering TTL, expiry, deduplication, owner partitions, forced-read ordering, rejected requests, invalidated late reads, prefix invalidation and scope-key collisions.
- scripts/notifications.test.mjs: twenty-three source/helper/transport cases covering totals, deduplication, foreign/malformed data, mutation races, reconnect, focus/visibility, fresh credentials, cleanup and account retirement.
- scripts/library-discussion.test.mjs: loads the actual shared coordinator through the compatibility export. All thirty-three preceding Library cases remain passing.
- .github/workflows/ci.yml: explicitly runs cache and notification scripts. Frontend CI also installs existing locked backend packages with npm ci --ignore-scripts so the loopback fixture can import socket.io; both lockfiles participate in npm caching. No new package or lockfile change. Actual GitHub execution remains pending publication to the isolated CI branch.

Documentation: this report and appended MVP_BACKLOG_AUDIT_2026-10-03.md / NEXT_WORK_PLAN_2026-10-03.md statuses. Preserve the eight unrelated existing evidence diffs, earlier batches and local/private files. Do not stage the entire worktree.

Socket authentication uses the documented callback form in the [official Socket.IO client options](https://socket.io/docs/v4/client-options/#auth). Namespace denial can recover on an explicit visible-tab/focus attempt; no infinite unauthorized retry loop was added. Cached notification GETs remain shared and are bounded by the existing Axios timeout; retirement guards discard obsolete callbacks. Only the socket-token request is aborted by this component, not a shared cached request used by other consumers.

## Observed validation

| Check | Observed result |
| --- | --- |
| Pre-repair cache/notification baseline | 17 executed: 7 passed, 10 failed. |
| Focused Library/cache/notification scripts | 68 passed: 33 Library, 12 cache and 23 notification cases; zero failed/skipped. |
| Actual loopback reconnect | Real Socket.IO server/client on an ephemeral 127.0.0.1 port. First authorization accepted synthetic TEST-only-1; after a forced local Engine.IO disconnect, the callback fetched TEST-only-2 and recovered a stored notification missed while disconnected. Both credentials, two token requests and unread count 1 asserted. Client/server closed in finally. |
| Combined native scripts | 311 passed across twelve scripts; zero failed/skipped. |
| Combined backend non-DB suites | 604 passed across 58 files; zero failed. Seventeen DB-dependent files explicitly excluded. |
| Frontend ESLint and standalone typecheck | Passed. |
| Frontend production build | Passed, 22 static pages generated. NEXT_PUBLIC_API_URL=http://127.0.0.1:1/api was process-local; no .env edit. Ignored .next output is local-only and must not be copied to production. |
| Mechanical frontend detector | Empty findings list for the notification component and three new/changed helpers. |
| Styling/index/whitespace | 34/34 notification className expressions match HEAD; git diff --check passed; index empty. Static styling comparison is not rendered visual acceptance. |
| Anonymous live baseline | Library and Railway health 200; remote main/deployment unchanged at e51942c. No live write. |

The transport case exercises real Socket.IO reconnection, but uses synthetic authorization, controlled canonical reads and callback state rather than production JWTs, database persistence or a mounted browser. Do not upgrade it into authenticated live, physical-device or participant evidence. No real-password, Gmail, administrator, SQL or physical-device action was performed in this batch.

## Repeatable checks

From the worktree root:

```powershell
node --test scripts/library-discussion.test.mjs scripts/request-cache.test.mjs scripts/notifications.test.mjs
$files=@(Get-ChildItem scripts -Filter '*.test.mjs' | ForEach-Object {$_.FullName})
node --test --test-concurrency=2 @files
```

Both applications' locked dependencies must be installed for the loopback transport case. From herbalaifrontend, run npm run lint and npx tsc --noEmit; build with a process-local loopback API. The backend non-DB run used synthetic loopback DATABASE_URL/DIRECT_URL, NODE_ENV=test, EMAIL_DELIVERY_MODE=log and an empty Gemini key, as in preceding batches. No tests were pointed at live Neon or the isolated demo database.

## Remaining gates and next bounded issue

1. Full isolated PostgreSQL CI remains required. No local PostgreSQL/Docker is installed; seventeen DB suites, including thirteen prepared Library SQL cases, are unexecuted locally. This batch neither adds SQL tests nor claims transaction proof.
2. After authorized combined publication, check authenticated owner/logout/login replacement, unread totals, read/read-all, healthy reconnect and visible-tab recovery with connected sessions. Existing last-confirmed data is retained if refresh fails; visible failure/retry feedback may need a separately reproduced refinement. No UI redesign was introduced here.
3. Next source candidate: notification HTTP input boundaries. The current controller uses parseInt for action IDs and list limits with no strict positive/max limit gate. Reproduce malformed/suffix/overflow/pagination cases through controlled routes before calling them confirmed or repaired. Existing repository writes include userId, so do not describe this candidate as an authorization bypass.
4. Root/media content/privacy review, formal SRS/SPMP/SDD/STD traceability and the selective release proposal remain separate work. Participant UAT was deferred by the user; phone inspection remains a user report. Neither was invented as a pass.

B01–B18 are accumulated bounded local repair groups, not a claim that the entire system is defect-free. Publication remains on hold.
