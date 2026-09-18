# Current Herb Library Audit

Status: Phase 2 findings; no production herb records changed  
Snapshot date: 2026-09-12  
Records reviewed: 14 live Herb records and 10 built-in seed definitions

## Executive finding

The current Library should be corrected before adding 20 more records. Of 14 live records, none has stored citation or image-license metadata. One official herb is duplicated under two names with the wrong taxon, one official record has inconsistent badge and claim data, and several dosage or preparation statements do not match the current PITAHC directory. Three non-official records contain prescriptive claims without retained sources.

Recommended disposition:

- **Keep after revision:** 9 official plant records.
- **Merge and replace identity:** Hilbas and Yerba Buena into one verified Yerba Buena record.
- **Hold from verified retrieval pending sources:** Gumamela, Indian Heliotrope, and Tanglad.
- **Replace or re-license images:** all 14, because no current image has stored creator, source-page, or license metadata. Akapulko is also visually inconsistent with the species in the supplied Library screenshot.

## Record-by-record audit

| Current record | Decision | Findings |
| --- | --- | --- |
| Akapulko — *Senna alata* | Revise | Identity and official listing match PITAHC. Topical fungal-use directions are broadly aligned, but “proven” and “completely resolved” are stronger than appropriate library wording. Keep external-use safety language after source verification. Current displayed image appears to show pink ornamental blossoms rather than *S. alata* and must be replaced. |
| Bawang — *Allium sativum* | Revise | Identity and official listing match. The stored “2 cloves twice daily” differs materially from the current PITAHC directory’s preparation guidance. The five-minute allicin instruction and anticoagulant warning need field-level citations. Do not publish a reconciled dose until one source is selected. |
| Bayabas — *Psidium guajava* | Revise | Identity and official listing match. PITAHC supports several topical and oral traditional uses, but the current claims about circumcision, toothache, and the exact gargle schedule are not traceable in the current directory text and need their original source. |
| Bitter Gourd — *Momordica charantia* | Rename and revise | This is the official Ampalaya taxon, but the live local name drifted from the seed name. Use “Ampalaya” as the preferred Philippine name and keep “Bitter gourd” as an English name. Current serving and frequency differ from PITAHC guidance. |
| Gumamela — *Hibiscus rosa-sinensis* | Hold | Not part of the official ten. The boil, mumps, twice-daily poultice, and “do not ingest” statements have no retained citations. Treat as an unverified traditional-use candidate until two appropriate sources and an image license are recorded. |
| Hilbas — *Clinopodium douglasii* | Merge/remove | Duplicate of the current Yerba Buena entry and shares the same image. *C. douglasii* is native to western North America according to Kew, while PITAHC identifies Philippine Yerba Buena as *Mentha cordifolia*. The DOH flag is therefore attached to the wrong taxon. Do not expose this record to Dr.Ai. |
| Indian Heliotrope — *Heliotropium indicum* | Hold | Not part of the official ten. The record combines a traditional topical claim with serious toxicity and carcinogenicity wording but retains no supporting source. Because the safety issue is material, keep the record out of public and AI-verified content until specialist-quality sources are reviewed. |
| Lagundi — *Vitex negundo* | Revise | Identity and official listing match. Current PITAHC directory support is specifically antitussive/cough-focused; the live record expands this to flu, fever, colds, asthma, and pharyngitis. Its age groups, volumes, and infant warning also do not match the current directory presentation. |
| Niyog-niyogan — *Combretum indicum* | Revise | The live accepted name is taxonomically valid; PITAHC uses the synonym *Quisqualis indica*. Store both. Current age bands differ from PITAHC, and the “two hours after evening meal” and “single dose only” instructions conflict with or are absent from the current directory, which discusses repeating after one week. |
| Sambong — *Blumea balsamifera* | Revise | Identity and official listing match. “Clinically proven to dissolve and expel kidney stones” overstates the current directory, which separates pre-clinical stone dissolution from clinical diuretic/antiuricemic evidence. Leaf amounts and resulting drink volume also need correction. |
| Tanglad — *Cymbopogon citratus* | Hold | Not part of the official ten. Fever, cough, cold, bloating, gas, kidney, dose, pregnancy, and essential-oil statements have no retained sources. This may become an evidence-supported or traditional-use entry after claim-by-claim review. |
| Tsaang Gubat — *Ehretia microphylla* | Revise | PITAHC uses *Carmona retusa*; Kew treats that name as a synonym of the accepted *E. microphylla*, so the database identity can remain if the official synonym is retained. Current “one glass every four hours” directions do not match PITAHC’s reduced-volume, leaf-amount, and age-based guidance. |
| Ulasimang Bato — *Peperomia pellucida* | Revise | Identity and official listing match. “Clinically proven to reduce serum uric acid” is stronger than the directory’s evidence labels. The stored once-daily salad instruction differs from the directory’s three-times-daily description. Hydration and acute-gout warnings need citations. |
| Yerba Buena — *Clinopodium douglasii* | Replace and merge | The claim says “DOH-approved” while the live flag is false. The taxon does not match PITAHC’s *Mentha cordifolia* and duplicates Hilbas. Replace the identity with the PITAHC taxon, retain the modern accepted synonym after botanical verification, merge only after checking comments and IDs, and remove “None significant” safety wording. |

