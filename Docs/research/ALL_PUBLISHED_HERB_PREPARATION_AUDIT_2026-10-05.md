# All published herbs: preparation and blank-field audit

Date: 2026-10-05
Status: local content and regression tests updated; production content writes NOT performed.

## Observed scope

Read-only inspection of https://herbalaiph.vercel.app/api/herbs?limit=100 returned 38 published records. Every returned record was checked for localName, scientificName, category, medicinalUses, preparationMethod, dosage, regionFound, warnings and imageUrl. This does not inspect unpublished or archived Neon records.

Twenty live preparation fields still contain the generic placeholder. All twenty corresponding local batch-02 records now resolve preparation citations: 13 traditional/monograph descriptions, five food-only descriptions and two reasoned safety withholds. The full 38-record coverage ledger references the canonical local batch-02 proposals in PUBLISHED_HERB_PREPARATION_COVERAGE_2026-10-05.json, without duplicating their medical text. That ledger is audit data, not an auto-import manifest.

The only genuinely blank displayed field found was Kalingag's imageUrl. No required name, use, dosage, warning, category or region field was empty. A statement that no verified treatment dose exists is not permission to invent a number. Optional alias/reviewer/provenance fields were not fabricated.

## Every inspected record

| Herb | Preparation disposition | Remaining action |
| --- | --- | --- |
| Akapulko | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Ampalaya | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Anonas | SAFETY_WITHHOLD | SELECTIVE_CONTENT_UPDATE_PENDING |
| Aratiles | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Atsuete | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Bawang | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Bayabas | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Damong Maria | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Gabi | FOOD_ONLY | SELECTIVE_CONTENT_UPDATE_PENDING |
| Gumamela | RESEARCH_FORMULATION_NOT_HOME_RECIPE | RETAIN_EXISTING_PREPARATION |
| Indian Heliotrope | SAFETY_WITHHOLD | PREPARATION_SOURCE_SUPPORT_METADATA_PENDING |
| Kalingag | SOURCED_DESCRIPTION | IMAGE_PENDING_LICENSED_BOTANICAL_REVIEW |
| Kamote | FOOD_ONLY | SELECTIVE_CONTENT_UPDATE_PENDING |
| Katakataka | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Lagundi | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Langka | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Luya | RESEARCH_FORMULATION_NOT_HOME_RECIPE | RETAIN_EXISTING_PREPARATION |
| Luyang dilaw | RESEARCH_FORMULATION_NOT_HOME_RECIPE | RETAIN_EXISTING_PREPARATION |
| Mabolo | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Makabuhay | SAFETY_WITHHOLD | SELECTIVE_CONTENT_UPDATE_PENDING |
| Malunggay | RESEARCH_FORMULATION_NOT_HOME_RECIPE | RETAIN_EXISTING_PREPARATION |
| Mangosteen | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Mayana | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Niyog-niyogan | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Okra | FOOD_ONLY | SELECTIVE_CONTENT_UPDATE_PENDING |
| Oregano | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Pandan | FOOD_ONLY | SELECTIVE_CONTENT_UPDATE_PENDING |
| Sabila | RESEARCH_FORMULATION_NOT_HOME_RECIPE | RETAIN_EXISTING_PREPARATION |
| Saluyot | FOOD_ONLY | SELECTIVE_CONTENT_UPDATE_PENDING |
| Sambong | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Sibuyas | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Suha | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Takip-kohol | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |
| Tanglad | RESEARCH_FORMULATION_NOT_HOME_RECIPE | PREPARATION_SOURCE_SUPPORT_METADATA_PENDING |
| Tsaang Gubat | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Ulasimang Bato | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Yerba Buena | PITAHC_EXISTING_GUIDANCE | RETAIN_EXISTING_PREPARATION |
| Ylang-ylang | SOURCED_DESCRIPTION | SELECTIVE_CONTENT_UPDATE_PENDING |

## New source review

