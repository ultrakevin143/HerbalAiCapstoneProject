# Wallet session-boundary recovery

Date: 10 October 2026, Asia/Manila.

Status: repaired and validated locally; uncommitted and not deployed. The source baseline and last recorded live release are `222de74806bfb951b956c204cfa8fee2fa6d758f`.

## Reproduced defects

Controlled tests using the actual shared Axios client reproduced four client races, not speculative production incidents:

1. A former account's unauthorized checkout POST, queued behind refresh, was replayed after a newer login completed.
2. A failed former refresh emitted `auth-logout` after the newer login, signing out that new client session.
3. A delayed successful saved-answer response still resolved after logout, exposing the former result to its caller.
4. Wallet requests dispatched while login was pending could use the previous cookies before the new session was confirmed.

The first three added cases failed against the original client: 34 existing cases passed and three new cases failed. The pending-login case subsequently reproduced the fourth gap after the initial repair: 38 passed and one failed. These counts are intermediate reproductions, not the final suite result.

## Focused repair

- `herbalaifrontend/lib/axios.ts` tags requests with a private session generation. Login/logout advance that generation and reject the former refresh queue.
- A generation mismatch cancels former responses/retries rather than delivering data, replaying checkout or emitting a stale logout event.
- Login/logout transitions block other shared-client requests until that matching transition completes or fails. Failed login preserves its real credential error and releases the temporary block.
- A new transition aborts the old shared refresh transport. Old refresh completion cannot flush a new generation's queue.
- Existing same-session coalescing, finite request/refresh timeouts, cookie transport, single retry, caller cancellation and genuine expiration handling are retained.
- Fifteen regressions were added to `scripts/auth-refresh.test.mjs`, including real loopback HTTP transport-abort evidence. Mock identifiers/text are fixture data, not authentication credentials. The release review added eight passing checks for late unauthorized responses, superseded login completion and login/logout timeout, unavailable-server and cancellation recovery; these did not reproduce another defect or require additional production code changes.

No backend, credit pricing/grants, UI styling, migration, account password, production setting or database record changed.

## Observed validation

| Check | Observed result |
| --- | --- |
| Initial original-client regressions | Three new failures, 34 existing passes |
| Pending-login reproduction after first repair | One new failure, 38 passes |
| Focused auth/credits/cache/feedback/stream selection | 173 passed, zero failures/skips at that intermediate checkpoint |
| Initial complete frontend Node selection (`scripts/*.test.mjs`) | 430 passed, zero failures/cancellations/skips |
| Release-review complete frontend Node selection | 438 passed, zero failures/cancellations/skips; all 49 session-refresh cases passed |
| Separate frontend footer cases | Four passed, zero failures/skips; 442 total frontend cases across the two selections |
| Focused lint (`npx eslint lib/axios.ts`) | Passed |
| Full frontend lint (`npm run lint`) | Passed, no errors or warnings |
| Independent TypeScript (`npx tsc --noEmit`) | Passed |
| Optimized constrained Next.js build (`npm run build -- --webpack`) | Passed; separate TypeScript validation ran first |
| Chrome with actual browser Axios transport and isolated mock cookies | Five of five passed; details below |

The build used process-only `NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api` and `NEXT_CONSTRAINED_BUILD=1`. No environment file, build configuration or production variable was modified. Generated builds and the loopback fixture are not publication artifacts.

### Chrome transport acceptance

A separate temporary server bound only to `127.0.0.1:4612` served the actual transpiled repository client and installed Axios browser bundle. It used a uniquely named, synthetic HttpOnly cookie and mock responses, without passwords, Neon, AI, provider API calls or real payments. The page was operated through connected Mercado Chrome; this was not a production credential test or a full application UI acceptance run.

1. Former checkout hit the server once. Login aborted its held refresh; the server observed the transport close. The queued checkout was canceled, no replay occurred, and a subsequent wallet GET carried only the new mock account cookie. No stale logout event occurred.
2. After logout, releasing the held saved-answer success canceled its caller. A subsequent GET observed the mock cookie cleared, not the former account.
3. While mock login was held pending, the wallet call was canceled before reaching the server. After confirmation, one wallet call used the new cookie.
4. Two concurrent same-session requests shared exactly one refresh and each retried successfully. No logout was emitted.
5. A genuine current-generation mock 401 refresh still rejected its wallet request and emitted exactly one logout event.

The page displayed `PASS: 5/5 isolated browser checks.` A sanitized JSON trace and screenshot were saved outside Git. The fixture cleared its unique cookie, its temporary tab was closed, and only its positively identified server process was stopped. Existing user tabs and the separate port-5000 listener were left untouched.

## Evidence files outside Git

Task directory: `C:\Users\Hp\Documents\Codex\2026-10-07\what-can-you-proposed-fix-for`.

- `session-boundary-before-20261010.log`: original-client three-case reproduction.
- `session-transition-before-20261010.log`: pending-login reproduction.
- `session-boundary-final-20261010.log`: intermediate 173-case selection.
- `session-boundary-all-frontend-final-20261010.log`: final 430-case result.
- `session-boundary-release-all-20261010.log`: later complete 438-case release-review selection.
- `session-boundary-release-auth-20261010.log`: 49 passing session-refresh cases.
- `session-boundary-full-lint-20261010.log`: full frontend lint.
- `session-boundary-footer-20261010.log`: four separate footer cases.
- `session-boundary-build-20261010.log`: successful optimized build.
- `session-boundary-browser-results-20261010.json`: five Chrome checks and synthetic transport traces.
- `session-boundary-browser-20261010.png`: visible Chrome completion evidence.
- `session-boundary-browser-20261010.mjs`: loopback-only acceptance harness; not production code.

## Limits and next release gate

- Client cancellation does not roll back a mutation already processed by the server. Server ownership, idempotency and transaction checks remain necessary; these tests do not claim to undo a payment or checkout already created.
- This generation is scoped to one loaded shared-client instance. Cross-tab server-side session revocation, simultaneous real credential submissions and already-received browser Set-Cookie races are not certified by the controlled transport tests.
- No production outage/account-switch race was manufactured. No manual password, physical-device, participant, merchant or real-money result is invented.
- The user authorized committing/pushing only the two code/test files and this report to the existing `codex/mvp-acceptance-ci` branch for full exact-SHA CI. This is not authorization to deploy production. Any later release should preserve the live database/settings and exclude all fixtures/logs/builds/credentials. After authorized release, perform bounded genuine authentication/wallet/saved-answer checks without repeated payments or AI prompts.
- All unrelated working-tree documentation was preserved. This continuation did not commit or push.
