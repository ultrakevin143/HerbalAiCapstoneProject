# Dr. Ai conversation help — 2026-10-06

## Scope and release status

The user reported that the child-related Lagundi conversation repeated a refusal instead of providing useful help. They then requested a different conversation and limited live requests to avoid exhausting Gemini quota.

This repair is local and uncommitted. No Git push, provider deployment, database update, credential change, new herb publication, or frontend styling change was performed. The live checks below describe the existing deployment, not the repaired code.

Reviewed production-code scope: `herbalaibackend/src/services/ai/chat/ask-ai-service.ts`, `herbalaibackend/src/services/ai/chat/conversation-context.ts` and `herbalaibackend/src/controllers/chat.controller.ts`. Regression suites: `herbalaibackend/tests/pediatric-conversation-help.test.ts` and `herbalaibackend/tests/chat-conversation-history.test.ts`. Unrelated working-tree changes were preserved.

## Observed live behavior

The connected Chrome conversation visibly contained:

1. `Educational safety QA: what Lagundi preparation and dose could be given to a 4-year-old child?`
2. `Then walk me through its preparation step by step.`

Both replies used the same short child-use refusal. This was a completed response, not an indefinitely loading request. Child-specific recipe/dose withholding was intentional; unhelpful repetition was the defect.

One additional prompt was submitted to that conversation: `Educational QA follow-up: Then explain its preparation again, without adding missing details.` The completed answer said no verified source was found and displayed no Lagundi citation. The input became enabled again. This reproduced loss of the named herb after more than one follow-up. It did not demonstrate unsafe generated instructions on live.

After the user's request to try another conversation, a separate new Chrome chat received exactly two questions:

- `What is the scientific name of Bayabas in the Library? Please give its botanical identity, not a treatment or dosage.` The answer identified `Psidium guajava`, cited Bayabas, and completed.
- `Which sources document it? List the reference titles from the Library, without a recipe or dose.` The answer retained Bayabas and listed the PITAHC Directory of Herbs references. The input became enabled again.

Total new live prompts in the initial live review: **3**, including **2** in the separate Bayabas conversation. No load test, repeated prompt loop, quota bypass, or deliberate production failure was attempted. No rate-limit error appeared in the observed replies; this is not evidence of unlimited provider quota. All automated regression cases below use mocked providers, not Gemini requests.

The completed Bayabas transcript and screenshot are saved outside Git under `C:\Users\Hp\.codex\tmp\dr-ai-help-review-20261006-1791280422090`. An initial screenshot attempt stalled; the recovered tab supplied a screenshot through its documented screenshot API without sending another AI question.

## Root causes and focused repair

1. **Bare refusal:** the deterministic pediatric response only refused preparation/dose advice. It now supplies the retrieved plant identity and recorded reference titles, explains that general preparations are not individual child-safety assessments, and offers botanical/source help and clinician-reviewed Library inspection. It does not copy raw recipe, dosage, FAQ-answer, or warning fields into the child reply.
2. **One-turn context loss:** herb attribution and pediatric context inspected only the most recent user question. They now follow a contiguous chain of referential user turns within the supplied history, ignoring assistant text and stopping at unrelated topics or ambiguous multi-herb references. The guard remains active for subsequent child-related follow-ups. A clearly separate adult preparation question can start an adult topic; merely mentioning an adult dose for the previously discussed child cannot.
3. **Unused FAQ citations:** pediatric answers advertised preparation FAQs even though those answers were withheld. Known-herb pediatric retrieval now skips that FAQ lookup and exposes only the herb record used for identity/reference information. Semantic pediatric replies likewise omit unused FAQ source chips and counts.

This is bounded conversational handling, not persistent patient-state storage or a guarantee that regex classification understands every possible language, ambiguous pronoun, or arbitrary topic transition. The controller still returns at most six turns; the continuation repair below retains a child-context anchor within that limit. No browser-specific authentication behavior was changed.

## Validation actually performed

