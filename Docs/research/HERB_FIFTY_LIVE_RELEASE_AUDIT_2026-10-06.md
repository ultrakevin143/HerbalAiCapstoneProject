# Fifty-herb live release audit — 6 October 2026

**Later local follow-up:** `Docs/research/HERB_FIRST_TEN_FIELD_REPAIR_2026-10-06.md` records the planner repair that retains the ten sourced preparation descriptions, combines citations and adds limited Talisay bark-study warning citations. The earlier audit below remains a time-bound checkpoint: its statement that Talisay's original review lacks a safety citation refers to that preserved original ledger. Human safety, publication and live-data gates remain unresolved; no new herb was published by the follow-up.

## Release decision

**Occurrence follow-up:** `Docs/research/HERB_FIRST_TEN_OCCURRENCE_REPAIR_2026-10-06.md` records ten source-bound region descriptions in the local read-only draft plan. No candidate was inserted or published. Historical audit findings below are not silently rewritten as current live evidence.

**The requested fifty new herbs are not complete and have not been published.** The live read-only snapshot contains 38 Herb rows and 17 SuggestedHerb rows; the public catalog contains the same 38 herbs. None of the fifty candidates matched those stored identities using the queued synonyms, reviewed name proposals and stored local aliases. This is a scoped comparison, not exhaustive taxonomic proof or a concurrency guarantee.

The separate update to twenty existing herbs **is already live**, as documented in `Docs/testing/HERB_PREPARATION_LIVE_RELEASE_2026-10-06.md`. It must not be described as publication of the fifty-herb expansion.

No database writes, new image uploads, Git commit or Git push were performed in this audit. Publishing incomplete medicinal records merely to reach fifty would not meet the user's requirement for accurate, sourced details.

## What was checked

- Every one of the fifty queued identities and its exact historical entry/page was matched to a preparation ledger. The Talisay supplement was applied as a read-only audit overlay, not a rewrite of the original queue.
- Recorded preparation source IDs were resolved within their owning ledgers. Quarantined Magnolia evidence remains a research-gap citation, not an accepted preparation citation.
- All-state duplicate comparison included all 38 Herb and 17 SuggestedHerb identities, including non-public states if present, queued scientific synonyms and the separate Mustasa/Radish modern-name proposals.
- All 37 selected Cloudinary URLs returned successful image delivery and matched their recorded original SHA-256 bytes. No new decoding, visual inspection or license re-verification was performed; the original individual provenance and CC0 evidence remain in the media ledgers.
- Public and database values matched for local/scientific name, category, uses, preparation, dosage, region, warnings and image URL across all 38 existing records.
- Existing public preparation fields: **zero blank** and **zero occurrences of the former exact generic baseline**. This does not mean every herb has a validated home-treatment recipe.

Audit assembly time: `2026-10-06T05:44:52.741Z`. Database snapshot: `2026-10-06T03:10:37.503Z`. Each image check has its own recorded timestamp in the JSON. These observations are time-bound, not continuously monitored.

## Completion counts

| Check | Observed result |
| --- | --- |
| Fifty candidates accounted for | 50/50 |
| Matching live stored identities | 0 |
| Complete first-ten content research drafts | 10/50; drafts are not final approval |
| Candidates without equivalent full content drafts | 40/50 |
| Bounded food-preparation descriptions | 31 |
| Other held food/traditional/laboratory/manufacturing descriptions | 15 |
| Exact-species preparation method not established in adopted ledgers | 4 |
| Complete, cleared medicinal household recipes | 0 |
| Selected uploaded covers with matching delivered bytes | 37/50 |
| Missing selected uploaded covers | 13/50 |
| Complete reviewed import manifests | 0 |
| Candidates cleared for public release | 0 |

The missing recipe count is **not** permission to invent quantities, water ratios, cooking duration or medicinal doses. Food processing, animal extraction and historical practice cannot automatically become home-treatment instructions.

## Existing live catalog findings

The complete read-only identity and content/source snapshot was rechecked at `2026-10-06T05:49:58.971Z`: all identities, all 38 content/source rows, all counts and the public-field comparison remained unchanged. Receipt: `C:/Users/Hp/Documents/herb-expansion-live-recheck-2026-10-06-1791265805405.json`. No writes occurred during either check.

1. **Kalingag has no image URL.** Its existing placeholder is not a failed Cloudinary delivery. An accurate, individually cleared image is still needed if a real cover is required.
2. **Tanglad, Indian Heliotrope and Gumamela have no stored embedding.** This is a vector-retrieval coverage gap, not proof they can never be returned through name/catalog fallback. Their live AI retrieval was not retested in this audit.
3. **Source-field metadata needs review.** One uses field, two preparation fields, 26 dosage fields and 28 warning fields lack an explicit source `supports` tag for that exact field. Some dosage text deliberately says a safe human regimen is not established; these counts are not proof that 26 actual dosage recommendations lack evidence. Do not add citation tags without reading the relevant source. The JSON lists every affected record.
4. **Separate known Dr. Ai context repair remains local.** The prior live check found that a general Centella preparation question omitted existing frequency/duration while a directly phrased frequency question retrieved it correctly. Its one-line repair and regression results are in the existing preparation release report; this audit did not deploy it.

