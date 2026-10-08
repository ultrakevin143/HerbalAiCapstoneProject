# Live herb completeness audit — 7 October 2026

Status: read-only audit; no database change, upload, application edit, embedding update, AI call, commit or push.

## Scope and evidence

The public full-list endpoint returned HTTP 200 with 38 records and total 38 at 2026-10-06T15:56:38.049Z (23:56 on 6 October in Manila). Browser checks and image checks finished after midnight on 7 October. This report concerns the live published catalog, not every private Herb/SuggestedHerb state or the separate fifty-candidate expansion.

All 38 full public records were inspected for core field presence, preparation wording, citations, regional-name presence, image URL and public review metadata. The public Library independently displayed “38 herbs found.” Kalingag and Indian Heliotrope detail dialogs were inspected; Kalingag's two references were expanded. This is not a claim that all 38 dialogs, all external source contents or all images were visually revalidated.

Machine-readable record matrix and image results: [audit JSON](LIVE_HERB_COMPLETENESS_2026-10-07.json).

## Results

| Check | Observed |
| --- | --- |
| Published herbs returned | 38 |
| Nonblank preferred/scientific name, category, use, preparation, dosage, region and warnings | 38/38 |
| Nonblank preparation field | 38/38 |
| At least one source explicitly tagged preparationMethod | 38/38 |
| At least one reference | 38/38 |
| Image URL present | 37/38 |
| Image HEAD returned 200 and image MIME type | 37/37 existing URLs |
| Missing image | Kalingag |
| Blank cebuanoName | 24/38 |
| Review date present | 38/38 |
| Reviewer identifier absent in public record | 37/38 |
| Duplicate exact scientific-name strings | 0 |
| Herb with repeated exact source URL | Oregano |

All records carry PUBLISHED and isVerified=true. These flags and field presence do not prove clinical effectiveness, complete source support, accurate language labels, valid photo identification or a traceable human review. Exact-string taxon uniqueness does not establish synonym-aware deduplication against private drafts.

## Preparation is present, but not always a usable household recipe

The stored preparations fall into six descriptive groups; these are audit labels, not new database classes or publication clearance:

- Official directory descriptions: 10.
- External, population-limited monograph description: Takip-kohol, 1.
- Ordinary food-use descriptions, not medicinal recipes: Gabi, Kamote, Okra, Pandan and Saluyot, 5.
- Study formulations, not reproducible home recipes: Gumamela, Luya, Luyang dilaw, Malunggay, Sabila and Tanglad, 6.
- Home preparation withheld: Anonas, Indian Heliotrope and Makabuhay, 3.
- Reported traditional practice with incomplete recipe parameters: 13.

Indian Heliotrope visibly says that no clinically validated preparation is available and the Library does not recommend preparing or consuming it. Kalingag visibly describes reported traditional preparations, explicitly not home instructions or validated human doses. These are not blank fields and must not be replaced with guessed beginner steps.

Many records describe a route or plant part but deliberately omit unsupported quantities, timing or treatment doses. The user’s desired detailed guide is therefore not fully established for all herbs. A stronger exact-species source is needed before adding missing parameters; sometimes the appropriate complete answer remains that no validated home method exists.

## Specific cleanup and evidence-review backlog

