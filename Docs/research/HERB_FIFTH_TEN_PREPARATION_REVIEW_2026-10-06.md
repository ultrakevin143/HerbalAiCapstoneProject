# Final ten: preparation evidence review

Reviewed: 2026-10-06 (Asia/Manila). Scope: unchanged candidates 41-50 from `pardo-fifty-research-2026-10-04`. The paired JSON remains **research only, not importable**. No live herb, photo, embedding, authentication setting or deployment changed.

## Outcome

- Ten candidates reviewed: two bounded food descriptions, two held food descriptions, two held food-use reports, one held traditional report, two held laboratory descriptions and one method not established.
- Zero complete household recipes, human medicinal instructions or publication approvals. Missing ratios, timings, serving amounts and clinical doses were not fabricated.
- One source was quarantined for conflicting retraction-link metadata. This is **not a confirmed retraction finding about the Magnolia paper**.
- Preparation review now covers all fifty candidate identities. The consolidated coverage report retains nineteen held descriptions or unresolved methods, not fifty usable medicinal recipes.

## Candidate decisions

| Candidate | Exact species | Evidence boundary | Research status |
| --- | --- | --- | --- |
| Kamias, `research-pardo-047` | Averrhoa bilimbi | Relish reporting does not resolve juice-associated oxalate kidney injury; cooking safety is unproven. | Food description held. |
| Balimbing, `research-pardo-048` | Averrhoa carambola | Salads/preserves reporting does not remove human kidney-injury evidence. | Food description held. |
| Kasuy, `research-pardo-070` | Anacardium occidentale | Cashew apple description only; no nut-shell, oil, roasting or fermentation instructions. | Bounded food description. |
| Bankundo, `research-pardo-126` | Morinda citrifolia | Reported Thai unripe-fruit preparation; no efficacy/dose approval, with NCCIH safety uncertainties attached. | Traditional description held. |
| `research-pardo-045` | Oxalis corniculata | Seasoning use is reported without a safe amount; the source also warns about oxalate toxicity. | Food-use report held. |
| Kahel, `research-pardo-054` | Citrus aurantium | Fruit marmalade reporting, not concentrated supplement or oil dosing; hybrid notation remains a staging check. | Bounded food description. |
| Tsampaka, `research-pardo-003` | Magnolia champaca | Quarantined metadata discrepancy; no preparation adopted. | Method not established. |
| `research-pardo-030` | Abutilon indicum | Combined leaf/twig/root laboratory extract, freeze-drying and solvent fractions, not leaf-only tea. | Laboratory description held. |
| Kastuli, `research-pardo-032` | Abelmoschus moschatus | Coffee-flavouring report lacks seed processing and amount; oil/additive concentrations are not recipes. | Food-use report held. |
| Ayapana, `research-pardo-130` | Ayapana triplinervis | Analytical preparations of industrial leaf/stem mash, not a validated human or children's regimen. | Laboratory description held. |

## Sources actually reviewed

The JSON records exact species, supported fields, selected sections and downloaded full-text byte counts/hashes. A held report is not advice to reproduce its method. No Facebook/Reddit anecdote, search snippet alone or unrelated-species recipe became preparation evidence.

