# Second-ten field drafts and validation — 2026-10-07

## Result

The paused filename-validation failure is repaired. The second ten now have held editorial field plans, connected to the read-only fifty-candidate release checker. No database write, upload, embedding request, commit, push or publication occurred. The application's UI and runtime routes were not changed.

Public catalog observed at **2026-10-06T16:49:06.417Z** (2026-10-07, Asia/Manila): **38 records**. This is a public catalog check, not a fresh private all-state database comparison.

| Measure | Before this batch | After this batch |
| --- | ---: | ---: |
| Held field plans assembled | 10 | 20 |
| Drafts with all required core text fields present | 10 | 19 |
| Partial field drafts | 0 | 1 |
| Candidates still lacking a full field draft | 40 | 31 |
| Missing selected covers in saved audit | 13 | 13 |
| Held secondary-source identities | 2 | 2 |
| Publication-cleared candidates | 0 | 0 |

“Full field draft” measures text presence, not scientific completeness, medical safety, image authentication or publication readiness. Categories remain Uncategorized, dosage fields explicitly withhold a medicinal dose, reviewer fields and embeddings remain null, and all records remain DRAFT/UNASSESSED/unverified. The one partial draft is Fennel: no modern Philippine occurrence claim was invented.

## What changed

- Added `HERB_SECOND_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`: historical-use summaries, evidence limits, exact saved preparation descriptions, explicit dosage limitations, safety-review notes, bounded occurrence evidence and selected-photo provenance.
- Integrated the additional plan into the read-only checker without replacing the historical first-ten report or private snapshot.
- Kept each draft's evidence filename and snapshot provenance separate. The second-ten plan has **no private snapshot**.
- Fixed the filename pattern to allow date hyphens while rejecting path separators, traversal and incorrect extensions.
- Added checks against duplicate candidates across plans, duplicate proposed record IDs, substituted covers and duplicate source IDs.
- Do not count a draft without `regionFound` as a full field draft.

## Second ten

| Candidate | Preparation retained | Occurrence evidence / unresolved scope |
| --- | --- | --- |
| Mustasa — Brassica juncea | Food description: leaves and seeds | Kew's proposed accepted hybrid × Brassarda juncea lists the Philippines as introduced; mapping is still held. |
| Radish — Raphanus sativus | Food description: cultivated root and leafy tops | January 2017 Benguet field observation names R. raphanistrum subsp. sativus; retain cultivated-subspecies scope. |
| Olasiman — Portulaca oleracea | Food description: leaves, shoots, buds | Country-level introduced listing only; not Ulasimang Bato / Peperomia pellucida. |
| Cacao — Theobroma cacao | Food-processing overview: seeds and pulp | Philippine cultivation supported by the dated DA 2016–2022 roadmap, not Kew's inspected distribution list. |
| Linga — Sesamum indicum | Historical leaf-poultice description, instructions withheld | Country-level introduced listing; sesame-allergen evidence does not clear medicinal leaves. |
| Niog — Cocos nucifera | Food description: coconut flesh / milk | Kew includes Philippines in native distribution; milk and coconut water are distinct. |
| Maize — Zea mays | Held draft description of corn-silk tea | Country-level introduced listing; stigma is not tassel or stalk. EMA status remains draft under discussion. |
| Tubo — Saccharum officinarum | Food-processing description: stem juice / sugar | Country-level introduced listing; selected crop's species-versus-hybrid scope still needs review. |
| Fennel — Foeniculum vulgare | Historical shared fennel/coriander description, instructions withheld | **Unresolved**: Philippines was not listed on the inspected Kew page; omission is not evidence of absence. |
| Paminta — Piper nigrum | Food description: dried-fruit seasoning | Country-level introduced listing; do not transfer Piper betle instructions. |

Seven descriptions concern food preparation/processing; three remain historical or draft descriptions. None is a newly approved medicinal household recipe. No missing time, temperature, ingredient ratio, quantity, clinical benefit or regional name was invented.

