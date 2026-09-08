# Performance Follow-up — 7 September 2026

## Outcome

Two locally actionable performance paths were improved without weakening authorization or removing responsive behavior:

1. Password and Google login now prime the bounded, safe session-profile cache from the account record already retrieved during authentication. The cached value contains only the fields returned by `/api/auth/me`; password and token fields are excluded. Existing ban, profile, verification, and password-change invalidation remains active.
2. The homepage was split into a server-rendered page shell and focused client components for the authenticated hero, trending-herb refresh, and contribution call-to-action. The static “Why Herbal AI?” section no longer belongs to the page-wide client bundle/hydration boundary.

## Measurements

Production-style frontend/backend on the same Windows laptop, Chrome 1440 × 900, five fresh browser contexts:

| Run | Homepage LCP |
|---:|---:|
| 1 | 2,636 ms |
| 2 | 900 ms |
| 3 | 744 ms |
| 4 | 820 ms |
| 5 | 868 ms |

The five-run local p95/max was 2,636 ms, below the 3,000 ms PR-001 threshold. This is a **local provisional pass**, not staging or device acceptance.

The controlled post-login benchmark created one temporary verified contributor directly in the database, authenticated through the production API, requested `/api/auth/me` three times, asserted identity and absence of a password field, logged out, then removed the token/account with an absence assertion.

| Measurement | Result |
|---|---:|
| Login | 5,020.1 ms — dominated by remote database/token operations and still requires staging work |
| First `/api/auth/me` after login | 37.5 ms end-to-end / 9.1 ms application |
| Second `/api/auth/me` | 19.6 ms end-to-end / 9.6 ms application |
| Third `/api/auth/me` | 19.7 ms end-to-end / 7.5 ms application |

## Visual and safety checks

- Desktop 1440 × 900 and mobile 320 × 800 homepage captures had zero horizontal overflow and preserved navigation, hero, Dr. AI preview, feature cards, herb cards, contribution CTA, and footer.
- A visible gradient/plant fallback now occupies the contribution image frame while its lazy remote image is unavailable or not yet loaded.
- The cache continues to be short-lived and mutation-invalidated. It does not replace server-side account-state checks beyond the configured TTL.
- One new cache regression verifies that credential fields are not retained in the session value.

## Remaining boundary

PR-001 is provisionally met in this local five-run sample. PR-004 and PR-005 remain unaccepted because cold distinct-user performance still depends on the remote database/network, and production-like staging with separate load generation is unavailable. Login itself remains a performance target for future database-proximate staging.
