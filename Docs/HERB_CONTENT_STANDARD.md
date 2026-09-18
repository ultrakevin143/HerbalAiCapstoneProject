# Herbal Library Content Standard

Status: Phase 1 baseline  
Established: 2026-09-12  
Scope: Built-in herbs, approved community suggestions, AI retrieval, and herb images

## Purpose

Herbal AI is an educational Philippine medicinal-plant library. Every published statement must be traceable, appropriately qualified, and safe to retrieve through Dr.Ai. A record is not considered verified merely because its fields are complete or an embedding was generated.

## Publication classes

Every herb must have one publication class. The classes must not be inferred from a plant name.

1. **DOH/PITAHC listed** — The plant appears in a current official DOH or PITAHC medicinal-plant reference. The UI label should say “DOH/PITAHC listed,” not “DOH approved,” because listing a plant is not an endorsement of this application or every preparation made from that plant.
2. **Evidence-supported Philippine use** — The plant is relevant to Philippine traditional medicine and has credible government, academic, pharmacopeial, or peer-reviewed support, but it is not part of the official ten-plant set.
3. **Documented traditional use** — The use is reported in a reliable ethnobotanical source but lacks sufficient clinical support. Wording must explicitly identify it as traditional use.
4. **Draft / hold** — Identity, source, safety, licensing, or claim wording is unresolved. Draft records must not appear in the public library or Dr.Ai retrieval context.

`isVerified` and `isDohApproved` are too coarse to represent these classes by themselves. The governance migration supplements them with explicit publication status and evidence class.

## Source hierarchy

Use the strongest available source for each individual claim:

1. Current DOH and PITAHC pages, monographs, circulars, formularies, and official publications.
2. Philippine government research bodies and public universities, including DOST-PCHRD and institution-hosted research.
3. Recognized botanical authorities for identity and accepted names, including Plants of the World Online and Philippine botanical institutions.
4. Peer-reviewed systematic reviews, clinical studies, pharmacopoeias, and WHO monographs.
5. Credible ethnobotanical publications for claims labeled only as documented traditional use.

Commercial blogs, social posts, search-result snippets, AI-generated text, product marketing, and uncited summaries are not acceptable factual sources.

At least one authoritative source is required for botanical identity and each published medical-use group. Preparation and dosage require an exact official or clinical source; values must never be averaged, converted, or invented across sources. A second independent source is required when a claim is absent from DOH/PITAHC material, involves children or pregnancy, or carries meaningful toxicity or interaction risk.

## Required record fields

The final data model should retain:

- Stable internal ID and normalized slug.
- Preferred Philippine local name and documented regional names.
- Accepted scientific name, author citation when available, family, and source-used scientific synonym.
- Plant part used and preparation form.
- Publication class, evidence level, review status, reviewer, and review date.
- Medicinal use written at the source’s evidence level.
- Preparation and dosage copied semantically from one identified source, with population and units preserved.
- Contraindications, interactions, adverse effects, red-flag symptoms, and missing-safety-data status.
- Structured citations with title, publisher, URL or bibliographic reference, publication date, access date, and which fields each source supports.
- Image path, depicted taxon, creator, source page, license, license URL, and modification note.
- Provenance indicating built-in, community-submitted, or administrator-created content.

The governance migration adds structured citations, image attribution, evidence class, review metadata, and provenance to Herb. Suggestion approval preserves `SuggestedHerb.informationSource` as a linked Herb source.

## Medical wording

- Keep descriptions direct and readable; do not repeat agency names in every field. Retain attribution in structured sources and the separate references section.
- Use “Traditionally used for…” when only traditional-use evidence is available.
- Avoid “proven,” “cures,” “completely resolves,” “safe,” and similar absolute language unless the cited source explicitly justifies the exact statement and context.
- Do not extend a source indication to related conditions. For example, evidence for cough does not automatically support flu, fever, asthma, or pharyngitis.
- Keep pre-clinical, clinical, and traditional evidence visibly separate.
- Never advise stopping prescribed treatment.
- Include consultation language for diagnosis, persistent symptoms, pregnancy, children, chronic disease, and possible interactions when applicable.
- “No warnings known” is not acceptable when safety data is absent. Use “Safety information has not yet been verified” and hold publication when risk is material.

## DOH/PITAHC badge rule

The badge is allowed only when a current official source identifies the corresponding taxon in the recognized medicinal-plant set. The scientific identity must match the official name or a documented accepted synonym. The badge applies to the plant reference, not to every claim, dose, user submission, commercial product, or this application.

The primary baseline is the [PITAHC Directory of Herbs](https://pitahc.gov.ph/herbs-directory/), supported by the [PITAHC agency page](https://pitahc.gov.ph/) describing the ten medicinal plants identified through DOH research and validation.

## Image standard

Search engines may be used for discovery only. Every published image must:

1. Come from its original source page, not a search thumbnail or copied blog.
2. Show the verified scientific taxon, preferably with diagnostic leaves, flowers, fruit, or habit visible.
3. Have a reusable license: public domain, CC0, CC BY, or CC BY-SA. Any additional license conditions must be followed.
4. Record creator, source URL, license name, license URL, and any crop or color adjustment.
5. Be stored under `herbalaifrontend/public/images/herbs/` using a stable lowercase slug and an optimized WebP or AVIF derivative while retaining attribution metadata.
6. Use descriptive alternative text based only on visible content.

Decorative stock images, AI-generated botanical identification images, unlabeled uploads, and images whose taxon cannot be confirmed must not represent a library record.

## Review workflow

1. Normalize the proposed name and resolve accepted name plus synonyms.
2. Establish Philippine relevance and publication class.
3. Extract claims without changing evidence level.
4. Verify preparation, dose, safety, and affected population independently.
5. Verify image identity and license; record attribution.
6. Have a human reviewer approve the complete record.
7. Publish the record and then generate its embedding from approved fields and source labels.
8. Re-review when a cited source changes or at a defined review interval.

Embeddings must be regenerated whenever approved identity, claims, preparation, dosage, warnings, or evidence class changes. Draft and held records must be excluded from Dr.Ai context.

## Seed and community-data rules

- Built-in records need deterministic IDs or slugs and idempotent updates.
- Seed matching must not use a broad `localName OR scientificName` update that can merge unrelated or duplicate records silently.
- Seeding must update only records whose provenance is built-in; it must never overwrite community records.
- Approved suggestions must preserve the submitter’s information source and add reviewer verification metadata.
- Approval must not imply DOH/PITAHC listing.
- The safe default for a new Herb is unverified until review is complete.

## Governing references

- [PITAHC Directory of Herbs](https://pitahc.gov.ph/herbs-directory/), accessed 2026-09-12.
- [PITAHC agency and Philippine herbal medicine overview](https://pitahc.gov.ph/), accessed 2026-09-12.
- [Republic Act No. 8423 — Traditional and Alternative Medicine Act](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/3840).
- [DOH Administrative Order No. 172, s. 2004 — Guidelines on the Registration of Herbal Medicines](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/11/42163).
- [Plants of the World Online](https://powo.science.kew.org/) for accepted botanical names and synonyms.
