# Photo creator metadata continuation - 7 October 2026
Status: HELD. This checkpoint follows HERB_OXALIS_KASTULI_CONTINUATION_2026-10-07.md. No live herb was added or edited.

## Completed
- Corrected seventeen third-, fourth- and fifth-ten draft imageCreator fields containing "no rights reserved" to null. Null explicitly preserves an unknown creator instead of inventing a photographer.
- Added HERB_CREATOR_METADATA_FOLLOW_UP_2026-10-07.json, binding each correction to its candidate, species, original source/photo/observation identifiers, media URLs, historical retrieval time and source hash.
- Kept existing image URLs, license, modification descriptions, preparation evidence, review gaps, DRAFT/UNASSESSED states and publication holds unchanged.
- Added a release-preflight guard rejecting normalized rights/license labels as creator names, including case, whitespace, hyphen and underscore variants. Empty text is rejected; absent/null and named metadata do not grant publication clearance.
- Preserved all three historical upload/audit/replacement receipts byte-for-byte, confirmed by raw SHA-256. Historical incorrect values remain in their original observation receipts; the new correction ledger is separate.
- Reviewed the official [CC0 deed](https://creativecommons.org/publicdomain/zero/1.0/) for the distinction between rights metadata and creator identity. No individual photo license, photographer, taxon or current media-delivery revalidation is claimed.

## Observed validation
- Targeted: six files, 186 passing tests.
- Combined focused suite: 38 files, 650 passing tests; 41 new correction/provenance/guard/held-release cases.
- Backend typecheck, strict changed-files typecheck, targeted ESLint and tracked git whitespace check passed.
- Read-only public preflight at 2026-10-07T01:15:53.689Z: 38 public herbs; fifty held draft plans; 49 descriptive core-field drafts; one partial Lokoloko draft; eleven missing selected covers; two secondary identity holds; zero public stored-name conflicts; zero publication clearance. Intentional checker exit 2 means HELD.
- Selected covers remain 39: twenty named creators retained without fresh re-verification, nineteen unknown creators (seventeen corrected here plus two already null), and eleven drafts without selected covers.
- Evidence: HERB_CREATOR_METADATA_VALIDATION_2026-10-07.json and HERB_CREATOR_METADATA_PUBLIC_PREFLIGHT_2026-10-07.json.

## Next work
Continuation update: bounded remaining-cover research, the current-plan selector repair and fresh public Library checks are recorded in HERB_CURRENT_COVER_CONTINUATION_2026-10-07.md. The fifty drafts remain held; no new cover was selected or published.

1. Research the eleven remaining permitted exact-species covers. Do not substitute unrelated plants or images with unknown reuse permission.
2. Verify individual selected media provenance and fresh delivery; retain botanical and human review holds. Unknown creator metadata must not be silently converted to an asserted name.
3. Resolve Lokoloko historical taxonomy and Philippine occurrence, or keep it excluded/held instead of forcing a name match.
4. Complete separate unresolved food-processing/safety review: Kastuli coffee, Kabiki fruit, Balibago leaves, Santan exact cultivar and Oxalis safe controls. Descriptive field completeness is not a safe beginner preparation.
5. Complete genuine content/category/botanical and source-reuse review, target backup, private all-state transactional duplicates, and guarded isolated PostgreSQL import/rollback/concurrency tests before staging. Docker/PostgreSQL are not available here; no database-import acceptance is claimed.
6. Only after those gates pass, review publication and verify Library visibility and retrieval. The fifty drafts are not public AI knowledge.

No production write, upload, credential access, frontend change, embedding update, live AI request, commit or push occurred. HEAD remains 741167b on codex/mvp-acceptance-ci. Unrelated working-tree changes remain untouched. This focused batch is not full live MVP acceptance.
