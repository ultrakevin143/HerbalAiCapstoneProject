# Current-cover research and live Library continuation - 7 October 2026
Status: HELD. Follows HERB_CREATOR_METADATA_CONTINUATION_2026-10-07.md. No live herb was added or edited.

## Focused repair
The replacement-photo runner depended on an older saved public preflight for its missing-cover queue. That can become stale after covers are selected or removed. It now reads all five current owning draft plans. The pure selector checks all fifty distinct identities, the correct held queue/status/flags, exact species ownership and the intended Cloudinary delivery origin/path. Regression tests prove that selection reacts to adding/removing a cover and rejects incomplete or mismatched inputs.
The first broad run exposed an older test that required the historical filename in runner text. That assertion was updated to explicitly forbid that dependency and require the current selector. Dynamic behavior remains tested; no release guard was weakened.

## Observed research and media blocker
- Fresh bounded iNaturalist search at 2026-10-07T01:18:44.096Z: eleven missing-cover candidates, 21 API requests, seven candidates with 21 per-photo CC0 leads. Exact-species and per-photo checks are still leads, not botanical, visual or publication clearance.
- The API search preceded the selector repair. Tests confirm the current plans produce its same eleven candidate IDs. The repaired CLI was typechecked; no repeat API search is claimed.
- Six first-choice photographs attempted: Nipa, Bottle gourd, Balibago, Asana, Kamias and Kastuli. At most two simultaneous transfers, 90 seconds per file, 8 MB cap, no retry.
- All six returned HTTP 200 but timed out (curl exit 28) with partial bytes. Pillow load with truncated-image acceptance disabled rejected every file. No source photo was visually approved, selected or uploaded.
- Lokoloko was deliberately not downloaded while historical identity/occurrence remains held. Alibangbang, Kupang and Ayapana have no qualifying lead in these bounded results; Kahel returns a different hybrid concept rather than an accepted exact queue match. This is not a claim that no suitable image exists.
- Original upload/audit/replacement receipts remain unchanged; the new search/download receipts are separate.
- Permission guidance checked against [iNaturalist's official media reuse FAQ](https://help.inaturalist.org/en/support/solutions/articles/151000169918). No statement here overrides individual photo permission or confirms photographer identity.

## Live public checks
- Full public catalog HTTP 200 at 2026-10-07T01:20:21.223Z: 38 distinct records, 38 nonblank preparation fields, no blank core fields in the checked list. Kalingag still lacks an image.
- Browser: Kalingag search returns exactly one result; its detail opens with preparation, warning and two reference links. Empty search displays the explicit no-match state. Next/Previous moved Page 1 to Page 2 and back.
- Kalingag dialog fits 375x812 and 1280x800 viewports. Dialog scroll width equals client width at both sizes; the phone page width is 375. Temporary viewport override restored.
- No console warning/error was observed in the captured tab logs. This does not certify all sessions or all pages.
- Preparation field presence is not a complete safe household recipe, validated dose or clinical clearance. No AI request, authenticated write, admin action, password test or new physical-device check was performed.

## Validation
- Final focused combined suite: 39 files, 668 passing tests, zero failures; eighteen new current-selection/download-boundary cases.
- Backend no-emit typecheck, strict changed-files typecheck, targeted ESLint and git whitespace check passed.
- Public preflight at 2026-10-07T01:25:01.952Z remains HELD (intentional checker exit 2): 50 plans, 49 descriptive core-field drafts, one partial, eleven missing covers, two secondary identity holds, no public stored-name conflicts, zero publication clearance.
- Exact results: HERB_CURRENT_COVER_VALIDATION_2026-10-07.json.
- Receipts: HERB_REMAINING_ELEVEN_PHOTO_RESEARCH_2026-10-07.json, HERB_REMAINING_ELEVEN_DOWNLOAD_CHECK_2026-10-07.json, HERB_CURRENT_COVER_LIVE_SMOKE_2026-10-07.json and HERB_CURRENT_COVER_PUBLIC_PREFLIGHT_2026-10-07.json.

## Next work, in order
1. Try a bounded browser-assisted download from an already verified individual source page or find another permitted exact-species source. Do not upload current partial files, upscale thumbnails or substitute another species.
2. Visually review completely decoded files and retain separate botanical-review holds; then recheck source taxon and individual license before any authorized Cloudinary upload. Do not infer that observer login identifies the photographer.
3. Resolve remaining cover leads, Lokoloko's historical identity/region and Kahel's hybrid mapping, or exclude/hold unresolved records.
4. Complete source-specific processing/safety, category/content/botanical and genuine human review. Unavailable safe recipes/doses must remain explicit rather than be fabricated.
5. Obtain target-specific recovery backup and current private all-state identity comparison. Build and test a guarded import, rollback and concurrent duplicates on real isolated PostgreSQL before staging; the required local database tools are still unavailable.
6. Publish only cleared records after reviewing the intended field diff, then verify live count, fields, images and citations and a small Library-to-AI retrieval check. The fifty drafts are not yet public AI knowledge.
7. Address the existing Kalingag cover separately with the same source/permission checks. Keep the other existing-catalog issues in LIVE_HERB_COMPLETENESS_2026-10-07.md visible.

No production write, upload, credential change, frontend styling change, embedding update, live AI call, commit or push occurred. HEAD remains 741167b on codex/mvp-acceptance-ci. Unrelated worktree changes were preserved. This is a completed bounded research/repair/live-smoke batch, not a claim that every feature or all fifty herbs are release-ready.
