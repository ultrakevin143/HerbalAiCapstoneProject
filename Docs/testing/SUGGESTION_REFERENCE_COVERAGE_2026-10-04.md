# Suggestion publication reference coverage — 4 October 2026

## Finding

Read-only live administrator review found an old Approved submission named `awdsawd` whose stored preparation, dosage and medicinal-use text were not credible. It is not in the rendered public 38-herb catalog, so this is not a public-library correction or a confirmed Dr. Ai retrieval issue.

The current review workflow already required a non-empty source field and at least one structured reference before publishing. It did not, however, require the structured references to declare support for every mandatory public claim field. A reviewer could therefore attach an identity-only reference and publish identity, medicinal-use, preparation and dosage text without structured coverage for the latter fields.

## Local repair

The approval controller now blocks publication unless valid structured references collectively cover:

- botanical identity;
- medicinal uses;
- preparation method; and
- dosage; and
- safety warnings when the record includes written warning text.

Editors can still save partial review work. The stricter rule applies only at the irreversible publication action. It does not infer that a citation is authoritative; the reviewer remains responsible for applying `Docs/HERB_CONTENT_STANDARD.md` to assess source quality and wording.

The follow-up review found that a direct repository call could bypass the controller guard. The database transaction now rechecks the references on the claimed suggestion before creating its Herb and audit entry. A validation exception causes the transaction to roll back its status/revision claim. The obsolete fallback that invented support labels from a plain information-source string has been removed; only explicitly reviewed reference scopes are copied into the published Herb.

An initial regression run reproduced three direct-call bypass cases: empty references, identity-only references and an unsafe URL. Each reached Herb creation rather than rejecting publication. After the repository guard was added, all three rejected before Herb or audit creation in the modeled transaction tests. Written-warning coverage is checked at both controller and repository boundaries. Reference coverage may be distributed across multiple reviewed sources.

The legacy `awdsawd` record was not edited, rejected or deleted. Its status means the new guard would not run retroactively. Any archival or retention action needs a separate exact-target review because it is historical user data and may be associated with audit records.

## Validation

- Initial controller-only batch: 22 focused tests passed; this is historical evidence and is not added to the final test count.
- Expanded final run: `npm test -- --run tests/review-http.test.ts tests/review-decisions.test.ts tests/suggestion-review-edit.test.ts tests/suggestion-id-boundaries-http.test.ts tests/suggestion-resubmit.test.ts tests/suggestion-upload-recovery-http.test.ts`: 114 passed across six files, zero skips/failures.
- `npm run lint`: passed.
- `npm run build`: passed.
- Separate strict TypeScript check of the changed database test files: passed. The normal application build excludes tests, so this is an additional compile check, not a database execution.
- `git diff --check`: passed; line-ending warnings concern pre-existing workspace files.

`tests/suggestion-validation.test.ts` could not run locally because its integration setup needs PostgreSQL and the local database service is unavailable. Its failure occurred during test-fixture user creation before the submission assertions. The isolated PostgreSQL GitHub CI must run before publication; no live approval or production database change was attempted for this repair.

The database governance suite now contains three actual rollback checks for unsupported direct approval. They verify Pending status, unchanged revision/reviewer state, zero Herb creation and zero audit entries after failure. The existing successful governance/publication fixtures now supply explicit source scopes, preserving their source/provenance/embedding assertions. These database suites were typechecked, but were not executed in this environment. The mocked transaction tests do not prove PostgreSQL rollback by themselves.

Public list/detail and embedding retrieval code were inspected: they select verified PUBLISHED Herb records rather than reading the SuggestedHerb archive. Existing role, revision, ownership, resubmission and duplicate-decision checks remain in their routes and transactions. The expanded local tests exercised stale decisions, ID validation, reference validation, side-effect ordering, resubmission and upload recovery. Authenticated role enforcement and real SQL behavior remain part of isolated database CI; no new live acceptance pass is claimed.

## Release scope

The local change set is limited to:

- `herbalaibackend/src/schema/suggest.schema.ts`;
- `herbalaibackend/src/controllers/suggest.controller.ts`;
- `herbalaibackend/src/repositories/suggest.repository.ts`;
- `herbalaibackend/tests/review-http.test.ts`;
- `herbalaibackend/tests/review-decisions.test.ts`;
- `herbalaibackend/tests/herb-governance.test.ts`;
- `herbalaibackend/tests/review-publication-transaction.test.ts`;
- `herbalaibackend/tests/suggestion-review-edit.test.ts`; and
- this report.

The release report also records a short cross-reference to this batch. Existing uncommitted historical reports were preserved. This batch needs isolated database CI and review before deployment. No migration or frontend change is required. Nothing in this batch is committed, pushed or deployed.

## Authorized release continuation

The user authorized proceeding with isolated database CI, the focused release and live acceptance on 4 October. The release scope is the eight backend files above and this report only. Unrelated historical documentation and hosting notes are excluded. Local preflight was repeated: all 114 focused tests passed, backend lint/build and the strict database-test typecheck passed. The CI branch, main and the watched deployment branch were verified at `58ebe66` before release work. Production refs will remain unchanged until the new commit passes isolated CI.

