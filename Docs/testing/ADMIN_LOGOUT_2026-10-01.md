# Administrator logout — 1 October 2026

## Request and implementation

The user requested a logout action in the administrator dashboard. The existing live dashboard exposed Public Site and theme controls but no administrator logout control.

The local administrator sidebar footer now includes a labelled Log out button with the existing Lucide icon system and admin navigation styling. It shares the existing sidebar footer with desktop controls and appears inside the existing expandable admin navigation on mobile. No new stylesheet, authentication endpoint or separate logout implementation was introduced.

The handler calls the existing AuthContext logout action, which posts to /auth/logout before clearing user state and the GET cache and navigating to /signin. The new handler guards duplicate clicks with a synchronous ref, disables the button while pending and exposes aria-busy. Failed requests show an alert and permit retry rather than falsely navigating as if server logout succeeded. The existing access-denied switch-account button uses the same guarded handler and displays errors as well.

## Observed validation

| Check | Result | Scope |
| --- | --- | --- |
| New administrator logout regressions | 7 passed | Actual page transpiled; hooks/auth action mocked, handlers invoked |
| Combined frontend regressions | 119 passed, 0 failed | Admin logout, password settings, session recovery, Messenger and Dr. Ai stream recovery |
| Frontend TypeScript check | Passed | npx tsc --noEmit |
| Frontend lint | Passed | Existing npm run lint |
| Production build | Passed; 22 static pages generated | Loopback-only build API URL; no live fixture or credential |
| Impeccable mechanical detector | Empty findings list | Changed administrator page only |

Regression cases cover visible non-submit semantics, existing theme-compatible classes, shared logout invocation instead of a shortcut redirect, busy feedback, duplicate requests, network failure and retry, backend error feedback, exclusion from loading/non-admin views, and handled access-denied logout failures. These are component/handler tests, not actual browser interaction with the new button or live cookie revocation.

The new suite is included in frontend GitHub CI. No commit, push or deployment was performed for this change. The live release remains db531de904de8ec2ba94d6ccc39e4bbf15080ad3. Following publication authorization, check desktop and mobile discovery, keyboard activation, logout redirect and rejection of protected admin access after logout. Do not claim a live logout-button pass before it is deployed and exercised.

## Caching clarification

No caching implementation was changed in this batch. The current frontend has an in-memory GET response cache, with a default 60-second lifetime and a 2-second lifetime for auth/me. Public library requests also use their own 60-second entries; they are not restricted to signed-in users. Successful login, logout and password-change logout clear the cache, and profile updates invalidate auth/me. Cache entries do not survive a full document reload. Authentication is still rechecked and the server still enforces session validity; caching is not a promise that all navigation or refreshes will be network-free.

Unrelated session-recovery evidence edits and the main checkout were preserved. User-performed live administrator password checks are recorded separately in PASSWORD_SETTINGS_2026-10-01.md.

## Publication authorization — 2 October 2026

The user authorized the proposed deployment and live checks. Before committing, the unchanged source was reviewed and the combined frontend regressions rerun: 119 tests passed, zero failed. The release is restricted to the administrator page, its native regression suite and CI step, this report, and the reviewed password-settings evidence. Three unrelated session-recovery report edits remain unstaged. Publish to the isolated existing CI branch first, and promote the same commit to main and the deployment branch only after its CI succeeds. Live logout, protected-route rejection and Google password setup are not yet counted as passed.
