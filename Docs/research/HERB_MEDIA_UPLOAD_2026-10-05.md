# Herb photo uploads and botanical follow-up

## Latest same-day larger batch

The eight remaining first-batch photographs have now been visually reviewed, uploaded and independently verified. Cloudinary reported `8 uploaded`, and `herbal_ai_herbs` increased from 14 to 22 assets. Total new herb photos: **10**. Each original returned HTTP 200, decoded completely and matched the selected source file's SHA-256. No existing image was replaced or deleted.

A fresh unfiltered Neon identity read returned 38 Herb and 17 SuggestedHerb rows. All fifty candidates were compared against recorded identities with zero conflicts; this is not exhaustive synonym research, concurrency protection or independent Railway-target verification. No Neon writes or publication occurred.

The new offline first-ten DRAFT planner passed regression checks, always disallows writes/publication and leaves isolated SQL/concurrency validation unresolved. Final combined backend validation: 892 non-database tests passed in 65 files; five focused herb suites total 69 passed tests; strict TypeScript and build/lint passed; Sources SSR checks 2 passed. Remaining work is medicinal-content clearance, isolated staging/integration and the other forty candidates, not eight missing first-batch uploads. Those forty now have 69 provisional photo leads across 35 candidates, with five unresolved searches; no further upload is claimed.

See `HERB_FIRST_TEN_BATCH_REPORT_2026-10-05.md`, `HERB_FIRST_TEN_PHOTOS_2026-10-05.json`, `NEON_HERB_IDENTITY_SNAPSHOT_2026-10-05.json` and `HERB_FIRST_TEN_DRAFT_PLAN_2026-10-05.json`. The first-two evidence below is retained as history; its remaining-work list is superseded by this update.

Date: 2026-10-05. Scope: real media uploads plus botanical evidence. No new public herb records.

## Actual external changes

Uploaded exactly two previously reviewed, individually CC0-labelled photographs to the user's connected Cloudinary environment `dclqw6at7`, folder `herbal_ai_herbs`. The visible folder count increased from 12 to 14, and the upload widget reported `2 uploaded`. No existing assets were replaced or deleted. No credentials or new upload presets were created.

| Plant | Source photo | Cloudinary asset ID | Public ID |
| --- | --- | --- | --- |
| Sampalok / Tamarindus indica | 580527782 | `023c48091d93d31d201d26fcd6724ad1` | `sampalok_tamarindus_indica_cc0_580527782_yfyfsb` |
| Butterfly pea / Clitoria ternatea | 173979709 | `262649f28b5936c8f3e7071a661d0ad1` | `butterfly_pea_clitoria_ternatea_cc0_173979709_bih8jo` |

Verified original public delivery URLs:

- [Sampalok](https://res.cloudinary.com/dclqw6at7/image/upload/v1791161286/sampalok_tamarindus_indica_cc0_580527782_yfyfsb.jpg)
- [Butterfly pea](https://res.cloudinary.com/dclqw6at7/image/upload/v1791161285/butterfly_pea_clitoria_ternatea_cc0_173979709_bih8jo.jpg)

These URLs use the console-observed cloud name, version and public ID in Cloudinary's delivery format. Each was verified by a real unauthenticated HTTP GET, not assumed from its syntax. Original bytes and full decode matched the selected photos:

| Plant | HTTP | MIME | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| Sampalok | 200 | image/jpeg | 1024 x 768 | 514219 | `5e58ec72909bf9bc3e1bb8bd4a53fe183e80f026e2ab24ffefd31701dbc1df5f` |
| Butterfly pea | 200 | image/jpeg | 1024 x 768 | 259879 | `2f96c2955abe5206d49267ab22c6958c260f68cbd52b612f3edba75c26f7dec4` |

The review manifest now retains the actual secure URL, asset/public IDs, folder, upload date and delivery outcome. Original iNaturalist creator, source, individual licence and hash evidence remains intact. No visible credit was removed from any existing asset; the two new photos' recorded CC0 licence permits reuse without attribution. Neither image has been retouched or generated.

No mobile layout, responsive delivery optimisation, frontend integration or Railway media-account binding is claimed as tested here. Originals are provenance assets; choose appropriately sized delivery through the application's image pipeline when integrating the cleared records.

## Botanical gaps resolved

- **Duhat synonym:** [Kew's Syzygium cumini entry](https://powo.science.kew.org/taxon/601603-1) explicitly lists `Eugenia jambolana Lam.` under heterotypic synonyms. This resolves the book-name mapping, not medical safety or an exhaustive duplicate check.
- **Sampalok Philippine occurrence:** downloaded the official [DENR urban-greening guidebook](https://forestry.denr.gov.ph/fmb_web/wp-content/uploads/2023/06/Philippine-Guidebook-on-Plant-Species-Suitable-for-Urban-Greening-EBOOK_compressed.pdf), 177 PDF pages, and rendered/visually inspected page 55. It identifies Sampaloc as Tamarindus indica and describes non-native, naturalized Philippine occurrence. Its photographs were not copied into the catalog.
- **Granada Philippine occurrence:** read the NAST-hosted [Mount Makiling flora's Punicaceae excerpt](https://nast.dost.gov.ph/images/pdf%20files/Publications/Other%20Publications%20of%20NAST/Vascular%20Flora%20of%20Mount%20Makiling%20and%20Vicinity/115%20Punicaceae.pdf), printed page 523. It records Punica granatum cultivation in Los Banos, Laguna and Philippine herbarium specimens. The separate browser screenshot request timed out; text review succeeded. Do not infer widespread wild distribution or medicinal efficacy.
- **Chico Philippine occurrence:** read the [UST Manila Campus Plant Database's Chico entry](https://www.ust.edu.ph/ust-manila-plant-databse/chico/), identifying Manilkara zapota and Philippine cultivation. This is local plant-database evidence, not a therapeutic trial or seed/bark toxicology study.

The new review file's three `MODERN_LOCAL_SOURCE_PENDING` entries are now resolved with explicit botanical source IDs/URLs. Medical-review, missing-photo, fresh duplicate-check and isolated-staging gates remain. The preliminary fifty-candidate queue remains unchanged and nonimportable.

## Validation performed after the updates

```text
npm test -- --run tests/herb-first-ten-content-review.test.ts tests/herb-expansion-review.test.ts tests/herb-expansion-batch-02.test.ts
3 files passed; 45 tests passed

tsc tests/herb-first-ten-content-review.test.ts --noEmit --target es2022 --module nodenext --moduleResolution nodenext --strict --skipLibCheck
Exit 0
```

The updated data-contract checks verify botanical occurrence citations and genuine Cloudinary metadata while retaining `stagingAllowed: false`, `publicationAllowed: false`, null preparation instructions and null dosage. These tests are not production import or clinical-safety approval.

## Evidence outside Git

Under `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/tmp/`:

- `herb-photo-review/cloudinary-two-herb-uploads-2026-10-05.jpg`: visible folder with both new assets and 14 total assets.
- `herb-photo-review/cloudinary-butterfly-pea-upload-2026-10-05.jpg`: asset detail screenshot.
- `herb-photo-review/cloudinary-*-original.jpg`: verified public-delivery bytes.
- `pdfs/denr-urban-greening.pdf` and `pdfs/denr-sampalok-page55.png`: official botanical reference and rendered review page.

Cloudinary double-click calls sometimes timed out after sending input, but the following fresh DOM snapshots showed the correct asset detail, IDs, location and dimensions. No repeated upload was attempted after the success state.

## Remaining work

1. Obtain and visually verify the other eight first-batch images, preserving individual licence and species evidence.
2. Complete plant-part-specific medicinal safety/content review. Local occurrence and a clear photo do not approve a home-treatment recipe.
3. Recheck all Herb and SuggestedHerb states before staging. The identity snapshot is still dated 2026-10-04; no fresh Neon query or write occurred in this continuation.
4. Validate DRAFT-only imports and concurrent duplicate prevention in an isolated database before any live staging. Do not add the research queue to deploy bootstrap.

Current totals for this first batch: 10 evidence-review drafts, 2 uploaded photographs, 0 newly staged Neon herbs, 0 newly published herbs. No Git commit/push or frontend styling changes were made.
