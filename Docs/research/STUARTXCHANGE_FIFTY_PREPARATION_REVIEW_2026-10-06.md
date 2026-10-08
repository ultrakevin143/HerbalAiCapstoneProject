# StuartXchange review and detailed-herb plan

Reviewed: 2026-10-06

Status: Research only; not a release manifest.

Scope: All 50 candidates in expansion-batch-03.review.json. No production writes, uploads, commits, or pushes in this review.

## Observed results

- Located species-heading or recorded-synonym preparation leads for 48 candidates.
- Held two candidates because the selected common-name pages describe different taxa: Lokoloko and Manzanitas.
- Found additional secondary preparation-form leads for all four previously missing-method candidates: Santan, Kabiki, Balibago, and Tsampaka. This closes discovery gaps only, not clinical or publication clearance.
- Rechecked the public API at 2026-10-06T15:46:44.109Z: HTTP 200, 38 returned public records, zero blank preparationMethod fields. A nonblank field does not mean a verified step-by-step medicinal recipe.
- The previous release audit reports 10 full draft plans, 40 incomplete candidates, 37 selected delivered covers and 13 missing covers. Those are previous audit findings, not fresh media or private database checks in this review.
- Zero new medicinal instructions, beginner procedures, or candidates were cleared for publication.

The public API observation is not proof that there are no duplicates among private DRAFT, HOLD, ARCHIVED or SuggestedHerb records. A new all-state duplicate check against the confirmed live target is still necessary before writing.

## Detailed records, without copying a website

The user's requested level of detail is appropriate for an educational library. The existing styling can remain. Use concise summaries and an expanded, source-linked detail view rather than loading long research text into every library card.

Proposed sections:

1. **Identity and local names:** accepted scientific name with author; source-used synonym; family; preferred local name; regional aliases with the source's language label. Bis. does not automatically mean Cebuano. Keep a photograph tied to the verified species and its original license.
2. **Plant description and Philippine occurrence:** diagnostic features and distribution, each with botanical or Philippine occurrence evidence. Do not infer nationwide occurrence from one local ethnobotanical report.
3. **Parts used and preparation:** link each preparation to its actual plant part, source, route, population and evidence level. Separate ordinary food preparation from medicinal use. List historical preparations descriptively, not as recommendations.
4. **Beginner steps:** expose procedural instructions only where the exact source and safety review support them. Do not supply missing amounts, timing, temperature, storage duration, frequency or patient group. A method name such as decoction is not enough to manufacture a recipe.
5. **Dosage and limitations:** preserve the original population and units when supported. Otherwise explicitly state that a validated human dose has not been established. No synthetic child, pregnancy or chronic-disease dosing.
6. **Warnings:** distinguish toxicity, allergy, interactions, vulnerable groups and unverified safety. Do not promote eye drops, poisoning antidotes, invasive preparations, obstetric procedures or hazardous seed remedies simply because a historical page lists them.
7. **Evidence and references:** separate reported traditional practice, laboratory/animal findings and human evidence. Include field-level source links, access date, reviewer and review date. More studies do not automatically mean stronger clinical evidence.

Current Herb/HerbSource fields already support medicinalUses, preparationMethod, dosage, warnings, sourceScientificName, evidenceClass, review metadata and source supports. They do not currently have dedicated family, plant-part, multilingual-alias or structured-step columns. Do not claim those sections are implemented. Add schema/API/UI extensions separately if those structured sections are approved; do not overload cebuanoName with every language.

### Example of the intended preparation distinction

