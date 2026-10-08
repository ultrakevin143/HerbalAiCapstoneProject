# Fourth-ten held field draft review — 2026-10-07

## Status and scope

The fourth ten candidates now have assembled **held editorial field plans**, not released Herb records. No database write, Cloudinary upload, embedding generation, AI request, credential change, commit or push occurred. No UI or runtime endpoint was changed.

The public-only release check observed **38 live herbs** at **2026-10-06T17:12:21.956Z** (2026-10-07, Asia/Manila). It returned no public candidate identity conflicts. It does not inspect hidden Herb drafts, pending/rejected SuggestedHerb records or independently verify the private target. The new fourth-ten plan has no private snapshot.

| Measure | After third ten | After fourth ten |
| --- | ---: | ---: |
| Assembled held draft plans | 30 | 40 |
| Drafts with required core text and preparation evidence | 28 | 35 |
| Partial drafts | 2 | 5 |
| Candidates without a complete field draft | 22 | 15 |
| Missing selected covers across fifty | 13 | 13 |
| Held secondary-source identities | 2 | 2 |
| Publication-cleared candidates | 0 | 0 |

These counts describe field drafting, **not household recipe availability, medical approval or release readiness**. Manufacturing/laboratory descriptions can have source-backed text while remaining unsuitable for beginner guidance. Ten final candidates still lack assembled field plans; five earlier assembled plans are partial.

## Records and preparation boundaries

| Candidate | Retained taxon | Evidence scope | Unresolved preparation or media |
| --- | --- | --- | --- |
| Santan | Ixora coccinea | Genus-level lead only | Exact-species method not established |
| Sampaguita | Jasminum sambac | Controlled tea scenting/manufacturing | No household instructions cleared |
| Kabiki | Mimusops elengi | Edible ripe-fruit flesh label | No preparation process; cover missing |
| Balibago | Hibiscus tiliaceus | Young-leaf vegetable label | No preparation process; cover missing |
| Thespesia populnea | Thespesia populnea | Young-bud/leaf food description | No quantities or cooking endpoint established |
| Doldol | Ceiba pentandra | Leaf/flower/young-fruit food description | Seed and seed oil excluded |
| Kalumpang | Sterculia foetida | Experimental seed solvent extraction | Laboratory only; no home method cleared |
| Manzanitas | Ziziphus mauritiana | Fruit food-processing descriptions | Historical author-qualified identity must be preserved |
| Asana | Pterocarpus indicus | Experimental heartwood extraction for rats | Laboratory only; cover missing |
| Coffee | Coffea arabica | Seed roasting/milling/brewing description | No brewing ratio or timing established |

Four descriptions concern food processing, one concerns manufacturing, two concern laboratory extraction, and **three do not establish a preparation method**. None clears medicinal instructions or beginner steps. Explanatory “method unavailable” prose was not counted as a completed method. Missing recipe parameters, human dosage and clinical benefits were not invented.

## Source and identity observations

The exact-species preparation descriptions are preserved from `HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json`; fresh 2026-10-07 identity/range observations are separately recorded. Earlier source access is not falsely represented as a fresh full-text review.

