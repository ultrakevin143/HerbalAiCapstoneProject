# Focused Library-to-AI release check

## Release baseline

The checked release is `88260d93b869b1d39ffa232837ec27254f2b19ca`. The `main` CI run completed successfully:

[GitHub CI run 37594363728](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37594363728).

This run did not change either production branch, hosting settings, herb records, herb recipes or images. No credential was entered or changed by the agent. New repairs and tests described below remain local.

## Observed live results

- The public catalog returned 88 records.
- Four bounded public listing requests, each with page 1 and limit 12, returned HTTP 200 with zero results despite the intended species being present in the catalog:

| Search | Existing catalog title | Scientific name |
| --- | --- | --- |
| Holy Basil | Balanay | Ocimum tenuiflorum |
| Indian Mallow | Abutilon indicum | Abutilon indicum |
| Portia Tree | Thespesia populnea | Thespesia populnea |
| Sponge Gourd | Luffa aegyptiaca | Luffa aegyptiaca |

- The actual live Library UI independently showed zero results for Holy Basil. Searching Balanay returned one result.
- Balanay's detail dialog showed preparation, dosage limitations, occurrence, warnings and a Sources & references button. Visible text is not a certification of source support, clinical effectiveness, image permission or recipe safety.
- Clicking Ask Dr. Ai about this plant opened `/chat?q=What%20preparation%20and%20safety%20information%20is%20available%20for%20Balanay%3F`, then redirected the logged-out browser to `/signin?callbackUrl=%2Fchat`. The question was lost before sign-in.
- Initially no connected Chrome contributor session was available and the in-app browser was logged out. The user then selected their administrator account and completed sign-in themselves. No password recovery or administrator-setting changes were performed.

## Completed authenticated AI check

Exactly one prompt was submitted through the live UI in the user-selected signed-in session:

> What does the Library record for Balanay (Ocimum tenuiflorum) say about its preparation and safety limitations? Please cite the record and avoid adding a dose or extra preparation steps.

The answer completed, identified Balanay and its scientific name, reproduced the current record's preparation, retained its warnings and absence of a cleared medicinal dose, and cited the Balanay record. No extra preparation step or medicinal dose was observed. The cited Balanay button opened `/library?id=builtin-expansion-03-pardo-172`, and the correct Balanay dialog appeared while the account remained signed in.

This passes one named-record retrieval and citation-navigation check. It is not proof of semantic embedding coverage, every herb, all conversations or independent support for the preparation timing already present in the database. No second prompt was sent to consume quota.

Local screenshot evidence: `herbalaifrontend/tmp/balanay-ai-live-proof.png` (git-ignored).

## Common-name correction already present locally

The existing local regional-name registry now has explicit `canonicalLocalName` values. All 88 registry scientific identities matched a public catalog record with the same canonical title; this mechanical comparison found zero mismatches. It does not verify every regional name or its cited source.

The local repository already expands searches with exact canonical-title alternatives while retaining publication, verification, category, DOH and pagination conditions. This code and registry are not in the checked deployed release. They were preserved rather than replaced with a second dictionary or credited as a newly authored repair.

Added `herbalaibackend/tests/herb-common-name-search.test.ts` to exercise the actual HTTP controller and repository with an isolated mocked Prisma boundary. It covers the four failed aliases, count/list predicate consistency, draft and unverified exclusion, case/whitespace cache behavior, category/DOH restrictions, pagination and unknown input. These are local controller/repository regressions, not real Neon integration tests.

## New focused redirect repair

Changed `herbalaifrontend/app/chat/page.tsx` to preserve the current chat query string in the sign-in callback. The redirect now replaces the unauthenticated history entry. The effect also depends on current query parameters and still waits for authentication loading or session-recovery failure to resolve.

Extended the already scheduled `scripts/dr-ai-stream.test.mjs` rather than adding an unscheduled root test. Tests execute the actual authentication effect extracted from the component and the existing callback validator. They cover exact plant questions, encoded punctuation, the plain chat route, loading/authenticated/unavailable-session guards and query dependencies. No redirect-security restrictions were relaxed.

