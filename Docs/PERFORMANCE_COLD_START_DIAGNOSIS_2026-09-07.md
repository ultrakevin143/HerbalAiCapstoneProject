# Performance cold-start diagnosis — 7 September 2026

Status: **Improved, not accepted**. PR-001 and PR-004 remain open.

## Bounded diagnosis

`scripts/diagnose-session-latency.mjs` creates exactly 50 temporary verified contributors, measures database and authenticated-session layers, validates response identity/no password field, and deletes those exact accounts with an absence assertion. It never sends mail or invokes Dr. Ai.

Initial run `ea6e9e8c78524ab8`:

| Layer | Result |
|---|---:|
| Fresh PostgreSQL connection | 2,138–2,541ms (3 samples) |
| Warm `SELECT 1` | p95 271.7ms (15 samples) |
| Prisma lookup, 1 / 10 / 50 IDs | 265.7 / 260.8 / 264.0ms |
| First authenticated HTTP request | 3,503.9ms end-to-end; 3,284.5ms application |
| Following 11 authenticated requests | p95 20.7ms end-to-end; 8.1ms application |

This isolates a large remote connection/first-query cost and confirms that a 50-ID query is approximately the cost of a one-ID query in this environment. It does not prove that every latency spike is caused by the database.

## Startup remediation

The backend now opens the configured minimum database connections and executes a harmless `SELECT 1` through Prisma before listening. Opening sockets alone did not reduce first-request time; initializing the ORM query path was necessary. The server is not reported ready until warm-up succeeds. No user records are cached by this step, and authentication/cache TTLs are unchanged.

The socket-only intermediate run took 14,930.3ms to report the demo ready and still produced a 3,925.7ms first authenticated request, so socket-only warm-up was not retained as the final behavior. Partial warm-up failure now releases every connection that did open before propagating the error. The local launcher allows 30 bounded readiness attempts to accommodate intentional remote initialization.

After run `73c38b8d81e84a1c`:

| Layer | Result |
|---|---:|
| Demo ready | 15,303.9ms |
| Fresh diagnostic PostgreSQL connection | 3,066–4,003ms (external control; still slow) |
| Warm `SELECT 1` | p95 280.8ms |
| Prisma lookup, 1 / 10 / 50 IDs | 268.2 / 266.9 / 277.7ms |
| First authenticated HTTP request | **535.2ms** end-to-end; 411.0ms application |
| Following 11 authenticated requests | p95 **18.3ms** end-to-end; 9.6ms application |

The first authenticated sample improved by 84.7% versus the initial diagnostic, but these are single local samples under different network conditions; treat the percentage as diagnostic evidence, not production acceptance. Readiness is intentionally slower because it absorbs the remote startup work.

## Bounded burst retest

Run `7d309496e60c4c06`, explicit IPv4, one request per distinct temporary user:

| Users | Success / total | End-to-end p95 | Application p95 | Target |
|---:|---:|---:|---:|---|
| 10 | 10/10 | 322.7ms | 281.1ms | Pass locally |
| 50 | 50/50 | 468.3ms | 362.1ms | Pass locally |
| 100 | 100/100 | 2,413.4ms | 2,125.7ms | **Fail** |

All 160 requests succeeded and all 100 temporary accounts were removed. Across three 50-account diagnostics and this 100-account burst, **250 exact temporary accounts** were deleted with absence assertions. The 100-user result demonstrates continued remote/query variability, so the system cannot claim consistent <=1s p95 through 100 distinct cold sessions. No 250/500 stage was repeated in this round.

## Regression and limits

- Backend build and lint passed after the startup change.
- Full backend regression remained **77/77 passing across 13 files** before the final Prisma warm-query addition; production startup plus the two diagnostic runs directly exercised that addition successfully.
- Local presentation rehearsal passed all emitted public/responsive/search/signed-out checks after the change.
- The PostgreSQL driver warns that future versions will change the semantics of some SSL mode aliases. No connection URL or secret was printed or changed in this work.

Remaining acceptance requires deployment near the database or a controlled staging environment, separate load generation, repeated cold/warm samples and 100/250/500-user targets. The current local/remote arrangement is suitable for capstone demonstration but not evidence of production-scale capacity.
