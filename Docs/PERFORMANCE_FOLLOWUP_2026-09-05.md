# Performance follow-up — 5 September 2026

Status: PR-001 and PR-004 remain In Progress.

## Homepage controls

Added clearly labelled test-only controls to `scripts/check-homepage-paint.mjs`:

- `PAINT_MINIMAL=1`: intercept the page with minimal static HTML (not Herbal AI application results).
- `PAINT_DEFER_SECTIONS=1`: intercept CSS to try content-visibility on sections after the hero; no source styling changes.

Minimal control LCP: 828, 144, 144 ms. Deferred-section experiment LCP: 3768, 904, 920 ms. The minimal page demonstrates some fresh-browser overhead, but does not account for the whole application delay. Deferring sections did not establish an improvement. No experimental CSS was applied to the application.

## Load-test instrumentation and safeguards

`scripts/run-local-load-test.mjs` now reports application p95 from X-Response-Time alongside client end-to-end p95 and the number of header samples. Missing measurements remain null, not zero. Endpoint warmup must succeed before a load run begins.

An initial attempt raced backend startup and produced 20 connection failures. It was not a valid capacity measurement. The new preflight guard prevents this from being reported as a completed load run.

## Completed measurements

Production backend on localhost:5000; client and server on the same Windows machine. Public catalog data were read, not modified. The authenticated run used one authorized account, with its new refresh session logged out successfully afterward. No test accounts were created, emails sent, or AI calls made.

First completed run: stages 10, 50, 100, 250, 500 for health and cached herbs; **1820 requests, zero failures**.

Second completed run: stages 100, 250, 500 for health, cached herbs and one authenticated session; **2550 requests, zero failures**.

| Second run endpoint | Concurrency | End-to-end p95 (ms) | Application p95 (ms) |
|---|---:|---:|---:|
| Health | 500 | 1122.8 | 0.8 |
| Cached herbs | 500 | 1096.0 | 2.7 |
| Authenticated session | 100 | 353.1 | 264.7 |
| Authenticated session | 250 | 1206.3 | 7.3 |
| Authenticated session | 500 | 1760.3 | 4.8 |

All listed requests returned HTTP 200 and supplied application timing. One-account concurrency is not distinct-user capacity or sustained traffic. Cache expiry and refresh can affect samples; the 100-request authenticated stage had much higher application time than subsequent warm stages.

Application timing starts in Express middleware and ends at response completion initiation. It excludes socket admission and client scheduling, and does not measure full body delivery. Percentiles from the two distributions cannot simply be subtracted to assign a causal percentage. The gap suggests substantial overhead outside the instrumented handler, including possible server scheduling, connection establishment and same-host load generation. It does not prove the database is irrelevant or that deployment capacity is sufficient.

## Next acceptance work

Regression verification: backend tests 37/37 passed across seven files; both updated scripts passed Node syntax checks; git diff whitespace check passed. With the temporary backend stopped, the new preflight correctly exited before load stages. Temporary frontend/backend test processes were stopped; the unrelated port 3000 application was not stopped.

Repeat on staging with the load generator on a separate machine; capture CPU, event-loop delay and connection metrics alongside both timings. Include distinct users, cache-expiry cycles and sustained traffic. Repeat homepage timing on another browser/device. PR-004 still fails the 1000 ms p95 target locally at 250/500 authenticated concurrency. Do not add longer-lived authorization caches or weaken security based on this evidence.
