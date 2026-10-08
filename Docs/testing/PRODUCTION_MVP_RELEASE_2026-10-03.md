# Production MVP release acceptance — 3 October 2026

## Current status

The reviewed release is live on https://herbalaiph.vercel.app. The user approved proceeding after isolated CI passed. Only the approved commit was released; this report is an uncommitted evidence follow-up, not another automatic publication.

- Release: `e6b774a39d56d6116da26350f87c4483e92d8cd3`.
- Previous production baseline: `e51942c35c573438c09a91104a40d4951f36fa50`.
- Remote `main`, `codex/readability-accessibility` and `codex/mvp-acceptance-ci` all resolve to the release SHA. Main and the deployment branch were advanced together by atomic fast-forward, without force-push.
- Both providers still watch `codex/readability-accessibility`. No provider variables, credentials, database connections or settings were changed.
- Vercel production showed Ready for the release SHA; Railway showed the corresponding deployment ACTIVE, successful and Online.
- Railway deployment ID: `518f6c56-2bf3-421f-8fcf-4049f94eb5ee`.

## Automated release evidence

All three GitHub runs for this exact SHA completed successfully:

- CI branch: https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37113901921
- Main: https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37114495553
- Deployment branch: https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37114495583

The isolated CI run executed 872 backend cases in 77 files and 312 native cases: 1184 passing cases, without adding repeated runs to this total. All seventeen formerly locally excluded database suites passed (113 cases, including thirteen Library SQL cases). Migrations ran against the isolated CI PostgreSQL service, not production. Lint/typechecks and the frontend build passed. See CI_RELEASE_PREFLIGHT_2026-10-03.md for the individual SQL suites and local execution limitations.

## Bounded live checks

| Area | Observed result | Limit |
| --- | --- | --- |
| Availability | Eleven frontend routes returned HTTP 200 HTML: home, Library, chat, Community, About, privacy, sign-in, signup, forgot-password, reset-password and verify-email. | HTTP availability, not full feature acceptance. |
| API health/catalog | Health returned 200; catalog returned 200 with 37 records. | Normal sequential reads, not load testing. |
| Anonymous protection | Suggestions, notifications and administrator audit endpoints returned 401. | Does not prove authenticated pagination rejection. |
| Input validation | Empty signup and malformed-email verification resend returned 400. | No account was created and no verification mail was sent. |
| CORS | All seven bounded API checks returned the exact public frontend origin in the allow-origin header. | One approved origin, not an exhaustive CORS matrix. |
| Administrator refresh | Gina's existing administrator session restored the console after reload. Suggestions, users and audit records loaded. | No administrator password or role was changed. |
| Recovery mail | One reset request for disposable contributor `mvpqa_unmid8j` produced a new email in the authorized Gmail alias inbox. Its live reset form opened. | No resend or cooldown bypass; no raw token retained here. |
| Recovery completion | The user reported successful save and sign-in redirection. The redirected sign-in page was observed. The user entered the new password privately; the live homepage identified Herbal QA. | New-password login observed. Historical old password was forgotten, so its rejection is not newly proven. |
| Contributor refresh | Suggestions reopened after session checking on reload, with Herbal QA and the retained submissions. | Healthy-session persistence, not induced outage recovery. |
| Suggestion creation | One no-image `TEST ONLY RELEASE e6b774a` submission reached Submission Received and appeared Pending. | Synthetic non-medical record, never approved. |
| Revision | Administrator requested changes. Contributor saw Revision Needed and matching notes, edited the prefilled preparation field and resubmitted. Two total owner records remained: one earlier QA record and this new record. | No duplicate suggestion created. Administrator reloaded to retrieve the resubmitted data; automatic admin/tab-resume refresh is not asserted. |
| Rejection | Administrator saw the revised preparation text and rejected it with explicit TEST ONLY notes. Contributor saw Rejected, matching notes and no resubmit action. | SuggestedHerb ID 64 remains retained for traceability. |
| Audit | REQUEST_CHANGES_SUGGESTION and REJECT_SUGGESTION rows both targeted ID 64 and Admin Kevs. Expanded rejection metadata matched the test label/notes and revision 3. | Selected administrator events; not a claim that every system activity is audited. |
| Notifications | Contributor dropdown displayed both review events. Marking only the new rejection notification read changed unread total from 5 to 4. Reload retained total 4 and the read item without a read-action button. | Routine read state, not forced concurrent-response/socket races. |
| Library details | Lagundi search returned one result. Details rendered preparation, safety text and the PITAHC reference link. Guest discussion prompted sign-in. Closing restored focus to the Lagundi card. | Reference display inspected; no fresh external-source or medical accuracy certification. |
| Public exclusion | Exact search for the rejected release QA label returned 0 herbs and the empty-filter message. | No synthetic medicinal record was published. |
| Contributor role boundary | Visiting `/admin` as Herbal QA rendered Access Denied, identified contributor role and withheld the console. Returning to Suggestions retained the session. | Actual browser route denial; no role manipulation. |
| Console | Library inspection returned no captured warning/error entries; contributor inspection returned no captured error entries. | Only the inspected session/window, not exhaustive telemetry. |

Initial session checking and transient zero/empty list states settled to their canonical content. They were not recorded as persistent data loss or failed authentication.

## Failures and evidence limits

No new application defect was reproduced in these bounded checks. An initial invalid-password sign-in led the user to request recovery; successful recovery/new-password login followed. Do not label that as a backend defect without evidence.

