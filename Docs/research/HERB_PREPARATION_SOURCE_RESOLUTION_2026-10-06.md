# Preparation citation-gap resolution — October 6, 2026

This follow-up resolves the three specific source-attribution/retrieval gaps in the previous live review. It edits the local existing twenty-record DRAFT batch and tests; it does not publish plants, change the live database or assign clinical approval.

## Sources recovered and reviewed

Both exact URLs returned **HTTP 200** through bounded direct source requests even though the web-reading tool had returned errors. Their original downloaded bytes are retained outside Git, with actual timestamp, type, size and SHA-256 in the JSON companion. A tool timeout was not misreported as a broken source.

- **UST Philippine Oregano:** the exact `Coleus amboinicus` account and leaf-juice/infusion text were reread. Its ordinary botanical description supplies no standardized preparation duration, water quantity or clinically validated treatment dose. The canonical access date and retrieval note now record October 6; broader efficacy/postpartum claims were not adopted. [UST plant account](https://www.ust.edu.ph/ust-manila-plant-databse/oregano/).
- **Cavite survey:** the fresh 538,761-byte publisher PDF exactly matches the retained original SHA-256 `4d3872b8d67196da53882d22fd8a799a53d9b201068543e22981fdc74beeb511`. Its nine pages open with pypdf. Survey methods and Table 2 rows 17/50 were reviewed; the retained original renderings of printed pages 337/339 were visually checked. Langka is leaf crushing/external; Mangosteen is leaf decoction/internal with reported fever/dengue use. This is an interview survey, not a validated treatment recipe or clinical trial. The source's printed `Garcinia x mangostana` notation remains explicit. The actual title was corrected from a running-header paraphrase. [Publisher PDF](https://nopr.niscpr.res.in/bitstream/123456789/57216/3/IJTK%2020%282%29%20335-343.pdf).
- **WHO safety attribution:** Key facts, Symptoms and Diagnostics/treatment were read. Official care guidance supports the no-delay and severe-symptom warning. It does not support a Mangosteen preparation, dose or efficacy claim. [WHO dengue fact sheet](https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue).

The preferred PDF renderer package `fitz` was absent; existing rendered pages and the available pypdf reader were used. Nothing was installed and no missing page was reconstructed.

## Focused repair

The Mangosteen warning now separates the survey's evidentiary limits from WHO medical-care guidance. Its previously empty warning mapping now references both the exact-species survey and WHO. WHO is mapped **only to warnings**, not preparation or dosage. The updater can now include this sourced warning instead of correctly excluding its earlier unmapped version.

No preparation text, treatment quantity, dosage, species name, photo, regional name, medicinal-use text or publication/reviewer field was changed by this repair. The canonical batch remains DRAFT with no assigned reviewer or publication promotion. Other unsupported warning changes continue to be excluded by the existing updater rules.

Public-field review revision 2 preserves the first review's hash, count summary and findings as history. Its current proposal has **20 preparation descriptions, one sourced dosage change, four sourced warning changes and 22 proposed source additions**; zero differing proposed fields remain excluded for missing mappings at this checkpoint. The classification remains twelve reported traditional-use descriptions, five food-only descriptions, two oral-preparation holds and one pharmacopoeial external-use reference—not twenty safe home-treatment recipes.

The artifact still says `PUBLIC_FIELD_REVIEW_ONLY_NOT_AN_EXECUTABLE_PLAN`, refuses application/publication, and records the absent private embedding backup. No original vector is fabricated.

## Validation and observed failures

- **196 tests passed across seven focused suites**, 8.30 seconds. Five new cases check warning attribution, selective plan support, current embedding text, local/scientific-name retrieval and provider-failure preservation. The RAG fixture now carries preparation, dosage and warning references with their true field scopes.
- Strict TypeScript with exact optional fields and unchecked-index protection passed for all five changed test files. Explicit ESLint passed for them. Missing source fixtures now fail explicitly rather than silently producing reference objects without URLs. One pre-existing multiline invocation was reformatted to satisfy the explicit lint check; behavior was unchanged.
- Backend build and source lint passed.
- The first default-parallel broad run had **1,230 passes and four failures**. One real regression in the test expectation assumed the university source was still reviewed October 5. The expectation now reflects the observed October 6 date for UST, Cavite and WHO, while retaining October 5 for the unchanged Tinospora source; no evidence was backdated to make it pass.
- Three other checks hit process/timing limits under default parallelism: isolated Prisma-config import, occupied-port startup and the 90ms chat-cancellation harness. The first two passed their original checks in a separate one-worker run (**39 tests**, 29.06 seconds). No timeout or production authentication/cancellation behavior was changed.
- The full non-database rerun with **two workers passed all 1,234 tests across 88 files**, 135.11 seconds, including the unchanged startup, isolated-runner and chat-cancellation checks. This is local dirty-working-tree evidence, not a clean release snapshot or new remote CI result.
- The final source-date test/guard version separately passed **nine tests**, 1.14 seconds, plus its strict TypeScript and ESLint.
- Eighteen PostgreSQL-dependent suites remained excluded locally. The earlier remote SQL pass on 3776993 remains historical evidence; no new remote CI or live Gemini acceptance is claimed. Default-worker load sensitivity remains recorded rather than being declared a proven runtime fault or silently hidden.

A final public read at **2026-10-06T01:54:47.483Z** still returned **38 published herbs and twenty generic preparations**, HTTP 200; all 38 identities matched the earlier SQL identity snapshot. This proves the local repair has not changed live content, not that new preparations are already available.

## Saved state and next work

Evidence: `HERB_PREPARATION_SOURCE_RESOLUTION_2026-10-06.json` and revision 2 of `HERB_PREPARATION_PUBLIC_FIELD_REVIEW_2026-10-06.json`. Raw source bytes remain outside Git. No credential, provider variable, live image/vector, commit or push was changed; unrelated auth/mail/UI/workflow/fifty-candidate work remains untouched.

1. Review the changed local batch and its new source scopes as part of the intended release bundle; do not reuse the previous batch or plan digest.
2. Take a fresh complete original-record/source/embedding recovery snapshot on the independently confirmed intended target, with an exclusive backup physically outside Git. The public preview and identity-only snapshot are not substitutes.
3. Review the fresh bounded executable plan and active reviewer; generate genuine accepted-field embeddings. The fifteen-minute plan window requires fresh preparation when ready.
4. Apply only the separately reviewed guarded existing-record update, never the broad bootstrap. Preserve media, identities, reviewer metadata and existing sources; retain audit/recovery evidence.
5. Inspect all affected live Library preparations, warnings, citations, preserved images, cache refresh and Dr. Ai local/scientific-name responses. These post-application outcomes remain unrun.
6. Keep the fifty-new-record taxonomy, four method gaps, thirteen media holds and transactional staging/publication work separate.

No physical-device or participant evidence was manufactured. The user's requested one-percent usage pause threshold had not been reached at the observed limit check (23 percent primary remaining).
