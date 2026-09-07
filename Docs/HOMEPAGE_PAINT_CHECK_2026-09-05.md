# Homepage paint follow-up — 5 September 2026

Status: In Progress. PR-001 is not accepted.

## Changes verified

- Removed two unused Geist font declarations/preloads from the root layout. Application CSS uses other font stacks; no application references consume these variables.
- Added `scripts/check-homepage-paint.mjs`: five fresh, unauthenticated Chrome contexts at 1440 × 900, with LCP element and stylesheet/font timings. Defaults to port 3001; override with FRONTEND_URL. Checks the page title to reject an unrelated application. Does not send AI queries or email.
- Demo launcher now checks IPv4/IPv6 listeners, child process exit state, and the Herbal AI page title before claiming readiness.

## Evidence

Port 3000 was serving Data Quality Detective Checker. Initial measurements against that application were discarded. Its process was left untouched. Herbal AI was tested separately on port 3001 using a production build.

| Run | Before LCP (ms) | After LCP (ms) |
|---|---:|---:|
| 1 | 4924 | 3972 |
| 2 | 1044 | 780 |
| 3 | 896 | 800 |
| 4 | 2268 | 984 |
| 5 | 912 | 996 |

In both sets the LCP element was the hero H1 and LCP equalled first contentful paint. The after set made no font resource requests, confirming the removed downloads. The slowest run remains above 2.5 seconds. These small local samples are diagnostic, not a reliable causal speedup estimate or staging acceptance: machine load was uncontrolled and the test backend was stopped before the after set. Anonymous static/fallback rendering was in scope, not authenticated workflows.

Frontend production build (including TypeScript), 18 route generation, lint, and git diff whitespace checks passed. The updated launcher rejected occupied port 3000 before starting processes. Its clean-port success path was not rerun.

## Next work

Correlate browser trace events with navigation/paint timestamps and repeat on a second machine or staging. Follow with PR-004 high-concurrency latency work. Do not mark PR-001 complete based on this cleanup alone.

## Continued investigation

The production frontend was isolated on port 3001 with the backend consistently offline for these anonymous fallback-rendering diagnostics. The existing port 3000 application was untouched. These are not complete-system or authenticated acceptance tests.

- Standard fresh-context LCP samples: 3396, 916, 828, 808, 948 ms.
- With JavaScript disabled, first contentful paint still took 2456 ms. LCP observers installed by the script did not report in this mode; this number is FCP, not LCP.
- Test-only CSS blur removal: 2024, 868, 816 ms. Matched CSS-interception control: FCP 2644 ms on the first run (LCP observer had not reported), followed by LCP 812 and 940 ms. This small sequential comparison does not establish a consistent benefit, so application styling was not changed.
- Pre-initializing a blank page renderer without loading application resources did not resolve the first-visit delay: LCP 3616, 748, 748 ms.
- Final traced run: LCP/FCP 2980 ms; TTFB 22.5 ms; CSS finished at 131.9 ms; load event at 1087.3 ms. Long tasks included 686 ms and 156 ms. Trace events included approximately 660 ms of layout and 1898 ms in LayerTreeHost shutdown / graphics synchronization. Nested durations overlap and must not be summed. The longest-event summary alone does not prove which graphics events caused the paint delay.

The diagnostic now validates run count and HTTP status, records execution modes, navigation timings, long tasks, and optional CDP trace summaries. JavaScript-enabled runs wait for an actual LCP observation (15-second timeout) instead of silently returning an empty sample. Test-only controls are PAINT_NO_JS=1, PAINT_NO_BLUR=1 (0 for intercepted control), PAINT_WARM_RENDERER=1, and PAINT_TRACE=1. PAINT_RUNS accepts 1–20. No control changes application files.

Verification: updated normal/trace run completed successfully against Herbal AI; no application code changed in this investigation. PR-001 remains In Progress. Graphics startup and layout are investigation leads, not a confirmed root cause or a verified fix.
