# Live Library source-scope audit — 4 October 2026

## Scope and method

Read-only audit of the public `https://herbalaiph.vercel.app/api/herbs?limit=100` response while source release `4ad669d` is live. All 38 returned herbs were checked, not just the visible first screen. The reported total and returned record count were both 38. Each returned record was verified/PUBLISHED and contained structured source references. Basic reference checks found no blank titles, references without both URL and citation, or non-HTTP(S) source URLs.

The audit compared the union of each herb's `sources[].supports` with the prospective suggestion-publication guard: identity, medicinal uses, preparation method, dosage, and warnings when written warning text is present. This is a structural comparison, not a clinical review, link-availability guarantee, or proof that a citation supports every sentence. The public API supplies current records; old local draft manifests do not establish the current live review status.

## Complete source-scope inventory

Every current record lacks at least one exact scope required by the new suggestion guard. All 38 nevertheless have references. These are metadata/review gaps; they must not be represented as 38 fabricated plants or 38 proven unsafe medical claims.

| Missing exact scope(s) | Count | Records |
| --- | ---: | --- |
| warnings | 10 | Akapulko, Ampalaya, Bawang, Bayabas, Lagundi, Niyog-niyogan, Sambong, Tsaang Gubat, Ulasimang Bato, Yerba Buena |
| preparationMethod, dosage, warnings | 20 | Anonas, Aratiles, Atsuete, Damong Maria, Gabi, Kamote, Katakataka, Langka, Mabolo, Makabuhay, Mangosteen, Mayana, Okra, Oregano, Pandan, Saluyot, Sibuyas, Suha, Takip-kohol, Ylang-ylang |
| dosage | 5 | Kalingag, Luya, Luyang dilaw, Malunggay, Sabila |
| identity, warnings | 1 | Gumamela |
| identity, medicinalUses, preparationMethod, dosage | 1 | Indian Heliotrope |
| identity, preparationMethod, dosage, warnings | 1 | Tanglad |

The six groups total 38. No database mutation, source-tag backfill, public wording change, deletion, reclassification, migration, or re-embedding was performed.

## Distinguish missing guidance from unsupported instructions

- Anonas and the inspected expansion manifest explicitly withhold a clinically validated home preparation and verified human treatment dose. Empty field-source arrays for withheld guidance are intentional in that manifest. Do not invent a dosage citation merely to satisfy a nonempty string check.
- Kalingag's public text states that the cited ethnobotanical study does not establish a clinically validated human dose; its preparation text describes reported practice rather than home-use instructions. Current sources tag identity, uses, preparation, and warnings, but not dosage. This limitation statement is not an instruction to take an unsupported dose.
- Gumamela describes a small pilot's research formulation and limits, not a validated general-purpose home treatment. Its source tags include humanEvidence and limitations but lack identity and warnings.
- Indian Heliotrope and Tanglad use legacy tags such as traditionalUse, preclinicalEvidence, humanEvidence and limitations. Those labels are not equivalent to a reviewed claim-by-claim identity/preparation/dosage/safety mapping.
- The ten PITAHC-directory records have preparation and dosage tags but no warning tags. Their positive guidance deserves priority for sentence-level review before any retrospective coverage assertion.

## Primary-source spot checks

