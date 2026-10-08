# Fourth ten: preparation evidence review

Reviewed: 2026-10-05. Scope: candidates 31-40 of `pardo-fifty-research-2026-10-04`, with unchanged identities, historical headings and book page pointers. The paired JSON is **research only, not importable**. No herb was added to Neon, published, embedded for Dr. Ai, or given a new image in this batch.

## Outcome

- Ten candidates reviewed: **four bounded food descriptions, one held manufacturing description, two held laboratory descriptions and three methods not established**.
- Zero complete household recipes and zero medicinal instructions cleared. Missing quantities, temperatures, durations and human doses were not invented.
- Preparation research now covers candidates 1-40; the last ten still need review. Reviewed does not mean safe, staged or published. The previous first-ten Talisay overlay and second-/third-ten exclusions remain applicable.
- Santan, Kabiki and Balibago remain explicit method gaps. Food-part identification and genus-level food reporting do not resolve them.

## Candidate decisions

| Candidate | Exact species | Evidence and boundary | Decision |
| --- | --- | --- | --- |
| Santan, `research-pardo-124` | Ixora coccinea | Gardenwise's Ixora paragraph does not name the species or cultivar. | Method not established; genus lead excluded from preparation citations. |
| Sampaguita, `research-pardo-139` | Jasminum sambac | The study uses cv. bifoliatum flowers to scent prepared Camellia sinensis tea, with spent flowers separated. | Manufacturing description held; not arbitrary ornamental-flower tea. |
| Kabiki, `research-pardo-138` | Mimusops elengi | NParks identifies edible ripe fruit flesh but no process. | Method not established; do not infer a raw-serving or seed recipe. |
| Balibago, `research-pardo-033` | Hibiscus tiliaceus | NParks reports young leaves as a vegetable without a cooking method. | Method not established; neither roselle nor Thespesia recipes substituted. |
| `research-pardo-035` | Thespesia populnea | World Agroforestry reports young buds/leaves uncooked or butter-fried. | Food description only; no medicinal or complete recipe clearance. |
| Doldol, `research-pardo-038` | Ceiba pentandra | PROTA describes leaves, flowers and young fruits cooked into sauces, with seed/oil cautions. | Food description excludes seed and oil processing. |
| Kalumpang, `research-pardo-039` | Sterculia foetida | Primary study describes a seed methanol extract. | Laboratory description held; no safe seed meal established. |
| Manzanitas, `research-pardo-067` | Ziziphus mauritiana | Fruit food processing is documented by World Agroforestry. | Food description only; modern Z. jujuba is not substituted. |
| Asana, `research-pardo-079` | Pterocarpus indicus | Heartwood solvent extraction was used for a rat experiment. | Laboratory description held; not human cardiovascular advice. |
| Coffee, `research-pardo-125` | Coffea arabica | World Agroforestry describes a roasted, milled and brewed seed beverage. | Food description only; no leaf-tea, other-species or medicinal regimen. |

## Sources actually reviewed

The JSON stores exact field support, taxon scope and limitations. A source can support an unresolved-gap explanation without supporting a preparation. No Facebook or Reddit anecdote was adopted.

