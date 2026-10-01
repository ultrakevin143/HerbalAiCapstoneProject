# Password-settings feedback — 2 October 2026

## Report and cause

The user asked for the incorrect-current-password message directly above Change password and reported that requesting a password link showed no visible notification. They subsequently confirmed that the OAuth password-link request itself works. That is a user-reported live result, not an independently observed new mail or password change in this batch.

Source inspection of release 0ba39ea568b19c6016b77dace9273ed353e1bb15 found that both actions shared one error state, and all feedback rendered after the email-link action and its help text at the bottom of the internally scrolling account-settings modal. A successful response could therefore appear below the visible area, and a failed password change was displayed far away from its own action. This diagnosis is based on the component structure; no additional live request was sent to reproduce mail delivery or use up the hourly allowance.

## Focused repair

- Password-change errors now render immediately before the Change password submit button, inside its form. The form's accessible description references the error when present.
- Link requests have separate error state. Their confirmation or error renders immediately before Email a password link, with status or alert semantics and an accessible description on the button.
- The confirmation explicitly starts with Password link requested and retains the backend response, including any cooldown instructions. It does not assert a new email was delivered or override the one-hour limit.
- Feedback scrolls into view using block=nearest within the modal without taking keyboard focus. Pending requests retain their busy label, disabled action and existing synchronous duplicate-request guard.
- Missing, null, non-string or blank response messages receive a safe request acknowledgement and inbox/Spam/cooldown instructions instead of crashing or rendering malformed content.
- Starting either action clears stale feedback from the other action. Existing credentials and unrelated profile fields remain unchanged on request failure.

Only PasswordSettings.tsx, its existing native regression suite, and this new report belong to the repair batch. Backend authentication, mail delivery, account linking, session revocation, token expiry, permissions and cooldowns are unchanged. Pre-existing worktree documentation edits and the separate Desktop checkout are preserved.

## Observed local validation

The combined frontend native suites passed 135/135 cases, including 43 password-settings cases. Eleven new cases cover immediate message placement, separate link errors, cooldown response rendering, clearing stale feedback, scroll-into-view calls, malformed response fallback and pending/duplicate request behavior. The initial test run exposed a test-selector limitation: the helper could not locate the link action after its label changed to Requesting link. Selecting its aria-busy action marker repaired the harness; the subsequent suite passed.

The mechanical UI detector reported no findings, and git diff --check passed. Frontend TypeScript, ESLint and the Next.js 16.3.8 production build passed; 22 static pages were generated. This is automated local validation, not a completed browser visual or live feedback check. No private credential was entered or submitted, and no new production mail was requested.

## Next acceptance

After reviewed publication, inspect the actual account-settings modal at desktop and phone widths. A user should enter and submit any private password themselves. Confirm an incorrect current password produces an alert above Change password, and a normal link request produces visible status next to its own button. Do not interpret an acknowledged request as independently verified inbox delivery. Preserve normal cooldowns and record only observed results.

This repair is local and uncommitted at this entry. Publishing and live rechecking are the next release steps, not completed outcomes.

## Release authorization and scheduled follow-up

The user subsequently authorized deployment of this notification fix and chose to check the notifications manually. Release only the component, regression suite, this report and NEXT_WORK_PLAN_2026-10-06.md; preserve all unrelated local evidence edits. Run isolated CI before promoting the exact tested commit to main and the deployment branch. The next-work plan is scheduled for 6 October 2026 at 8:10 PM Philippine time; its later repairs require a separate reviewed release proposal rather than an automatic push.