The initial connected-browser inventory contains Mercado Chrome with Gmail and Facebook, but no open Herbal-Ai session or connected Gina administrator browser. Fresh session availability must be observed before authenticated live checks are counted; old reports alone do not establish current sessions.

## Remaining project gates

| Gate | Current disposition |
| --- | --- |
| Citation coverage at controller and repository | Isolated CI passed; deployed as 4ad669d. Identity-only publication refusal observed live. |
| Real transaction rollback and governed successful publication | Actual disposable PostgreSQL CI passed the rollback and positive publication cases. No production SQL fixture was used. |
| Actual source authority and scientific/medical wording | Human reviewer checks against `HERB_CONTENT_STANDARD.md`; source tags do not establish factual accuracy. |
| Legacy approved archive record | Retained, absent from the previously inspected public catalog; historical-data decision remains pending. |
| New live acceptance for this guard | Partial edits saved, identity-only approval blocked, rejection/audit observed and public exclusion checked; separate live missing-warning case not performed. |
| Railway continuity | Owner decision remains pending; see `HOSTING_CONTINUITY_2026-10-03.md`. |
| Genuine Suggestions tab-return, physical-device evidence and participant UAT | Existing evidence limits remain open or deferred in the release report. |

## Isolated CI and release promotion

The authorized nine-file commit is `4ad669dc2ddc940b59220a175f9c085e2ced13a4` (Require reviewed reference coverage before herb publication), with 220 insertions and 28 deletions. CI run https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37182785074 passed both jobs for this exact SHA. Its disposable PostgreSQL service applied every migration successfully. All 892 backend tests across 77 files passed, including the five-case governance suite and the successful review/publication transaction test. This establishes execution of the three new real SQL rollback cases, not only the mocked checks. The 332 native frontend cases passed; the combined unique CI total is 1224, without adding repeated local runs. Lint, typechecks and the 22-page frontend build also passed.

After CI success, the remote production refs were rechecked at `58ebe66` and atomically fast-forwarded without force to the tested SHA. Main, `codex/readability-accessibility` and `codex/mvp-acceptance-ci` now resolve to `4ad669d`. Both provider statuses were initially Pending; that is not a completed deployment or live acceptance result. Source, database URLs, credentials and provider settings were not changed outside the reviewed batch.

The reconnected Gina browser rendered Admin Kevs and the live dashboard; Mercado restored Release QA and Kalingag Approved. Anonymous health, catalog/search and exact Kalingag reads returned HTTP 200; the catalog contains 38 herbs. Anonymous Suggestions, audit and Messenger conversation reads returned HTTP 401. One mistakenly guessed `/api/suggest/my-submissions` diagnostic returned 404; source inspection identified the canonical `/api/suggest` endpoint and its expected 401. The guessed URL is an audit targeting mistake, not an application regression.

## Deployment and observed live acceptance

All three exact-SHA CI runs completed successfully: the isolated branch run above, main run https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37182915336 and watched-branch run https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37182914932. Vercel's exact deployment https://vercel.com/kevinmercado987-gmailcoms-projects/herbal-ai-staging/F87u2Du6FsxtBvpMMZzsjDC4eQMW showed Ready, Production, the live `herbalaiph.vercel.app` domain and source `4ad669d` on the watched branch. Railway deployment `6a7c84df-5b4b-45f4-ad19-72b0a7b5900e` showed Active, Deployment successful and the matching source commit. Startup logs showed no pending migrations and successful application startup. No provider variables or billing settings were edited.

| Workflow | Observed outcome on 4ad669d |
| --- | --- |
| Existing contributor session | Mercado restored Release QA and the existing Approved Kalingag submission. Refresh retained authenticated access. |
| Existing administrator session | Gina restored Admin Kevs; intentional Admin Panel reload retained the role, dashboard and review controls without Forbidden or a sign-in redirect. |
| New QA submission | `TEST ONLY CITATION GUARD 4ad669d`, SuggestedHerb 67, saved as Pending. All text expressly labels it synthetic/non-medicinal and forbids publication. No image or personal file was uploaded. |
| Partial reference editing | A synthetic identity-only citation saved successfully; all other support boxes remained unchecked. The suggestion stayed Pending and showed one reviewed reference. |
| Under-sourced approval | Approve & Publish returned the new coverage error asking for identity, uses, preparation, dosage and written-warning sources. The record stayed Pending; the action controls recovered. No synthetic Herb was published. |
| Rejection and audit | Only new QA suggestion 67 was rejected with the test outcome as reviewer notes. Pending count returned to zero; rejected count became 15. Audit showed EDIT_SUGGESTION and REJECT_SUGGESTION for 67, with the exact rejection note. The latest APPROVE_SUGGESTION remained the earlier real Kalingag record, 66. |
| Public catalog exclusion | Fresh anonymous catalog read contained 38 herbs, zero exact QA-label matches and exactly one Kalingag. |
| Two-account Messenger | Release QA sent one TEST ONLY message to Admin Kevs. The new conversation appeared in Gina without reload. Administrator read it and replied; the reply appeared in Mercado without reload. |
| Messenger edit/order | Contributor edited only its own older QA message. Gina showed the edited text and marker; conversation preview remained the newer administrator reply. Contributor reload and reopening the conversation retained both messages and the edit. No message was deleted. |
| Administrator Messenger refresh | Intentional Gina Messenger reload restored Admin Kevs and the new Release QA conversation with the correct latest-message preview. |
| Contributor role boundary | A separate Mercado tab at `/admin` showed Access Denied, identified Release QA as contributor and withheld administrator controls. Neither session was logged out for this check. |
| Dr. Ai healthy completion | One bounded Kalingag evidence/safety question completed with the documented-traditional-use classification, no recommended dose, Herb 1 source label and educational safety notice. Suggested prompts and composer recovered. No captured warning/error entries appeared in the inspected AI or contributor Messenger tabs. This is not quota, outage or scientific-accuracy certification. |
| AI-to-Library source navigation | The Kalingag source button opened the exact public Herb ID `h-84ec276856199592`. Expanded references showed the Dapar 2020 journal source and Delacruz 2013 HERDIN mouse-only abstract. |
| Anonymous frontend shells | Home, Library, Community, About, Privacy, Forgot Password and the reset route without a token returned HTTP 200. These HTTP reads establish route availability, not every interactive feature or a newly completed password/email cycle. |

