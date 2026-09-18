# Existing Herb Catalog Remediation

Status: Completed  
Applied: 2026-09-12  
Authoritative baseline: PITAHC Directory of Herbs, accessed 2026-09-12

## Result

The public catalog now contains one governed record for each of the ten medicinal plants in the current PITAHC directory. Medical-use wording now distinguishes clinical and pre-clinical evidence, preparation and amount statements follow the directory, and each record links to its supporting government source.

## Corrected records

- Akapulko — *Senna alata*
- Ampalaya — *Momordica charantia*
- Bawang — *Allium sativum*
- Bayabas — *Psidium guajava*
- Lagundi — *Vitex negundo*
- Niyog-niyogan — *Combretum indicum*; PITAHC source name *Quisqualis indica*
- Sambong — *Blumea balsamifera*
- Tsaang Gubat — *Ehretia microphylla*; PITAHC source name *Carmona retusa*
- Ulasimang Bato — *Peperomia pellucida*
- Yerba Buena — *Mentha × villosa*; PITAHC source name *Mentha cordifolia*

## Identity and publication actions

- Merged the duplicate Hilbas and Yerba Buena records after confirming neither had comments.
- Replaced the incorrect *Clinopodium douglasii* identity with the PITAHC identity and Kew accepted-name relationship.
- Renamed the live “Bitter Gourd” record to the preferred Philippine name “Ampalaya.”
- Placed Gumamela, Indian Heliotrope, and Tanglad on hold without deleting them. They are excluded from the public Library and Dr.Ai until adequate sources are reviewed.
- Removed the known-wrong Akapulko image and the taxonomically mismatched Yerba Buena image. Their cards intentionally use the image fallback until the licensed-image phase.

## Sources and embeddings

Every published record now has a structured PITAHC source. Yerba Buena, Tsaang Gubat, and Niyog-niyogan also carry Kew taxonomy references for accepted-name reconciliation. All ten corrected embeddings were regenerated successfully; no published verified record is missing an embedding.

## Verification

- Public API returns exactly the ten governed official records.
- No Hilbas duplicate or held record appears publicly.
- Every public record is published, verified, and has at least one structured source.
- Backend build passed.
- Full backend suite passed: 17 test files and 102 tests.

## Deferred phase

The remaining remote images still lack acceptable creator and license metadata. The next phase should source, visually verify, optimize, and locally store licensed images for all ten official records. The known-wrong Akapulko and Yerba Buena images are already suppressed.

## References

- [PITAHC Directory of Herbs](https://pitahc.gov.ph/herbs-directory/)
- [Kew: *Clinopodium douglasii* distribution](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:61186-2)
- [Kew: *Mentha × cordifolia* synonym record](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:60476613-2)
- [Kew: *Carmona retusa* synonym record](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:113775-1)
- [Kew: *Quisqualis indica* synonym record](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:170880-1)
