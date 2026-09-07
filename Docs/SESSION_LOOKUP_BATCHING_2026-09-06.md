# Session lookup batching — 6 September 2026

Status: implementation verified; PR-004 performance acceptance remains **In Progress**.

## Retained implementation

Uncached `findUserById` lookups now share a short nominal 5ms collection window and a query bounded to 100 distinct IDs. The existing five-second/configured session cache remains responsible for caching; the batcher itself neither caches nor reuses in-flight results. Results are mapped by ID, not database ordering, and missing accounts resolve to null. The safe selected profile fields are unchanged; passwords are not selected. Failed batches reject all waiting callers and later calls can retry.

No pool size, cache TTL, authentication, firewall or persistent environment configuration was changed. The small collection window adds scheduling latency to an isolated cache miss; busy-event-loop delays can exceed the nominal timer. This trades a small isolated-request delay for fewer queries during bursts.

Files: `src/lib/batched-lookup.ts`, `src/repositories/user.repository.ts`, `tests/batched-lookup.test.ts`, `tests/user-session-cache.test.ts` in the backend. The load runner additionally validates returned profile identity and absence of a password field on every successful response.

## Regression evidence

- Four new batcher tests: duplicate/out-of-order/missing mapping; 250 requests split into 100/100/50; failure propagation/retry; no reuse of an older in-flight lookup.
- New cache race test: a result started before a ban cannot repopulate the cache with the old unbanned profile after invalidation.
- Targeted cache/batcher run: 9/9 passed.
- Full backend suite: **77/77 across 13 files**, 67.95 seconds. Build and lint passed. Final build after reverting the listener experiment also passed.
- Final production browser regression passed comments/replies/likes/ownership, Messenger touch edit/navigation, notifications, admin ban/unban with immediate session blocking/restoration, six admin tabs and logout/revoked refresh/protected routes. Its temporary records were cleaned. Demo processes were stopped after verification.
- The existing invalidation policy remains unchanged: this does not claim that a request already underway before a mutation can be retroactively cancelled.

## Local measurements

Production backend; same Windows machine generates traffic, remote database. Sequential stages reuse earlier users/cache entries, and environment/load are not controlled enough for a causal percentage-speedup claim.

| Stage | Before p95 ms (`cda2a428fab24db0`) | Batched p95 ms (`8d58afdaf3134069`) |
|---|---:|---:|
| 10 users | 2650.2 | 2475.1 |
| 50 users | 1417.8 | 467.5 |
| 100 users | 1522.8 | 572.6 |

Both runs completed all 160 requests successfully and cleaned 100 fixtures each. The 50/100 after-samples meet 1000ms locally; the initial burst does not. The deterministic batch-bound test verifies query consolidation independently of noisy latency samples.

Larger follow-ups:

| Configuration / run | 100-user p95 ms | 250-user p95 ms | 500-user p95 ms | 500 errors |
|---|---:|---:|---:|---:|
| Batching, default listener, localhost / `20eb2314c242490b` | 2559.5 | 3335.1 | 1427.7 | 125 ECONNREFUSED |
| Batching, experimental backlog 1024, localhost / `96480dfdcb744412` | 3240.6 | 3344.9 | 1820.5 | 69 ECONNREFUSED + 12 ETIMEDOUT |
| Batching, restored default listener, explicit 127.0.0.1 / `f1b9b21c5df445bb` | 4369.2 | 3323.4 | 2592.5 | 55 ECONNREFUSED |

Each larger run stopped with a failing exit status after exceeding the 5% error threshold, and deleted/verified absence of its 500 fixtures. All successful responses in the final two runs passed identity/field checks. Reported end-to-end p95 includes failed attempts; application timing exists only for responses with headers and is not a direct comparison of the same population. A separate 500-request health burst returned 500 HTTP 200 responses. The backend remained reachable after the tests.

These results do not prove a listener-backlog or address-family root cause. The backlog change did not resolve failures and was **reverted**. Explicit IPv4 also failed, so no application URL was changed. Database queueing/connection startup and local transport admission remain investigation areas; error counts from these uncontrolled runs cannot establish an improvement percentage.

## Safety and next acceptance step

All **1700 load-test fixtures** from this turn were removed by exact generated addresses, with cleanup assertions. No actual account, email delivery, firewall rule or schema was changed. Stop further repeated 500-client stress until transport admission and cold database-pool behavior can be isolated. A separate-machine/load-generator comparison is still needed for capacity claims; hosting purchase remains deferred. PR-001 homepage timing, participant UAT and reviewer sign-off remain separate open work.
