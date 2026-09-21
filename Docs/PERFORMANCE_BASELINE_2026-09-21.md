# Performance baseline — 2026-09-21

This is a small, sequential baseline against staging, not a load or capacity test. Requests originated from the developer's Windows machine in the Philippines. Wall time includes network, TLS, and hosting latency. `X-Response-Time` measures Express processing only. Each public page and API URL received three sequential requests; no authenticated endpoints or writes were exercised.

| Staging URL | Wall times (ms) | Decoded response | Express time |
| --- | --- | --- | --- |
| Frontend `/` | 621, 275, 239 | 38,788 B HTML | n/a |
| Frontend `/library` | 196, 219, 211 | 16,148 B HTML | n/a |
| Backend `/api/health` | 520, 3,133, 481 | 101 B JSON | 0.3 ms each |
| Backend `/api/herbs` | 3,965, 571, 578 | 86,222 B JSON | 1,326, 1.5, 1.1 ms |

The first herbs request was a cache miss; the next two were hits on the server's five-minute in-process herb cache. The 3,133 ms health sample had 0.3 ms of Express time, illustrating that wall time alone cannot identify slow application code.

The existing `/api/herbs?page=1&limit=12` endpoint returned 26,002 B decoded, versus 86,222 B for the unpaginated list. Its first measured Express time was 196.4 ms; page 2 was 30,149 B and 195.7 ms. These pages use different herb records, so their byte sizes need not match.

With `Accept-Encoding: gzip`, staging returned `Content-Encoding: gzip` for herbs: 14,413 B transferred for the full response and 5,619 B for page 1 (12 items). Vercel returned Brotli for `/library`: 4,267 B transferred. These are single transfer samples and do not include all browser assets.

The local production build has 29 files in `.next/static/chunks`, totaling 1.54 MiB uncompressed on disk; the largest is 413 KiB. This is an asset inventory, **not** a per-page download size or proof that all chunks load on one page.

## Existing instrumentation and gaps

- Express supplies `Server-Timing` and `X-Response-Time`; requests above the configured 1,000 ms threshold log `slow_request` with pool metrics.
- Herb list/detail queries use a five-minute in-process cache. This is per backend instance; cache hits and cold queries may differ after restarts or scaling.
- Herb and forum list APIs accept page/limit, but omitting them returns the full list. The library and admin currently request unpaginated herbs.
- Messenger history is paginated. The new-message user picker and several admin lists load all rows.
- No authenticated admin, messenger, or AI request was measured here. No browser Core Web Vitals, query plans, concurrency results, or 5,000-user capacity result is available from this baseline.

## Phase 2 targets

1. Add bounded pagination to large admin and messaging user lists, preserving search and selection behavior.
2. Make library and admin fetch only the data they need, then compare response bytes and timing with this baseline.
3. Inspect any remaining slow-request logs and database query plans before changing indexes or pooling.

## Phase 2 implementation (local, awaiting deployment measurement)

- Public library now requests 12 herbs at a time, with server-side search and category filters. A small categories endpoint supplies the complete filter list; direct herb links fetch details independently of the current page.
- Admin now fetches data for the open tab. Its dashboard receives counts, grouped charts, and four recent suggestions from one summary endpoint. Herb and user tables request 25 records per page.
- Messenger's new-message picker requests 20 users at a time, searches on the server after a short delay, and can load more. Direct message links fetch the target user by ID.
- Home trending herbs and Dr.AI source-link mapping now use a compact herb catalog containing only names, IDs, and display images instead of the full herb records.
- The admin knowledge-base table now requests 25 facts per page and searches on the server; the existing full-list endpoint remains available for other callers.
- Admin pending reviews request 10 submissions per page; contributor suggestion history retains its existing response shape.
- Messenger conversation previews now come from a bounded 25-item database query, with server-side name search and a load-more control. Its latest-message query orders in PostgreSQL instead of sorting all conversations in Node.js.
- A code review of forum comments found a single comment query with author inclusion plus a separate batched liked-ID query; no per-comment read query was found on that path. No database query plan or production slow-log sample was available, so a broader N+1 conclusion would be premature.
- Conversation pagination currently uses offsets. Concurrently arriving conversations can shift later pages; keyset cursors are a future improvement if this becomes visible under load.

The original staging timings above predate these changes. Compare the deployed page sizes, request counts, and app timings after rollout; do not treat local build success as a live speed improvement.

Read-only checks against the separate local Neon database exercised the new catalog, category, knowledge-base, review, and conversation queries. The compact herb catalog serialized to 5,799 B versus 86,127 B for the full herb array; a 12-herb page serialized to 25,907 B. The knowledge-base page returned 25 of 33 facts. These are local response-data sizes without HTTP envelopes or compression, so they are not directly comparable to the staging transfer measurements above.

## Phase 3 and 4 local follow-up

- Phase 3 defers Recharts into a dashboard-only component, provides library and chart loading skeletons, and debounces community search by 250 ms. A local production build and focused lint passed. No browser timing comparison has been made yet.
- Phase 4 reviewed image delivery and client caching. Herb cards already use `next/image` for bundled and configured remote hosts, with lazy loading and responsive sizes; other remote hosts fall back to ordinary lazy images. The largest bundled herb image is about 1.1 MB, and the page-wide botanical background is about 0.8 MB. Re-encoding those files requires visual comparison before claiming a safe size reduction.
- The client response cache now prevents a request invalidated while in flight from repopulating stale data. Successful login and forced session logout clear cached user-specific responses so a later account cannot reuse the previous account's notifications or profile. This is a correctness fix, not a measured latency improvement.
- Do not infer production speed or capacity improvements from local builds. Repeat browser image transfer and authenticated cache behavior checks after deployment, then compare with the staging baseline above.

## Phase 5 image delivery

- Re-encoded the two page-wide botanical JPEG backgrounds to WebP at their original 1,376 × 768 resolution and visually checked both versions. The light asset went from 798,708 B to 88,848 B (89% smaller); the dark asset went from 494,609 B to 20,152 B (96% smaller). These are file sizes, not measured network-transfer savings.
- CSS `image-set()` selects WebP when supported and retains the original JPEG as a fallback. No herb reference photograph was recompressed: those photographs require a separate image-by-image accuracy and attribution review.
- A local production build passed, and headless Chrome loaded each WebP with HTTP 200 after switching from light to dark mode. The backend was not running during this image-only check, so herb API requests failed; this was not an end-to-end functional test.
- The image delivery change still needs a deployed browser/network check. It does not resolve the separate authenticated-load and database-capacity acceptance targets.

## Phase 6 read-only query-plan and regression check

- Against the separate local Neon database, a read-only transaction counted 37 published, verified herbs. `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` showed sequential scans for the 12-herb page and a Lagundi search; execution times were 0.119 ms and 0.128 ms, with no shared disk reads in these warm samples. With only 37 qualifying rows, this does not justify adding another index.
- A representative conversation-preview query over six messages also used a sequential scan and completed in 0.128 ms. This tiny local sample cannot predict production behavior under a larger conversation history or concurrency.
- Backend build and lint passed; all 173 backend tests across 31 files passed. Full frontend lint passed. The Phase 5 frontend production build had already passed. No schema, pool, load-balancer, or deployment configuration was changed based on this evidence.
- The local PostgreSQL driver still emitted its existing `sslmode=require` compatibility warning during the read-only check. This phase did not change TLS settings; assess the connection-string configuration separately before upgrading `pg` or `pg-connection-string`.
