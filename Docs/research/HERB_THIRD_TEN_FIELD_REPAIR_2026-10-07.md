# Third-ten held field draft review — 2026-10-07

## Status and scope

The third ten candidates now have assembled held editorial field plans. **Nothing was published.** No database write, Cloudinary upload, AI request, embedding generation, credential change, commit or push occurred. The UI and runtime routes were not changed.

Live public catalog observation: **38 herbs**, checked at **2026-10-06T17:00:20.341Z** (2026-10-07, Asia/Manila). No candidate identity conflicts were returned by the public-only comparison. This does not check hidden Herb drafts or pending/rejected SuggestedHerb records, and is not a fresh private database-target confirmation.

| Measure | Previous two batches | After third batch |
| --- | ---: | ---: |
| Held draft plans present | 20 | 30 |
| Drafts with all required core text fields present | 19 | 28 |
| Partial text drafts | 1 | 2 |
| Candidates still lacking a full text draft | 31 | 22 |
| Missing selected covers across fifty candidates | 13 | 13 |
| Held secondary-source identities | 2 | 2 |
| Publication-cleared candidates | 0 | 0 |

Core text presence is not medical review, completeness of clinical evidence, proof of species identity or release readiness. Categories remain Uncategorized, safety reviews remain pending, dose text explicitly withholds a medicinal regimen, and reviewer/embedding fields remain null. Five third-ten candidates have no selected uploaded cover, even when their text fields are assembled.

## Records assembled

| Candidate | Taxon retained | Preparation scope | Occurrence evidence |
| --- | --- | --- | --- |
| Solasi | Ocimum basilicum | Leaf food description | Kew country-level native listing |
| Lokoloko | Ocimum gratissimum | Nigerian background food-use report, not a recipe trial | **Unresolved**; historical identity mapping is also held |
| Balanay | Ocimum tenuiflorum | Leaf food description | Kew taxonomic description includes Philippines |
| Romero | Salvia rosmarinus | Leaf seasoning, not essential oil | Co's Digital Flora: cultivated, not naturalized |
| Katuray | Sesbania grandiflora | Unopened white-flower food description | Kew country-level native listing |
| Alibangbang | Piliostigma malabaricum | Young-leaf soup condiment, not seed food | Kew country-level native listing |
| Kupang | Parkia timoriana | Laboratory bean-flour processing, not a household recipe | Kew country-level introduced listing |
| Nipa | Nypa fruticans | Young-seed dessert processing, not medicinal sap | Kew country-level native listing |
| Bottle gourd | Lagenaria siceraria | Young non-bitter fruit food description | Co's Digital Flora: cultivated and locally naturalized |
| Luffa aegyptiaca | Luffa aegyptiaca | Immature smooth-loofah fruit, not mature sponge | Co's Digital Flora: cultivated/naturalized; bounded Rizal photo locality |

Eight retained descriptions concern food preparation; one is a reported food use and one is laboratory food processing. Preparation text is preserved exactly from the earlier reviewed ledger. Missing cooking duration, ratio, therapeutic dose or home-processing safety was not supplied by inference.

Five third-ten covers remain missing: **Lokoloko, Alibangbang, Kupang, Nipa and Bottle gourd**. Existing Solasi, Balanay, Romero, Katuray and smooth-loofah cover URLs bind to the saved selected-photo ledger; this turn did not recheck image delivery, licensing or botanical morphology.

## Important identity findings

### Lokoloko remains held, not automatically merged