Proof screenshots are outside Git in the task visualization directory: `4ad669d-live-publication-blocked-20261004.png` and `4ad669d-messenger-persisted-20261004.png`. The two QA messages and rejected suggestion remain as labeled test evidence. No legacy submission, published herb, account role or password was changed.

Additional proof: `4ad669d-ai-cited-completion-20261004.png` and `4ad669d-library-sources-20261004.png`. Kalingag's previously saved source tags cover uses/preparation and safety, not the full new identity/dosage scope rule. The new gate intentionally applies prospectively; this read does not certify all pre-existing published records against the new rule. Retrospective source-tag review must assess actual citation support rather than inventing broad tags or silently reclassifying a live record. No new unsupported public claim or dosage was added during acceptance.

### Checks still requiring observed completion

The automated browser shortcut and CDP foreground transitions did not establish a usable Suggestions refresh event. The contributor tab still showed the new QA record Pending while the administrator/audit and catalog had the canonical rejection. A bounded network trace contained no new Suggestions request during the automated transition. This remains an evidence gap rather than a proven failure of real human tab-return; no synthetic focus/visibility event was dispatched. Network instrumentation was disabled afterward. A user handoff asks for a genuine away/back transition without Refresh status or reload.

For independent Google-linked acceptance, a new Codex browser was opened without replacing either Chrome session. The Google button navigated to the normal Google Sign In page, but that browser has no existing Google session. The authorized account identifier was prefilled and the tab handed off for private sign-in. No Google password, authorization code, new app password or reset token was read, entered or recorded. Fresh OAuth return and any new credential-dependent lifecycle checks are pending the user action; historical mail/password results are not represented as newly rerun on this release.

The initial provider-dashboard timeout, an exact Suggestions button-name mismatch caused by its numeric badge, and audit-row whitespace selector mismatches were browser automation targeting issues. Fresh accessibility controls resolved them; they are not application defects. The normal boot/session/loading states were allowed to settle before acceptance results were recorded.

No new application failure was reproduced in the bounded completed checks. The prospective publication guard is observed working; the genuine tab-return event and independent OAuth completion remain open. Post-release outcomes in this report are saved locally without a documentation-only redeploy. The twelve earlier changed historical reports and the hosting report remain untouched by the release commit. Railway displayed 14 days or $4.24 of trial at this inspection; continuity still requires an owner hosting decision. No upgrade, payment, database migration/backfill or data cleanup was attempted.

### Existing Chrome Google-session correction

The user reported forgetting the Gmail password and correctly requested use of the existing Chrome session. The unnecessary independent Codex Google-login handoff was closed without entering a password or code. Its sign-in request is superseded, not an unresolved requirement to recover Gmail. A fresh Sign In tab in Mercado Chrome used the normal Google button, showed the already signed-in authorized account in Google's account chooser, and selected it. The Dr. Ai avatar signing-in screen completed and Herbal-Ai opened with Mercado Kevin, Suggestions navigation and its account menu. No Gmail recovery or new Google authorization scope was needed; no Google or Herbal-Ai password was changed.

This intentionally switches Mercado's Herbal-Ai browser session from Release QA to the existing Google-linked account. Gina's administrator browser remains separate. Fresh Google OAuth return is now observed; a new email/password creation or private-password login cycle has not been performed in this batch. The earlier genuine Suggestions tab-return handoff is left unverified and must not be repeated against the now-different account or counted from cached Release QA UI.

An intentional reload then restored Mercado Kevin, the account menu and protected Suggestions navigation without a new Google login. OAuth login persistence passed. Proof outside Git: `4ad669d-google-login-success-20261004.png`. No additional source commit or deployment was triggered for these observed outcomes.
