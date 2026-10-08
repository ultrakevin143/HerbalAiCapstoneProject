# Third-ten preparation source review

Date: 2026-10-05. Research-only supplement for queued candidates 21-30; not an import manifest or live content release.

## Scope and observed outcome

All ten existing third-batch candidate IDs, accepted-name strings, local names and historical book pointers were retained. No substitute herb was added to reach a count. This records eight culinary preparation descriptions, one background report of food use and one explicitly held laboratory food-processing description. No complete household recipe or medicinal regimen was cleared.

| Candidate | Herb | Reviewed preparation scope |
| --- | --- | --- |
| research-pardo-170 | Solasi / Ocimum basilicum | Common-basil leaf food use; [species-level NParks page](https://www.nparks.gov.sg/florafaunaweb/flora/2/2/2274), not a Thai-basil cultivar substitution |
| research-pardo-171 | Lokoloko / Ocimum gratissimum | Reported Nigerian food use in the background of [Diyaolu et al.](https://doi.org/10.3390/foods10122913); not a cooking trial |
| research-pardo-172 | Balanay / Ocimum tenuiflorum | Leaf-food description from [NParks](https://www.nparks.gov.sg/florafaunaweb/flora/2/2/2275); historical Ocimum sanctum retained |
| research-pardo-174 | Romero / Salvia rosmarinus | Leaf seasoning and separate essential-oil caution from [NParks](https://www.nparks.gov.sg/florafaunaweb/flora/3/3/3338) |
| research-pardo-073 | Katuray / Sesbania grandiflora | Selected white-flower preparation in the [World Agroforestry food paragraph](https://apps.worldagroforestry.org/treedb2/speciesprofile.php?Spid=1519) |
| research-pardo-089 | Alibangbang / Piliostigma malabaricum | Young-leaf soup condiment in the [World Agroforestry profile](https://apps.worldagroforestry.org/treedb2/speciesprofile.php?Spid=17925), not a seed or bark recipe |
| research-pardo-091 | Kupang / Parkia timoriana | [Medhe et al. laboratory processing](https://doi.org/10.3390/foods11131822); missing numeric cooking endpoint and household-safety clearance remain held |
| research-pardo-215 | Nipa / Nypa fruticans | Selected young-seed dessert processing in [NParks](https://www.nparks.gov.sg/florafaunaweb/flora/2/6/2658), not sap fermentation or medicinal sheath tea |
| research-pardo-108 | Bottle gourd / Lagenaria siceraria | [NParks young-fruit cooking](https://www.nparks.gov.sg/florafaunaweb/flora/1/4/1441) paired with the [ICMR-associated human safety assessment](https://doi.org/10.4103/0971-5916.93424); bitter juice is not an endorsed remedy |
| research-pardo-112 | Luffa aegyptiaca | [GardeningSG young-fruit cooking](https://gardeningsg.nparks.gov.sg/gardening-resource-library/smooth-loofah/) and [NParks mature-fruit restriction](https://www.nparks.gov.sg/florafaunaweb/flora/4/8/4848) |

The accompanying JSON contains bounded preparation descriptions, species-specific citations, source-section limitations, raw-XML byte/hash evidence and retained review gaps. Clinical benefit claims in neighbouring botanical paragraphs, laboratory extraction protocols and cross-species recipes were not adopted.

## Retrieval and remaining gates

- The three PMC browser pages displayed access-check screens. They were not counted as full-text reads. The articles were separately retrieved through the public Europe PMC full-text XML API with bounded requests and directly inspected; no access challenge was solved or bypassed.
- Lokoloko's paper supplies background culinary reporting, not direct recipe validation. Its contamination and laboratory context is retained as a limitation.
- Kupang's method subsection lacks a numeric cooking time. The laboratory sequence remains a description on hold, not a home preparation guide.
- Source-limited preparation coverage now exists for the first thirty research candidates, including the earlier Talisay follow-up. The remaining twenty candidates still need preparation review. Coverage is not equivalent to clinical clearance, full content approval, media clearance or publication.
- Fresh all-state live duplicates, species/part/cultivar safety review, outstanding image holds and isolated PostgreSQL staging checks remain required. No new identity, photo, canonical import batch, database field, UI or Dr. Ai result was changed.
- Local raw XML stays outside Git. No credential was used or recorded; no commit, push or live write occurred.

## Validation

Eight new regression cases cover exact queue identity, honest counts, same-species citation support, basil/rosemary separation, selected food parts, laboratory-method holds, gourd/loofah safety exclusions and import refusal. The combined six-file preparation/research subset passed **67 tests**, 8.52 seconds. Strict TypeScript checking of the new test with strict optional/indexed-access settings, backend build and backend lint passed. New-file whitespace and narrow credential-pattern checks passed. The real Git index remained empty and HEAD unchanged; nothing was committed or pushed. These tests do not establish clinical safety or successful live staging.

The completed broad working-tree run passed **1,136 non-database tests across 83 files**, 57.84 seconds, with eighteen database-dependent suites explicitly excluded, an unused loopback database URL and an empty Gemini API key. It includes unrelated local research work and is not the reviewed eighteen-file release-bundle count. No real PostgreSQL staging/concurrency pass, remote CI result or live publication is claimed.

Next: review batches four and five with the same source and plant-part constraints. Keep the existing twenty live-placeholder preparation release separate and run its isolated PostgreSQL gate before any reviewed live application.
