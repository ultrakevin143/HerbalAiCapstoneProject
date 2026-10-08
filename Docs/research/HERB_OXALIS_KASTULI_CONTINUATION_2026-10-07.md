# Remaining preparation-source continuation - 7 October 2026
Status: HELD. This checkpoint follows HERB_SANTAN_KABIKI_CONTINUATION_2026-10-07.md. No live herb was added or edited.

## Completed
- Oxalis corniculata: added a primary source-bound description of traditional leaf parboiling from [Masters' northern Uganda study](https://doi.org/10.1186/s13002-021-00441-4). The exact species appears in the leaf-vegetable processing paragraph and species table. SA45 is the study's field identifier, not an asserted herbarium voucher accession.
- Kept the processing statement narrower than neighboring recipes: no sauces, ingredient quantities, repeated boiling, cooking duration, safe serving or validated oxalate reduction is inferred. The existing PROSEA oxalate warning remains unchanged. This is not a Philippine practice or a complete beginner recipe.
- Kastuli (Abelmoschus moschatus): added a separate seed/leaf laboratory water-extraction description from [Gul et al.'s in vitro study](https://doi.org/10.1186/1472-6882-11-64). Material provenance is CIMAP Hyderabad; the reviewed plant-material paragraph supplies no voucher accession. Centrifugation and vacuum concentration remain laboratory descriptions, not home treatment or coffee flavouring.
- Both papers were read through successful bounded EuropePMC full-text XML retrieval and publisher method text. Actual retrieval times, byte counts and hashes are saved in HERB_OXALIS_KASTULI_PREPARATION_FOLLOW_UP_2026-10-07.json. No complete PDF visual review is claimed.
- Updated only these two fifth-ten records and aggregate counts, with separate follow-up ownership. Existing doses, warnings, images, historical names and DRAFT/UNASSESSED review flags remain unchanged. The original fifth-ten preparation ledger retains SHA-256 dd92ef08037f6961fe2e19459555fe5d18f23ad0e3f83af8f388f582f81f3d6e.

## Lokoloko and reuse boundaries
The fresh bounded [Co's Digital Flora Ocimum entry](https://www.philippineplants.org/Families/Lamiaceae.html) still places Blanco's misapplied O. virgatum under O. tenuiflorum. The book's association with queued O. gratissimum remains unresolved; no queue rename or regional-name reassignment occurred.
The [World Agroforestry O. gratissimum PDF](https://apps.worldagroforestry.org/treedb/AFTPDFS/Ocimum_gratissimum.PDF) text search did not locate Philippines. This is not proof of absence. No fresh raw-origin body or hash is claimed for these Lokoloko reviews.
Masters' study records a no-commercial-use assurance to its participants alongside an open-access article license. Only a limited educational summary is held locally; public reuse/context review remains an explicit gate. No informant details or community vernacular names are imported.

## Observed validation
- 37 focused files, 609 passing tests, zero final failures; 17 new provenance, species, safety and held-release checks.
- Backend typecheck, strict changed-test typecheck and targeted ESLint passed.
- The first targeted run found a test-schema mismatch: an older citation lacks optional kind metadata. The existing-citation schema was corrected, while both new sources still require their kind. The final combined run passed.
- Read-only public preflight at 2026-10-07T01:06:28.364Z: 38 live herbs; 50 held draft plans; 49 descriptive core-field drafts; one partial; eleven missing selected covers; two secondary identity holds; zero public stored-name conflicts; zero publication clearance. Intentional checker exit 2 means HELD.
- Evidence: HERB_OXALIS_KASTULI_VALIDATION_2026-10-07.json and HERB_OXALIS_KASTULI_PUBLIC_PREFLIGHT_2026-10-07.json.

## Next work
Continuation update: item 1 below was subsequently completed and validated in HERB_CREATOR_METADATA_CONTINUATION_2026-10-07.md. The counts and observations above remain the historical source-review checkpoint, not a claim of current publication clearance.

1. Correct the 17 draft imageCreator values that contain the rights phrase "no rights reserved"; preserve historical upload/audit receipts and do not invent photographer names.
2. Research the eleven remaining permitted exact-species covers, preserving botanical and delivery holds.
3. Resolve Lokoloko's historical identity and Philippine occurrence from explicit botanical evidence, or keep it excluded/held rather than forcing a match.
4. Complete separate unresolved food-processing and safety review: Kastuli coffee, Kabiki fruit, Balibago leaves, Santan exact cultivar and Oxalis safe controls. Descriptive completeness does not remove these limits.
5. Complete category/content/botanical and genuine human review, source-reuse checks, target backup, private transactional duplicates, and guarded isolated PostgreSQL import/rollback/concurrency tests before staging. Then verify live Library and retrieval outcomes.

No production write, upload, credential access, frontend change, embedding update, live AI request, commit or push occurred. HEAD remains 741167b on codex/mvp-acceptance-ci. Unrelated working-tree changes remain untouched. The fifty drafts are not public AI knowledge, and this focused source suite is not full live MVP acceptance.
