# All fifty: preparation coverage and release handoff

Updated: 2026-10-06 (Asia/Manila). **Research coverage, not a release manifest.** All fifty unchanged candidate identities have been reviewed; none was staged or published by this batch.

## Honest totals

| Classification | Candidates |
| --- | ---: |
| Bounded food descriptions | 31 |
| Food descriptions or reported food uses held | 5 |
| Traditional or historical descriptions held | 4 |
| Laboratory descriptions held | 5 |
| Manufacturing description held | 1 |
| Methods not established | 4 |
| Total distinct reviewed candidates | 50 |

Zero complete household recipes, medicinal instructions cleared or publication approvals. The nineteen held/gap classifications are not additional safe preparations. The thirty-one food descriptions also retain clinical/part-specific, identity, media, duplicate and staging gates.

Talisay's separate kernel-processing review supersedes only its earlier missing preparation description, not its bark-safety review. The paired JSON preserves each candidate's source filename and raw/normalized classification; a regression recomputes all fifty rows and totals from the five batches plus that overlay.

## Complete candidate matrix

Rows follow the queue's five batches, not fifty live database additions.

| No. | Candidate / exact queue species | Candidate ID | Research status |
| --- | --- | --- | --- |
| 1 | Duhat / Syzygium cumini | `research-pardo-098` | Food description |
| 2 | Sampalok / Tamarindus indica | `research-pardo-088` | Food description |
| 3 | Atis / Annona squamosa | `research-pardo-005` | Food description |
| 4 | Talisay / Terminalia catappa | `research-pardo-094` | Food description |
| 5 | Butterfly pea / Clitoria ternatea | `research-pardo-077` | Food description |
| 6 | Mangga / Mangifera indica | `research-pardo-069` | Food description |
| 7 | Santol / Sandoricum koetjape | `research-pardo-063` | Food description |
| 8 | Papaya / Carica papaya | `research-pardo-104` | Food description |
| 9 | Granada / Punica granatum | `research-pardo-102` | Food description |
| 10 | Chico / Manilkara zapota | `research-pardo-137` | Food description |
| 11 | Mustasa / Brassica juncea | `research-pardo-014` | Food description |
| 12 | Radish / Raphanus sativus | `research-pardo-015` | Food description |
| 13 | Olasiman / Portulaca oleracea | `research-pardo-020` | Food description |
| 14 | Cacao / Theobroma cacao | `research-pardo-044` | Food description |
| 15 | Linga / Sesamum indicum | `research-pardo-159` | Traditional held |
| 16 | Niog / Cocos nucifera | `research-pardo-214` | Food description |
| 17 | Maize / Zea mays | `research-pardo-217` | Traditional held |
| 18 | Tubo / Saccharum officinarum | `research-pardo-219` | Food description |
| 19 | Fennel / Foeniculum vulgare | `research-pardo-119` | Traditional held |
| 20 | Paminta / Piper nigrum | `research-pardo-184` | Food description |
| 21 | Solasi / Ocimum basilicum | `research-pardo-170` | Food description |
| 22 | Lokoloko / Ocimum gratissimum | `research-pardo-171` | Food/report held |
| 23 | Balanay / Ocimum tenuiflorum | `research-pardo-172` | Food description |
| 24 | Romero / Salvia rosmarinus | `research-pardo-174` | Food description |
| 25 | Katuray / Sesbania grandiflora | `research-pardo-073` | Food description |
| 26 | Alibangbang / Piliostigma malabaricum | `research-pardo-089` | Food description |
| 27 | Kupang / Parkia timoriana | `research-pardo-091` | Laboratory held |
| 28 | Nipa / Nypa fruticans | `research-pardo-215` | Food description |
| 29 | Bottle gourd / Lagenaria siceraria | `research-pardo-108` | Food description |
| 30 | Luffa aegyptiaca / Luffa aegyptiaca | `research-pardo-112` | Food description |
| 31 | Santan / Ixora coccinea | `research-pardo-124` | Method missing |
| 32 | Sampaguita / Jasminum sambac | `research-pardo-139` | Manufacturing held |
| 33 | Kabiki / Mimusops elengi | `research-pardo-138` | Method missing |
| 34 | Balibago / Hibiscus tiliaceus | `research-pardo-033` | Method missing |
| 35 | Thespesia populnea / Thespesia populnea | `research-pardo-035` | Food description |
| 36 | Doldol / Ceiba pentandra | `research-pardo-038` | Food description |
| 37 | Kalumpang / Sterculia foetida | `research-pardo-039` | Laboratory held |
| 38 | Manzanitas / Ziziphus mauritiana | `research-pardo-067` | Food description |
| 39 | Asana / Pterocarpus indicus | `research-pardo-079` | Laboratory held |
| 40 | Coffee / Coffea arabica | `research-pardo-125` | Food description |
| 41 | Kamias / Averrhoa bilimbi | `research-pardo-047` | Food/report held |
| 42 | Balimbing / Averrhoa carambola | `research-pardo-048` | Food/report held |
| 43 | Kasuy / Anacardium occidentale | `research-pardo-070` | Food description |
| 44 | Bankundo / Morinda citrifolia | `research-pardo-126` | Traditional held |
| 45 | Oxalis corniculata / Oxalis corniculata | `research-pardo-045` | Food/report held |
| 46 | Kahel / Citrus aurantium | `research-pardo-054` | Food description |
| 47 | Tsampaka / Magnolia champaca | `research-pardo-003` | Method missing |
| 48 | Abutilon indicum / Abutilon indicum | `research-pardo-030` | Laboratory held |
| 49 | Kastuli / Abelmoschus moschatus | `research-pardo-032` | Food/report held |
| 50 | Ayapana / Ayapana triplinervis | `research-pardo-130` | Laboratory held |

