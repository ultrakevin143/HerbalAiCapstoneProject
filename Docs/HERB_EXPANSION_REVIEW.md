# Expansion batch 01: research and image review

Prepared 2026-09-13 on `codex/readability-accessibility`.

## Deliverables

- Seven reproducible draft entries in `herbalaibackend/content/herbs/expansion-batch-01.json` with stable IDs, Philippine names, scientific identities, plant parts, cautious copy, field-level references, review gaps, and image attribution.
- Seven actual photographs stored in `herbalaifrontend/public/images/herbs/`; all use commercially reusable CC BY licenses, with attribution in the manifest and `ATTRIBUTION.md`.
- Offline validation in `herbalaibackend/tests/herb-expansion-batch.test.ts` covers draft status, unique identities, reference integrity, evidence caveats, image metadata, and complete JPEG files.

These files are not loaded by the public API, seed, or AI retrieval. The existing 13 herbs are unchanged. No database import, approval, migration, or embedding generation occurred. This is a research/staging phase, not a completed twenty-herb rollout.

## Findings and coverage

| Herb | Evidence reviewed | Remaining gate |
| --- | --- | --- |
| Luya | Primary trial abstract: 70 women, four-day ginger/placebo comparison; NCCIH evidence/safety page. | Full-text appraisal and human review; do not extrapolate to ordinary tea or all nausea. |
| Luyang dilaw | Primary trial abstract: 70 adults, 12 weeks; pain improved but MRI joint-fluid/cartilage outcomes did not. NCCIH safety page reviewed. | Full-text/formulation appraisal and human review; do not imply joint repair. |
| Malunggay | Full primary trial reviewed: 88 postpartum women, no statistically significant day-three milk-volume difference; mostly cesarean deliveries and one-day measurement. LactMed includes other positive studies and safety context. | Qualified human review of the appraisal and comparative evidence; do not present one study as the entire evidence base. |
| Oregano | Kew identity/synonym and UST Philippine traditional-use description. | Primary ethnobotanical source, independent safety/human-study review, and human approval. |
| Sabila | Primary trial abstract: 60 people, eight-week aloe-gel-plus-tretinoin acne comparison. NCCIH safety page reviewed. | Full-text/formulation appraisal; not aloe-alone, raw-leaf, or oral-treatment evidence. |
| Takip-kohol | Primary trial abstract: 200 diabetic patients, mixed wound outcomes through day 21; Philippine names/use context in a laboratory paper. | Full trial and independent safety review. EMA page was located but monograph download was rate-limited; its content is not used as verified evidence. |
| Mayana | Philippine laboratory paper Table 1 documents traditional bruise/sprain use under Coleus blumei; Kew resolves accepted identity. | Trace original ethnobotanical references; independently review safety/human studies before approval. |

Four clinical papers were reviewed at **abstract level**; the malunggay trial was reviewed in full through Europe PMC XML. The machine-readable sources explicitly preserve these distinctions. Missing human-evidence review for oregano and mayana does not mean no human studies exist. No clinical approval, safe dose, or exhaustive literature search is claimed.

## Identity and local names

Kew taxon records are retained for all seven plants. UST botanical records support local names and Philippine relevance for luya, luyang dilaw, malunggay, oregano, and sabila; they are not used as substitutes for clinical evidence. The Philippine laboratory paper supports the names takip-kohol and mayana. Only sourced aliases are staged: Dilaw and Suganda. Kalabo and further regional aliases remain pending rather than being guessed or mislabeled as Cebuano.

## Image checks

The selected observation must match the exact scientific taxon, be research grade, and have a reusable license on the actual selected photo. The iNaturalist API supplied photo IDs, license codes, and creator attribution. Seven downloaded files were visually checked. A blurred ginger photo and an aloe observation showing a work crew rather than a suitable plant portrait were rejected and replaced. The aloe photograph is not presented as a Philippine location; photographic origin is separate from a plant's Philippine relevance.

Images depict reference plants, not the exact material used in the clinical studies. Photos alone cannot guarantee identification of a plant a reader has collected. Source JPEGs are retained unchanged; use optimized delivery when integrating them into the UI.

## Next implementation boundary

1. Resolve the listed clinical/safety gaps and obtain qualified human content review.
2. Implement a file-backed built-in catalog and merge approved community records without broad name-based overwrites. Existing comments and herb IDs must survive; do not silently replace the current database architecture.
3. Publish only approved entries, expose citations, validate aliases/search and image layouts, and then update AI retrieval/embeddings consistently.

Run the focused offline check from `herbalaibackend`: `npm test -- tests/herb-expansion-batch.test.ts`.

Validate the import manifest with `npm run herbs:validate`. Stage the four integration candidates as private database drafts with `npm run herbs:stage`. Publishing is deliberately gated: set `HERB_REVIEWER_ID`, `HERB_REVIEWER_EMAIL`, or `HERB_REVIEWER_USERNAME` to an active administrator who actually completed the review, then run `npm run herbs:publish`. The publisher generates every embedding before database publication and commits content, references, reviewer attribution, and embeddings atomically.
