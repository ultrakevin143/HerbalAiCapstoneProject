# CAPSTONE PROJECT next-work plan

Prepared 2 October 2026. Scheduled start: **6 October 2026, 8:10 PM Asia/Manila** (12:10 PM UTC). This is a one-time continuation in the existing chat, not a promise that every manual acceptance check can finish unattended.

On 3 October 2026, the user canceled that future schedule and requested immediate execution of this plan. The automation service reported that live-password-acceptance-checks already did not exist; no active matching local automation configuration was found. Today's execution and evidence are recorded in RELEASE_REVIEW_2026-10-03.md. The phases below remain the work plan, not a claim that all acceptance gates have passed.

## Objective and working boundaries

Close reproducible release-readiness defects in priority order and produce an evidence-backed system handoff. Reuse the selective-release-check worktree; inspect its current branch, applicable AGENTS.md files, remote state and working diff before editing. Preserve the unrelated dirty Desktop checkout and all existing uncommitted reports. Keep the established visual design and both Google and optional email/password login methods.

The user will manually audit the password notifications following the current release. Do not spend additional live mail requests or change credentials merely to repeat that audit. Later fixes require their own reviewed publication proposal; the scheduled continuation must not automatically commit, push, deploy or alter hosting variables.

## Phase 1 — reconcile release and evidence

1. Confirm the actual deployed notification-fix SHA, main/deployment-branch ancestry, GitHub checks and Vercel/Railway status. Do not assume the release is still current on 6 October.
2. Review PASSWORD_SETTINGS_FEEDBACK_2026-10-02.md, OAUTH_PASSWORD_COPY_2026-10-02.md, PASSWORD_SETTINGS_2026-10-01.md, ADMIN_LOGOUT_2026-10-01.md, REMAINING_MVP_GATES_2026-10-01.md and the latest linked follow-up reports.
3. Reconcile chronological evidence: distinguish superseded pending notes, confirmed fixes, current bugs and checks lacking evidence. Preserve user-reported results as user-reported; do not silently promote them into agent observations.
4. Record the user's notification audit if available. Otherwise leave that manual result pending and continue other independent checks.

Deliverable: a current issue ledger with severity, scenario, environment, evidence source, affected file or route, release SHA, status, next action and any required user involvement. Evidence gaps are not automatically product defects.

## Phase 2 — authentication and notification acceptance

- Check incorrect-current-password placement immediately above Change password; separate setup-link errors and acknowledgements; modal scrolling; keyboard and screen-reader semantics; busy/duplicate-click behavior; stale feedback clearing; and connection/rate-limit recovery.
- For an authorized disposable account, cover same-password rejection, incorrect-current-password rejection, user-completed change, exact previous-password rejection, new-password login, previous-session revocation, refresh persistence and protected-route denial after logout.
- Reconcile existing Google-linked acceptance before repeating it. Where evidence is still missing, cover the settings link, authorized inbox delivery, user-completed app-password creation, email/password login, continuing Google login on the same account identifiers, and used-link rejection. A Herbal-Ai password is not a Google password.
- Preserve the hourly email cooldown and single-use/one-hour token rules. If a password was forgotten, use normal recovery and document the missing historical comparison instead of testing a random password as an old one.

No administrator password changes. New credentials must be entered, confirmed and submitted by the user, never by the agent. Without user availability, continue source and automated checks and leave private credential acceptance pending.

## Phase 3 — contributor and administrator MVP

- Library: published records, search/filter/pagination, source and image rendering, invalid/absent detail handling, and responsive layout.
- Suggestions: authorized submission and image validation, My Submissions ownership, pending/approved/rejected state refresh, stale-tab return, pagination and failure/retry behavior.
- Administration: restored role after refresh, unauthorized/contributor denial, dashboard counts, approve/reject state transitions, audit-event correspondence and logout. Prefer read-only checks unless the exact disposable live record and mutation are already authorized.
- Catalog and moderation: revisit known last-page deletion/refetch evidence gaps safely in an isolated fixture. Do not delete real discussions or manufacture a large set of production records just to create pagination.

For any new live record or destructive/moderation operation outside the existing explicit authorization, obtain the appropriate confirmation first. Mark authorized test data clearly and document retained test artifacts; do not silently purge data or drop tables.

## Phase 4 — Messenger, Community and Dr. Ai

- Messenger: retained history, authenticated ownership, edit/delete validation, loading and retry, stale selection, interrupted requests and session expiry. Keep pre-existing drafts and real conversations intact; use bounded labeled fixtures for write checks.
- Community: list/detail/comment loading, validation and permissions, pagination recovery, pending controls, repeated actions and mobile wrapping.
- Dr. Ai: healthy grounded/cited response, partial-stream failure, idle versus total timeout, reader cancellation on navigation, retry and expired-session handling. Reuse controlled tests for provider/rate-limit/disconnect cases rather than exhausting live Gemini quotas.
- Keep browser-local simulation, native tests, isolated database results and real hosting/provider behavior separate. Healthy production requests do not prove provider-side billing cancellation, SQL termination or proxy disconnect propagation.

## Phase 5 — responsive and accessible UI

Batch desktop and phone-width browser checks for changed or unresolved routes. Cover the 110%-equivalent header breakpoint, modal fit and scroll, notification visibility, label/error association, focus containment/return, contrast in both existing themes, long content and loading/empty/error states. Temporary viewport or request-blocking overrides must be restored. Browser emulation is not a physical-device result.

## Phase 6 — dependencies and repository hygiene

Recheck current dependency advisories and root-file references without forced major downgrades. Classify code, migrations, documentation, test fixtures, media and generated artifacts using actual imports/references and deployment configuration. Propose unused-file moves or removals before any destructive action; filenames alone are not proof of disuse. Keep secrets, personal files, loopback fixtures and demo database settings out of the release. Database inspection is read-only unless a separately reviewed migration is authorized; never drop tables on an assumption.

## Phase 7 — repair and validation loop

For each reproducible problem: record severity and steps; create a failing regression; make the smallest proper-flow repair; rerun focused checks; then run the combined applicable suites, typechecks, lint and builds. Handle authentication/data-loss/security issues first, functional failures next, and minor UI/documentation debt last. Avoid speculative refactors of already-passing code.

Use isolated PostgreSQL/pgvector CI or a verified loopback test database for database/write tests. If local PostgreSQL/Docker is unavailable, explicitly report that limitation; never substitute Neon, Railway or the demo database. A prior green CI is historical evidence, not a new run for an unpublished change.

## Phase 8 — documentation and release proposal

Update the issue ledger, testing evidence and changed-flow documentation. Prepare traceability notes for SRS, SPMP, SDD and STD using actual requirements, implementation and observed tests. Do not invent study participants, signed acceptance, performance figures or guarantees of zero defects. The user previously asked not to pursue the participant campaign; retain its unrecorded status without running it or treating the user's approval as five-participant UAT.

Provide a selective file list, test results, migration/configuration impact, remaining manual gates, rollback notes and proposed live smoke checks for any new repair batch. Request publication authorization rather than automatically pushing. End with completed checks, reproduced failures, unresolved evidence gaps and the exact user action needed, if any.

## Scheduled execution prerequisites

Keep the computer powered on with the desktop app running and this worktree available. Connected contributor/admin browser sessions and user availability enable private acceptance; their absence does not prevent safe automated or public read-only work. Notify only for meaningful progress, reproduced failures, completion or required user action, and stay quiet if nothing actionable changes.
