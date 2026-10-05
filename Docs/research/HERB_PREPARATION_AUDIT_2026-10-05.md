# Preparation audit and continuation — 2026-10-05

## Observed issue
The public catalog at https://herbalaiph.vercel.app/api/herbs?limit=100 returned 38 records. Twenty live built-in entries repeat the same preparation placeholder and their local batch has empty preparation citations. The newer fifty-candidate research queue is separate and has not been published.

## Four local repairs
- Oregano: specific reported leaf juice/infusion forms, not a fabricated standardized recipe.
- Takip-kohol: official EMA traditional cutaneous monograph information, aligned preparation/dosage/cautions and minor-wound scope; not oral treatment of unrelated indications.
- Mayana: external leaf poultice reported by a Philippine community study; not an oral root recipe or recommendation to put raw leaves on open wounds.
- Pandan: food preparation explicitly distinguished from unverified medicinal use.

Changed fields have resolved source IDs. All local batch records remain DRAFT/unverified with review gaps. No images or UI styling were changed. No Neon mutation, deployment, commit or push occurred.

## Sources actually reviewed
- [UST Oregano](https://www.ust.edu.ph/ust-manila-plant-databse/oregano/): current university entry returned by search after an initial direct-page timeout.
- [EMA Centella monograph, Revision 1](https://www.ema.europa.eu/en/documents/herbal-monograph/european-union-herbal-monograph-centella-asiatica-l-urb-herba-revision-1_en.pdf): official seven-page PDF downloaded; pages 4–7 text-reviewed. Browser retrieval failed; no visual PDF-layout review is claimed.
- [Ducusin's La Union study](https://ejbio.imedpub.com/ethnomedicinal-knowledge-of-plants-among-the-indigenouspeoples-of-santol-la-union-philippines.php?aid=21461): publisher page and actual Mayana row 66 plus its continuation reviewed. Community-use documentation is not a clinical trial.
- [NNC Pandan](https://nnc.gov.ph/mindanao-region/pandan-leaves-probable-health-benefits/): botanical/culinary paragraphs only; anecdotal medicinal claims and inconsistent genus-wide edibility wording were not adopted.

The earlier comparative-toxicity paper was reread through Europe PMC XML. Its table records plant parts/uses, not home preparation recipes. Laboratory extraction and brine-shrimp methods were not converted into treatment instructions. Mixed-plant pregnancy/postpartum and Mayana root/UTI recipes were not imported. Search snippets and mismatched oregano species do not establish safe recipes.

## Earlier remaining sixteen (historical checkpoint)
| Name | Exact scientific name |
| --- | --- |
| Okra | Abelmoschus esculentus |
| Sibuyas | Allium cepa |
| Anonas | Annona reticulata |
| Damong Maria | Artemisia vulgaris |
| Langka | Artocarpus heterophyllus |
| Atsuete | Bixa orellana |
| Ylang-ylang | Cananga odorata |
| Suha | Citrus maxima |
| Gabi | Colocasia esculenta |
| Saluyot | Corchorus aestuans |
| Mabolo | Diospyros blancoi |
| Mangosteen | Garcinia mangostana |
| Kamote | Ipomoea batatas |
| Katakataka | Kalanchoe pinnata |
| Aratiles | Muntingia calabura |
| Makabuhay | Tinospora crispa |

This table records the earlier checkpoint, not the current backlog. See the follow-up below. Do not assign the same tea recipe to all plants, infer safe doses from traditional reports, or replace treatment methods with culinary instructions without labeling the distinction.

## Earlier observed local validation
Four focused suites passed: 42 tests, including seven new preparation regressions. Standalone strict TypeScript checking of the new test passed. No database-dependent test or live import is claimed. The prior 934-test broad result predates these preparation edits; it is not a full rerun of this batch.

## Next work and release safeguards
1. Research the remaining sixteen, prioritizing exact-taxonomy official monographs or clinical preparation sources. Preserve contextual, descriptive traditional methods when no validated instruction exists.
2. Independently review risk-sensitive parts, routes, contraindications and use in pregnancy/children. Retain human-review gates rather than calling a filled field safe.
3. Validate the combined bundle and review intended built-in updates. The existing bootstrap can publish/update content: a DRAFT manifest does not by itself prevent publication when that command is run. Do not automatically push this content for release.
4. After explicit content/release review, verify all-state duplicates, intended target, source support, regenerated embeddings and live Library/Dr. Ai behavior. Preserve existing identities, image provenance and unrelated authentication work.

At the user's one-percent remaining usage threshold, stop and resume from this file. The current remaining preparation entries are listed in the follow-up below, not the historical sixteen-entry checkpoint.

## Follow-up: preparation content and Dr. Ai retrieval

Read-only live check on 2026-10-05 at 03:24:58 UTC: the public API still returned 38 published records and twenty exact repeated preparation placeholders. These local changes have NOT been deployed. The fifty-candidate research queue remains separate and unpublished.

### Current local content outcome

| Outcome | Records |
| --- | --- |
| Cited traditional/monograph descriptions (9) | Oregano, Takip-kohol, Mayana, Aratiles, Damong Maria, Atsuete, Ylang-ylang, Sibuyas, Katakataka |
| Cited food-only preparation descriptions (5) | Pandan, Kamote, Gabi, Okra, Saluyot |
| Explicit harm-related preparation hold (1) | Makabuhay |
| Exact-part preparation still unresolved (5) | Anonas, Langka, Suha, Mabolo, Mangosteen |

Fourteen preparation descriptions does NOT mean fourteen clinically validated home recipes. Many sources report a form and route without reproducible quantities or timing. Unknown details and treatment doses remain withheld. No identities, images or UI styling were changed. No additional herbs were inserted or publication flags changed.

### Additional sources and actual review coverage

- [Tantengco et al., Ayta study (2018)](https://www.phcogj.com/sites/default/files/PharmacognJ-10-5-859_0.pdf): downloaded publisher PDF; Table 1 text on pages 4, 5 and 8 reviewed. Descriptive community reports, not clinical trials. No PDF visual-layout review is claimed.
- [Beloy et al., Loboc study (2026)](https://ethnobotanyjournal.org/index.php/era/article/download/7714/2268/75646): publisher PDF web text, methods and onion row reviewed; local download returned HTML. Identification had no deposited vouchers. No fabricated precise application sequence was added.
- [NParks Gabi](https://www.nparks.gov.sg/florafaunaweb/flora/1/8/1835), [NParks Okra](https://www.nparks.gov.sg/florafaunaweb/flora/1/5/1581): relevant botanical/culinary sections only; not medicinal validation.
- [Dapar et al., Manobo study (2020)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7227330/): Europe PMC full-text XML; Cananga row reviewed. Interview quantities were not adopted as safe dosing. A separate Kalanchoe row had a route-label inconsistency and was not used for that preparation.
- [TKDL Siquijor Katakataka record](https://tkdlph.piaem.org/index.php/ct-menu-item-3/ct-menu-item-7/7962-hanlilika-or-anlilikga-or-aritana): indexed public record reviewed. Direct requests failed (429/406); coverage is explicitly marked INDEXED_PUBLIC_RECORD. Its all-ages claim was not adopted. Recheck the original record before release.
- [PROSEA Corchorus aestuans account](https://plantuse.plantnet.org/en/Corchorus_aestuans_(PROSEA)): exact-species food paragraph reviewed, not seed medicinal directions or another jute species.
- [Langrand et al. (2014)](https://pubmed.ncbi.nlm.nih.gov/24867504/): human case abstract reviewed. Documents a harm; it does not estimate incidence or establish a safe dose. Makabuhay oral instructions remain withheld.

### Five remaining content gates

| Record | Why no recipe was added |
| --- | --- |
| Anonas | Caribbean TRAMIL indication differs; displayed salt units are inconsistent. Laboratory/animal extraction is not a home recipe. |
| Langka | Reviewed Philippine rows concern roots or bark; the HERDIN leaf-ointment study is laboratory extraction. No transfer between plant parts. |
| Suha | Loboc categories/routes are mixed and include pregnancy; no unambiguous leaf-only protocol adopted. |
| Mabolo | Reviewed leaf studies concern laboratory solvents or animal outcomes, not human home preparation. |
| Mangosteen | The original paper's supporting use reference concerns fruit hulls. Peel directions and experimental leaf tinctures cannot be transferred to the leaf record. |

The original toxicity paper's reference for Corchorus use concerns C. capsularis, not C. aestuans. Record-specific review gaps now preserve this mismatch and the other unresolved part/route limitations. Suitable additional sources may exist; this audit does not assert that they do not.

### Reproduced technical issues and local repairs

1. Named retrieval omitted stored botanical synonyms and regional names; repaired matching for sourceScientificName/cebuanoName and follow-ups. Only explicit stored names are used, not guessed synonyms.
2. Substring matching could select Atis for a question containing hepatitis; names now require alphanumeric boundaries. This does not resolve every inherently ambiguous common name; scientific identity and qualifiers still matter.
3. Close-vector lexical filtering omitted preparationMethod; preparation-only terms now participate in relevance checking.
4. Generation receives current preparation text, warnings and linked field references; regular/streaming regression fixtures cover the new wording and provider fallback. Pediatric instructions remain withheld. The system prompt distinguishes reports, food and laboratory methods from medicinal recipes.
5. The importer backdated newly reviewed sources to the original batch date. Per-source accessedAt now preserves the actual review date, validates calendar dates and retains the legacy fallback when none was recorded.
6. Embedding input is shared with a directly tested helper. The existing --publish operation regenerates vectors for selected updated records before its transaction; merely editing JSON does not update live embeddings or the database.

The isolated initial tests reproduced naming, relevance and prompt failures before repair. Tests promote content to PUBLISHED only inside mocked fixtures; this is NOT production publication or evidence that Gemini outputs were medically reviewed. Bundled knowledge-base files contain no competing preparation entries for these names.

### Follow-up validation and release gates

- Focused preparation/content/import-helper suites: 81 tests passed across four files after the Saluyot addition and full-record retrieval coverage.
- Backend build and lint passed; standalone strict TypeScript checks of the importer and new tests passed.
- The final broad rerun passed 993 tests across 72 files after the Saluyot and full-record retrieval additions. The preceding 976-test result is retained only as a historical checkpoint in this session; the companion validation report records final coverage and exclusions.
- Seventeen database-dependent suites are excluded because isolated PostgreSQL is unavailable. No real database transaction, provider-generation, live authenticated Dr. Ai or newly deployed Library acceptance pass is claimed.
- No commit, push, Neon mutation, upload or deployment occurred. Unrelated local authentication/documentation changes were preserved.

Before release: independently review source/part/route and safety restrictions (including the indexed-only TKDL record), confirm the intended Neon target and existing IDs, review the deployment bootstrap's write behavior, update only accepted existing records and their citations, regenerate their embeddings, restart/invalidate the catalog cache, and verify Library and Dr. Ai against the changed live fields. The existing bootstrap can publish DRAFT manifests; do not assume DRAFT JSON alone is a release safety barrier.

Continue with the five unresolved content gates and risk-sensitive source review, not fabricated boiling recipes or premature publication of the separate fifty candidates. At one-percent remaining account usage, stop and save this checkpoint.

### Later all-published-record continuation

See ALL_PUBLISHED_HERB_PREPARATION_AUDIT_2026-10-05.md and its 38-record coverage ledger for the latest state. The five remaining generic local placeholders have been replaced with qualified cited descriptions or a source-supported safety exclusion. All twenty batch-02 entries now have preparation attribution, without marking them reviewed or published. Live still has twenty placeholders; the connected Neon browser could not be controlled, so no live content write is claimed. Kalingag's missing image and two existing preparation-support metadata gaps are retained explicitly.