- [Caunca and Balinado, Cavite study](https://nopr.niscpr.res.in/bitstream/123456789/57216/3/IJTK%2020%282%29%20335-343.pdf): Table 2 rows 17 and 50 checked in extracted text and rendered PDF pages 3 and 5. No unreported recipe quantities imported.
- [Cordero and Alejandro, Ati study in Antique](https://smujo.id/biodiv/article/download/7286/4544): title and authors verified from PDF page 1; voucher HNUL0020607 and the separate external-wash row checked visually on page 10. The initial search misidentified the community as Panay Bukidnon; local wording and source metadata were corrected before final validation.
- [Smithsonian compilation](https://naturalhistory.si.edu/media/1868): printed page 113 read for Mabolo, without converting the report into clinical guidance. [Kew](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:322146-1/general-information) confirms the recorded synonym. Direct local Smithsonian PDF download returned HTTP 403; web-rendered text was available.
- [TRAMIL Anonas monograph](https://www.tramil.net/en/plant/annona-reticulata): the source's neurotoxicity cautions and inconsistent English salt units justify withholding its oral recipe. No silent unit conversion was made.
- [Tanglad pilot study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3754369/) was read through Europe PMC XML. It describes manufactured shampoo/cream formulations, not household leaf tea.
- [Indian Heliotrope review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8187075/) and existing [WHO toxin source](https://www.who.int/news-room/fact-sheets/detail/natural-toxins-in-food) support retaining the existing safety exclusion, not adding an oral recipe.
- The [current PITAHC directory](https://pitahc.gov.ph/herbs-directory/) still prints garlic quantities in bulbs. This was not silently changed to cloves. This unit needs qualified clinical clarification before independent dosing guidance is introduced.

Traditional reports, food preparation, standardized study formulations and treatment recipes remain distinct. A citation is not clinical clearance. Review gaps remain explicit; local records stay DRAFT/unverified. No medicinal efficacy upgrades were made.

## Live blockers and safe completion

The already-open Mercado Chrome Neon SQL editor was discoverable, but three documented access attempts failed to establish control. No SQL was entered or executed, no credentials were extracted, and no alternative production database was used. The public API read succeeds; it does not authorize or enable writes. Browser connectivity must be restored before any database publication.

1. Obtain a fresh, read-only database snapshot of all statuses and confirm this is Railway's actual production target. The public API alone cannot establish that.
2. Review and apply only the twenty existing IDs and intended preparation/safety/alias/source changes; preserve images, published status, comments, suggestion links and reviewer attribution. Retain a rollback snapshot. Do not insert duplicate plants or stage the separate fifty-candidate media research queue.
3. Add preparationMethod support to the existing Tanglad pilot-study source and Indian Heliotrope safety sources after field-level review. Their live references exist, but presently lack that support label.
4. Refresh relevant vectors through the normal trusted embedding path; keep existing names/identities intact. Do not claim semantic indexing is refreshed merely because a SQL text field changed.
5. Invalidate repository/API caches or allow the configured TTL to expire; verify the public responses and rendered detail view. Reload signed-in user caches when applicable.
6. Check named, stored-alias and semantic Dr. Ai retrieval against the updated live records, including provider-failure and safety cases. Current automated results use isolated published fixtures, not live Gemini.
7. Kalingag has a [licensed candidate photograph](https://commons.wikimedia.org/wiki/File:Cinnamomum_mercadoi33.jpg), but botanical visual review, attribution, Cloudinary upload and actual database assignment remain pending. No unrelated plant image was substituted.

Production deploy:bootstrap publishes both built-in manifests and imports knowledge content. It is not a selective preparation-only update and can overwrite existing fields. Do not run it blindly against the live catalog or mistake the JSON DRAFT flag for a release barrier. Existing migrations must not be edited retroactively.

## Validation

Five focused suites: 116 tests passed. Backend build and lint passed.
Strict standalone importer/test typecheck passed; whitespace checks passed (only an LF-to-CRLF notice). The broad run passed 1,028 tests across 73 files in 160.07 seconds, excluding the same 17 isolated-database suites recorded in HERB_PREPARATION_VALIDATION_2026-10-05.md. Local database/transaction tests and production write/AI smoke checks have not run. The subsequent ledger de-duplication has its own focused recheck; no runtime implementation changed after the broad run.

Earlier HERB_PREPARATION_AUDIT_2026-10-05.md checkpoints mentioning five remaining placeholders describe the prior state. This follow-up replaces that unresolved local-preparation count with zero generic placeholders, not zero safety/release gates.