1. [NParks Gardenwise 62, February 2024](https://www.nparks.gov.sg/sbg/research/publications/-/media/sbg/gardenwise/gw_pdf_2020-2029/gw_2024_vol_62_feb_updated.pdf): extracted printed page 31, Ixora paragraph. It names a genus, not the candidate species. Its preparation lead is deliberately not adopted.
2. [Zhang et al. (2023), Volatilomics Analysis of Jasmine Tea during Multiple Rounds of Scenting Processes](https://doi.org/10.3390/foods12040812): section 2.1 manufacturing, read in public Europe PMC full-text XML. Factory/cultivar scope retained; no clinical claim.
3. [NParks Mimusops elengi](https://www.nparks.gov.sg/florafaunaweb/flora/3/0/3030): species heading, fruit description and edible-part paragraph. Processing is not supplied.
4. [NParks Hibiscus tiliaceus](https://www.nparks.gov.sg/florafaunaweb/flora/2/9/2954): species heading, food paragraph and comparison with Thespesia. Cooking instructions are not supplied.
5. [World Agroforestry Thespesia populnea](https://apps.worldagroforestry.org/treedb/AFTPDFS/Thespesia_populnea.PDF): printed PDF page 3, Food paragraph, rendered and visually inspected. Adjacent medicine claims excluded.
6. [Duvall (2011), PROTA4U Ceiba pentandra](https://prota.prota4u.org/protav8.asp?h=M4&p=Ceiba+pentandra&t=Ceiba,pentandra): species Uses section and author/citation metadata. The culinary seed-oil caution is retained, not overridden by an older database's cooking-oil mention. Eye, root and childbirth practices excluded.
7. [Alam et al. (2021), Chemical Profiling, Pharmacological Insights and In Silico Studies of Methanol Seed Extract of Sterculia foetida](https://doi.org/10.3390/plants10061135): section 4.1, read in public Europe PMC full-text XML. The 2022 follow-up refers back to this extraction source; the actual method was read rather than inferred from the follow-up's abstract.
8. [World Agroforestry Ziziphus mauritiana](https://apps.worldagroforestry.org/treedb/AFTPDFS/Ziziphus_mauritiana.PDF): printed PDF page 3, Food paragraph, rendered and visually inspected. Historical author-qualified identity remains separate from modern Z. jujuba.
9. [Chen et al. (2025), Dose-Dependent Cardioprotection of Pterocarpus indicus Extract in Rats With Myocardial Ischemia](https://doi.org/10.1177/15593258251404066): Drug Extraction section, read in public Europe PMC full-text XML. Solvent fractionation and freeze-drying are not home preparation; rat doses were not transferred.
10. [World Agroforestry Coffea arabica](https://apps.worldagroforestry.org/treedb/AFTPDFS/Coffea_arabica.PDF): printed PDF page 3, Food paragraph, rendered and visually inspected. Medicine and pulp-fermentation claims not adopted.

## Retrieval and evidence limitations

- Several PMC HTML opens returned a browser challenge. The ordinary public Europe PMC full-text API supplied the articles; no challenge was bypassed. Four downloaded XML files include the 2022 Sterculia follow-up; only the directly inspected 2021 method is used as its preparation citation.
- Initial bounded Node PDF requests timed out. PowerShell downloads subsequently completed for Thespesia, Ziziphus and Coffee; each saved PDF has byte count/SHA-256 evidence in the JSON. The separate Ceiba PDF download did not complete through that attempt; its selected food/caution evidence is the directly read PROTA page.
- A Coffee render attempted before transfer completion failed. After the completed download, it was rendered and inspected successfully. Poppler emitted missing-font notices on the completed PDFs, but the selected species/food paragraphs were readable in their images. A failed partial render is not a failed source identification.
- Gardenwise screenshot retrieval returned HTTP 403; only extracted text was read. The generic species scope is unresolved regardless of visual availability. No exact-species recipe is claimed from it.
- The reviewed ledger preserves existing research identities. It is not a fresh all-state live duplicate query or an expert authentication of specimens/media.

## Observed validation

- New evidence-contract suite: eight tests passed. Focused six-suite run: **60 tests passed**, exit 0, 4.49 seconds.
- Strict TypeScript checking of the new test passed with exact optional-property and unchecked-index checks enabled. Backend build and source lint passed, exit 0. The configured source lint does not independently lint test files; strict checking covers this new test.
- Broad dirty-working-tree suite: **1,144 tests passed across 84 files**, exit 0, 64.67 seconds, with eighteen real-database suites explicitly excluded. This is not a clean selective-release bundle, remote CI or PostgreSQL result.
- Tests check queue identity/page pointers, honest counts, exact-species/field citation linkage, generic/edible-only gaps, jasmine manufacturing, Ceiba seed exclusions, laboratory boundaries and refusal by the production preparation-plan parser. They do not prove clinical correctness or live Dr. Ai retrieval.
- After adding the completed Coffee download/visual metadata, the final focused six-suite rerun passed all **60 tests**, exit 0, 4.20 seconds. New-file JSON parsing, trailing-whitespace and narrow credential-pattern checks passed. These pattern checks are not a comprehensive secret audit. The real Git index remained empty and HEAD remained `f98c498d0c62998b2f5129557f038a79345cd9bd`.

## Continue safely

Next review candidates 41-50: Kamias, Balimbing, Kasuy, Bankundo, Oxalis corniculata, Kahel, Tsampaka, Abutilon indicum, Kastuli and Ayapana. Prior toxicity, taxonomy and media holds must remain attached. Resolve the three explicit fourth-ten method gaps only if a matching reliable method is found; otherwise retain the gap rather than manufacture instructions.

Separately, the existing twenty-generic-preparation selective updater still requires its eight isolated PostgreSQL checks and a reviewed application against a fresh, confirmed-target snapshot. Do not feed this research ledger to that updater. New-herb staging needs fresh all-state duplicate checks, part/cultivar/clinical review, thirteen media clearances and isolated rollback/concurrency validation. No automatic commit, push, live database change or AI-retrieval pass occurred.