- Chrome blocked direct navigation to the live audit API negative-limit URL (`ERR_BLOCKED_BY_CLIENT`). This is a blocked browser check, not proof the application rejected or accepted the authenticated input. CI contains the controlled authenticated pagination coverage; that does not substitute for this missing live request.
- Browser selectors for audit-row whitespace and the guessed empty-search wording did not match. Fresh page state supplied the actual target and copy, and the UI checks completed. These were automation targeting errors, not application defects.
- At the initial release checkpoint, fresh signup-to-inbox verification, live image-upload/rejection, an approved factually sourced publication and Library authenticated write/moderation checks were unexecuted. The resumed upload and Library write checks below supersede only their corresponding pending items. Earlier reports remain historical evidence, not newly executed acceptance.
- Exact forgotten old-password rejection, fresh used-reset-link rejection and prior-session revocation were not observed in this cycle. No authenticated contributor session existed before this reset, so new-login persistence is not proof of revocation.
- Genuine human tab-resume, hosting-proxy cancellation, provider quotas/load and deliberate production network failures were not exercised.
- Physical-device inspection remains the user's earlier self-report. Participant UAT is deferred; no results or signatures were invented.
- Railway displayed limited trial time/credit. Hosting continuity needs owner review before defense; no payment or plan change was made.

## Retained evidence and next work

ID 64 remains Rejected with two administrator audit events and corresponding contributor notifications. Do not approve it or silently delete the evidence. ID 63 from the earlier release remains unchanged. No medicinal record, account role, administrator password or production credential was altered.

Test-only screenshot saved outside Git:
`C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-live-suggestion-rejected-20261003.jpg`.

Next acceptance batch: live upload/rejection using the already authorized project icon and connected disposable account; authenticated Library comment/reply/reaction boundaries using test-only content; then remaining mail/password checks only with necessary private user handoffs and cooldowns respected. Do not approve synthetic plants, permanently delete records without at-action confirmation, or manufacture outages. Preserve unrelated checkout changes. Outcome documentation remains local until separately reviewed for publication.

## Resumed batch — image upload and authenticated Library writes

The user resumed after pausing. Both existing test sessions were used; no new credential or account was created. No source file, provider variable, database connection or deployment branch was changed.

| Check | Observed outcome | Boundary |
| --- | --- | --- |
| Image selection | The authorized project `pwa-icon-192.png` (5994 bytes) was selected through Chrome's file chooser and its preview appeared. | Public project asset, no personal file. |
| Live upload | `TEST ONLY UPLOAD e6b774a` reached Submission Received. Contributor image preview loaded at 192×192 from `res.cloudinary.com`; administrator preview also loaded at 192×192. | Actual live upload, not an inferred success from the file chooser. No Cloudinary signature failure was observed in this attempt. |
| Upload rejection | Administrator rejected the exact icon test with explicit notes. Contributor showed Rejected and matching notes. Audit table showed REJECT_SUGGESTION targeting SuggestedHerb ID 65 and Admin Kevs. | Synthetic application icon was never approved or published; rejected record/image remain retained. |
| Library comment | Herbal QA posted `TEST ONLY e6b774a Library acceptance. No medicinal claims or advice.` to Lagundi. It appeared with owner controls and an empty composer. | Clearly marked QA text, not medical information or an endorsement. |
| Nested reply | Owner replied `TEST ONLY e6b774a nested reply. No health advice.`; it rendered under the parent. Both records survived reload and reopening the details. | No deletion had occurred at this point. |
| Reactions | Comment and reply were liked, each showed count 1 and the owner's Unlike action after reload. Both likes were then removed. Administrator subsequently observed Like actions with neither selected. | Reversible QA-only interactions. |
| Cross-session reaction | With both details views open, owner liked the parent once. Administrator's count changed to 1 without reloading while its own `aria-pressed` remained false. Owner removed the like; administrator returned to Like. | Real healthy socket synchronization; no forced race/outage or provider cancellation claim. |
| Deletion attempt | User explicitly authorized permanent deletion of only the new QA parent, preserving all other content. Its administrator Delete action opened the site's confirmation. Browser automation timed out while accepting the dialog; that admin tab then remained unresponsive. Working contributor browser was reloaded and still showed both parent and reply. | NOT PASSED: deletion, orphan-reply retention and new moderation audit are unverified. Do not resubmit blindly or label a browser-control timeout as an application defect. User handoff requested to inspect/complete the exact confirmation. |

Browser selector mismatches (textbox ambiguity and AX toggle-versus-DOM button roles) were resolved using the visible placeholder and DOM snapshot. Those are automation targeting errors, not reproduced application defects.

New screenshots saved outside Git:

- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-live-upload-rejected-20261003.jpg`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-live-library-reply-20261003.jpg`

No new application defect was reproduced by the completed upload/comment/reply/reaction checks. Next: resolve the exact administrator deletion handoff, verify the retained reply from canonical reads and the corresponding moderation audit if deletion completes, then return to the remaining release gates. Existing ID 63/64 artifacts were unchanged; ID 65 is rejected. Do not count the deletion attempt as completion, delete the reply without separate at-action authorization, bypass mail cooldowns or invent manual/participant evidence. This batch adds local evidence only; no commit or push occurred.

### Deletion handoff verification follow-up

The user reported confirming deletion. Automation regained access to Gina's Library tab; no browser dialog remained and its captured warning/error list was empty. A fresh contributor reload/reopened Lagundi discussion still rendered both the exact QA parent and reply. The administrator console was reloaded and its newest audit entries still began with the ID 65 rejection; no new DELETE_HERB_COMMENT event was observed. This does not verify successful deletion or orphan-reply retention, and does not establish a backend defect without observing a failed request. No automatic destructive retry occurred. A precise user handoff was requested to click only the QA parent Delete action, confirm once and report disappearance or the exact error, leaving the reply untouched.

Screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-library-parent-still-present-20261003.jpg`.

### Deletion completed — observed live acceptance

The user subsequently supplied a Gina Library screenshot showing only the retained QA reply, then confirmed completion. The connected administrator details view showed the parent absent and `TEST ONLY e6b774a nested reply. No health advice.` as a top-level comment with normal comment controls. A fresh contributor reload, Lagundi search and reopened details independently showed the same retained reply and no QA parent. The reply was not deleted or recreated by the agent.

The administrator Audit Logs page, after reload and explicit navigation to its heading, displayed DELETE_HERB_COMMENT at 08:11 PM on 3 October 2026, actor Admin Kevs, target HerbComment ID 34. Expanded metadata contained Lagundi's herb ID `h-b608b956c6101d4e`; it did not contain a before/after content snapshot, which is not asserted here. This observed result closes the previously pending administrator deletion, reply-retention and corresponding audit checks. Earlier failed/intermediate observations remain historical, not the final outcome. No new application defect was reproduced by this completed flow.

Retained-reply screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-library-retained-reply-20261003.jpg`.

Only the approved QA parent was deleted. Its reply and rejection/audit evidence for SuggestedHerb IDs 63–65 remain intact. No source edit, deployment, provider change or additional destructive action occurred. Remaining gates are fresh signup/verification for this release, the unobserved private-password checks, factually sourced approval/publication, genuine tab-resume and the explicitly deferred device/participant evidence boundaries; none is implied passed by this moderation result. Documentation remains local and uncommitted.

## Fresh signup/verification and Dr. Ai acceptance

The next resumed batch created one disposable contributor, username `release_e6b774a_1003`, display Release QA, using a plus-alias of the authorized Mercado Gmail account. The user privately entered and submitted its password. The agent did not enter, receive or retain it, and no administrator credential was changed.

| Check | Observed result | Boundary |
| --- | --- | --- |
| Signup | After the user's Create Account submission, the tab was on Sign In. | The transient signup-success banner was not directly captured; later account authentication and exact recipient mail establish the subsequent steps. No duplicate signup or retry was sent. |
| Mail delivery | A focused search for only the new test alias found one Inbox message, Herbal-Ai - Verify Your Email, displayed at 08:16 PM on 3 October 2026. Body addressed Release QA and linked to the public frontend verification route. | Actual Gmail delivery, not merely a generic success response. No verification resend or quota/cooldown bypass. |
| Verification requirement | Before opening the email link, user privately attempted this new account's password login. The page displayed `Please verify your email before logging in.` | Actual newly created account denial; no inference from the runtime environment flag or grandfathered accounts. |
| Activation | The exact new email link was opened after checking its destination origin/path. The live page displayed `Email verified successfully. You can now log in.` | Verification token not retained in documentation, screenshots or Git. |
| Verified login | User entered the original signup password privately. Homepage identified Release QA; protected Suggestions opened. | Password was unchanged by verification. No fabricated sign-in or role promotion. |
| Persistence and owner boundary | Reload restored Release QA on Suggestions. My Submissions remained 0 records after Refresh status; notification dropdown showed no notifications. The earlier Herbal QA submissions/review notifications were not shown to this new account. | Observed UI/account isolation in this normal account transition, not an exhaustive concurrent cache matrix. Captured warning/error list was empty. |
| Verification-link replay | A separate tab reopened that already consumed verification link and displayed `Invalid or expired verification token.` with the resend form. No new-link request was submitted. | This closes used EMAIL VERIFICATION link rejection only, not used PASSWORD RESET link rejection. |
| Dr. Ai healthy request | Before switching accounts, one educational Lagundi safety question completed from the source-checking state. Composer and suggested prompts re-enabled. Answer displayed Herb 1, FAQ 1 and FAQ 2 source labels, plain-language explanation and educational safety notice; captured warning/error list was empty. | Normal request completion, not provider quota/load, abort propagation, accuracy certification or proof every response is safe. |
| Citation navigation | The answer's Lagundi action navigated to `/library?id=h-b608b956c6101d4e` and opened Lagundi details with preparation/safety/source controls. | Actual citation-to-catalog navigation; external source content was not revalidated here. |

A verification success locator initially used incomplete exact wording; the fresh page state supplied the actual success message. This was an automation selector mismatch, not an activation failure.

Screenshots saved outside Git:

- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-email-verified-20261003.jpg`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-verified-login-suggestions-20261003.jpg`

Fresh signup/mail/mandatory verification/login/refresh and consumed-verification-link checks are now passed for this release, superseding their earlier pending checkpoint. The new contributor remains verified with no suggestions. No new application defect was reproduced in this batch. Remaining acceptance includes an exact remembered old-password-to-new-password transition and session revocation/replay, genuine human tab-resume, explicitly approved factually sourced publication and the previously deferred device/participant evidence. Keep the current disposable password privately available if continuing its password-settings test; never include it or the verification link in Git/chat. No source edit, provider change, commit or push occurred; evidence updates remain local.

## Password-settings transition — independent browser session

Before changing the disposable Release QA account's password, the user signed in privately using its current signup password in the separate Codex in-app browser. That browser rendered authenticated Suggestions for Release QA with zero submissions. Mercado Chrome held the same account's Account settings. The user then reported submitting a different password through Change password; neither password was entered or read by the agent.

