# Preparation source follow-up: official sources and social leads

Date: 2026-10-05. Local research/content/test changes only; no production content write, migration, deployment, commit or push.

## What is actually missing

A fresh read of `https://herbalaiph.vercel.app/api/herbs?limit=100` at 2026-10-05T13:19:58.034Z returned HTTP 200 and the complete 38 published identities. Twenty preparation fields still contain the same generic sentence; none is literally empty. The eighteen other fields contain specific guidance, traditional descriptions, formulation limitations or safety restrictions. This read does not inspect unpublished Neon records.

All 38 are accounted for in `PUBLISHED_HERB_PREPARATION_COVERAGE_2026-10-05.json` and `ALL_PUBLISHED_HERB_PREPARATION_AUDIT_2026-10-05.md`. Their earlier dispositions are the baseline, not a claim that today's new proposals are already live. The twenty placeholder replacements remain in canonical batch-02 and unapplied in production.

## Additional sources actually used

| Existing identity | New local result | Source and reviewed scope |
| --- | --- | --- |
| Luya, Zingiber officinale | A practical culinary Salabat method, original food-serving quantities and explicit non-treatment wording; existing clinical limitations and warnings retained | [Mark Bittman recipe reproduced by Epicurious](https://www.epicurious.com/recipes/food/views/salabat-386495): full ingredient list, yield and both cooking steps opened. Culinary source, not evidence that the drink treats nausea or is equivalent to a clinical formulation. |
| Luyang dilaw, Curcuma longa | Fresh/ground rhizome food use and leaf cooking-wrapper use; capsule/extract distinction retained | [NParks exact-species account](https://www.nparks.gov.sg/florafaunaweb/flora/1/9/1904): Food/Herb or Spice section. No medical claims elsewhere on the page imported. |
| Malunggay, Moringa oleifera | Leaf use in cooked broth/tinola, without invented leaf quantity or cooking duration; capsule-study limitations retained | [FNRI January 2014 media collection](https://fnri.dost.gov.ph/images/sources/media/jan2014.pdf): downloaded PDF pages 6–7, leaf food paragraph; page 6 rendered and visually inspected. Existing canonical identity citations establish the species. Broad all-parts edibility, raw-juice instructions and blood-sugar claims were excluded. |
| Tanglad, Cymbopogon citratus | Separate proposal: crush stalk for cooked food flavouring, distinct from standardized topical/mouth-rinse formulations | [NParks exact-species account](https://www.nparks.gov.sg/florafaunaweb/flora/1/9/1918): culinary paragraph read. Its medicinal leaf-tea, root-remedy and bath-water claims were not adopted. Earlier pilot-study review is explicitly identified as previous work, not a fresh full-text read. |
| Makabuhay, Tinospora crispa | Stronger oral-preparation exclusion: human injury was also reported after fresh-stem aqueous extracts, not only powdered products | [Cachet et al., Scientific Reports 2018 primary case abstract](https://pubmed.ncbi.nlm.nih.gov/30202067/): abstract read; identified species and human injury, not a safe-dose study. No offending preparation recipe imported. |

The three food additions are canonical batch-01 changes. Makabuhay's added preparation citation is canonical batch-02 and its coverage reference was updated. Tanglad is a non-importable research proposal in the companion JSON, not an edit to an old migration. None changes images, medicinal-use claims, evidence class, publication state, review ownership or treatment doses.

## Social-source review

[This public Reddit thread](https://www.reddit.com/r/phmoneysaving/comments/1ac7fiv/herbs_as_alternative_medicine_do_you_know_any/) was opened and relevant posts/comments read. It contains household oregano preparations, inconsistent quantities, mixed ingredients and child-use claims. No authenticated plant specimen, controlled preparation or validated dosing evidence was supplied. These instructions were not imported as medicinal guidance. A comment pointed to PITAHC; the official directory is preferable to copying a comment's regimen.

The [mixed-tea thread](https://www.reddit.com/r/tea/comments/gp09pd) was visible in search results; direct opening failed. It is recorded as search-only, not a fully reviewed recipe. Its mixed-species preparation and absorption claims were not adopted.

Three focused public Facebook searches returned no verifiable Facebook preparation post. No private feed or account was accessed, and no claim is made that all Facebook or Reddit content was scanned. Zero social-only medicinal instructions were adopted.

## Why not manufacture one recipe per plant

- Anonas fruit edibility does not clear its leaf decoction; the existing neurotoxicity and inconsistent-unit hold remains.
- Indian Heliotrope retains its oral safety exclusion. Makabuhay's fresh-stem human injury evidence reinforces its hold.
- Mabolo's NParks fruit account establishes edibility but did not provide a newly verified medicinal recipe or precise fruit-processing procedure. Its prior historical leaf description remains separately labelled.
- Gumamela's Hibiscus rosa-sinensis ointment study is not a Hibiscus sabdariffa beverage recipe or permission for a homemade ulcer application.
- Sabila's topical formulation evidence is not permission to swallow raw whole leaves or latex.
- The existing PITAHC garlic bulb/clove unit ambiguity remains unresolved; no unit was silently corrected.

The aim is a useful, sourced preparation field for every record—not an unsupported promise that every medicinal plant has a safe home-treatment recipe. Food, documented traditional use, standardized research and a reasoned safety exclusion stay distinguishable.

## Retrieval and validation observed

- Final focused command covered seven files: preparation source follow-up, preparation review, selective updater, full published coverage, preparation RAG, batch-01 and batch-02. **141 tests passed** in 6.35 seconds.
- The initial new follow-up test expected identical dosage wording for all three food entries. Malunggay correctly retained its existing lactation-dose exclusion; the test was corrected rather than changing that safety text. Final run passed.
- Named/scientific-name retrieval for all four new food descriptions sends current preparation and citation URLs into the AI context without an embedding call. Provider-failure fallback retains the stored food-versus-treatment distinction. These are isolated mocked published fixtures, not live Gemini acceptance.
- Backend `npm run build` and `npm run lint` passed. The lint command covers `src`, not the new test files.
- Eighteen database-dependent suites remain outside this local validation, including the newly authored preparation-update database suite. No local PostgreSQL transaction/concurrency pass is claimed.
- No fresh semantic vectors, SQL application, authenticated live AI answers, mobile checks or clinical clearance were produced by this follow-up.

Strict standalone TypeScript checking of the new follow-up and changed RAG tests passed, with `--strict --exactOptionalPropertyTypes` and no emit. Changed tracked-file whitespace checks passed, with Git's LF-to-CRLF notices only. Both new JSON/test files passed narrow private-key/database-password/API-key pattern and trailing-whitespace checks; this is not a comprehensive security scan.

## Next release work, without losing this research

1. Review the canonical twenty-placeholder batch and run its four isolated PostgreSQL preservation/rollback/concurrency tests in the isolated CI database. Keep demo credentials out of production.
2. Obtain a fresh full snapshot from Railway's independently confirmed Neon target, not the wrong main-checkout environment. Review the plan and retain the exclusive rollback backup before applying only existing IDs.
3. The existing selective CLI intentionally accepts only generic-baseline records. It must not be loosened to force the three already-populated batch-01 entries or Tanglad through. Prepare a separate exact-baseline, field-limited plan for those four after isolated database tests.
4. Preserve source/media/reviewer/role data and existing warnings; add field-specific citations. Use genuine nonzero embedding results before atomic updates, invalidate/expire server caches and reload client caches.
5. Verify the actual live Library preparation fields, source display and Dr. Ai named, scientific/alias and semantic retrieval, including safety withholding and provider failure. Report observed live counts separately from local proposals.
6. Resume the fifty-new-herb expansion only after the existing-library repair. That media/content queue is separate and not cleared by this follow-up.

Machine-readable source coverage, rejected social leads, inaccessible sources and the separate Tanglad proposal are in `HERB_PREPARATION_SOURCE_FOLLOW_UP_2026-10-05.json`. Source-access failures remain explicit; no incomplete PDF was used to reconstruct missing recipe quantities.
