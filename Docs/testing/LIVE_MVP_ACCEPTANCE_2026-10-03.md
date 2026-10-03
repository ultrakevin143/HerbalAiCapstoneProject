# Live MVP acceptance — 3 October 2026

## Scope and release

The user requested live MVP checks and repair of confirmed failures, then reconnected the Gina Chrome administrator session. Checks used https://herbalaiph.vercel.app, the existing disposable contributor `mvpqa_unmid8j` (Herbal QA), and the signed-in Admin Kevs account. No administrator password, account role, environment variable or database connection was changed.

Reviewed release: `e51942c35c573438c09a91104a40d4951f36fa50` (`Harden sign-in signup and verification feedback`). Rollback baseline: `f909b60e80854e71210d2fb5051ef0ff748e48d1`.

The release contains only the three authentication pages, their AuthContext signup response normalization, the auth-feedback regression script and CI step, and the two reviewed reports. Seven unrelated dirty evidence files remained unstaged. No fixture or credential was published.

Before release, the fresh combined native run passed 243 cases; frontend ESLint, TypeScript checking and the optimized production build passed. The build generated 22 routes. These are automated/local results, not inbox or real-password acceptance results.

Remote release evidence:

- Isolated branch CI: https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37085413839 — success.
- Main CI: https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37085565646 — success.
- Deployment branch CI: https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37085565417 — success.
- GitHub commit statuses reported Vercel success and Railway success for this SHA. The Railway description identified `herbalaicapstoneproject-staging.up.railway.app`.
- Main and `codex/readability-accessibility` were advanced together with an atomic fast-forward after isolated CI passed. No force push occurred.

## Observed live checks

| Area | Action and observed result | Evidence boundary |
| --- | --- | --- |
| Suggestion creation | Contributor submitted one clearly labeled `TEST ONLY MVP 20261003` record without an image or medicinal claims. Submission Received appeared; My Submissions showed one Pending record. Reload and Refresh status retained that record. | Real live write, not a fixture response. |
| Public catalog boundary | The library reported 37 published herbs. An exact search for the QA label returned zero results while it was Pending and again after rejection. | The synthetic record was never approved. |
| Administrator recovery | Gina's Admin Panel restored after reload and loaded the suggestion review interface without Forbidden. | Healthy-session reload; no induced refresh outage. |
| Request changes | Administrator requested changes with explicit TEST ONLY review notes. Admin counts changed to Pending 0 and Revision Needed 1. The contributor saw Revision Needed and the same notes. | Same SuggestedHerb ID 63. |
| Owner revision | Edit and resubmit opened the prefilled form with the review notes. Contributor changed preparation text to `TEST ONLY. Revision checked 20261003. No preparation instructions.` and resubmitted. My Submissions still contained one record, now Pending. Admin reloaded and saw the updated text. | No duplicate suggestion was created. |
| Final rejection | Administrator deliberately rejected the record with TEST ONLY notes. Contributor reload showed Rejected and those notes; the final rejected record had no Edit and resubmit action. | Record remains in live storage for traceability. |
| Audit records | The administrator audit table displayed REQUEST_CHANGES_SUGGESTION at 09:19 AM and REJECT_SUGGESTION at 09:21 AM on 3 October 2026, both targeting SuggestedHerb ID 63 and the administrator actor. Expanded metadata matched the QA label and notes, with revisions 1 and 3 respectively. | Metadata was observed, not before/after status snapshots. Contributor submission/resubmission logging was not asserted; this audit page explicitly covers selected administrator actions. |
| Dr. Ai | One suggested Lagundi question completed after the source-checking state. The composer and suggested prompts re-enabled. The answer displayed Herb 1/FAQ 1 source labels, a Lagundi catalog action, a plain-language explanation and an educational safety notice. | Healthy request completion only. This is not a medical accuracy certification, quota/load test or proof of provider-side cancellation. |
| Messenger delivery | In the existing QA/Admin Kevs conversation, contributor sent one TEST ONLY message. The administrator saw it and sent one TEST ONLY reply. The contributor received the reply without manual reload. | Two authenticated live sessions. Both messages remain retained. |
| Messenger persistence | Contributor reloaded Messenger, restored the account, reopened the existing conversation and retrieved both messages. | No new conversation or login credential was created. |
| Messenger owner edit | Contributor edited only the new QA message. It left edit mode and showed the edited indicator. The administrator saw the changed text; the sidebar still previewed the later administrator reply. | Actual delivery/update observed; exact concurrent-response race ordering was not induced. |
| Community | Opened existing TEST ONLY thread 17, saved one clearly labeled QA comment, and observed the count change from 2 to 3. Reload retained the comment, DOM container `comment-24`, and signed-in contributor. | No new public discussion was created; the comment remains retained. |
| Reversible Community reaction | Liked the QA thread, observed 1 Liked, then removed that like. Reload showed the original 0 Like count. | No deletion/moderation was performed. Viewing the detail also incremented its view count. |
| Contributor access boundary | Navigating the contributor session to `/admin` rendered Access Denied, identified the contributor role, and withheld the console. Back to Home restored the normal homepage and contributor session. | Browser route boundary observed; no role manipulation or API bypass attempted. |
| Normal library detail | Search for Lagundi returned one result. Its details opened, preparation/warnings rendered, and Sources & references exposed the PITAHC directory link. Closing returned focus to the Lagundi card. | Displayed reference link was inspected; the external source page was not opened or revalidated in this pass. |
| Verification recovery | `/verify-email` without a token showed the missing-token message and new-link form. One synthetic invalid token request settled to `Invalid or expired verification token.` with a resend form and sign-in link. | No verification email was sent and no real account was verified in this cycle. |
| Released auth forms | Sign In and Sign Up rendered with their expected inputs and navigation; signup showed the password visibility control and eight-character guidance. | No password was entered or submitted by the agent. This does not count as new signup or new-password login acceptance. |

