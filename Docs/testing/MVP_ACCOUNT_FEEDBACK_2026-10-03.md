# MVP account-feedback repair — 3 October 2026

## Scope and reproduced defects

The user authorized releasing reviewed fixes and continuing the remaining MVP repairs. This follow-up uses the selective-release-check worktree, after release 6d94d36. Existing unrelated evidence diffs remain untouched. There are no backend, migration, production-variable, provider-credential or database changes.

| ID | Severity | Observed failure | Focused repair |
| --- | --- | --- | --- |
| MVP-FEEDBACK-001 | Medium | Profile saving, public forgot-password and reset-password accepted unvalidated response message values. Object values caused actual React server-render errors; booleans, numbers and whitespace produced missing or unusable feedback. | Reuse a small runtime-validated request-feedback utility across those forms and PasswordSettings. Keep valid server validation messages and action-specific fallback messages. |
| MVP-FEEDBACK-002 | Medium | Recovery success handling accepted object/blank message values; reset success additionally dereferenced missing/null response data. The malformed acknowledgements caused crashes, blank feedback or success being treated as failure. | Guard response data and accept only nonblank strings. Preserve the neutral forgot-password acknowledgement and existing reset completion behavior. |
| MVP-FEEDBACK-003 | Low | Forgot-password logged complete caught request errors to the browser console. | Remove that logging without changing authentication or sending additional email. |

The first 21 new regression cases produced 19 failures. Eighteen were actual component failures; the other was a test expectation mistake. The expired-token form already disappears and offers the normal new-link route, rather than keeping three disabled controls. That test was corrected to match the incumbent behavior; no token lifecycle change was made to satisfy it.

## Validation observed before publication

- Source-derived native tests compile and invoke the actual components with isolated hook/request fixtures, then verify feedback state and React-rendered output. No fixtures call production or send email.
- All 77 password-settings/profile/recovery cases passed, including the 21 additions. The combined six frontend suites plus deployment harness passed 189 cases with zero failures (174 functional plus 15 deployment tests).
- Frontend ESLint, TypeScript checking and optimized Next.js production build completed successfully. The build generated all 22 routes.
- The Impeccable detector produced no findings for the four changed UI files. Git diff whitespace checking passed. Styling, layout, credential handoff, cooldowns, reset token rejection, password clearing and navigation were preserved.
- First-batch live keyboard acceptance passed separately; its successful CI and hosting statuses are recorded in RELEASE_REVIEW_2026-10-03.md. Those statuses are not claimed as CI or hosting acceptance for this follow-up batch before it is released.

## Release boundaries and remaining evidence

Only the shared utility, four consuming frontend files, the expanded existing regression suite and these two reports are intended for this follow-up release. No unrelated local reports, fixtures, personal media or credentials are included. Run isolated CI before promotion and verify the deployed public recovery and authenticated settings surfaces afterward. Do not manufacture malformed production responses or change a real user's password merely to exercise fallback branches.

User-completed password changes, old-password rejection, Google continuation, authenticated admin review/audit writes, broader write-flow acceptance, and provider/capacity boundaries remain separate evidence gates where a fresh session or user action is needed. Existing historical checks do not establish fresh full-MVP acceptance. Physical-device and participant outcomes are not invented.

## Published follow-up and live observations

The reviewed eight-file batch was committed as f909b60e80854e71210d2fb5051ef0ff748e48d1. Isolated GitHub CI run 37083144668 succeeded before promotion. Main and codex/readability-accessibility were fast-forwarded atomically from 6d94d36; their runs 37083281343 and 37083281581 subsequently succeeded. GitHub commit statuses reported successful Vercel and Railway deployments. Remote main and the deployment branch were read back and both resolve to f909b60.

After those success statuses, the live contributor Suggestions page survived reload, restored Herbal QA, loaded My Submissions (zero records) and opened Account settings with profile fields, all three password fields, Change password and Email a password link intact. The browser recorded zero console errors for that smoke check. The public forgot-password page rendered its email form and Google/app-password explanation. Reset-password without a token showed `Invalid reset link. Token is missing.`, disabled both password inputs and the save button, and had zero recorded console errors. A heading locator initially used the older title `Reset Password`; fresh inspection confirmed the actual title `Set Your Herbal-Ai Password`. This was an automation locator mismatch, not a product failure.

No signup, email request, profile save, password entry/change or administrator mutation was performed in these post-release smoke checks. The controlled 77-case component suite establishes malformed-response handling; production was not disrupted to create those failures. The agent-created browser tab was closed. This post-publication evidence append remains local for the next documentation batch; all production repair code and the initial report are already published.

## Next audit candidates, not reproduced production failures

A bounded source scan still finds raw message handling in Sign In, Sign Up and email verification. Those surfaces are outside this released four-form repair and require their own failing regression before changing success, uncertain-signup or resend behavior. Do not mark their edge-case audit as passed merely because the current backend normally sends string messages. No fresh authenticated administrator session was present in the connected browser inventory, so admin write/audit acceptance remains pending rather than counted as successful.

The subsequent user-authorized audit is recorded in AUTH_FEEDBACK_2026-10-03.md. Those authentication candidates now have reproduced regressions and focused local repairs; they are not yet published. Its 54 focused and 243 combined passing checks, loopback browser evidence and remaining administrator/release gates supersede the earlier not-yet-audited status only for this local follow-up.