Existing preparation and safety text retains the **2026-10-05** review provenance in `HERB_SECOND_TEN_CONTENT_REVIEW_2026-10-05.json`. New identity/distribution/status observations are separately dated 2026-10-07 in the new field plan. The previously read EMA draft PDF was not successfully reread this session; its saved evidence remains held. Eight records still lack a dedicated warning-support tag; those editorial safety limitations remain explicitly uncited. All ten dose limitations remain review limitations, not a medically validated regimen.

## Primary evidence and access limits

- [Kew mustard synonym mapping](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:60442520-2/general-information) and [accepted hybrid](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77354001-1): reconciliation proposal only; the queue was not renamed.
- [Kew radish synonym mapping](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:288491-1) and [Reeder et al. 2017 field report](https://bsppjournals.onlinelibrary.wiley.com/doi/full/10.5197/j.2044-0588.2017.036.008): cultivated-subspecies locality evidence. Radish samples were negative for TYMV; this is not human medical evidence.
- [DA 2016–2022 cacao roadmap](https://www.da.gov.ph/wp-content/uploads/2018/01/Philippine-Cacao-Industry-Roadmap.pdf), PDF page 5 / printed page 1: Philippine cultivation. The newer 2023 PDF exceeded the web tool's size limit and was not treated as read evidence.
- [Kew fennel](https://powo.science.kew.org/taxon/842680-1): no Philippine distribution match observed. Modern local occurrence remains open.
- [EMA Maydis stigma status](https://www.ema.europa.eu/fr/medicines/herbal/maydis-stigma): draft under discussion, not final clinical clearance.
- [Kew Piper nigrum](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:682369-1): Piperaceae and introduced Philippine distribution, not medicinal efficacy.

Exact per-record URLs, parts, review dates and support tags are saved in the JSON plan. Photo URLs bind to previously selected Cloudinary covers and saved creator/license metadata; no fresh delivery, license or botanical specimen clearance is claimed.

## Observed validation

- Original interrupted run: 25/29 targeted tests passed; four failed because the evidence filename's date hyphens were disallowed.
- After filename repair and added guards: **35/35 targeted preflight tests passed**.
- Expanded related suite: **156/156 tests passed across 12 files** (queue, staging planner, field/occurrence research, first-ten content/preparation, second-ten content/photos, identity/media follow-up, fifty-row audit and StuartXchange review).
- Backend `npx tsc --noEmit`: passed.
- Dedicated strict CLI/test typecheck initially found six implicit-any callback parameters. Typed fixture-row views and optional lookup checks repaired them; strict CLI/test typecheck then passed.
- Targeted ESLint for the checker and its regression test: passed.
- CLI `node --import tsx prisma/check-herb-expansion-release.ts --check-public`: produced valid JSON, no stderr and exit **2**, deliberately meaning **release held**, not permission to publish.
- Public duplicate comparison: zero matching candidate conflicts in the 38 public records. Hidden drafts and pending/rejected suggestions were not queried.

Test counts overlap; do not add them together. No live AI query, destructive test, credential change or production outage was induced.

## Next work, in order

1. Complete the next ten full field drafts from exact-species sources; preserve missing evidence instead of padding fields.
2. Resolve Fennel Philippine occurrence and the Mustasa/Radish name mappings; keep commercial sugarcane hybrid scope explicit.
3. Resolve the 13 missing covers and two secondary-source identity holds; recheck chosen photos' delivery/provenance before release.
4. Assign evidence-appropriate categories and finish part-specific safety/source review. Do not label laboratory or historical extraction as a beginner home recipe.
5. Match the intended private Neon target independently, take a backup, compare every Herb/SuggestedHerb state freshly and exercise a guarded importer against an isolated database, including rollback and concurrent duplicate writes.
6. Only after reviewed import clearance, publish the approved candidates, verify Library rendering and Dr. Ai retrieval, then remediate the existing 38 live records using their own exact-source support.

All fifty are still held. Publication is not claimed as complete.
