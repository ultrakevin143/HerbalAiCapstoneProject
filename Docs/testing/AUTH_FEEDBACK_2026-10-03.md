# Authentication feedback audit — 3 October 2026

## Scope and release boundary

The user asked to proceed with the sign-in, signup and email-verification edge-case audit. Work uses the existing selective-release-check worktree on codex/mvp-acceptance-ci. The baseline is f909b60e80854e71210d2fb5051ef0ff748e48d1. This batch is local and uncommitted: no push, deployment, database change, migration, environment-variable change or real password/email operation was performed. Existing unrelated evidence-file changes and the Desktop checkout were preserved.

## Reproduced issue groups

| ID | Severity | Actual failure | Focused repair and source |
| --- | --- | --- | --- |
| AUTH-FEEDBACK-001 | Medium | Sign In, Sign Up and verification accept malformed error messages. Objects cause React child-render exceptions; numeric, boolean and blank values produce unusable feedback. Null Sign In/Sign Up rejections also cause secondary exceptions. | Reuse requestError and null-safe response access in app/signin/page.tsx, app/signup/page.tsx and app/verify-email/page.tsx. |
| AUTH-FEEDBACK-002 | Medium | AuthContext signup returns malformed success messages; verification dereferences absent/null response data; both resend surfaces accept malformed acknowledgements. These cases crash or lose useful success/status feedback. | Normalize signup messages at the actual AuthContext response boundary and use responseMessage in verification and resend handlers. Verification flags remain strictly validated. |
| AUTH-FEEDBACK-003 | Low | Sign In exposes a raw timeout message rather than connection/retry guidance; verification exposes raw caught error messages rather than the verification recovery message. | Preserve valid server errors and use action-specific safe fallbacks for injected network/timeout rejections. Pending controls still recover. |
| AUTH-FEEDBACK-004 | Medium | Signup discards server validation-array details; both resend catches discard a usable 429 wait/retry message. | Use the existing shared validated error parser for validation and resend errors. Preserve 502/504 uncertain-signup guidance, 503 unavailable guidance and 409 unverified-account recovery. |
| AUTH-FEEDBACK-005 | Medium | Verification logs the entire caught request, including configuration whose URL can contain the verification token. The regression captured that logging call; no actual user's token was exposed during the test. | Remove the complete-request console logging. Verification error feedback remains visible. |

These are five issue groups, not 34 distinct product defects. Existing colors, CSS classes, layout, input labels, buttons and credential handoff are unchanged. Only the Sign In network fallback gains connection/retry guidance. Login destinations, successful signup's five-second redirect, single-effect verification, missing-token recovery and server verification requirements are preserved. No cooldown or token rule was bypassed or changed.

## Reproducible automated evidence

scripts/auth-feedback.test.mjs transpiles and invokes actual page handlers. It extracts the actual AuthContext signup function from its TypeScript AST instead of copying its logic. Network requests, hooks and navigation are isolated test doubles. All fixture addresses and credentials are synthetic and no fixture sends mail, creates an account or talks to a database.

The first 46-case run against the unrepaired working source had 28 failures and 18 passes. After the focused repair, all 46 passed. The expanded final suite contains 54 cases, including preserved successful redirects, server rate-limit feedback and null rejections. A read-only replay against exact baseline f909b60 had 34 failures and 20 passes. The repaired working tree passes all 54. Some baseline failures concern feedback normalization rather than render crashes; they are not mislabeled as production outages.

PowerShell baseline replay, with no checkout or file replacement:

```powershell
$env:AUTH_FEEDBACK_BASELINE_REF='f909b60e80854e71210d2fb5051ef0ff748e48d1'
try { node --test scripts/auth-feedback.test.mjs }
finally { Remove-Item Env:AUTH_FEEDBACK_BASELINE_REF }
```

Combined current-source validation:

```powershell
node --test scripts/messenger-sync.test.mjs scripts/auth-refresh.test.mjs scripts/dr-ai-stream.test.mjs scripts/password-settings.test.mjs scripts/admin-logout.test.mjs scripts/library-accessibility.test.mjs scripts/auth-feedback.test.mjs scripts/deployment-config.test.mjs scripts/deployment-flow.test.mjs
```

- All 243 cases passed, zero failed/cancelled/skipped: 228 frontend functional regressions and 15 deployment-harness tests.
- Frontend ESLint, TypeScript checking and optimized Next.js production build succeeded; the build generated 22 routes.
- A new CI step runs auth-feedback.test.mjs. No fresh GitHub CI result is claimed for an uncommitted batch.
- Impeccable reported no findings on the three changed UI routes. Git whitespace checking passed.
- Timeout cases inject ECONNABORTED-style rejections to test recovery. They do not establish real hosting timeout timings, provider cancellation or database termination. The existing shared Axios client remains at its 30-second request timeout.

## Local browser validation

A temporary in-memory HTTP fixture listened only on 127.0.0.1:4314. A Next.js development preview listened only on 127.0.0.1:4313 with its API destination explicitly set to that fixture. The fixture had no persistence, mail sender, database, credentials or successful authenticated session. It returned controlled malformed verification/resend responses, and no real account was created or verified.

Observed in the connected browser:

1. A synthetic verification failure with an object message rendered the verification recovery text and resend form, rather than a React crash.
2. Resending to test@example.invalid received a synthetic object acknowledgement and showed the neutral fallback. The acknowledgement is fixture evidence, not an actual email-delivery result.
3. The same error/resend view remained readable at 390 by 844 browser pixels. Document width and viewport width both measured 390 pixels, with no horizontal overflow. This is browser emulation, not physical-phone evidence.
4. A synthetic successful verification response with null data rendered the safe successful acknowledgement and Sign In action.
5. The inspected browser logs contained zero React-render-error matches. Expected fixture HTTP errors are not claimed absent.

Screenshot evidence remains outside Git:

- C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/auth-feedback-local-desktop-20261003.png
- C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/auth-feedback-local-mobile-20261003.png

The viewport override was reset, the agent-created tab was closed and both temporary loopback processes were stopped. No persistent fixture file or preview setting was added to production configuration.

## Next release and administrator acceptance

Intended production batch: the three authentication pages, AuthContext.tsx, scripts/auth-feedback.test.mjs and .github/workflows/ci.yml, plus this report if reviewed. The prior MVP_ACCOUNT_FEEDBACK report's local post-release evidence can be reviewed separately; do not include all dirty reports automatically. There are no backend or schema changes.

Before publication, review this exact file set and obtain release authorization. Then use isolated CI before promoting, retain f909b60 as the rollback baseline, and smoke-check the released authentication surfaces. Real signup/inbox verification and password checks remain separate from these fixtures and require authorized live accounts and user-completed credential entry.

The connected inventory showed only Mercado Chrome with unrelated personal tabs and an empty Codex browser. No Gina/admin session was available; unrelated personal tabs were not opened. Fresh admin approve/reject and corresponding audit-log acceptance is pending a connected signed-in administrator and explicitly identified disposable records. No administrator password was changed and no invented write-flow result was recorded.

## Live-focused release follow-up

The user subsequently requested fixing and checking MVP issues live. The reviewed production batch is now authorized for selective publication. A fresh run again passed all 243 native cases, frontend lint, TypeScript checking and the production build before staging. The earlier local-only status above is the historical audit observation, not a claim that those fixtures tested live delivery. Publish only the reviewed authentication files, their CI regression step and these reports; preserve unrelated dirty evidence. Record actual isolated CI, hosting and live results after they occur, not before.
