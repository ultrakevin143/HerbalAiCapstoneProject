# First-ten occurrence draft repair — 6 October 2026

## Result and scope

The first-ten research review already contained occurrence pointers, but its generated draft data did not include `regionFound` or occurrence-field citations. Adding an occurrence object to the previous planner input was silently ignored rather than validated.

This local repair supplies ten bounded region descriptions using eight primary botanical, government, university or research sources. It preserves all preparation, dosage, warning, image and publication boundaries from the previous batch. This is not publication of ten or fifty herbs.

The saved ledger is `HERB_FIRST_TEN_OCCURRENCE_REVIEW_2026-10-06.json`; the regenerated complete output is `HERB_FIRST_TEN_FIELD_DRAFT_PLAN_2026-10-06.json`.

## Reviewed geography

| Candidate | Supported scope | Source and boundary |
| --- | --- | --- |
| Duhat | Country-level introduced occurrence | [Kew Syzygium cumini](https://powo.science.kew.org/taxon/601603-1), Philippines under Introduced into. No provincial inventory inferred. |
| Sampalok | Country-level naturalization | [DENR urban-greening guidebook](https://forestry.denr.gov.ph/fmb_web/wp-content/uploads/2023/06/Philippine-Guidebook-on-Plant-Species-Suitable-for-Urban-Greening-EBOOK_compressed.pdf), printed page 55. Non-native and naturalized; not a complete locality list. |
| Atis | Specific naturalized locality | [Co's Digital Flora, Annonaceae](https://www.philippineplants.org/Families/Annonaceae.html), Annona squamosa entry: Palawan. Other Annona species' provincial lists were not copied. This does not claim absence elsewhere. |
| Talisay | Country-level native-range occurrence | [Kew Terminalia catappa](https://powo.science.kew.org/taxon/171034-1), Philippines under Native to. No medicinal bark-safety inference. |
| Butterfly pea | Country-level introduced occurrence | [Kew Clitoria ternatea](https://powo.science.kew.org/taxon/486606-1), Philippines under Introduced into. No native-status or province-wide claim. |
| Mangga | Pooled study area | [Dapar et al. 2020](https://doi.org/10.1186/s13002-020-00363-7), Table 4 row 4, voucher USTH 015591. Agusan del Sur study, not each individual municipality. |
| Santol | Pooled study area | Same primary study, Table 4 row 80, USTH 015624. Native status was not inferred from a local-use report. |
| Papaya | Pooled study area | Same primary study, Table 4 row 40, Kapayas laki, USTH 015668. No clinical outcome or native status inferred. |
| Granada | Specific cultivated locality | [NAST-hosted Mount Makiling flora, Punicaceae](https://nast.dost.gov.ph/images/pdf%20files/Publications/Other%20Publications%20of%20NAST/Vascular%20Flora%20of%20Mount%20Makiling%20and%20Vicinity/115%20Punicaceae.pdf), printed page 523: commercial nurseries in Los Baños, Laguna. The preceding Loktob forest/stream paragraph was not assigned to Punica granatum. |
| Chico | Country-level cultivation description | [UST plant database](https://www.ust.edu.ph/ust-manila-plant-databse/chico/), exact Manilkara zapota entry. Its campus-database heading alone was not treated as a geolocated wild specimen. |

There are five country-only, two specific-locality and three study-area records. The pooled Dapar study covers Bayugan, Esperanza and Sibagat; its species table does not prove each species occurred at every site. No complete Philippine distribution map was created.

## Source-access limitations

Kew distribution sections, Co's exact Atis entry, and the publisher's study-area text were inspected through web browsing. Exact Mangga, Papaya and Santol species/voucher rows were additionally retrieved read-only from the publisher's Table 4 HTML.

Direct DENR PDF retrieval failed in this follow-up; its printed-page-55 species text was available through the primary URL's web index. The earlier preparation review inspected that page. The NAST PDF's exact Punica granatum passage was available through its primary URL's index, but direct fetch and screenshot timed out. UST's direct open returned an error; its primary university entry was available through web search.

These access limitations are recorded per source. A new full-PDF visual review was not performed or counted as passed. Final source-quality review should retry the unavailable PDFs; indexed text is not proof that their full documents were visually inspected.

## Focused repair

- A separate occurrence validator checks all ten candidate identities, including local/scientific name and book entry/page.
- Each region and geographic scope must exactly match the cited source claim for that species. Wrong-species references, broadened scope, changed text, duplicate records/sources/claims/references and credential-bearing URLs are rejected.
- The occurrence ledger must retain its research-only status and false publication, staging and production-write flags.
- The shared first-ten field helper combines occurrence sources without losing earlier preparation, image, warning or traditional-use source bindings. Identical URLs remain consolidated.
- The read-only CLI loads the new ledger. Its output includes `regionFound` and scope metadata; absent research is explicitly noted instead of replaced with invented geography.
- Every proposed record remains `DRAFT`, `UNASSESSED`, unverified, not DOH-approved and without an embedding. Therapeutic categories remain `Uncategorized`; geographic evidence is not a reason to invent them.

## Observed validation

1. Initial regression run before implementation: **20 tests failed**. Missing region output and silently ignored malformed evidence were reproduced.
2. Final regression file: **26 tests**, including the complete saved CLI output's equality with a reproduced plan.
3. Combined focused run: **9 files, 125 tests passed**, duration **11.36 seconds**:
   - herb-expansion-occurrence-research
   - herb-expansion-field-research
   - herb-expansion-staging-plan
   - herb-first-ten-content-review
   - herb-first-ten-preparation-supplement
   - talisay-preparation-follow-up
   - herb-expansion-review
   - herb-fifty-live-release-audit
   - published-herb-preparation-coverage
4. Backend lint and TypeScript build passed. Git whitespace checks passed; the index remained empty.
5. The actual CLI generated ten region-cited and ten preparation-cited draft rows, zero unmapped warning rows and zero conflicts against the archived fixture. Write/publication flags remained false.

Tests used an intentionally unreachable loopback database and an empty Gemini key. They are unit/ledger validation, not isolated PostgreSQL, current live duplicate clearance, actual AI retrieval or medicinal approval.

The archived snapshot is dated 5 October and still displays its expired/unconfirmed-target blockers. This is deliberate reproducible offline evidence, not a statement that the separately verified live target is currently wrong. A future writer must obtain fresh all-state identities inside its transaction and prevent concurrent duplicates.

No Neon write, Cloudinary upload, live deployment, Git commit or Git push occurred. No frontend styling or unrelated working-tree changes were modified.

## Remaining work

1. Finish first-ten source/content-quality review, including unavailable PDF rechecks, safety limitations and suitable non-invented categorization. Do not convert food processing into a medical recipe.
2. Complete full-content drafts for the other forty candidates. The fifty-candidate audit still lists **four adopted preparation-method gaps** and **thirteen missing selected covers**.
3. Implement and test a dedicated new-record writer in isolated PostgreSQL, including rollback and simultaneous identity conflicts. No local PostgreSQL/Docker runtime has been available.
4. Only then prepare a reviewed import/release batch, refresh identity checks and verify actual Library/Dr. Ai retrieval after any authorized deployment. The existing twenty-record preparation updater is not a fifty-record importer.