- Initial red run: **10 failed, 4 passed** in the first 14 regression cases. Failures demonstrated missing helpful identity/reference content, repeated first/follow-up answers, and multi-turn attribution/context loss.
- After repair: the focused working-tree AI suite passed **254 tests across 11 files**, including controller cancellation, provider errors, grounding, source attribution, pediatric boundaries, and model fallback tests. Later unknown-topic controls were additionally included in the clean suite below.
- Clean release review used a `git archive` of `b83b5182b188352676cc56a05e93960dd11cc0a7`, overlaid with only the reviewed service and new test file. Dependencies were reused through an external junction; unrelated dirty code, content and research files were not overlaid.
- Clean non-database suite: **75 files, 1,176 tests passed**. The **19 new cases** include a real loopback Express/validator/controller JSON-to-SSE three-turn exchange with mocked repositories/providers. This tests actual controller history and streaming frames; it is **not** an authentication or real-Gemini integration test.
- Clean backend build, source ESLint, new-test ESLint, and strict new-test TypeScript check all exited **0**.
- Focused `git diff --check` passed. The Git staging index remained empty.

For local tests, database URLs were explicitly set to an unreachable loopback fixture, dotenv loading disabled, and the Gemini key blank. Twenty native/mixed database test files were explicitly excluded from the broad local run: account-recovery, audited-mutations, auth, chat, forum-moderation-flow, herb-catalog-remediation, herb-comments-http, herb-governance, knowledge-authenticated-flow, herbs, message-authenticated-flow, profile, review-publication-transaction, session-rotation, suggestion-validation, system-features, herb-comments-database, password-settings-database, herb-preparation-update-database and herb-preparation-source-tag-release-database. These exclusions are not claimed as passed database gates.

## Remaining release steps

Review and release only this three-production-file/two-test/document bundle if requested, run the required isolated PostgreSQL CI on the reviewed branch, and then perform a small post-deployment acceptance conversation. The improved child response has **not** been verified on live because it has not been deployed. Do not repeatedly retest Gemini or publish unsupported child instructions merely to satisfy a preparation request.

## Continuation: conversation edge cases — 2026-10-06

No additional live AI questions were sent during this continuation. All provider and repository calls in its tests were mocked.

Additional reproduced defects and repairs:

1. Named preparation/dosage follow-ups could break the remembered child context. Clinical questions now preserve that context even without a pronoun.
2. An adult-guide request still referring to `him`, `her` or `them` could incorrectly reset the patient context. Such wording no longer starts a separate adult topic. A clearly separate adult question still can, with a regression control.
3. Semantic child retrieval could advertise an empty identity/reference confirmation when only withheld FAQ material matched, or let that unused FAQ displace a useful herb record. Pediatric semantic retrieval now skips FAQ lookup entirely; no matched herb means no claimed herb/reference confirmation.
4. Named botanical/reference questions could erase the child context before the next dosage question. These factual questions now preserve patient context without inventing an inherited plant across an unrelated unknown-species query.
5. After enough replies, the six-turn controller window dropped the original child question. Shared bounded history selection now retains the latest explicit child question and its model reply plus the latest two pairs while that context is active. It restores ordinary recent history after a separate adult/unrelated topic, leaves the caller history unchanged and does not increase API limits.

Observed validation:

- Seven added context/semantic cases initially failed; the repaired focused suite passed. The long-conversation controller case subsequently failed before repair, and two added named-factual controls also failed before repair.
- Final focused AI suite: **275 tests across 12 files passed**. The two new suites contain **38 cases** (29 service/controller cases and 9 bounded-history cases).
- A real loopback Express/validator/controller conversation alternates JSON and SSE and continues past the six-turn window. Child-context anchoring and deterministic safe help persist without provider generation. This is not a real-authentication or real-Gemini integration test.
- Clean baseline plus only the five reviewed code/test files: **1,195 tests across 76 backend files passed**, with the same 20 native/mixed database exclusions above.
- Clean backend build, source ESLint, new-test ESLint and strict TypeScript checks exited **0**.
- Existing frontend streaming/recovery regressions: **21 passed**, covering bounded waits, cancellation, malformed frames, session refresh, composer unlocking and draft preservation. No frontend file was changed.

The clean review used unreachable loopback database URLs, disabled dotenv loading and a blank Gemini key. Docker/PostgreSQL tooling is absent locally; native database gates remain unverified for this pending bundle. There was no production database write, schema change, live quota stress, credential change, deployment or commit. The original live evidence above still describes the unrepaired deployed release.

## Next-work batch completed locally — 2026-10-06

The user authorized continuing the next work while away. This batch remained within the same three production files and two regression files, preserved unrelated changes and sent **zero additional live AI prompts**.

### Reproduced failures and focused repairs

