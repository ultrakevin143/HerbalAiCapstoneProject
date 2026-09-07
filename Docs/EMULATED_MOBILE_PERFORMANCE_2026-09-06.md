# Chrome mobile and performance follow-up — 6 September 2026

## Selected pair and outcome

1. Chrome-emulated mobile workflow regression: **Verified for exercised workflows**. Kevin chose browser emulation instead of opening firewall access on a neighbor's Wi-Fi. Physical Samsung/iOS acceptance remains unverified, not silently replaced by a device claim.
2. Performance acceptance: **In Progress / targets not met**. Do not mark PR-001 or PR-004 accepted.

## Mobile evidence

`node scripts/rehearse-mobile-workflows.mjs` passed against the production demo after the accessibility changes:

- Herb comment/reply live updates, like/unlike persistence, ownership checks, deletion and modal layouts at 320/390/430 pixels.
- Messenger back/contact/send/touch-edit controls and 320px notification controls.
- Admin ban/unban persistence, immediate cached-session blocking/restoration, self-ban and contributor denial, and six mobile admin tabs.
- Logout clears both cookies, revokes the issued refresh token and protects four routes.
- Temporary accounts, comments, messages, tokens and associated audit records were cleaned; assertions passed.

This supplements the prior 26-page-width axe scan. It is not complete WCAG, exhaustive dialog or physical-keyboard acceptance.

## Homepage measurements

Five fresh anonymous Chrome contexts, 1440x900, production frontend/backend running locally. Browser workflow testing finished before timing began. No experimental CSS interception or disabled JavaScript was used. Command: `FRONTEND_URL=http://localhost:3000 PAINT_RUNS=5 node scripts/check-homepage-paint.mjs` (set these variables in PowerShell before running).

LCP milliseconds: **2556, 748, 692, 724, 728**. The hero H1 was the LCP element in every sample. The slowest sample exceeds the 2500ms target. These small same-machine samples are not a controlled before/after speedup or field percentile estimate.

## Distinct-user load measurements

Runner: `scripts/run-distinct-user-load-test.mjs`. Separate temporary contributor accounts, one authenticated `/api/auth/me` request per selected user per stage; database and network are shared external resources. Increasing stages reuse some earlier users and may encounter warmed caches. This is burst testing, not sustained independent-user capacity.

| Concurrent distinct users | Successes / requests | End-to-end p95 ms |
|---|---:|---:|
| 10 | 10 / 10 | 2548.1 |
| 50 | 50 / 50 | 1396.6 |
| 100 | 100 / 100 | 1518.8 |
| 250 | 250 / 250 | 4259.3 |
| 500 | 405 / 500 | 7279.2 |

Run `52edd2a638324466`: 910 requests, 95 failures (all at the 500 stage, 19% of that stage). Fetch reported TypeError without a captured nested transport code; the precise connection failure cause remains unknown. The newly added >5% error/timeout safety condition fired and the process exited nonzero. All 500 fixtures were deleted and absence checked. Backend health returned HTTP 200 afterward.

Backend logs during slow requests showed a ten-connection pool with queued work and long application durations. This supports investigating database/pool/network latency but does not establish the cause of the 95 transport failures or justify increasing pool limits blindly.

A bounded diagnostic follow-up (`8aa5855c50fa4fc9`) added application timing and safe nested error-code reporting, without replaying the 500-user stress stage:

| Users | Successes / requests | End-to-end p95 ms | Application p95 ms |
|---|---:|---:|---:|
| 10 | 10 / 10 | 322.5 | 284.3 |
| 50 | 50 / 50 | 1151.7 | 1001.3 |
| 100 | 100 / 100 | 1546.2 | 1262.4 |

All 160 follow-up requests succeeded and supplied timing headers. All 100 fixtures were deleted and absence checked. The 50/100 stages still exceed the 1000ms p95 requirement. Percentiles cannot be subtracted to establish causal attribution. No performance optimization is claimed from these measurements.

## Runner repairs and remaining work

- Authenticated preflight must now succeed before stages run.
- Stop when a stage exceeds 5% errors or p95 reaches the configured timeout; set a failing exit status.
- Cleanup uses exact generated email addresses even if ID capture fails, checks absence and always closes the database pool.
- Report application timing sample count/p95 and nested transport error codes without printing tokens or connection URLs.
- Node syntax check and repository whitespace check passed.

Next performance action: isolate remote database round trips, pool queueing and transport failures with bounded tests; compare cold/warm runs under controlled conditions before application changes. Separate-machine/staging acceptance remains deferred by the no-hosting decision. Do not weaken session invalidation, lengthen authorization-cache TTLs or open firewall rules to make tests pass. Participant UAT and final reviewer acceptance still require real people.