| Check | Observed outcome | Boundary |
| --- | --- | --- |
| Chrome session after change | The prepared Chrome tab was redirected to `/signin?callbackUrl=/suggest`. | The transient change-success message was not captured. Administrator credentials were not changed. |
| Independent pre-change session | Without manually logging out that browser, navigating to protected Suggestions showed session verification and then redirected to `/signin?callbackUrl=/suggest`. | This is a separate browser context, not another Chrome tab sharing the cleared cookies. It establishes rejection of the previously authenticated session in this flow. An intermediate automation action landed on Messenger and is not counted as evidence of a successful protected refresh. |
| Subsequent login | After the user reported completing the old-password attempt, Codex instead rendered authenticated Suggestions. Reload preserved Release QA identity and zero submissions. | No invalid-password message was observed. The user was asked whether they used the old or new password; neither exact old-password rejection nor new-password acceptance is claimed until clarified. |
| Targeted local backend regressions | Four mocked Vitest suites passed: password settings, password-settings repository, password-reset cooldown and OAuth password setup; 40 tests total. | Mocked dependencies; no live database, provider outage or mail send. Does not replace actual browser password checks. |
| Targeted local frontend contracts | `node --test scripts/password-settings.test.mjs` passed 77 tests, with no failures/skips. | Native UI/contract tests, not physical-device or live network evidence. These are repeat validations, not additions to the release's 1184 unique CI cases. |

Screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-independent-session-revoked-20261003.jpg`. It shows the redirected sign-in page with only the test username filled and the password empty. No source repair, environment change, commit or push occurred. Exact old/new-password identification remains the next user handoff; do not infer rejection from a generic `done` reply or store credentials in evidence.

### Password identity clarified

The user explicitly confirmed using the NEW password in the subsequent successful Codex login. Accordingly, new-password acceptance, protected Suggestions access and refresh persistence are passed for this password-settings transition. The independent pre-change session's prior redirect remains revocation evidence; the later login is a new session. Exact OLD signup-password rejection is still pending. Mercado Chrome remains signed out with this test username prepared for one old-password attempt, leaving the successful Codex session intact. No password was disclosed or entered by the agent.

### Old-password rejection completed

In response to the explicit request to enter only the OLD signup password for `release_e6b774a_1003`, the user reported invalid-password feedback. The connected Mercado Chrome sign-in page independently displayed `Invalid email/username or password.` and remained on `/signin?callbackUrl=/suggest`. The password field stayed masked; its contents were not read, copied or retained by the agent. This closes exact old-password rejection for this new account's password-settings transition, not the earlier forgotten-password account cycle.

Completed live checks for this transition: independently authenticated pre-change session rejected after the change, new-password login accepted, protected Suggestions accessible after new login, new session persistent after reload, and old signup password rejected. No new application defect was reproduced in these checks. This does not imply completion of remaining acceptance gates or password-reset link replay, which is a separate flow.

Screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-old-password-rejected-20261003.jpg`. Evidence updates remain local/uncommitted; no source edit, deployment or administrator password change occurred.

## Sourced approval/publication acceptance

The user authorized completing the remaining acceptance and then explicitly approved publication of the exact reviewed Kalingag (`Cinnamomum mercadoi`) record as real educational content. Before submission, the public catalog contained 37 records and neither this scientific name nor Kalingag. No synthetic medicinal record was approved, and earlier rejected QA records were not altered.

Sources inspected:

- Dapar et al. (2020), Journal of Ethnobiology and Ethnomedicine 16:14, https://doi.org/10.1186/s13002-020-00363-7. Table 4 entry 69 records Agusan Manobo traditional uses and preparations. Record text paraphrases limited traditional-use evidence, not clinical efficacy or a treatment recommendation. The reviewed reference supports identity, recorded uses and preparation, not a clinically validated dosage or official listing.
- Delacruz (2013), HERDIN research-project abstract, https://www.herdin.ph/index.php?cid=51004&view=research. The experiment studied acute leaf-extract toxicity in mice. The reference supports the warning's animal-versus-human evidence distinction, not human safety or a safe dose.

Dosage text explicitly states that the cited ethnobotanical study does not establish a clinically validated human dosage. Preparation text describes reported practice without home-treatment instructions; warnings explain that neither traditional reports nor mouse findings establish human safety. No image was supplied, no official DOH approval asserted and no quantitative treatment dose published.

| Check | Observed result | Boundary |
| --- | --- | --- |
| Contributor submission | Release QA submitted Kalingag once, reached Submission Received, and My Submissions listed one Pending record. | Normal authorized write; no duplicate/retry. |
| Administrator structured review | Edit & references saved two complete references with scoped supported claims and reviewer notes. | Actual saved review, not merely filled fields. |
| Publication | Explicitly approved Approve & Publish action removed the pending record; administrator Approved count rose from 1 to 2. Public catalog rose from 37 to 38 with exactly one matching scientific name. | Transient success-toast locator was not captured; durable catalog/approved record establish completion. No repeated approval action. |
| Public record | New herb `h-84ec276856199592` opened in an anonymous Chrome Library detail view with preparation/dosage limitations, warnings, two source links and the sign-in discussion prompt. Public detail API returned PUBLISHED, COMMUNITY_SUBMISSION, DOCUMENTED_TRADITIONAL_USE, `isDohApproved: false`, `sourceSuggestionId: 66` and the same references. | Reviewer verification is not a certification of clinical efficacy. No authentication bypass was used to read public content. |
| Publication audit | Administrator saw APPROVE_SUGGESTION for SuggestedHerb ID 66 at 08:42 PM on 3 October 2026. Expanded metadata linked the exact new herb ID, Approved status, revision 2, classification, reviewed text and scoped references. | Actual audit event; no inference from the catalog alone. |
| Owner notification | Existing Release QA session received Herb Suggestion Approved and a View link to the exact new herb. Dropdown showed one new notification with Kalingag scientific name and publication wording. | Only this owner's notification was inspected; no delivery email claim. |
| Genuine tab-return refresh | User supplied a Chrome screenshot of the public Library record, but the independent Codex My Submissions list still read Pending. A precise handoff to switch away/back without Refresh status or reload was requested. | NOT YET PASSED: public visibility and a received notification do not establish the required focus/visibility event. No outage or synthetic DOM event was manufactured. |