- [NParks Averrhoa bilimbi](https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2735): exact-species heading and relish-use paragraph.
- [Nair et al. (2014), bilimbi juice and oxalate nephropathy](https://doi.org/10.1155/2014/240936): full-text abstract and discussion. The authors leave cooking's protective effect unresolved; no safe amount is inferred.
- [NParks Averrhoa carambola](https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2736): species and fruit-food paragraph; juice and medicinal claims excluded.
- [Barman et al. (2016), starfruit-associated acute oxalate nephropathy](https://doi.org/10.4103/0971-4065.175978): primary human case-series abstract and case material. Dietary reporting is not a safe-serving trial.
- [NParks Anacardium occidentale](https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2709): the cashew apple food paragraph, not its nut-processing or folk-medicine statements.
- [PROSEA Morinda citrifolia](https://prosea.prota4u.org/view.aspx?id=2778): exact-species Uses section. A Thai traditional report is described, not recommended; vague raw/prepared food wording does not establish fermentation controls.
- [NCCIH Noni](https://www.nccih.nih.gov/health/noni): Latin name, human-evidence and safety sections. Potassium, medications and uncertain liver-report causation retained; no safe-duration recommendation adopted.
- [Chung (1999), PROSEA Oxalis corniculata](https://prosea.prota4u.org/view.aspx?id=86): Uses and oxalate Properties. Reported seasoning and larger-exposure toxicity are kept together.
- [Dutch Botanical Gardens Association bitter orange](https://www.botanischetuinen.nl/en/plant_en/2621/bitter-orange-or-seville-orange): Citrus × aurantium heading and marmalade food use. Adjacent oil, sedative and appetite claims excluded.
- [NCCIH Bitter Orange](https://www.nccih.nih.gov/health/bitter-orange): food versus supplement safety. Cardiovascular reports involving mixed ingredients are not asserted to prove bitter-orange causation.
- [Krisanapun et al. (2011), Abutilon indicum extraction study](https://doi.org/10.1093/ecam/neq004): section 2.1 and specimen/part description, read in public full-text XML. Preclinical extraction is not a household diabetes regimen.
- [PROSEA Abelmoschus moschatus](https://prosea.prota4u.org/view.aspx?id=76): species/synonym and seed coffee-flavouring paragraph. No oil dose, perfume preparation, historical regulatory guarantee or okra substitution.
- [Checkouri et al. (2020), eight-plant aqueous-extract study](https://doi.org/10.3390/antiox9100959): raw material, species lot table and infusion/decoction methods. Ayapana leaf/stem mash remains an analytical sample; quantities and cell results are not human doses.

## Quarantined source: important correction

The retrieved [Magnolia paper's public XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10758728/fullTextXML), DOI `10.1016/j.heliyon.2023.e22972`, contains a `retraction-forward` pointer to `PMC11923187`. Reading that [linked article's XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11923187/fullTextXML) identifies a **cinnamon-oil** retraction, DOI `10.1038/s41598-025-94143-6`, not the Magnolia title. The initial progress message called the study retracted too early; subsequent inspection corrected that claim.

The original DOI's [Crossref metadata](https://api.crossref.org/works/10.1016%2Fj.heliyon.2023.e22972) returned the matching Magnolia title and an empty relation object. That does not prove the paper is unretracted. Publisher verification remains unresolved. The source stays quarantined; no bark-solvent extraction method or cancer-treatment claim is adopted. Do not cite the cinnamon notice as the Magnolia paper's retraction.

## Retrieval limitations

Several PMC HTML opens returned a browser challenge. The normal public Europe PMC full-text API supplied the selected papers without bypassing that challenge. The 2022 Abutilon candidate's XML returned HTTP 500 twice; its snippet was not adopted. The separately retrieved 2011 paper supplied directly read, part-specific methods instead.

Kew/NC State/National Kidney Foundation pages had retrieval failures during this review. They were not used as adopted evidence or represented as completed source reads. No PDF was newly authored or edited. Raw downloaded XML remains outside Git in the fifth-ten scratch directory; hashes/byte counts are in the research JSON, not credentials.

## Observed validation

- Initial seven-suite run: 70 tests passed, exit 0, 5.87 seconds, including ten new evidence-contract tests.
- After adding the all-fifty coverage synchronization regression, the focused seven-suite run passed **71 tests**, including eleven new tests, exit 0, 5.23 seconds. Strict TypeScript checking of the final test file completed successfully, exit 0, with exact optional-property and unchecked-index checks enabled.
- Backend build and source lint passed, exit 0. Source lint does not independently lint the new tests; strict test TypeScript validation is separate.
- Earlier broad working-tree run passed 1,154 tests across 85 files, exit 0, 60.47 seconds. The final run after the coverage regression passed **1,155 tests across 85 files**, exit 0, 54.35 seconds. Eighteen real-database suites were explicitly excluded in both runs; these are dirty-working-tree non-database results, not a clean release bundle, remote CI or PostgreSQL pass.
- Regression scope: exact queue names/page pointers; fifty distinct candidate IDs; source-to-field/species linkage; honest counts; retained renal and oil/supplement exclusions; laboratory parts; quarantined-link mismatch; and refusal by the live preparation-plan parser. These tests do not validate medical efficacy or live retrieval.
- Local availability checks on October 6 found no `docker`, `psql`, `postgres` or `initdb` command and no matching service. Eight authored real PostgreSQL updater checks remain **unrun**, not failed or passed. No production database was used as a fixture.
- Final JSON parsing, new-file whitespace and narrow credential-pattern checks passed. Six downloaded XML byte counts and SHA-256 hashes matched their ledger entries, including the quarantined source and mismatched linked notice. This is not a comprehensive secret audit. The real Git index remained empty and HEAD remained `f98c498d0c62998b2f5129557f038a79345cd9bd`.

## Next work

Use `HERB_FIFTY_PREPARATION_COVERAGE_2026-10-06.md` for the complete matrix. Resolve the four explicit method gaps and nineteen held/gap classifications without inventing recipes; bounded food descriptions are also not publication clearance. Preserve the thirteen outstanding image holds.

The existing twenty-generic-preparation updater still needs isolated PostgreSQL rollback/concurrency validation, a fresh confirmed-target/all-state snapshot and reviewed application. New-herb staging requires separate identity, part/cultivar safety, duplicate and media clearance. Only after an actual reviewed release can live Library preparation display, images and Dr. Ai retrieval be claimed as tested. No automatic commit or push occurred.
