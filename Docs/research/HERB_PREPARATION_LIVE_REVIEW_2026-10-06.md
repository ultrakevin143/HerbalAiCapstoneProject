# Live preparation release review — October 6, 2026

## Newer source-resolution follow-up

`HERB_PREPARATION_SOURCE_RESOLUTION_2026-10-06.md` supersedes the unresolved citation/transport findings below, preserving them as history. Direct HTTP recovered the exact UST and Cavite sources; source text/table rows and matching original PDF bytes were reviewed. The local Mangosteen warning now maps the survey and official WHO care guidance separately; WHO is not preparation/dose/efficacy support. Public-field revision 2 proposes twenty descriptions, one dosage, four warnings and 22 source additions, with zero unmapped differing fields. Five new cases and the 196-test focused run passed. The initial default-parallel broad run found one outdated date expectation and three timing/process failures; corrected date assertions and a full two-worker rerun passed all 1,234 non-database tests. Strict changed-test checks, explicit lint, backend build/lint and the final nine-date-test rerun passed. No new remote SQL CI or live update is claimed; live still has 38 herbs and twenty generic preparations. Recovery backup, genuine vectors, reviewed guarded application and post-update Library/Dr. Ai checks remain next.

This is a read-only existing-record review, not a production release, a clinical approval or a fifty-new-herb import. The reviewed software remains on CI branch `codex/mvp-acceptance-ci` at `3776993e80134816b0b147157a44f4e003ea316a`. This continuation created local evidence/tests only; it made no commit, push, provider-variable change, live content write, image assignment or embedding regeneration.

## Fresh provider and database target

Fresh Chrome provider tabs worked, although the original Railway tab timed out. The running Railway service was Online. Its private database value was inspected only to compare non-secret hostname/database metadata, then re-hidden. The configured pooled hostname matches Neon compute `ep-icy-sound-aqfe958d` and database `neondb` on branch `br-still-waterfall-aqtagztm`, named `pre-railway-deploy-2026-09-20`. No credential was copied into Git, chat, an environment file or the report.

A new Neon SQL Editor query preserved the existing editor draft. One SELECT-only JSON aggregate captured all Herb and SuggestedHerb identity rows at **2026-10-06T01:14:23.988856+00:00**. The result was one JSON row containing **38 herbs and 17 suggestions**, not a one-record catalog. Counts, table-qualified unique IDs and column completeness were validated. No User records were queried.

Evidence: `NEON_HERB_IDENTITY_SNAPSHOT_2026-10-06.json`. This supersedes earlier unconfirmed-target/browser-timeout statements only for this observed checkpoint. The wrong primary-checkout environment remains unsuitable; no local database credential was replaced.

## Complete recorded-name comparison

The existing review helper compared all **50** unchanged research candidates against all **55** captured plant identities, including both Approved and Rejected suggestions and all recorded herb states. Stored scientific names, source scientific names and regional aliases split on commas/slashes were included. Result: **zero conflicts against those recorded identities**.

This is not exhaustive reconciliation of every botanical synonym or a concurrent staging pass. Fresh transactional checks remain required before an eventual import. The Kalingag Approved suggestion and its one published herb are expected separate table records. Legacy Approved suggestion 3 (`awdsawd / awds`) has no matching published herb in this snapshot; it was left untouched and remains a separate moderation-history review, not a new preparation defect.

## Live public catalog and twenty-record diff

The public API read completed at **2026-10-06T01:23:53.919Z**, HTTP 200, with pagination completeness verified: **38 of 38** published herbs, **20** exact generic preparation sentences, **zero** blank preparations. All 38 public identities matched the selected database snapshot, including source/regional names, publication status and verified state.

The generic sentence remains `No clinically validated home preparation is provided in this entry.` All twenty batch-02 IDs/scientific/local identities match that exact live baseline. No proposed preparation has been applied yet.

Evidence: `HERB_PREPARATION_PUBLIC_FIELD_REVIEW_2026-10-06.json` explicitly carries `PUBLIC_FIELD_REVIEW_ONLY_NOT_AN_EXECUTABLE_PLAN`, `applyAllowed=false` and `publicationAllowed=false`. The executable plan schema rejects it. The public API omits embedding; the review records that omission rather than fabricating an original vector or claiming recovery-backup completeness.

Proposed field scope under the existing updater rules:

- **20 preparation descriptions**, **one sourced dosage change**, **three sourced warning changes**, **21 proposed source additions**; these are not live update/insert counts.
- Description classes: **12 reported traditional-use descriptions**, **five food-only descriptions**, **two withheld oral preparations**, **one pharmacopoeial external traditional-use reference**. This is not twenty approved household recipes.
- Existing source rows remain append-only. Public identity, names, medicinal-use/category text, regional data, media/licence fields, publication/verification state and reviewer metadata are captured as protected values and are not proposed for replacement.
- Each record retains its explicit review gaps. No new plant ID, publication transition, automatic seed/bootstrap or photo replacement is included.