1. **Safety-sensitive alias ambiguity:** Yerba Buena's stored aliases include Hilbas; the earlier TKDL review identifies Hilbas under Artemisia vulgaris. This needs species-aware disambiguation, not recipe transfer. Saluyot is stored as Corchorus aestuans while the selected TKDL Saluyot page concerns Corchorus olitorius; retain the exact-species food limitation. See [TKDL review](TKDL_EXISTING_HERB_REVIEW_2026-10-06.md). These are previously source-checked leads, not new medicinal assertions from this API snapshot.
2. **Regional-name coverage and labelling:** 24 fields are blank. Populated fields also need language-specific provenance: Kalingag includes English “Philippine cinnamon”; Tanglad includes English “Lemongrass”; Lagundi includes Dangla; Indian Heliotrope combines many unlabelled aliases. The single cebuanoName string cannot faithfully represent all Philippine languages. A blank alias is not permission to invent one, and a broad Bis. label is not automatically a certified Cebuano translation.
3. **Photo gap:** Kalingag has no stored image. Its live detail uses the fallback, not a broken image request. All other existing URLs currently deliver image responses, but are frontend /images/herbs assets, not proof that new Cloudinary uploads were imported. No fresh 37-image botanical/licensing review was performed.
4. **Duplicate reference:** Oregano has two source rows pointing to the exact same UST URL with different support tags. Preserve the union of genuinely supported fields and any notes before a backed-up consolidation. Do not delete one row blindly.
5. **Source-to-field coverage:** preparationMethod tags now cover all 38. Missing exact tags elsewhere: identity 3 (Gumamela, Indian Heliotrope, Tanglad), medicinalUses 1 (Indian Heliotrope), dosage 26, warnings 28, regionFound 28. The matrix lists every affected record. These are coverage metadata gaps, not 26 missing numeric doses or proof that every warning lacks evidence. Several records use narrower traditionalUse/philippineRelevance/limitations tags; inspect what each source actually supports before normalising tags.
6. **Review provenance:** Only Kalingag has a reviewer identifier in this public snapshot. The other 37 have dates but no identifier. Historical/imported records may have separate review evidence; reconcile that evidence before calling them fully human-reviewed. Do not backfill imaginary reviewers.
7. **Source-unit ambiguity:** Bawang's live dosage uses bulbs. The official [PITAHC directory](https://pitahc.gov.ph/herbs-directory/) search result also uses that unit in its professional-advice wording; the direct web fetch timed out. This is not established as an application transcription bug. Confirm the intended unit with a stronger official reference before any revision or AI elaboration; do not silently substitute cloves.

The report does not certify all doses, warnings, regional occurrence claims, preparation parameters or source wording against full current originals. Presence and tag checks identify the review backlog rather than replace botanical/clinical content review.

## All-record matrix

“200” means image HTTP delivery, not identification clearance. “Present” means a regional-name string exists, not that its language is verified. Missing support tags are exact-tag gaps only.