## Cross-record defects

### Evidence and safety

1. Medical claims, preparation, dosage, and warnings have no structured citations in the Herb model.
2. `isVerified` defaults to `true`, so newly created records can appear authoritative before evidence review.
3. Evidence levels are collapsed: pre-clinical, clinical, and traditional statements are presented in the same voice.
4. Several records use absolute language such as “proven,” “completely resolved,” or “none significant.”
5. The AI embedding text includes these unsupported fields, so a data error can become a confident Dr.Ai answer.

### Identity and duplicate handling

1. Hilbas and Yerba Buena have the same scientific name and image but conflicting DOH flags.
2. The seed finds an existing herb by `localName OR scientificName`, updates its content, and does not normalize the existing local name. This explains how “Bitter Gourd” can retain that name while receiving the Ampalaya seed content.
3. Accepted names and source-used synonyms are not stored separately.
4. There is no database uniqueness constraint or review-safe merge mechanism for accepted scientific identity.

### Provenance and community approval

1. `SuggestedHerb` stores `informationSource`, but `approveSuggestion` inserts no source into Herb because Herb has no source field or relation.
2. Approved suggestions inherit Herb’s default verified state without a separate evidence classification.
3. Herb records do not identify whether they came from the built-in catalog, an approved suggestion, or direct admin creation.
4. Seed updates can match records without checking origin, creating a risk of overwriting community-derived content.

### Images

1. All 14 live records point to Cloudinary assets without stored source-page, creator, license, depicted taxon, or modification metadata.
2. Hilbas and Yerba Buena use the identical file despite needing a different official Philippine identity.
3. The supplied Akapulko screenshot is a clear visual mismatch and should be removed first.
4. Bawang and Bayabas look plausible in the supplied screenshot, but plausibility is insufficient without identity and license provenance.
5. The repository has local files only for Bayabas, Lagundi, and Sambong, and the live database does not currently use those local paths.

## Source reconciliation notes

- PITAHC currently lists Tsaang-gubat as *Carmona retusa*. [Kew treats it as a synonym of *Ehretia microphylla*](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A113775-1), supporting an accepted-name plus source-synonym approach.
- PITAHC currently lists Niyog-niyogan as *Quisqualis indica*. [Kew treats it as a synonym of *Combretum indicum*](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A170880-1), so the current accepted name is defensible if the PITAHC synonym is retained.
- PITAHC currently lists Yerba Buena as *Mentha cordifolia*. [Kew treats *Mentha × cordifolia* as a synonym of *Mentha × villosa*](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A60476613-2). By contrast, [*Clinopodium douglasii* is a western North American species](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A61186-2), making the current Philippine DOH association incorrect.

## Required corrections before Phase 3

1. Add evidence class, publication status, provenance, review metadata, structured references, and image attribution to the data design.
2. Make new Herbs unverified by default and exclude drafts/holds from public queries and AI context.
3. Preserve suggestion sources during approval.
4. Replace broad seed matching with stable built-in identifiers and provenance-scoped updates.
5. Resolve the Hilbas/Yerba Buena duplicate safely, including any comments linked to either record.
6. Rewrite the ten official entries directly from one declared PITAHC baseline before generating new embeddings.
7. Remove or hold the three unsupported non-official records until their sources are approved.
8. Replace every image through a license-aware local-asset workflow; prioritize Akapulko and Yerba Buena.

## Audit sources

- [PITAHC Directory of Herbs](https://pitahc.gov.ph/herbs-directory/), current directory accessed 2026-09-12.
- [PITAHC Philippine Herbal Medicine overview](https://pitahc.gov.ph/), accessed 2026-09-12.
- [Republic Act No. 8423](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/3840), establishing PITAHC and principles for traditional knowledge.
- [DOH Administrative Order No. 172, s. 2004](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/11/42163), defining registration concepts for herbal medicines.
- Kew Plants of the World Online taxon records linked in the reconciliation notes.

## Phase boundary

The audit itself made no herb-content, image, or embedding changes. The next governance phase added provenance and citation storage without rewriting existing medical content. Existing records must now be corrected in a migration-safe batch before selecting 20 additions.
