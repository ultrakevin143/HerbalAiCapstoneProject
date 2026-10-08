# Medicinal-plant ebook inventory and expansion proposal

Audit date: 2026-10-04. Research only; no herb inserted, overwritten, published, embedded, or uploaded. No application code changed for this review.

## Answer and scope

**143 distinct, name-resolved candidate species are absent from the current 38-record public catalog.** This is a preliminary name-comparison count, not a guarantee that 143 herbs are absent from every live database table, correctly interpreted in the historical botanical sense, medically suitable, or ready to publish.

**Zero additions are cleared for import by this review alone.** The public endpoint excludes unpublished records. Before insertion, compare against all Herb publication states and SuggestedHerb records, including historical synonyms and local-name collisions. An authenticated all-record database snapshot was not available during this review. No credentials were requested or extracted.

## Book coverage and counting

Source: T. H. Pardo de Tavera, *The Medicinal Plants of the Philippines*, translated and revised by Jerome B. Thomas Jr., Philadelphia: P. Blakiston's Son & Co., 1901. User-supplied filename ends in `(IA_cu31924050881592).pdf`.

- All **308 PDF pages** were passed through text extraction; **294** contained extractable text. Blank/scanner pages were not counted as plant entries.
- The source SHA-256 is `d0f8a1fec9514578deddf99bbc1c0e8b5e01153df0ebf24aa4745a103cb6adb3`.
- Reviewed front matter, contents, plant-account text, and indexes. Plant accounts span printed pp.17-243 (PDF pp.23-249); property/disease and alphabetical indexes were used for cross-checking, not counted again. Publisher advertisements at the end were excluded.
- The scanned OCR has collapsed words, clipped margins, and spelling differences. The [proofread transcription of the same 1901 edition](https://www.gutenberg.org/files/26393/26393-h/26393-h.htm) was used to recover entry headings, not substituted for the user's scan without comparison.
- Inventory contains **220 named entry/variety labels**: 215 species-style headings, four explicitly subordinate variety labels, and one genus-only rice heading (`Oriza`). This is **not** a claim that the book contains 220 unique accepted species. Incidental plants mentioned in discussions, synonym strings, index repetitions, and publisher advertisements are not separate expansion entries.
- All 220 labels were compared with the extracted source pages. 215 achieved a normalized heading-text similarity of at least 90%; the five lower-scoring cases were visually corroborated at PDF pp.24, 82, 147, 165, and 214. This confirms text provenance, not botanical identity or clinical validity. Additional visual checks covered contents and Anonas, Sampalok, and Duhat pages.
- Important transcription correction: the scanned heading is `A. reticulata` (printed p.21 / PDF p.27); the Gutenberg heading says `reticulate`. It is not a new species.

| Inventory decision | Labels | Meaning |
| --- | ---: | --- |
| Candidate absent from public catalog | **143** | Distinct accepted species keys under the stated name-matching criteria; research candidates only |
| Existing public herb | **22** | Do not create another herb record |
| Identity hold | **50** | Unresolved spelling, synonym, homonym, historical usage, common-name collision, rank, or lookup failure; not included in the 143 |
| Book variety / repeated accepted species | **5** | Four subordinate varieties and one synonym overlap; not extra herbs |
| Total audited labels | **220** | 143 + 22 + 50 + 5 |

The 143 excludes uncertainty rather than silently guessing it away. Toxic or otherwise unsuitable plants can still be *name-matched candidates*: candidate status is not a safety endorsement.

## Comparison method and evidence

Public baseline: [Herbal-Ai herbs API](https://herbalaiph.vercel.app/api/herbs?limit=100), which returned 38 records and total 38. The checked repository's `findAllHerbs` and `findHerbCatalog` restrict this to `publicationStatus=PUBLISHED` and `isVerified=true`.

Local `expansion-batch-01.json` and `expansion-batch-02.json` were also checked: 27 entries, **24 distinct scientific names**, all already present in the public baseline. They are not an additional set of new candidates.

Names were queried with the [GBIF v2 species match service](https://techdocs.gbif.org/en/openapi/v1/species) against Catalogue of Life Extended Release, checklist key `7ddf754f-d193-4cc9-b351-99906754a03b`. There were 252 distinct initial query names, including the catalog and historical source names. The CSV retains the exact query URL, returned identity, match type, confidence, and diagnostic note.

Counting rules:

1. Expand abbreviated genera and normalize case and typographic ligatures, retaining the book's wording separately.
2. Use an exact species-level name match with confidence at least 98 and no unresolved homonym warning. Subspecies/varieties in taxonomy responses are compared at their parent species key.
3. Compare accepted species identity, not just current display names; collapse matching book species keys.
4. Do not automatically promote fuzzy/variant or higher-rank matches. Explicit reviewed exceptions include the Anonas spelling correction, Ampalaya correction, and published synonyms for Niyog-niyogan, Takip-kohol, and Sabila. Atis is an explicit genus-spelling normalization corroborated by the [NParks Annona squamosa record](https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2713).
5. Hold historical concepts that conflict with the automatic result or with existing local names. Even an exact backbone match can select an inappropriate botanical author or historical interpretation. These are name-screening results, not a completed botanical revision of the book.
6. Do not count a parent plus its stated varieties as multiple new herbs. `Trichosanthes anguina` and `T. cucumerina` share the matched parent species and contribute one candidate, not two.

Two initial requests (`Anisomeles ovata`, `Andropogon schoenanthes`) did not produce usable responses and remain holds. They were not assumed new.

## Confirmed existing public herbs

The 22 mapped records are: **Anonas, Makabuhay, Atsuete, Mangosteen, Gumamela, Suha, Malunggay, Akapulko, Niyog-niyogan, Bayabas, Ampalaya, Takip-kohol, Sambong, Damong Maria, Tsaang Gubat, Lagundi, Oregano, Luya, Luyang dilaw, Sabila, Bawang, and Sibuyas.**

Examples of why literal name matching would be wrong:

| Book label | Existing record | Decision |
| --- | --- | --- |
| `Cassia alata` | Akapulko / `Senna alata` | Existing matched species |
| `Moringa pterygosperma` | Malunggay / `Moringa oleifera` | Existing matched species |
| `Psidium pomiferum` | Bayabas / `Psidium guajava` | Existing matched species |
| `Coleus aromaticus` | Oregano / `Coleus amboinicus` | Existing matched species |
| `Quisqualis indica` | Niyog-niyogan / `Combretum indicum` | [Modern synonym](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A77101543-1/general-information) |
| `Hydrocotyle asiatica` | Takip-kohol / `Centella asiatica` | [Modern synonym](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A323255-2) |
| `Aloes Barbadensis` | Sabila / `Aloe vera` | Do not create another aloe; [Aloe barbadensis synonym](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A529240-1) |

## Important holds, not additions

- **Langka:** the book calls `Artocarpus integrifolia` Langka/Jackfruit, but automated matching suggests `Artocarpus integer`, while the existing Langka is `A. heterophyllus`. Modern botanical literature explicitly discusses this historical misapplication. Treat it as a possible duplicate requiring review, not a new fruit tree. [Gardens' Bulletin Singapore taxonomic treatment](https://www.nparks.gov.sg/sbg/research/publications/gardens%27-bulletin-singapore/-/media/sbg/gardens-bulletin/gbs_73_02_y2021/73_02_08_y2021_v7302_gbs_pg309.ashx).
- **Kalingag:** printed p.208 applies the local name to both `Cinnamomum pauciflorum` and `C. tamala`; the existing catalog uses `C. mercadoi`. Both historical headings are held. Do not create new Kalingag records based solely on these labels.
- **Katakataka:** the book's `Kalanchoe laciniata` is not the catalog's `K. pinnata`; common names are not adequate species identifiers.
- **Tanglad/grass:** do not convert `Andropogon Schoenanthes` into `Cymbopogon citratus` by assumption.
- **Star anise:** do not equate the historical `Illicium anisatum` account with edible star anise or import its directions.
- **Spilanthes, Phyllanthus, Euphorbia and Plantago:** historical usages/authors can differ from a modern unqualified name match; these require botanical interpretation.
- **Rice:** `Oriza` alone is a genus-style label, not a resolved species record.

The CSV contains every hold individually; these examples are not the complete hold list.

## Proposed first research batch: five plants, not 143 imports

| Priority candidate | Modern scientific name | Book printed page | Next evidence needed |
| --- | --- | ---: | --- |
| Duhat | `Syzygium cumini` | 114 | Philippine use/safety sources and a species-verified photo; historical heading is `Eugenia Jambolana` |
| Sampalok | `Tamarindus indica` | 104 | Distinguish food use from medicinal claims; review safety and preparation descriptions |
| Atis | `Annona squamosa` | 20 | Keep distinct from existing Anonas; review plant-part-specific safety before writing any preparation content |
| Talisay | `Terminalia catappa` | 110 | Philippine documentation, safety review, and identifiable leaves/fruit photo |
| Butterfly pea | `Clitoria ternatea` | 92 | Confirm local aliases and Philippine use; do not imply clinical efficacy from food-colour use |

All five are absent from the public snapshot; their all-record database checks, medicinal-claim reviews, and final image approvals are still pending. This is a proposed review order, not a recommendation that people use these plants medicinally.

[Kew accepts Syzygium cumini and lists Eugenia jambolana as a synonym](https://powo.science.kew.org/taxon/601603-1). [Kew's Tamarindus indica profile](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A520167-1/general-information), [NParks Annona squamosa](https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2713), [NParks Clitoria ternatea](https://www.nparks.gov.sg/florafaunaweb/flora/1/3/1372), and [NParks Terminalia catappa description](https://biodiversitysg.nparks.gov.sg/our-biodiversity/flowering-plants/trees/ketapang-/) provide modern identification references, not clinical approval.

### Safety exclusion

Do not bulk-copy historical doses, enemas, emetics, or disease-cure assertions into public guidance or RAG. The 1901 source is historical documentation, not contemporary prescribing evidence. For example, rosary-pea seeds contain abrin according to [CDC](https://www.cdc.gov/chemical-emergencies/chemical-fact-sheets/abrin.html), and [FDA's botanical import alert](https://www.accessdata.fda.gov/cms_ia/importalert_141.html) addresses Aristolochia/aristolochic acid. Accordingly `Abrus precatorius` and `Aristolochia indica`, although name-matched and absent publicly, are **excluded from the proposed first batch**. Other candidates require their own safety review rather than a blanket safe/unsafe inference.

### Image requirements

No new photograph has been approved or downloaded in this review. A search label alone cannot guarantee species identity.

For each selected record:

1. Find an original, species-labelled photograph showing identifying leaves, flowers, fruit, or habit; compare with a modern botanical reference. Avoid misleading plant parts, related species, generic herbal photos, AI-generated identification pictures, and Google Images thumbnails.
2. Read the original file page's author, source, and reuse licence. Do not assume a book, search result, botanical website, or Scribd upload grants image reuse.
3. Record the existing schema fields `imageCreator`, `imageSourceUrl`, `imageLicense`, `imageLicenseUrl`, and `imageModification`. Keep required attribution visible. Identify any crop/resizing and comply with share-alike conditions when applicable.
4. Verify the selected file visually before import. If identity or permission is unclear, use the system's honest placeholder instead of a mismatched photograph.
5. Optimize only after approval, upload through the existing media flow, and test image display/attribution at mobile and desktop sizes.

One **unapproved photo lead**: [Syzygium cumini (1).jpg](https://commons.wikimedia.org/wiki/File:Syzygium_cumini_(1).jpg), uploader Dolon Prova, labelled own work, CC BY-SA 4.0. Metadata/licence was read; species identification and suitability of the actual image still need visual review. No comparable final photo was selected for the other four plants.

## Safe database/content workflow

1. Obtain a read-only all-state catalog and suggestion inventory. Resolve canonical scientific names with botanical authors, known scientific synonyms, and local/Cebuano aliases; compare the shortlist with every existing record, not just published herbs.
2. Prepare a separate research manifest with `DRAFT`, `isVerified=false`, `UNASSESSED`, and no fabricated reviewer/date. If a record exists or is pending, attach appropriate new references to the existing review workflow instead of duplicating it or overwriting its content.
3. Store the book's historical name in `sourceScientificName`, the reviewed modern name in `scientificName`, and exact book/page citations plus modern evidence in `HerbSource`. Use only supported schema fields; no new table is justified solely to hold this ebook.
4. Write evidence-limited summaries of Philippine traditional use and modern safety. Taxonomy sources support identity, not medicinal efficacy. Where dosage evidence has not been established by reviewed sources, explicitly say so; do not fabricate a dose to fill a required string.
5. Finish photo identity/licence checks. Keep unsupported or ambiguous records on hold and out of public retrieval.
6. Validate the existing content/import path in dry-run mode, then check idempotency and duplicate rejection on an isolated database. Review race protection so simultaneous approval/import cannot create a duplicate. The schema currently indexes `scientificName` but does not enforce its uniqueness; an application precheck alone is not proof of race-safe insertion.
7. Recheck the live all-state inventory immediately before an approved insertion. Publish only evidence-reviewed records under the appropriate evidence class; never automatically set `isDohApproved=true` because a plant appears in this book.
8. After approval/publication, verify catalog count, one record per accepted species, citations, images/credit, filters/search, cache invalidation, and Dr. Ai retrieval grounding. Draft/held material must stay out of public RAG.

No import or database test was run for this proposal. No production change or push occurred.

## Scribd supplement

The supplied [Scribd document](https://www.scribd.com/document/732935121/Encyclopedia-of-Herbal-Medicinal-Plant-in-the-Philippines-Second-Edition) exposes a 63-page personal compilation revised by Derrick Yson. Publicly accessible text was consulted for discovery only, without bypassing access restrictions. Its AI-enhanced platform description was not treated as the author's evidence. It is **not added to the PDF's 220-label count**, and its embedded images have not been cleared for reuse. Independently verify every suggested identity, medical assertion, and image.

## Saved evidence and verification

- `PARDO_HERB_INVENTORY_2026-10-04.csv`: all 220 labels, historical/common names, page locators, comparison decision, modern matching evidence, and explicit pending review gates.
- `HERB_CATALOG_BASELINE_2026-10-04.json`: 38 minimal public catalog records, reviewed local manifests, source hash, method, and counts. No user credentials or personal accounts are included.
- Validated: 220 inventory rows; disjoint decisions total 220; 143 candidate species keys are unique; 22 existing mapped catalog names are unique; all 24 local-manifest species appear publicly. No clinical/photo/all-state database approval is inferred from these checks.
- Full source extraction, HTML cross-check, page renders, and raw taxonomy-response cache remain outside the repository as research scratch; the original PDF was not changed or re-exported.
