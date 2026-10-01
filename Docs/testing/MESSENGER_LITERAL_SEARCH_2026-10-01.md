# Messenger literal-search follow-up — 1 October 2026

## Finding and scope

Follow-up to `MESSENGER_SEARCH_NORMALIZATION_2026-10-01.md`. The conversation sidebar implements literal, case-insensitive name matching, but its repository previously passed raw input into an ILIKE pattern. Percent and underscore could expand SQL matches; backslash could change pattern interpretation. This mismatch can fill a server page with names the rendered filter hides. It is not evidence of SQL injection: the original query was already parameterized.

The interpretation of percent, underscore, and escape characters follows [PostgreSQL's pattern-matching documentation](https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-LIKE). Search remains literal name search, not a user-facing SQL-pattern feature.

## Focused repair

`herbalaibackend/src/repositories/message.repository.ts` builds an escaped search pattern and specifies `ESCAPE '!'`. The escape character itself, percent, and underscore are escaped. Backslash becomes ordinary input because the explicit escape character is exclamation mark. The surrounding substring wildcards, parameter binding, case-insensitivity, latest-message selection, ordering, limit, and offset remain unchanged. No schema migration, credential, environment, or UI-style change is needed.

This follow-up does not change the separate New Chat user picker, authentication, socket handling, message mutation, or visibility permissions.

## Tests and evidence boundaries

- Seven repository query-contract cases cover percent, underscore, exclamation mark, backslash, a combined input, an apostrophe, and an empty search. Before the repair, all seven failed the new escape-clause contract while the existing nine boundary cases passed. These are seven checks of one contract, not seven separate production incidents.
- After repair, all 45 targeted backend tests passed across repository boundaries, message HTTP validation, and message notifications.
- Backend source lint, targeted test-file lint, and TypeScript production build passed.
- All 23 frontend Messenger regressions passed again. The previous normalization repair's full frontend lint, typecheck, production build, and controlled desktop browser checks remain separate evidence.
- An additional real-database regression was added to the existing isolated authenticated Messenger suite. It creates labeled messages for two isolated fixture contacts, searches literal punctuation with page size one, checks that nonmatches do not consume pagination, checks the empty final page, and checks uppercase/empty searches. It restores the temporary contact name in finally; the suite cleans fixture users and cascading records afterward.
- That database regression has not run locally: this workstation has no PostgreSQL or Docker runtime. The existing suite refuses targets other than test-mode loopback `/herbalai_test`. GitHub CI must pass it before this code is released.

No production message, contact name, account, or database record was altered for this follow-up. The previous live space-padded search reproduction is documented separately; no new live wildcard-specific failure is claimed here.

## Release gate

Run the existing temporary-branch CI with its isolated PostgreSQL service. Only after its backend/database and frontend checks succeed should the reviewed changes be considered for main and the deployment branch. No fixture build, credentials, local test server, or primary-checkout changes belong in the release. At the time of this record, this repair is local and production has not changed.

## Publication follow-up

Commit `07a1811bdeb9f66f26e68a924bc0333808895ee7` contains only the nine explicitly reviewed application, regression-test, and factual acceptance-report files. It was first pushed to the existing `codex/mvp-acceptance-ci` branch. [CI run 36829993962](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/36829993962) passed both jobs. The actual isolated database suite passed 452 tests across 61 files, including the nine-case authenticated Messenger suite and the sixteen-case repository-boundary suite. Frontend CI passed its 23 Messenger regressions, lint, typecheck, and production build. The new punctuation/pagination database regression is therefore executed in isolated CI, not merely authored or mocked.

After checking that both remote branches were ancestors, that same commit was fast-forward pushed to `main` and `codex/readability-accessibility`, without force or primary-checkout changes. Their CI runs are `36830288501` and `36830288624`. At this intermediate observation, both deployment contexts were pending; no patched live result is inferred from a successful push.

Public health, the one-record herb catalog request, and the one-record forum request returned HTTP 200 with success status during release monitoring. These requests alone do not prove that the new frontend or backend deployment has completed. Deployment and authenticated live results are recorded separately after observation.

### Deployment and live verification completed

Both main CI `36830288501` and deployment-branch CI `36830288624` completed successfully. The exact commit's Vercel status and `herbal-ai-staging - HerbalAiCapstoneProject` Railway status both became success.

After a full reload of a separate live Messenger tab, the existing Herbal QA contributor session restored. Space-padded uppercase ADMIN displayed the existing Admin Admin conversation, closing the earlier live whitespace reproduction. Opening that conversation displayed the existing edited QA history. Percent and underscore searches displayed No conversations found without removing the open conversation; whitespace-only input restored its sidebar row. The current live contact name has no punctuation, so the exact special-character-name and pagination assertions remain the real isolated-database CI evidence, not an invented positive live match.

Following Suggest Herb opened the protected form; another full reload restored it under the same authenticated contributor rather than redirecting to Sign In. This is protected-page/session smoke evidence, not a new suggestion submission or administrator review test. No new account, reset email, upload, message mutation, or production database fixture was created for this release check. The original recovered Suggestions tab was not modified; the separate test tab was closed.

Screenshot `herbalai-live-search-fixed-20261001.png` is saved outside Git in the local temporary directory. Temporary-branch, main, and deployment-branch refs contain the same reviewed application commit. This post-release evidence is a local documentation follow-up for the next reviewed documentation batch; it does not require another application change.
