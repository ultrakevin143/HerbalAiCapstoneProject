# Live Messenger acceptance follow-up — 1 October 2026

## Scope and baseline

Executed against `https://herbalaiph.vercel.app` using the reconnected Gina Chrome administrator and Mercado Chrome Herbal QA contributor. The release worktree starts at `d08e38495a3a4965e9a43b5d98eae4860fb2fe3c`; its preceding application repair is `a0931f768348efb88d06a35292828682fd3f8d3d`. The existing primary checkout, styling, application source, credentials, environment settings, and schema were not changed.

## Observed passes

1. Both fresh live Messenger tabs restored their existing authenticated accounts without entering credentials.
2. One explicitly labeled, non-medical administrator message was sent to the existing Herbal QA conversation. Both histories and sidebar previews displayed it. The receiver's notification badge also increased; notification delivery or clearing outside this view was not separately tested.
3. The new administrator message was edited. Its new text and edited marker appeared in both histories, and both sidebar previews updated without reloading.
4. Herbal QA sent one labeled reply to the administrator. Both histories and previews displayed the reply. The administrator's notification badge increased.
5. The administrator edited the existing September 30 QA reply in the older Mercado Kevin conversation. The October 1 Herbal QA conversation stayed above it. The older preview changed, but its September 30 date and relative activity order were retained.
6. The contributor reply was edited while the administrator filtered the sidebar for `QA`. The filtered result eventually displayed the new preview. This is an actual concurrent interaction, not proof that a particular stale HTTP response finished after a socket event. The deterministic snapshot-race regressions remain the evidence for that exact ordering.
7. Both tabs were fully reloaded. Their authenticated accounts and sidebars restored. Reopening the QA conversation displayed persisted administrator and contributor edits. The new administrator edit appeared exactly once in each loaded history.
8. A project PWA icon and labeled caption were attached in the contributor composer. With only that tab temporarily offline, clicking Send produced the observed alert `Failed to send message. Please try again.` After dismissal and restoration of normal networking, the image preview, filename, caption, and enabled Send button remained. The history and last-message preview remained unchanged. This proves image/caption retention after network failure, not a successful retry, provider upload, or a provider-specific failure. The unsent caption and attachment were cleared through the existing controls afterward.
9. The same administrator session opened the live Admin Panel and loaded its statistics without a Forbidden error. This is authenticated read evidence, not a new moderation or audit-write test.

## Automated validation

The existing Messenger suite was rerun locally: `node --test scripts/messenger-sync.test.mjs` passed all 19 cases with zero failures. No local PostgreSQL/Docker suite was run. The 444 backend tests and frontend build passed in the previously documented isolated release CI; those are not newly executed live backend tests in this follow-up. The real-database account-recovery suite includes explicit old-password rejection, session revocation, single-use reset, and concurrent redemption coverage.

## Uncompleted checks and reasons

- **Historical previous-password rejection, live:** the tester confirmed they no longer remember the previous password. The prepared isolated sign-in tab was closed without submitting a guessed password. A random invalid password would not establish rejection of the actual previous password. A new recovery cycle would require private user-entered credentials and another reset email; no such request or password change occurred here.
- **Actual live community last-page deletion:** the authenticated community listing contains four discussions and no pagination controls. The production page requests 25 records per page. Removing a record from the single page would not exercise recovery from a now-invalid higher page. Creating at least 22 extra public posts just to manufacture that state was not performed. No discussion or message was deleted. Existing controlled last-page response handling evidence remains in `REMAINING_MVP_GATES_2026-10-01.md`; it is not relabeled as a live deletion pass.
- **Genuine human tab resume:** automated focus changes and reloads are not evidence of a physical tab-switch action by a person. This remains distinct.
- Formal participant and physical-device evidence is unchanged; these browser checks are not a substitute for it.

No new functional defect was reproduced in this bounded pass. No application repair or new production deployment was needed.

## Side effects, evidence, and cleanup

Two new labeled QA text messages remain in the existing administrator–Herbal QA conversation. Each was edited once. One existing labeled administrator reply in the older Mercado Kevin conversation was also edited. These actions may retain ordinary message/notification records. No real plant information, password, reset token, private file, email request, database fixture, or media upload was sent. The icon stayed in the browser's unsent draft.

Screenshots are outside Git in `C:\Users\Hp\AppData\Local\Temp`:

- `herbalai-live-two-profile-qa-20261001.png`: persisted two-profile QA history after reload.
- `herbalai-live-older-edit-ordering-20261001.png`: older edit remains below newer conversation activity.
- `herbalai-live-image-draft-retention-20261001.png`: image and caption survive the failed send.

The offline override was removed and network observation disabled. Unsent content was cleared. The separate password-check tab and all agent-created live test tabs were closed; personal browser tabs and signed-in accounts were left intact. No local fixture server was started for this follow-up.

## Fresh recovery-cycle handoff

After the tester requested continuing the remaining checks, a new isolated live Sign In tab was prepared with only the existing disposable username prefilled. The tester is asked to privately prove the current password works before requesting another reset, then retain it for the post-reset rejection check. This avoids mistaking a guessed password for the true old password. This new tab is retained as a user handoff; the earlier closed test tabs remain closed. At this observation, baseline login, a new email request, reset submission, and post-reset checks have not happened. No password or reset link is recorded. Actual higher-page forum deletion remains unavailable without creating many extra public records; none were created.

### Subsequently requested account recovery

The tester also forgot the current password and explicitly requested another reset. The existing Mercado contributor session's profile confirmed the disposable username and its Mercado Gmail plus-alias; the profile was only read, not saved or modified. One live forgot-password submission completed with the neutral response and its one-hour resend guidance. The exact new password-reset message arrived in Gmail Inbox, displayed at 2:38 PM on 1 October. Its reset action was checked to target the expected live origin and `/reset-password` path before opening it in the Codex browser. The form displays New Password and Confirm New Password and is retained for private user entry; no credential was entered by the agent.

The authenticated Suggestions tab is separately retained for a post-reset session-revocation check. The agent-created Gmail search/message tab was closed. Screenshot `herbalai-fresh-reset-form-20261001.png` is saved outside Git in the local temporary directory. At this observation, delivery and form loading have passed, but reset submission, revocation, used-link rejection, and new-password login await the tester's submission. Historical old-password rejection remains unobservable because the password is forgotten; this recovery request does not close that check. No reset URL, token, or password is stored in this report.

### Reset submission and session revocation observed

The tester reported submitting the new password. The reset tab was observed at Sign In, consistent with the page's success redirect. Reloading the separately preserved, previously authenticated Suggestions tab first showed session verification, then redirected to Sign In. This is fresh live evidence of revocation of that old browser session. The exact success toast was not captured and is not quoted as observed. Screenshot `herbalai-reset-session-revocation-20261001.png` is saved outside Git in the local temporary directory.

The existing username is prefilled in the Codex browser Sign In tab for the tester to enter the new password privately. New-password login and used-link rejection are still pending at this observation; revocation does not prove either. No second reset email was requested.

### New-password login and protected refresh observed

The tester reported that new-password sign-in opened the homepage, and the browser showed the authenticated homepage. Following its Suggest Herb link loaded the protected contributor form and My Submissions. A full reload first showed session verification, then restored the form and notification badge rather than redirecting to Sign In. New-password sign-in and persistence on the protected page therefore passed in this new recovery cycle. Screenshot `herbalai-new-password-protected-page-20261001.png` is saved outside Git in the local temporary directory.

The revoked Mercado test tab was closed. The recovered contributor tab is retained separately. A new Codex browser tab opens the exact already-used reset link for a private user-submitted rejection check using the same new password. Opening its form alone does not establish that the token is accepted; this page validates redemption when submitted. Used-link rejection remains pending until that response is observed. No additional reset email or application change was made.

### Used-link rejection observed

After the tester submitted the already-used link, its actual live response was `Invalid or expired password reset token.` This was token rejection, not a weak-password or password-mismatch message. The password fields and submit button were removed, and Request a New Reset Link was shown. The observation was at approximately 2:46 PM Philippine time, about eight minutes after the new email displayed 2:38 PM and before its advertised one-hour expiry. This supports single-use rejection rather than merely testing an hour-old link. No further reset email was requested.

Reloading the recovered contributor's separate Suggestions tab restored protected access again, demonstrating that the rejected reuse attempt did not revoke that recovered browser session. The used-link test tab was closed; the recovered Suggestions tab remains open for the tester. Screenshot `herbalai-used-reset-link-rejected-20261001.png` is saved outside Git in the local temporary directory. Delivery, user-submitted reset, old-session revocation, new-password login, protected refresh, and used-link rejection now have fresh live evidence. Historical old-password rejection, genuine human tab resume, and actual higher-page community deletion remain separate unobserved checks.