| Herb | Description classification | Proposed changed fields | Source keys |
| --- | --- | --- | --- |
| Oregano | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | ust-oregano |
| Takip-kohol | PHARMACOPOEIAL_EXTERNAL_TRADITIONAL_USE | preparationMethod, dosage, warnings | ema-centella-2022 |
| Mayana | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | la-union-preparations |
| Okra | FOOD_ONLY_DESCRIPTION | preparationMethod | nparks-okra-food |
| Sibuyas | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | loboc-preparations-2026 |
| Anonas | ORAL_PREPARATION_WITHHELD | preparationMethod, warnings | tramil-anonas |
| Damong Maria | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | ayta-preparations-2018 |
| Langka | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | cavite-preparations-2021 |
| Atsuete | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | ayta-preparations-2018 |
| Ylang-ylang | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | manobo-preparations-2020 |
| Suha | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | panay-preparations-2021 |
| Gabi | FOOD_ONLY_DESCRIPTION | preparationMethod | nparks-gabi-food |
| Saluyot | FOOD_ONLY_DESCRIPTION | preparationMethod | prosea-saluyot-food |
| Mabolo | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | smithsonian-mabolo-2004 |
| Mangosteen | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | cavite-preparations-2021 |
| Kamote | FOOD_ONLY_DESCRIPTION | preparationMethod | la-union-preparations |
| Katakataka | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | tkdl-katakataka |
| Aratiles | REPORTED_TRADITIONAL_USE_NOT_VALIDATED | preparationMethod | ayta-preparations-2018 |
| Pandan | FOOD_ONLY_DESCRIPTION | preparationMethod | nnc-pandan-food |
| Makabuhay | ORAL_PREPARATION_WITHHELD | preparationMethod, warnings | tinospora-hepatitis-2014, tinospora-hepatitis-2018 |

## Findings and targeted primary-source rechecks

**Mangosteen warning mapping remains an editorial hold.** Its stronger local warning differs from live, but `fieldSources.warnings` is empty. The selective updater correctly preserves the original warning rather than silently applying an unattributed replacement. The public-field review identifies the excluded text explicitly. Independently review/map each changed warning claim, or explicitly review preservation of the existing warning, before accepting the final executable plan. A WHO follow-up page was retrieved as a possible safety source, not imported or counted as adopted attribution: [WHO dengue fact sheet](https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue).

Targeted rechecks, not a fresh verification of every source:

- The Centella reference retains pharmacopoeial material and external/adult restrictions; its classification is traditional use, not well-established efficacy or permission to substitute garden plants. Sections 2 and 4.1–4.6 were reread. [EMA monograph](https://www.ema.europa.eu/en/documents/herbal-monograph/european-union-herbal-monograph-centella-asiatica-l-urb-herba-revision-1_en.pdf).
- The fresh-stem Tinospora case supports keeping the oral-preparation hold, without deriving a safe dose or injury frequency from a case report. [Primary case-report abstract](https://pubmed.ncbi.nlm.nih.gov/30202067/).
- The Annona page still describes a decoction alongside prolonged-use neurological cautions and pregnancy/breastfeeding/child exclusions. Its English salt-unit inconsistency was not silently corrected; no recipe was imported. [TRAMIL species account](https://www.tramil.net/en/plant/annona-reticulata).
- The web tool returned Internal Error for the exact UST Oregano page and Cavite PDF. This is a **retrieval limitation**, not proof of an offline/broken source or a new full-text pass. Reopen the original primary pages or verify the retained source bytes before fresh editorial clearance. Previously recorded review history was not rewritten.

## Validation observed this continuation

- **26 new evidence/guard contracts passed**, including all twenty individual field/source-preservation checks, snapshot completeness/target consistency, all-state duplicate recomputation, an injected source-synonym conflict, and refusal to treat public evidence as an executable plan.
- **108 tests passed across four focused suites**, duration **5.45 seconds**: public review, expansion identity review, preparation release and preparation update.
- Strict standalone TypeScript checking and explicit ESLint for the new test passed. The first test attempt had an authoring parse error from extra closing parentheses; it was repaired before the successful run. No production defect or remote CI rerun is inferred from that test-file error.
- Tests used an unused loopback database URL and empty Gemini key; no database connection or provider generation was needed.
- Existing full isolated PostgreSQL/CI evidence remains the prior 3776993 result: 1,161 backend tests, including all eight updater SQL cases, and frontend checks passed. This new documentation/test is local and is not part of that already-pushed SHA.
- The real staging index remained empty and HEAD unchanged. Unrelated auth/mail/UI/workflow/fifty-candidate changes were preserved. Working-tree whitespace checking passed with existing LF/CRLF warnings, not content errors.

## Next work, in order

1. Resolve the Mangosteen warning-attribution decision and the targeted primary-source retrieval limitations. Independently review the risk-sensitive proposals; source descriptors and software tests are not blanket clinical clearance.
2. On the independently confirmed intended target, use the guarded prepare path to capture fresh complete original rows, source records and real original embeddings; retain an exclusive recoverable backup physically outside Git. This public-field review/identity snapshot cannot substitute for it.
3. Review the fresh executable plan/digest and active reviewer. Generate genuine accepted-field embeddings; do not fill missing values with fake vectors. Plan freshness is bounded to fifteen minutes, so obtain a new snapshot when actually ready.
4. Apply only a separately authorized, guarded existing-record transaction; preserve source/media/reviewer fields and retain its audit and recovery evidence. No broad bootstrap or fifty-candidate import.
5. After application, inspect every affected Library entry/source/warning, preserved photo, search/category/caches and Dr. Ai local/scientific-name retrieval. These new live outcomes remain **unrun**.
6. Resume the separate fifty-candidate taxonomy, four method gaps, thirteen media holds and safe staging/publication gates. All-state recorded-name comparison is now observed, but import race protection and independent taxonomy/clinical/media clearance are not completed.

Physical-device and real-participant UAT evidence was not created by these read-only checks. Previously deferred participant work is not counted as a pass.