## Four unresolved methods

- Santan: the reviewed Ixora lead names a genus, not the exact species.
- Kabiki: edible fruit flesh is identified, but its preparation process is not established.
- Balibago: vegetable use is reported without an explicit cooking method.
- Tsampaka: inconsistent retraction-link metadata is quarantined. The linked notice concerns cinnamon oil, not the original Magnolia paper. Retraction status of that paper is unconfirmed; no method is adopted.

Other held descriptions retain their own safety/part/cultivar limitations. No cooking-based detoxification, human dose, home solvent extraction, newborn-feeding regimen or essential-oil ingestion is inferred.

## Evidence locations

- `HERB_FIRST_TEN_PREPARATION_SUPPLEMENT_2026-10-05.json` and `TALISAY_PREPARATION_FOLLOW_UP_2026-10-05.json`: first-ten preparation evidence plus the separate Talisay overlay.
- `HERB_SECOND_TEN_CONTENT_REVIEW_2026-10-05.json`: second-ten food and held historical/draft evidence.
- `HERB_THIRD_TEN_PREPARATION_REVIEW_2026-10-05.json`: third-ten food, reported-use and laboratory boundaries.
- `HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json`: fourth-ten manufacturing/laboratory holds and three method gaps.
- `HERB_FIFTH_TEN_PREPARATION_REVIEW_2026-10-06.json` and its Markdown report: final-ten source reads, warnings and metadata quarantine.
- `HERB_FIFTY_PREPARATION_COVERAGE_2026-10-06.json`: all fifty source pointers; rejected by the production preparation-plan parser.

Original safety, taxonomy and media ledgers remain applicable. Source links and retrieval limitations are recorded in each batch report; these are not invented clinical recipes.

## Prior live evidence is separate

The last recorded October 5 API audit returned 38 published herbs, twenty unchanged generic preparations, zero blank fields and eighteen specific/restricted notes. This is prior evidence, **not a fresh October 6 live query**. The new fifty-candidate queue is separate from that catalog.

Prior media evidence records 37/50 actual expansion uploads and thirteen missing/replacement-cover holds. This batch uploaded nothing and did not re-verify those deliveries. An image lead is not an upload; an upload is not a Neon herb row.

## Required next work

1. Run the existing updater's eight real PostgreSQL checks in isolation: atomic rollback, audit consistency, active reviewer, concurrent writes and snapshot protection. October 6 availability checks found no Docker/PostgreSQL command or service. Non-database passes do not substitute.
2. Review the twenty-generic-preparation updater separately. Its schema intentionally refuses these research ledgers; do not broaden it to force unsafe or already-populated proposals through.
3. Take a fresh all-state snapshot of the confirmed live Neon target. Check scientific names, synonyms, drafts and suggestions for duplicates. Never use the differently targeted local connection or expose credentials.
4. Resolve taxonomy, cultivar, plant-part/clinical safety, four method gaps and thirteen media holds. Retain explicit restrictions or held records where reliable evidence is unavailable.
5. Stage only a genuinely reviewed subset in isolation, validating rollback and concurrent-duplicate protection. Fifty reviewed candidates is not authorization to publish all fifty.
6. After a reviewed release, verify Library preparations/citations/images, responsive display, search/categories and Dr. Ai retrieval. Rebuild embeddings only from approved changed content; observe actual retrieval before marking it passed.

## Observed local validation

Eleven new evidence-contract tests passed in a focused 71-test run. The final broader dirty-working-tree run passed 1,155 tests across 85 files, exit 0, 54.35 seconds, excluding eighteen database suites. Strict test TypeScript checking, backend build and source lint passed. These are bookkeeping/code checks, not medical approval, real PostgreSQL validation or a clean selective-release bundle.

No remote CI, live import, live AI call, authenticated user-flow check, physical-device check or participant result is claimed. Raw downloaded XML stays outside Git. No credentials, local fixture media or unrelated changes were staged. No commit or push occurred.