An audit-details summary was exposed as a button by accessibility but not by the DOM button locator; using its observed text opened the details. Initial audit rows briefly showed historical data while the new fetch settled. These selector/transient observations are not established application failures. The published Kalingag record remains retained as explicitly authorized real content; no cleanup/deletion is implied.

Screenshots outside Git:

- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-kalingag-publication-review-20261003.jpg`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-kalingag-published-20261003.jpg`

### Fresh recovery preparation for used-link rejection

One normal Forgot Password request was sent for the disposable Release QA account's authorized Mercado Gmail plus-alias. The live page returned its neutral acknowledgment. A focused Gmail search found exactly one corresponding Inbox reset message at 08:45 PM on 3 October 2026; the agent opened only that message and validated the link's public frontend origin and reset path before opening it. The token was not printed or stored in documentation. A new password remains for the user's private entry, confirmation and submission; reset completion and consumed-reset-link rejection are not yet counted as passed. The independently authenticated Codex session remains available for revocation evidence after this recovery. No resend or cooldown bypass occurred.

Recovery-form screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-fresh-recovery-form-20261003.jpg`. No source repair, provider/environment change, commit or push occurred in this batch.

### Owner status and evidence boundaries

The user reported seeing Approved after the requested tab return. The connected Codex My Submissions list still displayed Pending when subsequently inspected, so this remains a user-reported result rather than an independently established focus refresh. A controlled browser foreground transition also did not establish an observed automatic list change; no synthetic application event was dispatched. One ordinary Refresh status request then returned Approved with the saved reviewer notes, and the receipt updated to Suggestion Approved. Thus canonical contributor status/receipt are passed; genuine automatic tab-return refresh remains an evidence gap, not a proven production defect. No repeat question was sent after the user requested autonomous routine checks.

The exact approval notification was marked read without marking other accounts' notifications. The dropdown's unread indicator disappeared after completion. Local mocked review HTTP, atomic review-decision, structured-review-edit and contributor-resubmission suites passed 28 tests across four files. These are repeated isolated regressions, not new additions to the release's unique CI count.

Owner status screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-kalingag-owner-approved-20261003.jpg`.

## Newly reproduced About-page source drift — local repair

Opening the live About page during the foreground check exposed a separate, hardcoded medical directory instead of current reviewed Library data. The live page used `Clinopodium douglasii` for Yerba Buena whereas the public reviewed catalog uses `Mentha × villosa`; Tsaang Gubat displayed `Carmona retusa` instead of the catalog's `Ehretia microphylla`. It labelled Niyog-niyogan as Yesterday, Today, and Tomorrow and supplied its own unsourced preparation/dosage and strong efficacy prose, including the Lagundi chrysoplenol D sentence. These are observed page-versus-repository discrepancies; this report does not infer clinical evidence from a chemical constituent or claim a botanical synonym alone proves an unsafe record.

Two regression checks failed against the original About implementation: absence of reviewed repository/reference reuse and presence of obsolete independent identity/treatment copy. The focused local repair removes the duplicate medical array, loads the same public reviewed DOH-listed records through existing `cachedApiGet`, preserves selection order and styling, uses canonical identity/uses/preparation/dosage/safety/images, reuses `HerbReferences`, and links the exact Library record ID. Network/malformed-response failure displays actionable retry text instead of outdated medical fallback. Unpublished, unlisted and incomplete rows are excluded, with guarded reference shapes and a cancelled-effect state-write check. No database, medicinal content in the backend, package dependency, login behavior or production setting was changed by this repair.

Local repair files:

- `herbalaifrontend/app/about/page.tsx`
- `herbalaifrontend/lib/about-herb-records.ts`
- `scripts/about-herb-records.test.mjs`

Validation: 14 native regressions passed after repair; focused ESLint and `tsc --noEmit` passed; production build compiled and generated all 22 pages. An intermediate local JSX delimiter mistake was caught by lint/typecheck/build and corrected before the passing run; test compilation now also asserts syntactic diagnostics. The scoped Impeccable detector returned no findings. These are local results, not a deployed repair or an observed browser rendering pass.

A loopback-only read fixture loaded public reviewed records without credentials and rejected writes. The local production-preview start command was explicitly blocked by the execution policy. No alternate launcher or policy bypass was attempted; the temporary fixture was stopped. The successful validation build uses only a process-local loopback API override; no environment file was edited and this local fixture/build must not be treated as deployable production configuration. Browser desktop/narrow visual validation of the About repair remains pending. No commit or push occurred. Existing unrelated documentation changes were preserved.

### Fresh recovery completion and independent-session revocation