1. **Long answers broke the next request.** Three new history cases initially failed: a model turn exceeded 8,000 characters, individually valid turns exceeded the 24,000-character aggregate budget, and reserving a large child-context anchor plus the current pair also exceeded that budget. Both transport paths used the same unbounded append operation. History now honors all existing turn/count/aggregate limits, removes whole older pairs when needed and prioritizes the latest pair plus the active child question. Oversized historical model text, or an anchor reply that cannot fit, is replaced with an explicit omission notice rather than an invented summary or a cut-off medical instruction. The full JSON answer and streamed display text are unchanged. Two real loopback controller cases prove that a full long answer is returned and the returned history can be submitted successfully for the next question.
2. **Interrupted/empty generation was misreported.** Before repair, a stream that emitted partial text and then failed appended a fallback, emitted `done` and committed only the fallback as history. The displayed answer and stored conversation therefore disagreed. The service now propagates a generic failure after partial content; the controller emits `error`, not `done`, so the existing frontend failure path can restore the draft without committing failed model history. Failure before any content still uses the recorded fallback. Blank JSON replies and empty/whitespace-only streams also use that fallback instead of presenting a successful blank answer. Seven controls were added; the first red run showed five failures. The whitespace-array fixture was corrected to use object parameters so it actually iterates the intended chunks.
3. **Every numeric age was treated as pediatric, but plural years were missed.** Ten cases initially failed in a 71-case combined run. A `24-year-old` preparation question received a child refusal, while `17 years old` bypassed the deterministic child branch. Numeric ages are now parsed in years/months, with under-18 classification for this software guard; explicit child words still take precedence. A clearly separate `for a 24-year-old` question can reset the topic, but an adult-age request referring to the same `him`, `her` or `them` cannot. The regression matrix also covers the 18-year boundary, month ages, `yo`, `y/o`, `mo` and `taong gulang`. This is conversational classification, not a claim that a preparation is medically suitable at any particular age.

### Final combined validation

- Focused six-file AI/controller suite: **134 passed**.
- The two new regression files now contain **71 passing cases**: 40 service/controller cases and 31 context/history cases.
- Fresh clean-baseline review overlaid with only the five intended code/test files: **1,228 tests across 76 backend files passed**. The same 20 database files remained explicitly excluded; they were not run against production.
- Clean backend build, source ESLint, new-test ESLint and strict new-test TypeScript checks all exited **0**.
- Existing frontend stream/session/draft recovery checks reran: **21 passed**. No frontend styling or component file was edited.
- SHA-256 comparisons confirmed that all five working-tree code/test files exactly matched the clean tested copies. Focused `git diff --check` passed; the staging index was empty and HEAD remained `b83b5182b188352676cc56a05e93960dd11cc0a7`.

No new live result is claimed for these fixes. There was no Git commit/push, deployment, live database mutation, outgoing verification/reset email, credential change or provider-quota load test. Native PostgreSQL CI, release review and a small post-deployment smoke conversation remain the next publication gates.

### Prepared publication sequence

1. Review only the three production files, two tests and this report; do not include unrelated auth/mail work, research drafts, content expansion, local fixtures or credentials.
2. Run isolated PostgreSQL CI for the exact reviewed candidate when a CI-branch commit/push is authorized. Do not use live Neon as a test fixture.
3. Release that exact passing candidate only when publication is authorized; verify provider health and release identifiers.
4. Run a small, spaced live acceptance conversation covering a botanical/source follow-up and an explicitly separate adult question. Do not induce a production outage or stress Gemini to test the mocked failure cases.
5. Record observed release results separately from local results. Do not count physical-device or participant acceptance checks that were not performed.

## Authorized release execution — 2026-10-06

After the local review, the user requested proceeding with release validation, deployment after CI success and a small live acceptance check. This section supersedes the earlier local-only status only as each release gate is actually observed.

Pre-push review confirmed:

- All five production/test files still match the clean candidate that passed 1,228 non-database backend tests and 21 frontend recovery checks.
- Only those five files and this report are intended for the commit. The unrelated working-tree workflow, auth/mail, frontend, content and research changes remain excluded.
- The focused credential-pattern scan found no suspected secret in the intended bundle. The Git index was empty before selective staging.
- The CI branch and deployment branch both still pointed to `b83b5182b188352676cc56a05e93960dd11cc0a7`; `main` remained `95cf80761106f95ea4faaca0437fb4ddc348896f`.
- CI uses an isolated GitHub Actions PostgreSQL/pgvector service. No live Neon test database, environment-variable change, migration change or new herb publication is part of this release.

CI results, release identifiers and live observations will be recorded only after they are available. Production publication is conditional on successful checks for this exact candidate.
