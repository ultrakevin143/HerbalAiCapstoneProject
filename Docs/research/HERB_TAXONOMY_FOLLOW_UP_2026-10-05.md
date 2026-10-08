# Taxonomy follow-up before completing the fifty-herb queue

Date: 2026-10-05. Status: three confirmed naming-treatment discrepancies require review before import. This document does not change the queue, accepted identity or any live database record.

Latest continuation: the offline generator boundary is repaired with seven passing Python tests and now defaults to a nonwriting dry run with exclusive new-file output. Separate source mappings for Mustasa/Radish permitted provisional media selection; Kahel's historical crop concept remains on hold. No actual accepted-name or checklist-key rewrite was made. See `HERB_IDENTITY_MEDIA_PROGRESS_2026-10-05.md`; the sections below retain the earlier investigation state.

## Radish

The queue uses `Raphanus sativus`, matching its historical book heading and the earlier checklist-match result. [Kew's current entry for Raphanus sativus](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A288491-1) treats that name as a synonym of `Raphanus raphanistrum subsp. sativus`. Kew also records authorities using alternative taxonomy. This is a taxonomic-treatment discrepancy, not proof that the historical crop is unidentified or that every wild-radish image is interchangeable with cultivated radish.

The bounded iNaturalist exact-species search did not return the queue name. A follow-up must verify the accepted subspecies and its historical mapping, preserve `Raphanus sativus` as a source/synonym name, and select a photograph explicitly identified to the intended crop concept. Do not substitute a generic `Raphanus raphanistrum` photo merely because the genus/species words overlap.

## Kahel

The queue uses `Citrus aurantium`, with historical heading `Citrus Bigaradia`. [Kew's current Citrus x aurantium entry](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A59600-2) identifies `Citrus × aurantium` as an accepted hybrid and lists Philippine introduction. The omitted hybrid marker needs to be reconciled with the intended bitter-orange concept and historical synonym. A broad orange or mandarin photograph is not automatically an acceptable substitute.

The bounded iNaturalist query did not return the exact queue spelling. Check the explicit hybrid taxon and relevant infraspecific concept before selecting a photo. No differently named API taxon was automatically accepted.

## Mustasa

The queue and exact iNaturalist observation search use `Brassica juncea`. [Kew's current entry](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77354001-1) accepts `× Brassarda juncea` and records `Brassica × juncea` as a homotypic synonym; its accepted combination was published in 2024. Other botanical descriptions still use the older genus treatment. This discrepancy was discovered during the second-ten photo review, not silently resolved by renaming the queue.

Two individually CC0 photographs downloaded and decoded, but neither is upload-cleared: the clearer flower photograph remains on a taxonomy hold. Reconcile the historical heading, checklist identifier, accepted nothogenus and observation concept before assigning an accepted name or publishing. Do not manufacture a replacement taxon key.

## Research-only name parser repair

The old offline research-queue schema required simple two-word species names, and its comparison kept the first two whitespace-separated tokens. Regression tests reproduced failures for separate hybrid markers and infraspecific names. The research-only module now accepts explicit named hybrids, a leading nothogenus marker and `subsp.`, `var.` or `f.` ranks. Comparison preserves rank/epithet, normalizes `ssp.` to `subsp.` and avoids collapsing a parent-cross formula into its first parent. It still does not infer taxonomic equivalence from spelling alone.

Observed validation: 24 new taxonomic tests and 69 existing focused herb tests passed together (93 total); backend TypeScript build and source ESLint passed. Coverage includes:

- Historical binomials plus authority suffixes still match recorded synonyms correctly.
- A hybrid marker does not collapse all `Citrus × ...` identities to one generic key.
- An infraspecific crop identity is not silently replaced with its broader species identity.
- Reviewed synonyms, accepted taxon identifiers and source names remain distinct and auditable.
- All existing fifty-candidate, first-ten and snapshot tests continue to pass.

The three actual queue identities and accepted keys remain unchanged pending source reconciliation. The historical queue generator `scripts/build-herb-research-queue.py` still truncates inventory names to two tokens: do not regenerate a reconciled hybrid/subspecies queue with it until that separate boundary is repaired and tested. No production matching, import or database schema was altered.

The current zero-conflict result means no conflicts for the recorded queue names and supplied aliases/synonyms at the captured time. It does not clear unresolved taxonomic equivalence or prove every possible historical synonym has been checked. All candidates remain unapproved research records; no production matching code, schema, importer or deployment bootstrap was changed for this follow-up.

For Alibangbang, Kupang and Ayapana, the remaining issue is an empty qualifying-photo query, not a confirmed taxonomic discrepancy. They remain separate media-search gaps.