After the user reported completing the private reset, the exact Mercado recovery tab redirected to `/signin` and displayed Log into Herbal-Ai. The separately authenticated Codex Suggestions session redirected to `/signin?callbackUrl=/suggest` without an intervening logout, cookie clearing or replacement login. This establishes independent previous-session revocation for this reset. The transient success message was not captured; new-password login and consumed-reset-link rejection remain pending, so the full recovery cycle is not yet marked passed.

The Mercado sign-in username is prepared as `release_e6b774a_1003` for private user entry of the new password. Neither password values nor the reset token were inspected, retained or printed. No additional reset request, cooldown bypass, source change, commit or push occurred. Sign-in handoff screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-reset-login-prepared-20261003.jpg`.

### Recovery new-password login and persistence

After the user completed the prepared new-password login, Mercado Chrome opened the homepage with Release QA identity. Direct navigation to protected Suggestions followed by a normal reload retained authentication. The settled page showed Release QA, Suggest a New Herb and this account's one Approved Kalingag submission. An immediate observation during loading contained no headings; the subsequent settled page confirmed successful access rather than a failed authentication result.

New-password login, protected-route access and refresh persistence passed for this fresh recovery. The independent pre-reset session had already been revoked. The exact consumed reset link is now open in the signed-out Codex browser for user-completed private entry and submission; displaying its form alone does not validate the token. Consumed-link POST rejection remains pending, and no password or token was recorded. No repeat reset request or cooldown bypass occurred.

Screenshots outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-reset-new-login-persistent-20261003.jpg` and `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-consumed-reset-check-prepared-20261003.jpg`. Evidence remains local/uncommitted; no additional deployment occurred.

### Consumed recovery-link rejection observed

After the user submitted the already-used link and reported expired-token feedback, the connected Codex page displayed `Invalid or expired password reset token.` in its alert. Both password inputs and the submit button were removed; Request a New Reset Link and Back to Sign In remained. No password value or token was read or recorded. No further reset email was requested.

The consumed-link rejection check passes: the link can no longer change the password. The combined error does not independently distinguish consumption from time expiry; immediate consumption handling is also covered by existing automated regressions. Observed live recovery checks now include email delivery, user-completed reset with sign-in redirect, independent prior-session revocation, new-password login, protected Suggestions access, refresh persistence and rejection of the previously used link. Exact pre-reset-password rejection was not tested in this recovery cycle; the separate settings-change cycle already has its own old-password rejection evidence. No new defect was reproduced and no production repair or push was needed for this check.

Screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/e6b774a-consumed-reset-rejected-20261003.jpg`. The About-page source-drift repair remains local, with browser visual validation and release still pending.

### About repair preflight continuation

A read-only listener inventory found no running preview on the known local application/fixture ports (3000, 3001, 3002, 4388, 4391). The previously blocked preview command was not retried through another launcher, and no replacement local server or production outage was created. Desktop/narrow browser rendering remains unverified.

Review found that CI explicitly lists native regression files and did not include the new About suite. A focused local workflow step now runs `scripts/about-herb-records.test.mjs` after frontend dependencies are installed. Five additional regressions cover CI inclusion, actual retry handler forcing a fresh read after failure, selection switching canonical details and the exact Library link, empty responses hiding medicinal details, and late rejection after unmount avoiding state writes. The retry/selection checks use the isolated component harness, not real-browser interaction.

The About suite now has 19 passing cases. Running it together with request-cache, deployment-configuration and mocked guarded-deployment suites passed 47 tests with zero failures or skips. JavaScript syntax checking and `git diff --check` passed. Existing earlier About ESLint/typecheck/build results remain applicable to the unchanged page/helper; no new build or remote CI execution is claimed. These repeated/new local results do not change the deployed release's recorded unique CI count. The workflow change, About repair, tests and evidence remain local/uncommitted; unrelated changes were preserved, and no credentials or fixture files were added to the release bundle.

### Responsive browser validation and narrow-layout repair

After the user explicitly requested proceeding with responsive inspection, the normal requested `npm run dev -- --hostname 127.0.0.1 --port 4388` command succeeded. This allowed development-preview validation despite the earlier production-preview start blocker. No alternate launcher or security-policy workaround was used. The default local backend at port 5000 was absent, and the page correctly showed its reviewed-records unavailable/retry state. This was a missing local service, not an observed live outage.

For content layout only, a temporary memory-only HTTP fixture was bound to `127.0.0.1:4391`. It fetched one public catalog snapshot containing ten DOH-listed records from the deployed frontend API, served only GET catalog reads, rejected other requests and all writes, and contained no credentials or database access. The preview's API override was process-local; no environment file or production provider setting changed. Authentication/session behavior was not tested with this fixture; the shared header's session-retry state reflects unsupported fixture authentication endpoints.

Browser viewport emulation reproduced card-content overlap at the ultra-narrow requested width. This uses responsive dimensions, not a physical phone or a claim of manually opening Chrome DevTools. The browser clamps a requested 226px viewport to an observed 240px, so 226px rendering was not counted as tested. The original fixed-height two-column cards wrapped names beyond their bounds at 240px despite no document-wide horizontal scrollbar.

Focused repair: the selector stacks below 360px, uses minimum rather than fixed card height with internal spacing, stacks the detail header/image on narrow screens and lets canonical names wrap. Selection buttons now explicitly expose pressed state and button type. Existing palette, typography, desktop composition, authentication and plant data were preserved.

The confirmation pass measured actual widths 240, 320, 390, 768, 1242 and 1366px. Every width rendered ten selectable records, exactly one pressed selection, zero card-child bottom clipping and document scroll width no larger than the viewport. Desktop Yerba Buena and mobile Niyog-niyogan selection updated the canonical scientific identity and exact Library ID link. Expanding mobile sources displayed PITAHC and Plants of the World Online links. Decorative offscreen circles remained clipped by their existing container; they did not cause document horizontal overflow. The 1242px check is a narrower desktop layout, not proof of an actual browser zoom operation.

About now has 20 passing tests, including narrow-layout and selected-state regressions. The combined About/cache/configuration/guarded-deployment run passed 48 with zero failures or skips. Focused ESLint, `tsc --noEmit`, `git diff --check` and the updated production build passed; all 22 pages generated. The build retains the process-local fixture API override and is for local validation only, not a deployable production artifact. Temporary viewport overrides were reset. No real-device, dark-theme, authenticated preview or whole-site responsive acceptance is claimed. No source commit/push or deployment occurred.

The development server was stopped before building. Starting the resulting production preview with the normal `npm run start` command was blocked by execution policy. No alternate startup workaround was attempted, and the temporary fixture was stopped. The observed development-browser responsive checks and production build pass remain valid; serving the production build in-browser remains pending.

Screenshots outside Git:

- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/about-local-desktop-1366-20261003.jpg`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/about-local-mobile-390-20261003.jpg`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/about-local-narrow-226-before-20261003.jpg` (filename reflects requested size; measured viewport was 240px)
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/about-local-mobile-390-after-20261003.jpg`
- `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/about-local-narrow-240-after-20261003.jpg`

## Authorized About follow-up release preflight

The user explicitly approved reviewing, pushing and testing this follow-up live. Scope is exactly five files: the About page, its canonical-record adapter, its 20-case native regression suite, the CI workflow step for that suite and this acceptance report. Existing changed historical reports and all unrelated Desktop material remain excluded. No schema, backend source, credential, environment, dependency, media, build artifact or local fixture is in the bundle.

Fresh validation passed all 332 native cases across thirteen scripts, with zero failed/skipped cases, plus full frontend lint and standalone typecheck. Previously observed responsive checks cover actual widths 240, 320, 390, 768, 1242 and 1366px. Remote main, deployment and CI refs were rechecked at e6b774a before staging. Vercel production was Ready at that baseline and explicitly showed codex/readability-accessibility as its production branch. Full isolated backend/database CI for the follow-up is required before advancing main and the deployment branch; no pass or live deployment is asserted at this preflight checkpoint.

A fresh build with the CI-style local API setting compiled and generated 22/22 pages. The staged manifest contains exactly five paths (610 insertions and 124 deletions before this outcome note). Bounded credential/token/private-key patterns found only the unchanged synthetic PostgreSQL URLs in the isolated CI workflow, not production credentials, email addresses or live recovery tokens. Screenshots stay outside Git. Providers rebuild from source with their existing production variables; no local build artifact is uploaded.

## About follow-up released and checked live

The authorized five-file commit is `58ebe66d26bde13f36fdfd5cfa3d69f231030dc1` (Use reviewed Library records on About and fix narrow layouts), containing 612 insertions and 124 deletions. Only those five paths were committed; eleven pre-existing historical documentation diffs remain untouched. No schema/backend/environment/media/fixture/build artifact was included.

The CI branch was pushed first. Actual isolated CI run https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37127436464 succeeded in both jobs, including migrations against its disposable PostgreSQL service. Logs show 872 backend tests in 77 files and 332 native cases, including all 20 About regressions: 1204 passing unique cases for this SHA. Frontend/backend lint and typechecks and the 22/22-page build succeeded. Repeated local runs are not added to that count.

After CI passed, main and codex/readability-accessibility were rechecked at the approved previous production SHA and advanced together with an atomic non-forced fast-forward push. All three remote refs now resolve to 58ebe66. The resulting main run https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37127639668 and deployment-branch run https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37127639899 also completed successfully.

Vercel's production-specific deployment list showed Ready for 58ebe66 on codex/readability-accessibility, not merely a preview status. Production deployment: https://vercel.com/kevinmercado987-gmailcoms-projects/herbal-ai-staging/8mdzjEXQxApB2GLnJy3Kyt5fZ2RL. The overview initially retained the previous deployment while the new release settled; the production list and actual public page establish the updated release. Railway showed Online and ACTIVE for the matching commit message; its success status points to deployment `14e0c48b-3a83-49bb-966e-7669e6b7ec5c`. No provider settings or credentials changed.

| Live check | Observed result |
| --- | --- |
| Availability/catalog | Public frontend-proxied health returned 200; reviewed DOH-listed query returned success with ten records; full catalog retained 38 records. |
| Anonymous About | Settled public page rendered ten pressed-state selection buttons without a record-loading error. Sign In remained available for the anonymous browser. |
| Canonical selection | Desktop Yerba Buena selection displayed Mentha × villosa, omitted the obsolete Clinopodium douglasii identity, and linked Library ID h-4daf09c5a0b641ba. Mobile Niyog-niyogan selection used its canonical repository ID. |
| Responsive layouts | Actual live widths 240, 320, 390, 768, 1242 and 1366px each rendered ten selectors, one pressed selection, zero card-child bottom clipping and no document horizontal overflow. Browser emulation only; not physical-device acceptance or an actual zoom check. |
| Reference disclosure | Mobile Sources & references expanded and displayed the PITAHC Directory and Plants of the World Online references. |
| Exact Library navigation | The selected Niyog-niyogan link opened `/library?id=04d52d3b-b738-4ede-8275-46ba18758ac6`; settled Library modal showed Niyog-niyogan and Combretum indicum (Balitadham / Tartaraok). |
| Existing contributor session | A new Mercado Chrome tab restored Release QA, loaded all ten About records and omitted the signup CTA. Its protected Suggestions page remained accessible after reload with the same account. Existing user tabs/drafts/passwords were not changed. |
| Administrator follow-up | Original admin tab handle was no longer available. Inventory found a replacement `/admin` tab, but its automation timed out before inspection. A new admin refresh is NOT counted as passed. No password, role, logout or destructive retry was performed. |

No new application defect was reproduced in these bounded About live checks. The stopped local-preview tab could not be navigated through its internal browser error page; documented troubleshooting permitted a fresh tab in the same in-app browser, which successfully loaded the public release. This browser-control issue is not a production application outage. Temporary viewport overrides were reset. No live database writes, reset emails, synthetic medicinal publication or induced production outage occurred in this follow-up acceptance.

Remaining limits: the administrator-browser follow-up is unverified; genuine Suggestions focus-return evidence remains unresolved; participant UAT is deferred and physical-device results remain user reports. Railway's dashboard still shows a limited trial (15 days or $4.27 at inspection), so ongoing hosting availability is not guaranteed by this release. No upgrade/payment was attempted. This post-release evidence is saved locally after the approved source/documentation commit, without an additional documentation-only push/redeployment.

Live screenshots outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/58ebe66-live-about-desktop-20261003.jpg` and `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/58ebe66-live-about-mobile-20261003.jpg`.

