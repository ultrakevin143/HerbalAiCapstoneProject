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