## Candidate-by-candidate preparation and media matrix

Descriptions, plant parts, citation IDs, owning ledger, historical page, content-draft status and individual image-check timestamps are recorded for **all fifty** in the accompanying JSON. In this table, “uploaded” means delivered bytes matched, not final content/publication clearance.

| Batch | Herb | Scientific name | Adopted preparation research | Cover | Full content draft |
| --- | --- | --- | --- | --- | --- |
| 1 | Duhat | Syzygium cumini | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Sampalok | Tamarindus indica | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Atis | Annona squamosa | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Talisay | Terminalia catappa | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Butterfly pea | Clitoria ternatea | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Mangga | Mangifera indica | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Santol | Sandoricum koetjape | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Papaya | Carica papaya | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Granada | Punica granatum | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 1 | Chico | Manilkara zapota | FOOD_DESCRIPTION | Uploaded; bytes match | Present; held |
| 2 | Mustasa | Brassica juncea | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 2 | Radish | Raphanus sativus | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 2 | Olasiman | Portulaca oleracea | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 2 | Cacao | Theobroma cacao | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 2 | Linga | Sesamum indicum | HISTORICAL_DESCRIPTION_WITHHELD | Uploaded; bytes match | Not complete |
| 2 | Niog | Cocos nucifera | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 2 | Maize | Zea mays | DRAFT_TRADITIONAL_DESCRIPTION | Uploaded; bytes match | Not complete |
| 2 | Tubo | Saccharum officinarum | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 2 | Fennel | Foeniculum vulgare | HISTORICAL_DESCRIPTION_WITHHELD | Uploaded; bytes match | Not complete |
| 2 | Paminta | Piper nigrum | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 3 | Solasi | Ocimum basilicum | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 3 | Lokoloko | Ocimum gratissimum | REPORTED_FOOD_USE_DESCRIPTION | Missing selected cover | Not complete |
| 3 | Balanay | Ocimum tenuiflorum | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 3 | Romero | Salvia rosmarinus | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 3 | Katuray | Sesbania grandiflora | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 3 | Alibangbang | Piliostigma malabaricum | FOOD_DESCRIPTION | Missing selected cover | Not complete |
| 3 | Kupang | Parkia timoriana | LABORATORY_FOOD_PROCESSING_DESCRIPTION_HELD | Missing selected cover | Not complete |
| 3 | Nipa | Nypa fruticans | FOOD_DESCRIPTION | Missing selected cover | Not complete |
| 3 | Bottle gourd | Lagenaria siceraria | FOOD_DESCRIPTION | Missing selected cover | Not complete |
| 3 | Luffa aegyptiaca | Luffa aegyptiaca | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 4 | Santan | Ixora coccinea | METHOD_NOT_ESTABLISHED | Uploaded; bytes match | Not complete |
| 4 | Sampaguita | Jasminum sambac | MANUFACTURING_DESCRIPTION_HELD | Uploaded; bytes match | Not complete |
| 4 | Kabiki | Mimusops elengi | METHOD_NOT_ESTABLISHED | Missing selected cover | Not complete |
| 4 | Balibago | Hibiscus tiliaceus | METHOD_NOT_ESTABLISHED | Missing selected cover | Not complete |
| 4 | Thespesia populnea | Thespesia populnea | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 4 | Doldol | Ceiba pentandra | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 4 | Kalumpang | Sterculia foetida | LABORATORY_DESCRIPTION_HELD | Uploaded; bytes match | Not complete |
| 4 | Manzanitas | Ziziphus mauritiana | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 4 | Asana | Pterocarpus indicus | LABORATORY_DESCRIPTION_HELD | Missing selected cover | Not complete |
| 4 | Coffee | Coffea arabica | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 5 | Kamias | Averrhoa bilimbi | FOOD_DESCRIPTION_HELD | Missing selected cover | Not complete |
| 5 | Balimbing | Averrhoa carambola | FOOD_DESCRIPTION_HELD | Uploaded; bytes match | Not complete |
| 5 | Kasuy | Anacardium occidentale | FOOD_DESCRIPTION | Uploaded; bytes match | Not complete |
| 5 | Bankundo | Morinda citrifolia | TRADITIONAL_DESCRIPTION_HELD | Uploaded; bytes match | Not complete |
| 5 | Oxalis corniculata | Oxalis corniculata | REPORTED_FOOD_USE_DESCRIPTION_HELD | Uploaded; bytes match | Not complete |
| 5 | Kahel | Citrus aurantium | FOOD_DESCRIPTION | Missing selected cover | Not complete |
| 5 | Tsampaka | Magnolia champaca | METHOD_NOT_ESTABLISHED | Uploaded; bytes match | Not complete |
| 5 | Abutilon indicum | Abutilon indicum | LABORATORY_DESCRIPTION_HELD | Missing selected cover | Not complete |
| 5 | Kastuli | Abelmoschus moschatus | REPORTED_FOOD_USE_DESCRIPTION_HELD | Missing selected cover | Not complete |
| 5 | Ayapana | Ayapana triplinervis | LABORATORY_DESCRIPTION_HELD | Missing selected cover | Not complete |

