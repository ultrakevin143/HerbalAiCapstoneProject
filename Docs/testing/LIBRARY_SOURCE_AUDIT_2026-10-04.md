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
