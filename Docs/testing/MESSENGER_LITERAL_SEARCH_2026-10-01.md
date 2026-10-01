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