Opened the actual [PITAHC Directory of Herbs](https://pitahc.gov.ph/herbs-directory/) and [Comparative toxicity, phytochemistry, and use of 53 Philippine medicinal plants](https://pmc.ncbi.nlm.nih.gov/articles/PMC8685920/) on 4 October. These checks do not certify the remaining sources or all 38 entries.

PITAHC contains explicit side-effect or escalation cautions for several herbs, including Bawang, Bayabas, Tsaang-gubat and Niyog-niyogan. This confirms that a missing warnings tag can be a metadata omission rather than total absence of safety material in the cited page. It does not establish that every additional warning currently written in Herbal-Ai is supported by that same source. Compare the exact sentence and cited section before adding a tag or changing wording.

The comparative-toxicity paper describes ethanol extracts, phytochemical screening and a brine-shrimp assay. Its results must not be converted into an established safe human treatment dose or clinical efficacy claim. The expansion records' withheld-dose language is consistent with the need for that distinction; this spot check does not validate every traditional-use summary.

## Recommended next batch

1. Review the ten directory records first against their exact live preparation, dosage and warning wording; record supporting sections and any wording correction individually.
2. Review the five missing-dosage records and distinguish documented study regimens from deliberately withheld clinical guidance.
3. Review legacy source tags for Gumamela, Tanglad and Indian Heliotrope without automatically treating humanEvidence or limitations as full claim coverage.
4. Review the twenty expansion records as limitation-bearing educational content, not as missing home-treatment recipes. Preserve explicit uncertainty; do not manufacture citations, quantities or safety assurances.
5. If a retrospective edit is needed, use a reviewed, versioned content batch and validate public Library and Dr. Ai retrieval afterward. Do not silently mass-edit production to make every checkbox appear complete.

The deployed guard correctly blocks newly approved under-sourced suggestions prospectively. This audit identifies a separate legacy-content review task; it does not establish a failure of that guard or authorize a data backfill. Hosting is explicitly excluded from this continuation.

## First prioritized review completed — 4 October 2026

Compared the ten directory records' live preparation and amount fields with their named sections in the [PITAHC directory](https://pitahc.gov.ph/herbs-directory/). No contradictory quantity or preparation summary was identified in this comparison. This is source correspondence, not independent clinical validation. Bawang's source uses bulbs; do not silently substitute cloves or endorse that quantity.

| Record | Warning traceability still requiring review |
| --- | --- |
| Akapulko | Allergy is addressed; broader escalation wording needs attribution. |
| Ampalaya | Professional supervision is addressed; treatment-replacement caution is additional. |
| Bawang | Adverse effects and bite emergency cautions are addressed. |
| Bayabas | Symptom escalation is addressed; hot-liquid caution is additional. |
| Lagundi | Current warning extends beyond its preparation section. |
| Niyog-niyogan | Excess-use adverse effects are addressed; diagnostic advice is additional. |
| Sambong | Clinical consultation is addressed; fluid-restriction wording is additional. |
| Tsaang Gubat | Persistent-symptom consultation is addressed; additional severity wording remains. |
| Ulasimang Bato | Clinical consultation is addressed; treatment-replacement caution is additional. |
| Yerba Buena | Persistent-symptom consultation is addressed; missing-safety information is a limitation. |

None has a warnings scope tag. Partial correspondence does not authorize adding full-field coverage, removing precautionary text, or fabricating a citation. These findings remain review items, not ten newly reproduced functional failures.

The apparent scientific-name differences were checked individually using the live records' existing Kew links: [Quisqualis indica → Combretum indicum](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:170880-1), [Carmona retusa → Ehretia microphylla](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:113775-1), and [Mentha × cordifolia → Mentha × villosa](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:60476613-2). Kew lists these as synonyms of the corresponding accepted names. The live normalized names are therefore not treated as demonstrated identity errors.

No live content, source scope, dosage, publication status or embedding was changed. The remaining 28 records and additional warning attribution are still open; this ten-record review is not a completed 38-record clinical audit.

## Second prioritized review completed — 4 October 2026

Read the five missing-dosage records from the live backend's public `/api/herbs?limit=100` response after release `95cf807`. The catalog still returned 38 records. Compared their uses, preparation descriptions, withheld-dose statements and warnings with the primary research and institutional safety sources below. No conflicting regimen or unsupported home-dose instruction was identified within the inspected scope. This is source correspondence, not clinical certification, exhaustive review of every reference, or permission to prescribe these plants.

| Record | Observed correspondence and limits | Sources inspected |
| --- | --- | --- |
| Kalingag | Table 4, entry 69 documents the species, community-reported stomach complaints and bark/branch/root preparations. These are ethnobotanical reports, not a clinically validated human regimen. The separate HERDIN abstract concerns acute leaf-extract toxicity in mice, not pregnancy, pediatric or human-dose validation. The live record maintains these distinctions. | [Dapar et al. (2020)](https://doi.org/10.1186/s13002-020-00363-7), [Table 4 XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC7227330/fullTextXML), [Delacruz (2013), HERDIN abstract](https://www.herdin.ph/index.php?cid=51004&view=research) |
| Luya | The cited short pregnancy-nausea trial tested a measured oral research product. Its abstract supports the limited symptom finding, not equivalence to homemade tea or all nausea treatments. NCCIH supports the listed digestive adverse effects, interaction caution and pregnancy/breastfeeding uncertainty. | [Trial abstract, PMID 11275030](https://pubmed.ncbi.nlm.nih.gov/11275030/), [NCCIH Ginger](https://www.nccih.nih.gov/health/ginger) |
| Luyang dilaw | The small, 12-week knee-osteoarthritis trial reports extract-related pain improvement without corresponding MRI effusion or cartilage-composition improvement. The live text does not equate that extract with kitchen turmeric. NCCIH supports digestive, enhanced-bioavailability liver-injury and pregnancy cautions. | [Trial abstract, PMID 32926799](https://pubmed.ncbi.nlm.nih.gov/32926799/), [NCCIH Turmeric](https://www.nccih.nih.gov/health/turmeric) |
| Malunggay | The 88-participant capsule trial did not find a statistically significant day-three milk-volume difference; inspected methods/results/limitations do not establish a general lactation dose or long-term infant safety. LactMed discusses wider evidence but also supports assessment before galactagogues, product variability, limited long-term infant evidence and clot-risk caution. The live wording distinguishes this trial from broader evidence. | [Trial full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC9684698/), [Research XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9684698/fullTextXML), [LactMed, revised 15 July 2026](https://www.ncbi.nlm.nih.gov/books/NBK501899/) |
| Sabila | The small acne trial combines a formulated topical gel with prescription tretinoin; it is not proof for raw aloe alone, all wounds or oral use. NCCIH supports distinctions between gel, latex and leaf preparations and the listed topical and oral cautions. The live record preserves those limitations. | [Trial abstract, PMID 23336746](https://pubmed.ncbi.nlm.nih.gov/23336746/), [NCCIH Aloe Vera](https://www.nccih.nih.gov/health/aloe-vera) |

### Retrieval and review boundaries

- PubMed pages did not return usable abstract text through the initial web reader. The matching Luya, Luyang dilaw and Sabila primary abstracts were read through the official Europe PMC REST search with `EXT_ID:<PMID> AND SRC:MED`, `format=json` and `resultType=core`. Title, identifier and DOI matched. Their complete articles were not reviewed in this batch.
- Dapar's exact table entry and selected Malunggay article sections were read from Europe PMC full-text XML. This does not mean every paragraph or linked reference was independently revalidated.
- HERDIN initially timed out, but its existing Chrome tab subsequently loaded the matching title, author, date and abstract. That abstract's animal experiment was inspected; the complete research project was not obtained. The initial timeout is not recorded as a permanently broken citation.
- LactMed's initial checking-browser page subsequently loaded its public article in Chrome without solving a CAPTCHA, signing in or bypassing a security warning. Its safety summary and matching trial discussion were inspected.
- This batch did not independently recheck every Kew or UST identity link. It did not establish efficacy, endorse a treatment quantity or turn an animal experiment into a safe human dose.

### Disposition and remaining work

All five records deliberately withhold general home-treatment dosing. Their missing `dosage` scope is not evidence of a missing recipe that should be filled in. Do not add invented quantities, suppress uncertainty, or mass-backfill scope tags. If the approval guard is later extended to distinguish a documented limitation from positive dosing instructions, that requires its own reviewed schema/validation/test change; this review does not implement one.

Fifteen catalog records have now received bounded source-content comparisons across the two batches. Twenty-three remain for the next batches: Gumamela, Indian Heliotrope and Tanglad, followed by the twenty expansion records. Additional warning attribution for the first ten records remains open. None of these counts represents a completed clinical validation or full MVP acceptance.

## Live contributor authorization check — 4 October 2026

Opened `https://herbalaiph.vercel.app/admin` in the connected Mercado Chrome session. The rendered page identified Mercado Kevin as a contributor and showed **Access Denied**, explaining that only administrators can access the dashboard. No administrator controls or dashboard statistics were exposed. This is an observed frontend role-gate check, not proof of every protected backend endpoint or a completed administrator write-flow test.

Evidence screenshot is stored outside Git at `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/contributor-admin-guard-20261004.jpg`. Gina/purple Chrome was absent from the available-browser inventory; fresh authenticated approval/rejection and audit-log checks were not performed or marked passed.

This continuation changed only this local report. No live record, credential, source scope, publication status or embedding was changed, and no commit/push was performed. Mail recovery and hosting remain excluded. No new code suite was run for this documentation-only batch; the previous release's CI result must not be presented as a newly executed test run.

## Third prioritized review completed — 4 October 2026

Read Gumamela, Indian Heliotrope and Tanglad from the public frontend-proxy API at 19:42 Asia/Manila. The response total and returned count were 38. The local checkout remained `95cf807`; this continuation did not reverify provider deployment identities. Checked the cited research by identifier, rather than treating the older remediation reports as current database evidence.

| Record | Correspondence observed | Remaining boundary |
| --- | --- | --- |
| Gumamela | The [primary pilot abstract, PMID 31298659](https://pubmed.ncbi.nlm.nih.gov/31298659/), retrieved through official Europe PMC REST, confirms 12 participants, a 4% leaf-extract ointment alongside compression, twice-daily application and up-to-12-week follow-up. The stored 2019 volume/issue/page citation matches metadata. The live summary limits the finding to adjunct research rather than general wound treatment. | The abstract does not establish manufacturing standardization or substantiate every general wound-care warning. Keep those attribution questions open; do not tag the entire warning field as covered by this pilot. The complete paper was not obtained. |
| Indian Heliotrope | The [cited review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8187075/), read through [Europe PMC XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8187075/fullTextXML), identifies pyrrolizidine alkaloids, preclinical findings and toxicity concerns and calls for clinical/safety work. [WHO's pyrrolizidine-alkaloid section](https://www.who.int/news-room/fact-sheets/detail/natural-toxins-in-food) supports the general toxin-risk caution. The live record withholds preparation and a safe human dose rather than presenting laboratory activity as treatment. | WHO is not a species-specific identity reference or therapeutic-dose validation. Animal and constituent findings cannot establish the safety of internal use. Legacy `traditionalUse`/`preclinicalEvidence` tags are not complete field-level coverage. |
| Tanglad | The [primary topical pilot](https://pmc.ncbi.nlm.nih.gov/articles/PMC3754369/) tests measured-concentration cream/shampoo formulations, not tea. The [2024 scoping review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10892616/), read through [Europe PMC XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10892616/fullTextXML), describes small topical/oral-health studies and unresolved evidence quality and safety. The live summary does not claim tea or homemade oil is proven treatment. | The review mixes C. citratus, C. flexuosus, uncertain-species and combination-product studies. It notes that oil composition was often undisclosed. Measured concentration alone does not establish chemical standardization. The current `standardized` qualifier and full warning attribution need a controlled wording/source review. |

### Wording review candidates — no silent production edits

The inspected sources do not justify assuming that every research product was chemically standardized. This is an unresolved attribution/wording issue, not proof that a product was unstandardized. Proposed minimal wording for a separately reviewed content update:

- Gumamela uses: replace `a standardized 4% Hibiscus rosa-sinensis leaf-extract ointment` with `a 4% Hibiscus rosa-sinensis leaf-extract ointment`.
- Gumamela preparation: `The human study used a 4% leaf-extract ointment together with medical compression therapy. It does not provide a safe home-preparation method.`
- Gumamela amount field: replace `the standardized ointment` with `the study ointment`; preserve the research-only qualification and observed schedule.
- Tanglad uses: replace `standardized Cymbopogon citratus essential-oil formulations` with `Cymbopogon citratus essential-oil formulations`.
- Tanglad preparation: `Research studies tested topical or mouth-rinse formulations with measured essential-oil concentrations. Their results do not establish a reproducible home preparation.`

No research concentration, clinical assurance, dosing instruction or safety warning is added by these proposed changes. Do not rewrite an already-applied migration to retrofit them. If approved for publication, use the governed content-edit path or a separately reviewed, narrowly scoped versioned correction, verify the current source text before updating, and validate Library and Dr. Ai retrieval afterward. This batch did not apply that correction or regenerate embeddings.

### Documentation inconsistency repaired locally

`Docs/HERB_LIBRARY_AUDIT.md` and `Docs/HERB_REMEDIATION_REPORT.md` described the earlier three-record hold and ten-record catalog. Their original dates establish historical snapshots, but their present-tense wording could be mistaken for current system behavior. Added explicit historical-phase notices with the subsequent restoration migration and a link to this current review. Preserved the original observations, test counts and decisions; they are not newly run or retroactively invalidated tests.

### Validation and remaining scope

- Public read-only API returned all three expected IDs: `h-c132f53f302dc204`, `h-a2eb84453b7dc7d0`, `h-33500111229eaede`, each with its existing references. No application or database write was performed.
- PMID metadata and abstract were retrieved via `EXT_ID:31298659 AND SRC:MED`, `format=json`, `resultType=core` on the official Europe PMC REST endpoint. The two XML documents above were inspected in selected abstract, methods, results, safety and limitation sections; their cited experimental papers were not exhaustively re-reviewed.
- Eighteen records now have bounded source-content comparisons; the twenty expansion records remain. Additional warning attribution from earlier batches and these standardization qualifiers remain open. This is not a complete clinical audit or full MVP acceptance.
- This documentation-only continuation changes three local Markdown files. No code suite was newly executed, no unrelated local edits were staged, and no commit or push was performed. Mail recovery, hosting and new authentication-credential entry remain outside scope.

## Fourth bounded review completed — 4 October 2026

Compared all twenty expansion records from the live public API with their draft manifest and retained source references. Inspected Table 1, laboratory methods and limitations in the [comparative-toxicity paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC8685920/) through [official Europe PMC XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8685920/fullTextXML). The paper's assay is not a human treatment trial. Table correspondence below does not independently validate the experiments cited within each row or establish a clinical dose.

| Record | Table 1 row / alternate source | Source-part comparison |
| --- | --- | --- |
| Anonas | 5 | Leaves |
| Aratiles | 38 | Leaves |
| Atsuete | 12 | Leaves |
| Damong Maria | 7 | Leaves |
| Gabi | 18 | Leaves |
| Kamote | 31 | Leaves |
| Katakataka | 33 | Leaves |
| Langka | 8 | Leaves |
| Mabolo | 23 | Leaves |
| Makabuhay | 51 | Stem; synonym reconciled |
| Mangosteen | 27 | Leaves; downstream experimental attribution remains |
| Mayana | 17 | Leaves; synonym reconciled |
| Okra | 1 | Fruit |
| Oregano | UST entry | Leaves |
| Pandan | 40 | Leaves |
| Saluyot | 19 | Leaves; retain cited species |
| Sibuyas | 4 | Leaves, not bulb |
| Suha | 16 | Leaves, not fruit |
| Takip-kohol | 30 | Whole plant; synonym reconciled |
| Ylang-ylang | 13 | Leaves, not commercial oil |

The live use summaries preserve traditional/laboratory limitations and do not supply positive home-preparation instructions or treatment quantities. That correspondence is not a safety guarantee. Mangosteen's underlying experimental attribution must not be generalized across plant parts. Saluyot's cited taxon must not be silently substituted with another species sharing its common name.

The [UST Oregano entry](https://www.ust.edu.ph/ust-manila-plant-databse/oregano/) supports the local identity and traditional cough/digestive context, not clinical efficacy. [Kew's accepted Oregano entry](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:445902-1) lists Plectranthus amboinicus as a synonym and Philippine introduction. Individually checked [Coleus blumei → Coleus scutellarioides](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:445922-1), [Hydrocotyle asiatica → Centella asiatica](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:323255-2), and [Tinospora rumphii → Tinospora crispa](https://powo.science.kew.org/taxon/581600-1). These normalized names are not demonstrated species mismatches. This batch did not independently reidentify the physical plants or every image.

### Reproduced review-tracking defect and focused repair

Every expansion draft has written warnings and an empty `fieldSources.warnings` array. However, each `reviewGaps` list mentioned only preparation/dosage review; it did not explicitly retain the unresolved warning attribution. The earlier seven-record batch already checks that absent warning coverage is accompanied by a safety review gap. Added the corresponding per-record regression to the twenty-record batch rather than pretending the comparative-toxicity paper covers every safety sentence.

- Before repair: the new twenty per-record checks all failed on the original manifest; the two existing tests passed.
- Repair: retained the existing review gap and added `Independent safety-source review and sentence-level attribution of existing warnings` to each draft. No warning sentence, source tag, scientific name, medicinal claim, image, preparation or dose was changed.
- The expanded test also asserts that every local candidate remains `DRAFT` and unverified. Draft-file status is not the current live publication status; the separately published records remain unchanged.
- This repair records unfinished work. It does not supply missing citations, certify safety, authorize a data backfill or change the publication validator.

### Observed validation

| Check | Result |
| --- | --- |
| Focused file-based regression rerun | 26 passed across `herb-expansion-batch-02.test.ts` and `herb-expansion-batch.test.ts`; includes the twenty previously failing checks. |
| Backend lint / build | Both completed with exit code 0. Build covers configured application code, not every test file. |
| Focused strict test-file typecheck | `tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck tests/herb-expansion-batch-02.test.ts` passed. |
| Importer dry run | `tsx prisma/import-built-in-herbs.ts --dry-run --file content/herbs/expansion-batch-02.json` validated all twenty; no stage/publish mode used. |
| Live comparison | All twenty unique expected IDs matched the manifest's scientific name, uses, preparation, dose and warnings. All were PUBLISHED/verified and not DOH-listed; total catalog remained 38. Twenty comparisons passed. |
| Broader database attempt | Not passed: adding `herb-governance.test.ts` and `herb-catalog-remediation.test.ts` produced five governance failures and a catalog-suite prerequisite rejection, with four skipped tests. The combined run also had the same 26 passing file-based tests; they are not an additional 26 unique passes. |

The broader attempt was inappropriate without its prerequisite and was not retried against production. This checkout had no configured `DATABASE_URL`, `PGHOST`, `PGDATABASE` or `PGSERVICE`, and no isolated PostgreSQL database was available. The catalog guard rejected the target before connecting; the governance calls failed. These results are an environment/test-selection blocker, not evidence of five new live content defects. A fresh isolated SQL CI run remains necessary before publishing this batch. Prior release CI success is not substituted for that run.

### Completion boundary and next work

All 38 current catalog records have now received the bounded source-content comparisons described in the four batches. The structural inventory and this correspondence pass are complete for the observed catalog; clinical validation, complete warning attribution and downstream-paper verification are not. Keep the original scope gaps and additional warning review open, including plant-specific assertions such as Gabi irritation and Damong Maria pregnancy cautions. Do not remove protective wording or fabricate citations to close a checkbox.

The next controlled content task is to resolve the two legacy `standardized` qualifiers described above and obtain sentence-level safety references before asserting full-field coverage. Fresh authenticated administrator write-flow/audit checks and post-correction Library/Dr. Ai retrieval validation remain separate release gates. Mail recovery and hosting remain excluded.

This continuation changed only this report, `herbalaibackend/content/herbs/expansion-batch-02.json` and its file-based test. No live content edit, migration, role change, source backfill or re-embedding was performed. No commit/push was made, and unrelated local changes were left untouched.
