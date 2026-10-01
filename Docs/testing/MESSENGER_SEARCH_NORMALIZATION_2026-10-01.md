# Messenger search normalization — 1 October 2026

## Scope and release boundary

Focused follow-up to the Messenger acceptance and password-recovery records. Baseline checkout: `d08e38495a3a4965e9a43b5d98eae4860fb2fe3c`. Existing styling, message synchronization, authentication, database configuration, and unrelated working-tree changes are preserved. This repair is local and has not been committed or deployed.

## Reproduced issue

Severity: medium usability defect. The backend trims conversation search and caps it at 100 characters, while the visible sidebar used the raw input for substring filtering. Surrounding whitespace could therefore hide a conversation returned by the backend. Whitespace-only input also hid all loaded rows, and input longer than the server's cap could disagree with server results.

Live reproduction on `https://herbalaiph.vercel.app/messenger`, using the existing recovered Herbal QA session:

1. The sidebar displayed the existing Admin Admin conversation.
2. Entering two spaces, `Admin`, then two spaces showed No conversations found.
3. Replacing that with `Admin` displayed the existing conversation again.

Only the search input was changed. No message was sent, edited, deleted, or uploaded during this check. The separate recovered Suggestions tab was not navigated or reset.

The same whitespace defect reproduced in the loopback fixture: a loaded TEST ONLY Alpha conversation disappeared for space-padded uppercase ALPHA. Baseline regression execution produced 20 passes and three failures out of 23 cases; the failures covered surrounding whitespace, whitespace-only input, and the 100-character boundary.

## Correction to the initial suspicion

An unmatched socket contact can be added to internal conversation state, but the existing rendered list already filters nonmatching names. The earlier suspicion of a visible unmatched-contact leak was not reproduced. A preliminary state-membership guard and its extra network revalidation were removed rather than shipping an unnecessary change. The final repair does not change socket insertion or reconciliation behavior. The regression suite explicitly verifies that a nonmatching realtime contact remains hidden.

## Focused repair

`herbalaifrontend/app/messenger/page.tsx` derives one normalized search value using `trim().slice(0, 100)`. The debounce, rendered name filter, and empty-state wording use that same value. Case-insensitive matching and the existing 250 ms debounce remain unchanged.

`scripts/messenger-sync.test.mjs` adds four regression cases which execute the actual page filtering expression rather than a copied implementation. Existing recovery, message-ordering, reconciliation, and socket authorization tests remain intact. The existing GitHub frontend test step already runs this script.

## Validation

- After repair, all 23 Messenger Node tests passed: the existing 19 and four new cases.
- Full frontend lint and TypeScript checking passed after the normalized value was placed after the state/ref declarations. An initial placement between state declarations triggered React Compiler memoization diagnostics; those were resolved without suppressing lint rules or changing unrelated callbacks.
- Next.js 16.3.8 production build passed, including TypeScript and generation of all 22 routes. Only that child process received the loopback fixture API setting; no production configuration was changed.
- The patched local production build displayed TEST ONLY Alpha for space-padded uppercase ALPHA. Whitespace-only search returned both Alpha and Beta after the server refresh. The desktop observation had a 1280 px viewport and document width of 1280 px.
- A requested 390 × 844 viewport override did not take effect: the actual browser still reported 1280 px. Both temporary overrides were reset. This is not counted as a phone-sized pass or physical-device evidence.
- No local PostgreSQL, production database test, new GitHub CI run, or deployment is claimed for this repair.

## Remaining distinct checks

The backend uses PostgreSQL ILIKE, whereas the sidebar uses literal substring matching. Percent and underscore search semantics therefore warrant a separate database-backed test and an explicit literal-versus-pattern decision. This is a static compatibility concern, not a newly observed database failure, and this patch does not change SQL semantics.

Historical old-password rejection remains unobserved live because the tester forgot that password. Recent email delivery, reset submission, session revocation, new-password login, protected refresh, and used-link rejection are documented in the separate live acceptance record. Genuine human tab resume and actual higher-page forum deletion also remain separate evidence gaps. No participant or physical-device result is invented.

## Evidence handling

Screenshots are saved outside Git in the local temporary directory:

- `herbalai-whitespace-search-before-20261001.png`: controlled local baseline.
- `herbalai-live-whitespace-search-before-20261001.png`: live baseline.
- `herbalai-whitespace-search-fixed-desktop-20261001.png`: repaired local desktop result, not a deployed fix.

The memory-only fixture and fixture-configured Next build stay local. No fixture account, cookie, credential, reset token, or production environment change is included in this patch.

Temporary agent-created search tabs were closed after validation. The previously recovered Suggestions tab is retained. The local preview and memory fixture processes were stopped. GitHub CI and live patched verification remain release steps, not completed results.
