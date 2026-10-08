# Herb expansion: first-ten evidence and photo review

## Latest larger-batch status

Final same-day validation after the remaining-thirty intake: **934 local backend tests passed in 69 files**, plus seven Python generator tests. Fifty of 51 newly downloaded derivatives passed full decode and size checks, covering 26 of the remaining thirty candidates; four still have no leads. None of those intake images has been visually reviewed or uploaded. See `HERB_EXPANSION_CONTINUATION_PLAN_2026-10-05.md` for the ordered remaining work. The verified expansion-upload count stays **20/50**, not 50/50.

Latest superseding result: **20 of 50 expansion candidates now have selected, uploaded, HTTP/decode/hash-verified photographs**. Mustasa, Radish and Maize covers were completed after separate identity and visual reviews. The offline queue generator now preserves named hybrids/subspecies and defaults to a nonwriting dry run; seven Python regression tests passed. The broad local backend run passed **928 tests in 68 files**, excluding seventeen database-dependent suites. See `HERB_IDENTITY_MEDIA_PROGRESS_2026-10-05.md` for current evidence and remaining gates. Earlier counts, unresolved-cover notes and zero-upload statements below are historical. No expansion herbs have been staged or published in Neon; image completion is not medicinal-content approval.

The remaining forty candidates were also queried in this continuation. There are 69 CC0 metadata leads for 35 candidates, with five unresolved searches and no completed visual inspection/upload for those leads. See `HERB_REMAINING_FORTY_PROGRESS_2026-10-05.md`. Seven new metadata checks passed; the combined five focused herb suites now total 69 passed tests. A final broad rerun includes the additions: 892 tests passed in 65 files; seventeen database-dependent suites remain excluded.

Ten of ten first-batch photographs are now selected, uploaded and HTTP/decode/hash verified. The fresh Neon read contains 55 Herb/SuggestedHerb identities; all fifty research candidates returned zero recorded-name/supplied-alias conflicts. An offline first-ten DRAFT planner and regression tests were added; it cannot write or publish. Current validation: 885 backend non-database tests, 62 focused herb tests, 2 Sources SSR checks, backend build/lint and standalone strict TypeScript passed. Database staging/concurrency tests remain unrun; all ten retain medicinal-content review gates. No new herbs were written to Neon and no commit/push occurred.

The detailed report and remaining-work order are in `HERB_FIRST_TEN_BATCH_REPORT_2026-10-05.md`. Earlier zero/two-upload results and blocked-browser notes below are historical, not the current totals. Remaining media/content work concerns the other forty candidates; first-ten mobile delivery integration and SQL safety are separate gates.

Date: 2026-10-05. User cancelled promotion-video work and explicitly resumed herbs. No video was produced; existing unrelated files were left untouched.

Latest same-day continuation: the first ten expansion photographs and seven second-batch photographs are now uploaded, for 17 expansion candidates total. All seven new original deliveries returned HTTP 200 and matched source byte hashes. Thirty size-cleared second-batch pictures were visually screened; four additional maize derivatives decoded but failed the unchanged size threshold. Mustasa, Radish and Maize remain without selected covers. See `HERB_SECOND_TEN_PROGRESS_2026-10-05.md` and its photo evidence ledger.

The research-only hybrid/subspecies validator/comparison was repaired with 24 new tests; no actual queue identity was silently renamed. The fresh all-state snapshot from the first-ten continuation is dated 2026-10-05 and contains 38 Herb plus 17 SuggestedHerb rows; no new snapshot was taken during this second-batch work. The original results and blockers below are historical, not current totals. No Neon staging/publication, commit or push has occurred.

## Completed in this continuation

- Added `HERB_FIRST_TEN_REVIEW_2026-10-05.json`: ten educational draft summaries with botanical references, historical entry/page mapping, field-level medical citations, plant-part distinctions, omitted recipes and specific remaining gates.
- Kept the original fifty-candidate queue unchanged. The new review file has `records`, not the importer's `herbs`, and explicitly disallows staging/publication. None of these ten has final medicinal-content clearance.
- Reviewed the two fully downloaded Butterfly pea photographs. Selected the clear flower close-up, photo 173979709, as a suitable image candidate; companion 173979704 is cluttered but useful for inspecting foliage. This is visual consistency with a botanical description, not expert specimen authentication.
- Completed one bounded byte-resume download for Sampalok photo 580527782. Full PIL decode passed at 1024 x 768; 514,219 bytes; SHA-256 `5e58ec72909bf9bc3e1bb8bd4a53fe183e80f026e2ab24ffefd31701dbc1df5f`. Visually inspected brown constricted pods and paired narrow leaflets against NParks' [Tamarindus description](https://www.nparks.gov.sg/florafaunaweb/flora/3/1/3174).
- Requeried the official iNaturalist observation API for observations 103883242 and 321030761. Both returned the expected taxon and research quality; the selected individual photos each returned `license_code: cc0`. Do not infer all photo permissions from an observation-level filter.
- Retained creator/source/individual licence/hash evidence in the review manifest. New downloads remain outside Git; no edited/generated substitute photographs were used.