The historical text links `Ocimum gratissimum` with `O. virgatum` as used by Blanco and groups three basil species in its use discussion. The inspected [Co's Digital Flora Ocimum section](https://www.philippineplants.org/Families/Lamiaceae.html) instead places `Ocimum virgatum auct. non Thunb.; Blanco` under `Ocimum tenuiflorum`. The queue therefore retains `O. gratissimum` with an explicit **PRIMARY_HISTORICAL_IDENTITY_HOLD**. It was not renamed to holy basil, counted as medically equivalent, or assigned another basil's Philippine distribution.

[Kew's O. gratissimum record](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:452969-1) accepts the species but did not list Philippines in the inspected country sections. Absence from that listing is **not proof of absence**. The Nigerian composition/contamination study is neither Philippine occurrence evidence nor human safety approval.

### Country-list omissions are not absence findings

Romero, Bottle gourd and smooth loofah have separate, exact-entry local botanical evidence in Co's Digital Flora. The omission of Philippines from their inspected Kew range pages was not converted into an absence claim or patched with neighbouring species' distribution text.

- [Cultivated Salvia rosmarinus](https://www.philippineplants.org/Families/Lamiaceae.html), Salvia > Cultivated, not naturalized: garden cultivation only.
- [Lagenaria and Luffa entries](https://www.philippineplants.org/Families/Cucurbitaceae.html): bottle-gourd cultivation/local naturalization and the separate smooth-loofah entry. The preceding angled-loofah paragraph was not borrowed.
- [Kew holy-basil description](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:453130-1/general-information): Philippines occurs in the Kew Bulletin distribution paragraph. No province map or native-status claim was invented from that paragraph.

### Mixed historical food accounts remain separate

The book's Parkia entry includes African coffee-like seed-use material and mixed old names. Only the exact-species, labelled laboratory food-processing description already reviewed for `Parkia timoriana` was retained. The numeric cooking endpoint is missing in that study; no beginner recipe is cleared.

Historical regional-name strings are preserved separately with source/page provenance and `modernRegionalMappingCleared=false`. In particular, a broad historical “Vis.” label was not silently converted to Cebuano, and shared basil names were not treated as unique taxon identifiers.

## Safety and preparation-source handling

- Rosemary leaf-food use remains separate from essential oil; the [NParks species page](https://www.nparks.gov.sg/florafaunaweb/flora/3/3/3338) warns pregnant or breastfeeding women against taking the oil.
- Bottle-gourd bitter-juice restrictions remain attached to the [ICMR human adverse-event assessment](https://doi.org/10.4103/0971-5916.93424). The full-text XML was retrieved through Europe PMC after direct web access failed. The adverse-event report is not evidence of benefit or a safe dose, and cooking was not claimed to clear toxicity.
- [NParks smooth loofah](https://www.nparks.gov.sg/florafaunaweb/flora/4/8/4848) separates young-food parts, named sweet cultivars and mature inedible fruit; these boundaries remain attached.
- The [Parkia timoriana study](https://pmc.ncbi.nlm.nih.gov/articles/PMC9265550/) reports laboratory flour processing, not a clinically tested home treatment.
- The earlier preparation/safety ledger retains its 2026-10-05 provenance; fresh identity/distribution observations are separately dated 2026-10-07. No claim that every earlier source was freshly reread is made.

Five records still lack a dedicated warning-support source; editorial safety limits remain explicitly uncited. All ten dosage limitations remain review limits rather than validated dosing guidance. All ten medicinal instructions and beginner steps remain uncleared.

## Focused implementation

The read-only release-check schema now allows an **omitted** draft image URL where the selected-cover audit also has none. This is not an importer or runtime Herb validation change. Missing images remain blocked; supplying a different image, or omitting an already selected image, causes validation to fail. This avoids forcing a fabricated image URL merely to store an unfinished editorial plan.

The CLI loads the third-ten plan alongside the first two. Each plan retains its own evidence filename; the second and third plans have no private snapshot. Earlier reports were not overwritten.

## Observed validation

- Targeted release/preparation-draft tests: **53 passed across two files**.
- Expanded related suite, including third-ten preparation and field-draft regressions: **182 passed across 14 files**.
- Backend `npx tsc --noEmit`: passed.
- Dedicated strict CLI and both field-draft/preflight test typecheck: passed.
- Targeted ESLint: passed.
- Ten-row queue identity, original book metadata, preparation-source species and selected-cover binding checks: passed.
- Read-only live CLI returned valid JSON with no stderr and exit **2**, deliberately meaning **release held**.
- `git diff --check`: no whitespace errors; Git printed existing LF/CRLF conversion warnings for unrelated tracked files.

Counts overlap; do not sum the two suites. No medical accuracy approval, live AI retrieval test, production import, physical-device test or participant acceptance is implied by these automated checks.

## Evidence files

- `HERB_THIRD_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`: ten held editorial drafts.
- `HERB_THIRD_TEN_FIELD_RELEASE_CHECK_2026-10-07.json`: fresh read-only public release-check receipt.
- `HERB_THIRD_TEN_PREPARATION_REVIEW_2026-10-05.json`: original exact-species preparation evidence.
- `HERB_SEVENTEEN_MEDIA_DELIVERY_2026-10-05.json`: five previously selected cover/provenance records.
- `HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json`: earlier fifty-candidate audit.

## Next work

1. Assemble the fourth-ten full field drafts against their exact source and species, retaining missing evidence and media as holds.
2. Complete the fifth-ten drafts; keep higher-risk fruit, seed, solvent-extraction and quarantined-source limitations explicit.
3. Resolve Fennel's occurrence and Lokoloko's identity/occurrence gaps, plus Mustasa/Radish mappings, before import.
4. Close the thirteen cover holds, two secondary-source identity holds, category assignments and part-specific safety/source reviews.
5. Independently confirm the live private target, back up, compare all Herb and SuggestedHerb states freshly, and validate a guarded importer with rollback and concurrent-duplicate tests in isolation.
6. Publish only reviewed candidates after release clearance; then verify Library details and Dr. Ai retrieval and remediate the existing 38 live records from their own sources.

This turn completes the third-ten drafting/validation batch, **not the fifty-herb publication**.