For Talisay (Terminalia catappa), StuartXchange describes bark decoctions and leaf preparations in oil as traditional practices. Those are source leads, not a safe household medicinal recipe. Its edible-kernel description is a separate food use. Do not convert the bark method into numbered beginner steps unless an exact applicable source and safety review support it. This example is editorial guidance, not new database content. [Talisay source](https://www.stuartxchange.org/Talisay)

## All-50 preparation-form discovery matrix

These are brief original research notes, not public treatment instructions. Every row remains held for publication. A linked page is not a botanical authority or a complete clinical review.

| Batch | Queued local name | Queued scientific name | Preparation-form discovery note | Page |
| --- | --- | --- | --- | --- |
| 1 | Duhat | Syzygium cumini | Ripe fruit as food; reported bark decoctions and dried-seed powder. | [Source lead](https://www.stuartxchange.org/Duhat) |
| 1 | Sampalok | Tamarindus indica | Fruit pulp in dishes and preserves; reported leaf baths and bark decoctions. | [Source lead](https://www.stuartxchange.org/Sampalok) |
| 1 | Atis | Annona squamosa | Ripe fruit as food; reported leaf or bark preparations. Seed remedies excluded from procedural reuse. | [Source lead](https://www.stuartxchange.org/Atis) |
| 1 | Talisay | Terminalia catappa | Edible kernels; reported bark decoction and leaf preparations in oil. | [Source lead](https://www.stuartxchange.org/Talisay) |
| 1 | Butterfly pea | Clitoria ternatea | Flower food colouring and tea; reported leaf poultices and infusions. Root and seed procedures held. | [Source lead](https://www.stuartxchange.org/Pukingan) |
| 1 | Mangga | Mangifera indica | Fruit foods and preserves; reported young-leaf infusion and bark decoction. | [Source lead](https://www.stuartxchange.org/Mangga.html) |
| 1 | Santol | Sandoricum koetjape | Fruit preserves; reported leaf infusion or decoction for baths and bark poultice. | [Source lead](https://www.stuartxchange.org/Santol) |
| 1 | Papaya | Carica papaya | Fruit foods and pickles; reported leaf poultices and root or leaf decoctions. | [Source lead](https://www.stuartxchange.org/Papaya) |
| 1 | Granada | Punica granatum | Fruit products; reported root-bark and rind decoctions. Toxicity review required. | [Source lead](https://www.stuartxchange.org/Granada) |
| 1 | Chico | Manilkara zapota | Fruit food; reported bark decoction, leaf compress, and seed-kernel oil. | [Source lead](https://www.stuartxchange.org/Chico) |
| 2 | Mustasa | Brassica juncea | Leaf vegetables and pickles; reported leaf or seed poultices. Irritant preparations held. | [Source lead](https://www.stuartxchange.org/Mustasa) |
| 2 | Radish | Raphanus sativus | Raw or cooked vegetable; reported leaf or root decoctions. | [Source lead](https://www.stuartxchange.org/Labanos) |
| 2 | Olasiman | Portulaca oleracea | Salad leaves; reported pounded-leaf poultices and leaf decoction. | [Source lead](https://www.stuartxchange.org/Gulasiman.html) |
| 2 | Cacao | Theobroma cacao | Roasted seeds and fruit pulp foods; reported fruit poultice and root decoction. | [Source lead](https://www.stuartxchange.org/Kakaw) |
| 2 | Linga | Sesamum indicum | Roasted seed foods and seed oil; reported seed decoction and leaf mucilage. | [Source lead](https://www.stuartxchange.org/Linga) |
| 2 | Niog | Cocos nucifera | Coconut flesh, cream and cooking oil; reported topical oil and root preparations. | [Source lead](https://www.stuartxchange.org/Niyog2) |
| 2 | Maize | Zea mays | Seed foods and cooking oil; reported corn-silk or cob decoction and infusion. | [Source lead](https://www.stuartxchange.org/Mais) |
| 2 | Tubo | Saccharum officinarum | Stem foods and sugar products; reported root or leaf decoction. | [Source lead](https://www.stuartxchange.org/Tubo.html) |
| 2 | Fennel | Foeniculum vulgare | Food flavouring; reported fruit or seed infusion. | [Source lead](https://www.stuartxchange.org/Haras) |
| 2 | Paminta | Piper nigrum | Dried peppercorn condiment; reported decoction mouthwash and leaf preparations in oil. | [Source lead](https://www.stuartxchange.org/Paminta) |
| 3 | Solasi | Ocimum basilicum | Leaf condiment; reported herb infusion or decoction and seed poultice. | [Source lead](https://www.stuartxchange.org/Balanoy) |
| 3 | Lokoloko | Ocimum gratissimum | Do not transfer preparation from this different taxon. | [Rejected page](https://www.stuartxchange.org/Malasulasi) |
| 3 | Balanay | Ocimum tenuiflorum | Reported leaf tea, leaf baths and root or leaf decoctions. | [Source lead](https://www.stuartxchange.org/Sulasi.html) |
| 3 | Romero | Salvia rosmarinus | Leaf condiment; reported herb decoctions, leaf infusion and oil preparations. | [Source lead](https://www.stuartxchange.org/Romero) |
| 3 | Katuray | Sesbania grandiflora | Cooked flowers and leaves; reported bark decoction and leaf poultice. | [Source lead](https://www.stuartxchange.org/Katurai) |
| 3 | Alibangbang | Piliostigma malabaricum | Young leaves as food flavouring; reported flower infusion, root-bark decoction and leaf paste. | [Source lead](https://www.stuartxchange.org/Alambangbang.html) |
| 3 | Kupang | Parkia timoriana | Processed seed and pod foods; reported bark decoctions and powdered-seed external preparations. | [Source lead](https://www.stuartxchange.org/Kopag) |
| 3 | Nipa | Nypa fruticans | Young seed food and sap products; reported fresh-leaf decoction or cataplasm. | [Source lead](https://www.stuartxchange.org/Nipa) |
| 3 | Bottle gourd | Lagenaria siceraria | Cooked fruit food; reported seed poultice and leaf preparations. Bitter-fruit hazards require review. | [Source lead](https://www.stuartxchange.org/Upo) |
| 3 | Luffa aegyptiaca | Luffa aegyptiaca | Fruit as vegetable; reported seed infusions and oil preparations held as high-risk. | [Source lead](https://www.stuartxchange.org/PatolangBilog.html) |
| 4 | Santan | Ixora coccinea | Reported root or flower decoctions, root tincture and leaf or stem poultice. | [Source lead](https://www.stuartxchange.org/Santan.html) |
| 4 | Sampaguita | Jasminum sambac | Flower tea scenting; reported flower or leaf decoctions and root poultice. | [Source lead](https://www.stuartxchange.org/Sampagita) |
| 4 | Kabiki | Mimusops elengi | Reported bark decoctions, inner-bark infusion and boiled-leaf compress. | [Source lead](https://www.stuartxchange.org/Kabiki) |
| 4 | Balibago | Hibiscus tiliaceus | Reported fresh-bark maceration, root infusion or decoction and leaf preparations. | [Source lead](https://www.stuartxchange.org/Malabago) |
| 4 | Thespesia populnea | Thespesia populnea | Reported bark or leaf decoctions and ground-bark topical preparations. | [Source lead](https://www.stuartxchange.org/Banago) |
| 4 | Doldol | Ceiba pentandra | Young-leaf foods; reported bark decoction and leaf infusion. | [Source lead](https://www.stuartxchange.org/Buboi) |
| 4 | Kalumpang | Sterculia foetida | Reported bark or leaf decoction and seed-oil preparations. Raw-seed food claims held. | [Source lead](https://www.stuartxchange.org/Kalumpang) |
| 4 | Manzanitas | Ziziphus mauritiana | Do not transfer preparation from this different taxon. | [Rejected page](https://www.stuartxchange.org/Mansanitas) |
| 4 | Asana | Pterocarpus indicus | Reported leaf infusion, shredded-bark decoction and wood decoction. | [Source lead](https://www.stuartxchange.org/Narra) |
| 4 | Coffee | Coffea arabica | Reported roasted-leaf infusion or decoction; existing food draft separately covers coffee beverages. | [Source lead](https://www.stuartxchange.org/Kape.html) |
| 5 | Kamias | Averrhoa bilimbi | Fruit food souring and preserves; reported leaf paste and flower infusion. Concentrated juice held. | [Source lead](https://www.stuartxchange.org/Kamias) |
| 5 | Balimbing | Averrhoa carambola | Fruit foods and preserves; reported leaf or fruit decoctions. Kidney-disease warning required. | [Source lead](https://www.stuartxchange.org/Balimbing) |
| 5 | Kasuy | Anacardium occidentale | Commercially prepared kernel foods; reported bark or leaf infusion and decoction. Shell-oil procedures held. | [Source lead](https://www.stuartxchange.org/Kasuy) |
| 5 | Bankundo | Morinda citrifolia | Reported fruit foods and juices, heated leaves and leaf or stem-bark decoction. | [Source lead](https://www.stuartxchange.org/Apatot) |
| 5 | Oxalis corniculata | Oxalis corniculata | Reported salad leaves, leaf juice or poultice and plant decoction. Oxalate safety review required. | [Source lead](https://www.stuartxchange.org/TaingangDaga) |
| 5 | Kahel | Citrus aurantium | Peel marmalade and flower flavouring; reported rind decoction and flower-water preparations. | [Source lead](https://www.stuartxchange.org/Dalandan) |
| 5 | Tsampaka | Magnolia champaca | Reported bark decoction, flower infusion or decoction and leaves mixed with oil. | [Source lead](https://www.stuartxchange.org/TsampakangPula.html) |
| 5 | Abutilon indicum | Abutilon indicum | Reported leaf decoction, root infusion and leaf or flower external preparations. | [Source lead](https://www.stuartxchange.org/Malbas) |
| 5 | Kastuli | Abelmoschus moschatus | Reported seed or root decoction, seed infusion and leaf or root poultice. | [Source lead](https://www.stuartxchange.org/Kastuli) |
| 5 | Ayapana | Ayapana triplinervis | Reported leaf or stem infusions, decoctions and leaf poultice. | [Source lead](https://www.stuartxchange.org/Ayapana) |

## Identity errors avoided

- ButterflyPea describes Centrosema pubescens. Use Pukingan for the queued Clitoria ternatea, not the similarly named plant.
- Alibangbang describes Bauhinia monandra. Alambangbang.html is the relevant Piliostigma malabaricum lead.
- Kupang describes Parkia javanica. Kopag is the relevant Parkia timoriana lead; do not assume shared Tree bean names make them identical.
- Niyog and Niyog2 refer to different plants; coconut must not inherit Niyog-niyogan material.
- Patola.html describes Luffa acutangula; PatolangBilog.html contains the Luffa cylindrica/aegyptiaca lead.
- Malasulasi describes Leptospermum polygalifolium, not Ocimum gratissimum. Sulasi is Ocimum tenuiflorum. The latter's Loko-loko alias is not permission to merge the queue's two basil taxa.
- Mansanitas is headed Ziziphus jujuba Mill., not queued Ziziphus mauritiana. [Kew's Ziziphus jujuba (L.) Gaertn. record](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A77392808-1) concerns a different author-qualified name. Neither should be merged with the existing Aratiles/Muntingia calabura merely because Mansanitas is shared.
- Paminta's page says family Arecaceae, but [Kew places Piper nigrum in Piperaceae](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A682369-1).
- Malbas's page says family Myrtaceae, but [Kew places Abutilon indicum in Malvaceae](https://powo.science.kew.org/taxon/1101632-2).

## Safety cross-checks

- Atis: a human case series reports toxic eye injury from seed exposure. Historical seed remedies must not become public beginner procedures. [Original case series](https://pmc.ncbi.nlm.nih.gov/articles/PMC5056555/)
- Granada: NCCIH distinguishes juice from roots, stems and peel; large quantities of those parts may be harmful. Their historical preparations cannot inherit fruit-juice safety. [NCCIH](https://www.nccih.nih.gov/health/pomegranate)
- Kamias: a human case series reports oxalate-related acute kidney injury after concentrated fruit juice ingestion. Do not recommend concentrated juice as medicine. [Original case series](https://pmc.ncbi.nlm.nih.gov/articles/PMC3741977/)
- Balimbing: people with kidney disease are advised to avoid starfruit because of potentially serious toxicity. [National Kidney Foundation](https://www.kidney.org/kidney-topics/why-you-should-avoid-eating-starfruit)

The site includes folklore from several countries and studies on different taxa, plant parts and laboratory extracts. Its long study list is not automatically evidence for the exact household method. Read original references before adopting a medical claim; a title-only or animal-study match is insufficient.

## Attribution and media

[StuartXchange's reuse warning](https://www.stuartxchange.org/Plagiarism) expressly objects to copying the compilation under a blanket fair-use claim. This review saves short original factual notes and links. No pages or images were mirrored, uploaded or represented as an endorsement.

Keep existing cleared CC0 media where identity remains verified. For missing covers, inspect the original image source and its actual license. The absence of a visible credit must not be used to evade attribution obligations. Ordinary citation links do not require copying large page assets.

## Publication sequence

1. Resolve the two held identities and review each selected source against botanical authorities. Independently corroborate required medical/preparation/safety claims.
2. Complete each of the 50 field-level drafts and source support mappings. Keep ordinary food, reported traditional practice and clinical instructions explicitly distinct.
3. Close the 13 missing-cover holds, confirming species, reusable license and Cloudinary delivery against the original file.
4. Produce a reviewed executable manifest with deterministic identities. Run a fresh private all-state duplicate check against the independently confirmed production database. Never publish the RESEARCH_QUEUE file.
5. Test stage, idempotent repeat, concurrent-write protection and rollback against isolated PostgreSQL. Keep fixture credentials and test content out of production.
6. Publish only cleared records and rebuild their embeddings from approved fields and source labels. Verify Library counts, name search, references, photos, preparation display and grounded Dr. Ai retrieval with a small number of targeted conversations.
7. Record exact added/updated/skipped counts and unresolved holds. Do not report 50 additions unless 50 actually cleared and were independently verified live.

## Validation

The companion JSON records all 50 queue IDs, corrected links, held identities, primary safety checks and explicit non-publication flags. The accompanying regression test checks queue coverage, those mappings and hold invariants.

Observed local validation on 2026-10-06:

- `npm test -- tests/stuartxchange-preparation-review.test.ts tests/herb-fifty-live-release-audit.test.ts tests/herb-expansion-review.test.ts tests/herb-expansion-staging-plan.test.ts tests/herb-preparation-rag.test.ts`: exit 0; 5 files and 95 tests passed, including the 7 new ledger checks.
- Public API read: HTTP 200; 38 returned herbs; zero blank preparationMethod fields.
- No production writer, importer, embedding generation, live AI conversation, database-backed staging/rollback test, image upload or deployment was run for this research batch.
- Source discovery and ledger tests do not certify botanical identity, clinical safety, copyright clearance or live retrieval for unpublished candidates.