## Content safeguards and outstanding research

| Candidate | Main review limitation or withheld material |
| --- | --- |
| Duhat | Confirm historical synonym; the reviewed leaf-tea trial did not reduce fasting glucose. No seed-based diabetes treatment instructions. |
| Sampalok | Collect modern Philippine occurrence and medicinal safety evidence. No convulsion-treatment bath instructions. |
| Atis | Seed exposure has human ocular injury reports. No scalp-paste recipe. |
| Talisay | Modern human bark efficacy, dosage and contraindications remain unresolved. |
| Butterfly pea | Root/seed remedies are not equivalent to flower food use. No purgative or root-extract recipe. |
| Mangga | Philippine community reports are not clinical proof. No historical opium mixture or burning-leaf inhalation instructions. |
| Santol | Philippine ethnobotanical use is documented; seed injury evidence must remain visible. No seed-swallowing recommendation. |
| Papaya | Distinguish ripe fruit from latex; rat uterine experiments are not human pregnancy evidence. No latex child dosing or dengue-cure claim. |
| Granada | Modern Philippine occurrence remains unresolved. Juice findings do not validate root-bark worm treatment. |
| Chico | Modern Philippine occurrence and seed/bark safety remain unresolved. No seed medicinal recipe. |

No recipe or therapeutic dose has been cleared. Some modern evidence is ethnobotanical or preclinical; these types must not be relabelled clinical validation. The [Duhat trial](https://pubmed.ncbi.nlm.nih.gov/16476114/) and [NCCIH pomegranate guidance](https://www.nccih.nih.gov/health/pomegranate) were rechecked through browsing. The Atis PMC page was unavailable and HERDIN timed out on this date; their notes retain the prior review date rather than inventing a fresh successful read.

The all-state duplicate snapshot remains dated 2026-10-04: 38 Herb and 17 SuggestedHerb rows, zero recorded direct conflicts for the fifty selected candidates. No fresh Neon query or exhaustive synonym review was performed today. Repeat the check before any staging, including nonpublished herbs and all suggestion states.

## Observed validation

From `herbalaibackend`:

```text
npm test -- --run tests/herb-first-ten-content-review.test.ts tests/herb-expansion-review.test.ts tests/herb-expansion-batch-02.test.ts
3 test files passed; 45 tests passed
```

The eight new data-contract tests cover first-batch identity alignment, nonimportable format, withheld doses/preparations, citation resolution, evidence distinctions, high-risk part cautions, unresolved occurrence and individual licensed photo provenance. These are local data-contract checks, not clinical approval, production import integration tests or live image-delivery tests.

Standalone strict TypeScript checking of the new test file also passed (`tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --strict --skipLibCheck`). No full application build was needed for these documentation/data and test-only changes.

`git diff --check` returned no whitespace errors for tracked changes, with existing Windows line-ending notices. Unrelated dirty files were not repaired, staged or committed.

## External operations and blockers

- **Cloudinary: zero uploads.** The intended `herbal_ai_herbs` folder is present in the connected Mercado Chrome inventory, but two attempts to bind/read that tab timed out at the browser-control connection step. Recovery guidance was read; no hidden credentials, alternate browser-control mechanisms or fabricated upload URLs were used. Both selected photo entries correctly retain null Cloudinary URL/asset ID.
- **Neon: zero writes.** No herbs, suggestions, source records or schema were changed.
- **Git: no commit or push.** No production/frontend styling changes were made in this continuation.
- **Database tests:** not run. An isolated PostgreSQL environment is still needed for staging/concurrent-duplicate integration checks; live Neon must not be used as a destructive test fixture.

## Next bounded batch

1. Restore a responsive connection to the already-open Cloudinary tab; upload only the two visually reviewed, individually CC0 images, then record actual secure URLs, asset IDs and delivery checks. Do not publish records merely because a photo is uploaded.
2. Resolve the three modern Philippine-occurrence gaps and Duhat synonym confirmation; finish plant-part-specific safety review for all ten. Obtain and visually review the other eight catalog photographs.
3. Prepare a separate DRAFT-only import manifest for cleared records. Test fresh all-state duplicate detection and transaction/concurrency protection using an isolated database; do not route the research queue into deploy bootstrap.
4. Stage only cleared records, verify source coverage and image delivery at desktop/mobile dimensions, then review publication. Continue the remaining four batches with the same gates.

The old malformed Approved suggestion 3 remains a separate documented data-quality backlog. It was not deleted or modified.