| Herb | Stored taxon | Preparation description class | Regional-name field | Image | Sources | Missing exact support tags |
| --- | --- | --- | --- | --- | --- | --- |
| Akapulko | Senna alata | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 1 | warnings |
| Ampalaya | Momordica charantia | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 1 | warnings |
| Anonas | Annona reticulata | HOME_PREPARATION_WITHHELD | Blank | 200 | 2 | dosage, regionFound |
| Aratiles | Muntingia calabura | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Atsuete | Bixa orellana | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Bawang | Allium sativum | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 1 | warnings |
| Bayabas | Psidium guajava | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 1 | warnings |
| Damong Maria | Artemisia vulgaris | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Gabi | Colocasia esculenta | FOOD_ONLY_DESCRIPTION | Blank | 200 | 2 | dosage, warnings, regionFound |
| Gumamela | Hibiscus rosa-sinensis | STUDY_FORMULATION_NOT_HOME_RECIPE | Present; language not certified | 200 | 1 | identity, warnings, regionFound |
| Indian Heliotrope | Heliotropium indicum | HOME_PREPARATION_WITHHELD | Present; language not certified | 200 | 2 | identity, medicinalUses, dosage, regionFound |
| Kalingag | Cinnamomum mercadoi | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Present; language not certified | Missing | 2 | dosage, regionFound |
| Kamote | Ipomoea batatas | FOOD_ONLY_DESCRIPTION | Blank | 200 | 2 | dosage, warnings, regionFound |
| Katakataka | Kalanchoe pinnata | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Lagundi | Vitex negundo | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 1 | warnings |
| Langka | Artocarpus heterophyllus | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Luya | Zingiber officinale | STUDY_FORMULATION_NOT_HOME_RECIPE | Blank | 200 | 4 | dosage, regionFound |
| Luyang dilaw | Curcuma longa | STUDY_FORMULATION_NOT_HOME_RECIPE | Blank | 200 | 4 | dosage, regionFound |
| Mabolo | Diospyros blancoi | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Makabuhay | Tinospora crispa | HOME_PREPARATION_WITHHELD | Blank | 200 | 4 | dosage, regionFound |
| Malunggay | Moringa oleifera | STUDY_FORMULATION_NOT_HOME_RECIPE | Blank | 200 | 4 | dosage, regionFound |
| Mangosteen | Garcinia mangostana | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 3 | dosage, regionFound |
| Mayana | Coleus scutellarioides | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Niyog-niyogan | Combretum indicum | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 2 | warnings |
| Okra | Abelmoschus esculentus | FOOD_ONLY_DESCRIPTION | Blank | 200 | 2 | dosage, warnings, regionFound |
| Oregano | Coleus amboinicus | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Pandan | Pandanus amaryllifolius | FOOD_ONLY_DESCRIPTION | Blank | 200 | 2 | dosage, warnings, regionFound |
| Sabila | Aloe vera | STUDY_FORMULATION_NOT_HOME_RECIPE | Blank | 200 | 4 | dosage, regionFound |
| Saluyot | Corchorus aestuans | FOOD_ONLY_DESCRIPTION | Blank | 200 | 2 | dosage, warnings, regionFound |
| Sambong | Blumea balsamifera | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 1 | warnings |
| Sibuyas | Allium cepa | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Suha | Citrus maxima | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |
| Takip-kohol | Centella asiatica | EXTERNAL_MONOGRAPH_LIMITED_DESCRIPTION | Blank | 200 | 2 | regionFound |
| Tanglad | Cymbopogon citratus | STUDY_FORMULATION_NOT_HOME_RECIPE | Present; language not certified | 200 | 2 | identity, dosage, warnings, regionFound |
| Tsaang Gubat | Ehretia microphylla | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 2 | warnings |
| Ulasimang Bato | Peperomia pellucida | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 1 | warnings |
| Yerba Buena | Mentha × villosa | OFFICIAL_DIRECTORY_DESCRIPTION | Present; language not certified | 200 | 2 | warnings |
| Ylang-ylang | Cananga odorata | REPORTED_TRADITIONAL_PRACTICE_NOT_COMPLETE_RECIPE | Blank | 200 | 2 | dosage, warnings, regionFound |

## What happened to the requested fifty new herbs?

The fifty-candidate expansion remains separate held research, not fifty new public records. The prior StuartXchange review records 48 method leads and two held identity/source mismatches, with zero publication clearance. Its descriptions do not automatically become safe home recipes. The earlier release audit records incomplete content drafts and missing selected covers; that is an earlier checkpoint, not a fresh private Neon/Cloudinary audit here. See [StuartXchange review](STUARTXCHANGE_FIFTY_PREPARATION_REVIEW_2026-10-06.md) and [fifty-candidate release audit](HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.md).

## Validation observed

- Local Node assertions passed for unique IDs, derived counts, all-record classifications, exact source-tag gaps, image-to-record ownership and read-only boundaries.
- `npm test -- tests/herb-preparation-public-review.test.ts tests/herb-preparation-rag.test.ts`: 75 tests passed across two files, exit 0. These are local automated checks, not live AI-provider or medical-efficacy tests.
- Both new report files passed Git whitespace inspection with no whitespace diagnostics. `git diff --no-index --check` returned 1 because each new file differs from NUL; Git also reported normal LF-to-CRLF conversion warnings.
- No live content changed. Missing image, alias provenance, source support and review provenance remain open; test success does not close those editorial gaps.

## Next repair order

1. Resolve safety-sensitive alias/taxon ambiguity and source-specific identity gaps.
2. Review warning support and dose/population limitations, preserving unavailable human doses.
3. Consolidate Oregano's reference, add a cleared Kalingag image and retain genuine review provenance.
4. Add only source-confirmed language-tagged names and preparation details.
5. Review a small complete new-herb batch against all private database states before any idempotent import.
6. After approved content changes, refresh embeddings and run bounded retrieval checks. This audit made no AI-provider calls and does not newly prove embedding completeness.

Any future live write needs a reviewed field diff, exact database target, recovery snapshot, safe claim wording, source ownership and post-write public comparison. Nothing in this report was written to production.
