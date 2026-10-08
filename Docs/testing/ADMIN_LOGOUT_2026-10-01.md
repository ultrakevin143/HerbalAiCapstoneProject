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

## Released and tested live — 2 October 2026

The reviewed five-file batch was committed as b7913bcbb009b06ad28b4830631aae580fb44a20 and pushed to codex/mvp-acceptance-ci. [Isolated CI run 36888913872](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36888913872) succeeded: logs confirm 523 backend tests across 67 files and 119 frontend regressions, including the seven administrator logout cases. The same commit was atomically fast-forwarded to main and codex/readability-accessibility. Main CI run 36889169081 and deployment-branch CI run 36889169063 subsequently succeeded. Vercel and Railway both reported successful deployments for the release SHA.

| Live check | Observed result | Boundary |
| --- | --- | --- |
| Authenticated desktop dashboard | Admin Kevs dashboard loaded with the new Log out button beside existing footer controls | Actual Mercado Chrome; no administrator password changed by the agent |
| Mobile discovery | At 390 by 844 CSS pixels, opening Toggle admin navigation exposed Log out within the viewport | Browser emulation, not a physical phone |
| Mobile horizontal fit | Document width was 375 against a 390-pixel viewport; logout bounds were x=16..358, y=352.77..398.52 | No horizontal overflow; temporary viewport override restored |
| Keyboard activation | Pressing Enter on Log out completed navigation to Sign In | Actual live logout request, not a mock |
| Independent protected-route check | A second previously opened administrator tab redirected to /signin?callbackUrl=%2Fadmin after reload | No dashboard or protected data rendered after logout |
| Browser Back | The logout tab returned to Sign In rather than reopening the administrator console | Actual history action; not a promise about every browser's history UI |

Visual evidence is saved outside Git in admin-logout-live-desktop-20261002.png, admin-logout-live-mobile-20261002.png and admin-logout-blocked-admin-20261002.png in the task visualization directory. The authorized logout ends the administrator session in this Chrome profile; it is not a password reset or an all-device administrator password mutation.

The user selected kevinmercado987@gmail.com for the next Google-linked password test. Google account selection and the branded signing-in page returned to the authenticated Mercado Kevin contributor homepage. Account settings showed the expected email and username mercado_kevin_b67e52. The email-link request and actual Inbox delivery passed; the secure password form awaits user entry and submission. That remaining lifecycle is recorded in PASSWORD_SETTINGS_2026-10-01.md, not counted as completed here. No additional commit or push was performed for this post-release evidence.