## Observed local validation

- Before the component repair, the Dr. Ai suite ran 29 tests: 25 passed and 4 new redirect checks failed.
- After repair, the combined Dr. Ai stream, authentication feedback and session-refresh suites passed all 117 tests.
- Common-name and adjacent category/cache suites passed all 25 tests.
- Backend lint for the existing registry/repository and backend TypeScript checking passed.
- Frontend lint for the changed chat component, frontend TypeScript checking and a production build passed. All 23 pages generated.
- The root stream test is outside the frontend ESLint base path and was skipped with a warning; its Node syntax check and executable tests passed. Do not describe that skipped file as linted.
- Whitespace checks passed. Test logs are under git-ignored `herbalaifrontend/tmp/`.

## Browser-test limitation

The local build explicitly used loopback API/socket addresses, not production credentials. An anonymous-only loopback fixture started successfully, but the environment policy blocked launching the local Next production preview. No alternate launcher or policy bypass was attempted; the fixture was stopped. Therefore, post-repair real-browser confirmation is pending, not passed.

The user forgot the disposable account password and chose an existing administrator session instead. The authenticated check above completed without Gmail login, password recovery or any administrator mutation. The browser was left on the cited Balanay record for review.

## Next bounded release steps

1. Review only the existing backend registry/repository correction, new common-name test, chat redirect repair, scheduled stream test extension and this report. Preserve unrelated local changes.
2. Obtain an explicit selective publication instruction before committing/pushing this new batch. The working live branch remains `codex/readability-accessibility`; `main` remains reserved for the future VPS release.
3. After successful CI/deployment, repeat the same four live aliases and the anonymous Library-to-sign-in callback once each. Do not reimport herbs or change database titles for a search-code defect.
4. The signed-in named-Balanay answer and citation navigation passed in the existing user-selected session. Retest only the paths affected by the subsequent release; do not repeat unrelated AI conversations to consume quota. Alias-based or semantic retrieval is not proved by this named-record result.
5. Freeze a release only after these reproduced failures are resolved. Compile the defense study guide from existing project documents and verified test evidence, retaining any unresolved content/indexing or participant limitations.

Earlier semantic-index and preparation/source findings in `Docs/research/HERB_POST_HANDOFF_LIVE_AUDIT_2026-10-07.md` were not rechecked in this focused run and must not be called resolved.

## Selective release preflight — 8 October 2026

The user authorized selective publication and live retesting. Fresh remote reads found both `main` and `codex/readability-accessibility` at `88260d9`; no newer remote merge was observed or attributed to another tool. The fixes were still missing from both remote trees.

The six-file candidate was exported from that live commit into a clean directory, using only the registry, repository correction, new backend regression file, chat component, existing stream regression file and this report. It excludes unrelated UI styling, mail/authentication changes, herb content edits, migrations, credentials, local fixtures and generated artifacts.

- Dependencies were installed from the committed lockfiles. Prisma client generation, complete backend/frontend source lint, backend/frontend TypeScript checks and the frontend production build passed. All 23 pages generated.
- All 346 native frontend regressions passed, including the eight new callback checks and existing stream/session checks.
- All 1,321 non-database backend tests passed across 78 files.
- An earlier broader local run also selected 15 database-dependent suites whose names do not contain `database`; those could not connect to loopback PostgreSQL. Docker and psql were unavailable. Those failures are environment limitations, not reproduced live failures or proof of defective application code. They were not silently marked as passed.
- Fresh public catalog comparison again found 88 registry identities and 88 published catalog identities, with zero canonical-title mismatches.
- The real working-tree index was isolated from release staging. All other local changes remain outside the candidate.

The existing `codex/mvp-acceptance-ci` branch is used for the full isolated PostgreSQL CI gate before advancing the live deployment branch. No new branch, provider setting or production database mutation is needed. `main` remains unchanged for the future VPS deployment. CI success and post-deployment receipts must be recorded separately; the preflight does not claim those outcomes in advance.