## Administrator and hosting follow-up

At approximately 10:02–10:11 PM Asia/Manila, the user authorized the remaining administrator/hosting review. Binding the existing purple-profile admin tab again timed out. A fresh tab in the same connected Chrome profile successfully loaded the live Admin Console without signing in again or changing credentials. This closes the prior administrator-browser inspection blocker for this release; the old tab's automation failure is not counted as an application defect.

| Follow-up check | Observed result |
| --- | --- |
| Dashboard and refresh | Admin Console loaded with 38 herbs, 0 pending reviews, 2 approved suggestions, 17 users and 33 FAQ facts. After an intentional reload, the same administrator and dashboard returned; no Forbidden or sign-in redirect appeared. |
| Published catalog | All Herbs settled at 38 records and included Kalingag / Cinnamomum mercadoi. |
| Suggestion review | Pending filter correctly showed no suggestions. Approved filter showed two records, including Kalingag and its review note. Dashboard showed 14 rejected suggestions. No approval/rejection action was repeated. |
| Audit read | Administrative Audit Logs loaded. Expanding the existing APPROVE_SUGGESTION entry showed suggestion 66, Kalingag, Approved, its scientific identity and the previously recorded review metadata. This proves access to the existing audit record, not a newly generated write event. |
| Logout control | Log out remained visible. It was not clicked, preserving the user's administrator session. |

Read-only review also found a legacy Approved suggestion named `awdsawd` (submitted 6 June 2026) whose expanded stored details claimed "treats anxiety", with preparation `plawds`, dosage `awda` and source `pitahc`. It did not appear in the rendered 38-record All Herbs catalog. This is a data-quality/provenance follow-up, not a new runtime exception or verified public medicinal publication. No record was edited, rejected or deleted; historical review and retention need an explicit, scoped remediation decision.

Railway remained Online on the matching release. Its workspace displayed TRIAL with 15 days or $4.27 remaining; accumulated usage was $0.73. Project costs were application $0.4380 and pgvector $0.2550. No payment or hosting changes were made, and the database service is not presumed unused. The finite trial remains a hosting-continuity risk. Current policy sources, measured costs and a concrete owner handoff/checklist are saved in `HOSTING_CONTINUITY_2026-10-03.md`.

No source repair, live write, new mail request, credential change, commit or push was needed for this bounded follow-up. The new documentation and this appendix remain local. Genuine Suggestions focus-return, participant UAT and independently observed physical-device acceptance retain their existing evidence limits.

Screenshot outside Git: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/58ebe66-admin-refresh-20261003.jpg`.

## Local publication-coverage hardening

The 4 October read-only audit of the legacy `awdsawd` approval found it absent from the public catalog but structurally under-sourced for its stored public-claim fields. A local guard now requires valid review references to collectively cover identity, medicinal uses, preparation and dosage before a Pending suggestion can be approved. Partial reviewer edits remain saveable; the gate is applied only at publication. This does not judge source authority automatically and does not change or retroactively reprocess legacy data.

Focused review tests passed (22), plus backend lint and TypeScript build. The database-backed suggestion-validation suite remains an environment-only local gap because PostgreSQL is unavailable; it must pass in isolated PostgreSQL CI before release. The repair, tests and detailed evidence are local in `SUGGESTION_REFERENCE_COVERAGE_2026-10-04.md`; no commit, push, provider setting or live record mutation occurred.

Follow-up review strengthened this local batch at the repository transaction boundary and required source coverage for any written warnings. The old repository fallback that manufactured claim-support labels from a plain source string was removed. Three direct-call bypass cases failed before the repair and now reject before Herb/audit creation in modeled tests. The expanded final run passed 114 tests across six files, plus lint/build and separate strict typechecking of the changed database tests. Three PostgreSQL rollback cases are prepared but remain unexecuted locally; their pass is not inferred from mocks or the previous released CI. Publication/source-provenance fixtures were updated for explicit coverage. The detailed report tracks these release gates and the separate hosting, legacy-record and manual acceptance limits.