## Specific unresolved preparation and identity gates

- **Santan — Ixora coccinea:** the reviewed Ixora-genus food paragraph does not establish the exact species/cultivar. Do not copy genus-level tempura instructions.
- **Kabiki — Mimusops elengi:** reported fruit edibility does not itself provide a preparation process or safe medicinal regimen. Historical intranasal bark treatments were not adopted.
- **Balibago — Hibiscus tiliaceus:** do not borrow Hibiscus sabdariffa preparation. The reviewed leaf-wrapper/fodder statements are not equivalent to preparing this species as medicine.
- **Tsampaka — Magnolia champaca:** the previously quarantined metadata remains unresolved. A different [2022 primary study](https://doi.org/10.1080/13880209.2022.2101669) was retrieved as full-text XML and describes laboratory leaf extraction under the synonym Michelia champaca in an animal experiment. It was recorded only as a new research lead: no human recipe, treatment dose or clinical safety was adopted.
- **Mustasa/Radish:** reconcile the recorded modern-name proposals with the exact crop identity and occurrence evidence before final manifest creation. The historical queue was preserved.
- **Kahel:** reconcile the historical bitter-orange concept; an accepted-name lookup alone does not resolve the intended crop or clear a photo.
- **Talisay:** the kernel-food-processing overlay does not clear the earlier bark-safety question; the first-ten safety draft still has no accepted safety citation for that unresolved claim.

## Missing selected uploaded covers

- Lokoloko — Ocimum gratissimum
- Alibangbang — Piliostigma malabaricum
- Kupang — Parkia timoriana
- Nipa — Nypa fruticans
- Bottle gourd — Lagenaria siceraria
- Kabiki — Mimusops elengi
- Balibago — Hibiscus tiliaceus
- Asana — Pterocarpus indicus
- Kamias — Averrhoa bilimbi
- Kahel — Citrus aurantium
- Abutilon indicum — Abutilon indicum
- Kastuli — Abelmoschus moschatus
- Ayapana — Ayapana triplinervis

## Next work, in release order

1. Complete the first-ten field-linked manifest and safety review, beginning with the unresolved Talisay warning. Finish the remaining forty full content drafts, including Philippine occurrence and explicit “not established” limits where evidence does not supply a safe dose. Do not fabricate a therapeutic category, region or recipe.
2. Resolve the four preparation gaps using exact-species and plant-part primary sources. If no usable human preparation exists, keep the record held or explicitly withhold instructions; a food/laboratory paragraph is not a medicinal recipe.
3. Select, visually inspect, individually license-check and upload the thirteen missing covers. Separately address the existing Kalingag placeholder.
4. Review existing source-field metadata and create the three missing live embeddings using actual approved text. Preserve original text, sources, vectors and audit history for rollback.
5. Test a dedicated new-record import in isolated PostgreSQL, including rollback and concurrent Herb/SuggestedHerb duplicate handling. The current first-ten planner is read-only; the twenty-existing-record updater is not a fifty-record importer. Local PostgreSQL/Docker is absent, so these tests are not claimed passed.
6. Generate genuine embeddings for approved new records, take a fresh all-state snapshot inside the guarded import transaction, and publish only the fully reviewed subset with correct audit ownership and source rows.
7. Reconcile each published record through the public API and Library, check the real cover and preparation/source sections, and test Dr. Ai exact-name/synonym retrieval without converting withheld preparations into recipes. Release the separate tested AI context fix as a focused reviewed code change.

The requested “push live” is therefore blocked by unfinished content and import validation, not merely by a missing Git push. No blanket bootstrap or broad dirty-worktree push was performed.

## Evidence files

- `Docs/research/HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json`
- `C:/Users/Hp/Documents/herb-expansion-live-audit-2026-10-06-1791256241360.json` — credential-free, read-only identity/content snapshot saved outside Git.
- `C:/Users/Hp/Documents/herb-expansion-media-audit-2026-10-06-1791256332301.json` — individual Cloudinary delivery checks saved outside Git.
- Original five preparation ledgers, first-ten full-content ledger, Talisay overlay and individual photo/taxonomy ledgers referenced by the JSON.

## Validation

The new eight evidence-consistency tests and the existing focused expansion/preparation/RAG checks passed: **11 files, 140 tests**, duration 45.73 seconds. These are static-ledger and mocked-service checks, not actual PostgreSQL staging or human medicinal review.

Backend ESLint and TypeScript build also passed. The Git index remains empty; no commit, push, application deployment or database write was performed in this audit. Unrelated working-tree changes were preserved.

An earlier broad `tests/herb-` filter also selected database-backed suites. It was interrupted after unavailable-loopback-database failures and an isolated-runner subprocess timeout; it is **not a passing full-suite result**. Its test database was explicitly set to unreachable `127.0.0.1:1`, not the live Neon endpoint. The focused run excluded those unavailable database suites. No isolated expansion import or rollback test is claimed completed.