- **Santan:** the inspected [NParks Gardenwise article](https://www.nparks.gov.sg/sbg/research/publications/-/media/sbg/gardenwise/gw_pdf_2020-2029/gw_2024_vol_62_feb_updated.pdf), printed page 31, describes Ixora at genus level. That is not an exact-species preparation source for I. coccinea. The unrelated author-qualified homonym was not substituted for the [Kew I. coccinea L. record](https://powo.science.kew.org/taxon/753844-1).
- **Kabiki and Balibago:** the inspected [Mimusops page](https://www.nparks.gov.sg/florafaunaweb/flora/3/0/3030) identifies edible fruit flesh; the [Hibiscus page](https://www.nparks.gov.sg/florafaunaweb/flora/2/9/2954) reports young leaves as a vegetable. Neither establishes a cooking process. Roselle or Thespesia recipes were not transferred to Balibago.
- **Sampaguita:** the [jasmine-tea study](https://doi.org/10.3390/foods12040812) concerns a named cultivar and controlled scenting of prepared tea. It is not a recipe for boiling arbitrary ornamental flowers or essential oil. Fresh full-text retrieval was not completed this turn; the earlier reviewed paragraph retains its original provenance.
- **Kalumpang and Asana:** the [Sterculia extraction study](https://doi.org/10.3390/plants10061135) and [Pterocarpus rat study](https://doi.org/10.1177/15593258251404066) remain labelled laboratory evidence. Solvent processing and animal findings were not converted into human treatment instructions.
- **Doldol:** the previously reviewed [PROTA account](https://prota.prota4u.org/protav8.asp?h=M4&p=Ceiba+pentandra&t=Ceiba,pentandra) remains the preparation/warning source. Its seed-oil caution is not overridden by an older conflicting food-use lead.
- **Manzanitas:** [Co's Digital Flora](https://www.philippineplants.org/Families/Rhamnaceae.html) distinguishes the historical Ziziphus jujuba Lam., non Mill., usage associated with Z. mauritiana. The unqualified queue synonym is insufficient for a later all-state identity comparison. Modern Z. jujuba recipes were not borrowed.
- **Asana:** the [accepted Pterocarpus indicus Willd. record](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:516487-1) is retained, not the different author-qualified homonym.

All ten have bounded Philippine occurrence evidence: five inspected Kew species entries include Philippines; the other five use exact entries in Co's Digital Flora. The relevant cultivated/naturalized records are [Santan and Coffee](https://www.philippineplants.org/Families/Rubiaceae.html), [Sampaguita](https://www.philippineplants.org/Families/Oleaceae.html), [Doldol](https://www.philippineplants.org/Families/Bombacaceae.html), and [Manzanitas](https://www.philippineplants.org/Families/Rhamnaceae.html). Cultivation was not relabelled as wild/native occurrence. A country-list omission was not treated as proof of absence.

The [historical Pardo book](https://www.gutenberg.org/files/26393/26393-h/26393-h.htm) supplies historical provenance only. Unsupported eye, childbirth, smoking, corrosive-substance or disease-treatment instructions were not adopted. Historical regional-name labels remain raw source strings with `modernRegionalMappingCleared=false`; broad “Vis.” labels were not silently converted into Cebuano.

Only Doldol has a dedicated warning-support source in this batch. Nine warning fields remain explicitly uncited editorial safety limits. All ten dosage fields remain uncited review limits, not validated regimens. These gaps continue to block publication.

## Media and release holds

Seven cover URLs bind to the previously selected audit/provenance records. **Kabiki, Balibago and Asana have no selected cover**, and their image fields remain omitted. No fake URL or other-species image was supplied. This turn did not recheck Cloudinary bytes, licenses or botanical morphology; saved checks are historical.

All ten retain DRAFT / UNASSESSED status, unresolved category assignment, false verification/DOH flags and null reviewer, review timestamp and embedding. No draft is available in the live Library or retrievable by the live AI merely because it is stored in a local plan.

## Focused checker repair

The read-only release checker now refuses to count a field draft as complete when:

1. Its preparation kind is `METHOD_NOT_ESTABLISHED`;
2. Its preparation field is explicitly uncited; or
3. It has no source tagged to support preparation.

It also rejects genus-only evidence tagged as exact-species preparation and rejects a source with an explicitly different scientific name. Source tags alone do not authenticate source content; human species/part/cultivar and safety review remains necessary. Existing evidence and missing-cover checks stay in place.

The CLI loads all four field plans and still has no write/publish mode. Earlier receipts were not overwritten. “Full content draft” in its JSON means the required field text and preparation evidence are present, not a complete safe recipe.

## Observed validation

- Targeted field-draft/preflight tests: **74 passed across three files**.
- Expanded related suite: **211 passed across sixteen files**.
- Backend `npx tsc --noEmit`: passed.
- Strict CLI and fourth-ten/third-ten/preflight test typecheck: passed.
- Targeted ESLint for the changed checker and fourth-ten tests: passed.
- Regression checks cover three non-methods, genus/species substitution, lost preparation citations, factory/laboratory boundaries, missing covers and retained author-qualified identity.
- Public-only CLI: valid JSON, no stderr, intentional exit **2** (release held).
- Observed public catalog: 38; candidate conflicts: 0; publication clearance: 0.
- Six-file conflict-marker/whitespace checks and held-receipt assertions: passed.
- CLI `--publish` rejection: exit 1 with no stdout; no write/publish mode exists.
- `git diff --check`: passed; existing LF/CRLF conversion warnings concerned unrelated tracked files.

Test totals overlap and must not be summed. These tests do not constitute clinical validation, live AI retrieval, a private database comparison, an import/rollback test, physical-device evidence or participant acceptance.

## Evidence and continuation

- `HERB_FOURTH_TEN_FIELD_DRAFT_PLAN_2026-10-07.json`: ten held field plans.
- `HERB_FOURTH_TEN_FIELD_RELEASE_CHECK_2026-10-07.json`: fresh public-only receipt.
- `HERB_FOURTH_TEN_PREPARATION_REVIEW_2026-10-05.json`: preserved preparation ledger.
- `HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.json`: earlier candidate/media audit.

Next:
1. Assemble the final ten field plans with exact source boundaries and higher-risk preparation holds.
2. Resolve Fennel occurrence, Lokoloko identity/occurrence, Santan/Kabiki/Balibago methods and author-qualified identity mappings.
3. Close thirteen cover holds, two secondary-source identity holds, categories and part-specific safety/source review.
4. Confirm the intended private live target freshly, compare all Herb/SuggestedHerb states, back up, and validate guarded import/rollback/concurrent-duplicate behavior in isolation.
5. Publish only cleared records; verify Library details and AI retrieval, then remediate the existing 38 records against their own sources.

This completes the fourth-ten drafting/validation batch, **not the fifty-herb live release**.