## Retained QA artifacts

- SuggestedHerb ID 63, label `TEST ONLY MVP 20261003`, final status Rejected. It has no image, no usable preparation instructions and no medicinal claims. Do not approve or publish it.
- Two TEST ONLY direct messages in the existing Herbal QA/Admin Kevs conversation; the contributor message was edited once.
- One TEST ONLY comment in the existing test thread `/community/17`, observed as `comment-24`.
- Two corresponding administrator suggestion-review audit events. They must remain traceable rather than be silently removed.

No public medicinal-plant record was created or modified. No permanent deletion, additional mail request, password change, upload or account promotion was performed. The comment/messages were intentionally retained; the thread reaction was restored.

## Findings and remaining boundaries

The five authentication-feedback defect groups documented in `AUTH_FEEDBACK_2026-10-03.md` are repaired and deployed. No additional functional failure was reproduced in the bounded live checks above. Do not change passing flows merely to claim another repair.

Loading transitions were allowed to settle before judging the result. A transient initial empty conversation/audit view is not recorded as a failed fetch when the subsequent loaded state displayed the expected records.

The following are not newly passed by this cycle:

1. Fresh signup-to-inbox verification and password recovery/settings acceptance. These require the user's private credential entry; prior reports remain the source for earlier cycles.
2. Historical exact old-password rejection for the disposable account whose old password was forgotten. Successful new-password login is not substitute evidence.
3. Approval-to-published-catalog acceptance and live image-upload/rejection. The synthetic ID 63 record must remain rejected; approval would require an explicitly approved, factually sourced record.
4. Permanent deletion/moderation and actual deletion of the last item on a higher Community page. The live forum has four discussions; this pass did not manufacture enough public posts to create another page.
5. Genuine human tab-resume, physical-device and participant acceptance. Browser reloads do not replace those results; the user previously reported a phone inspection, but no fresh physical-device run or participant signatures were collected here.
6. Provider quota/load, hosting-proxy cancellation and termination of already submitted provider/SQL work. No production outage or quota-exhaustion exercise was induced.

## Evidence and repository handling

Screenshots saved outside Git:

- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/mvp-live-pending-20261003.png`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/mvp-live-rejected-20261003.png`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/mvp-live-messenger-20261003.png`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/mvp-live-community-20261003.png`

This post-release evidence is a local documentation follow-up, not a second production code release. Preserve unrelated dirty reports and the primary checkout. Do not include credentials, reset tokens, browser storage or fixtures in Git.

After recording the final states, the temporary contributor, auth-smoke and administrator Messenger tabs were closed. The user's Gina Admin Panel remained open. No user-owned tab was closed and no session cookie or draft was cleared.
