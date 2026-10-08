# Connected provider preflight

Date: 2026-10-04. Read-only inspection; no database writes, uploads, account-setting changes, credential extraction, commits or pushes.

## Neon inspection

The user-opened project is **HerbalAi capstone**, project `falling-block-62836604`. Its selected branch is `pre-railway-deploy-2026-09-20`, branch `br-still-waterfall-aqtagztm`, endpoint `ep-icy-sound-aqfe958d`, database `neondb`. Do not assume the branch named `production` is the live app's database merely because of its name.

Executed the following read-only query in the Neon SQL Editor:

```sql
SELECT current_database() AS database_name,
       COUNT(*) AS herb_total,
       COUNT(*) FILTER (WHERE "publicationStatus" = 'PUBLISHED' AND "isVerified" = true) AS public_total,
       md5(string_agg(id, '|' ORDER BY id) FILTER (WHERE "publicationStatus" = 'PUBLISHED' AND "isVerified" = true)) AS public_id_fingerprint,
       (SELECT COUNT(*) FROM "SuggestedHerb") AS suggestion_total
FROM "Herb";
```

Observed: **38 total Herb rows, all 38 published and verified, and 17 SuggestedHerb rows**. Public ID fingerprint `8f27e6bdb9f183d89473c428d0980eb0` matched a fresh public API response containing the same 38 IDs. This corroborates the selected branch's catalog against the live website. Railway's configured database connection target was not independently inspected, so do not treat this as authorization to change its connection settings.

The complete identity result used no publication or suggestion-status filter:

```sql
SELECT 'Herb' AS "recordType", id, "localName", "scientificName",
       "sourceScientificName", "cebuanoName", "publicationStatus"::text AS status, "isVerified"
FROM "Herb"
UNION ALL
SELECT 'SuggestedHerb' AS "recordType", id::text, "localName", "scientificName",
       NULL::text AS "sourceScientificName", "cebuanoName", status::text, NULL::boolean AS "isVerified"
FROM "SuggestedHerb"
ORDER BY "recordType", "scientificName", id;
```

All **55 displayed rows** were captured in `NEON_HERB_IDENTITY_SNAPSHOT_2026-10-04.json`. Only plant names, record IDs, recorded synonyms/regional names, status and verification indicators were captured; no User rows or credentials were requested. Counts and the saved Herb-ID fingerprint were validated locally before comparison.

## Fifty-candidate comparison

The existing `expansionQueueSchema` and `findIdentityConflicts` helpers compared the fifty candidates against all 55 captured rows. Regional-name strings were split on commas and slashes for conservative alias comparison. Stored source scientific names and the queue's recorded historical synonyms were included.

Observed result: **zero direct scientific-name, recorded-synonym, local-name or regional-alias conflicts**. All fifty remain research candidates, not approved publications. This is a point-in-time comparison of the identities actually recorded in the inspected branch; it does not resolve every possible botanical synonym or guarantee future race-free insertion. Taxonomy, evidence, safety and photo checks remain pending, and duplicate checks must be repeated at staging time.

The existing default review CLI still labels its own comparison `PUBLIC_BASELINE_ONLY`; this provider inspection is a separate, wider comparison. Do not silently relabel the old public-baseline report as a complete database check.

## Existing suggestion anomaly

Suggestion **3** is marked `Approved` but has local name `awdsawd` and scientific-name text `awds`. It is not among the 38 Herb rows returned by this inspection. This is a legacy review/data-quality anomaly requiring separate triage, not one of the fifty new candidates. Suggestion 66 is the sourced Kalingag record, also Approved. Fifteen other suggestion records are explicitly rejected QA/test records. There are no Pending or ChangesRequested rows in this captured inventory.

No historical suggestion was deleted or modified. Do not invent a botanical identity for the malformed record, and do not republish rejected test records.

## Cloudinary inspection

The user-opened Cloudinary media environment shows cloud name **`dclqw6at7`**. The media-library search displayed 21 assets. Folder Home displayed `herbal_ai_herbs`, `herbal_ai_messages`, `herbal_ai_suggestions`, and `samples`. The expected herb-specific folder therefore exists.

No API key/secret was opened or copied. No upload was attempted. The current public Herb records did not provide a Cloudinary URL suitable for independently proving this environment is Railway's configured media account. Confirm the non-secret cloud name against the backend's provider configuration before any upload or URL integration.

## Browser limitations observed

- Neon's JSON-download wait stalled, and the automation session reset. A subsequent clipboard-copy attempt returned no parseable text. The completed result table was therefore read directly from its displayed DOM instead; all 55 rows were available, so no rows were invented or assumed from a truncated export.
- Cloudinary folder drill-down encountered an automation input timeout. The folder listing itself was observed successfully. No asset-detail or upload operation is counted as completed.

## Next bounded batch

1. Research and review the first ten candidate identities and field-level evidence, including plant-part-specific safety and Philippine occurrence.
2. Complete bounded full-image downloads, decoding and visual checks. The ten existing CC0 photo leads are still unapproved; the incomplete local Atis asset must not be uploaded.
3. Confirm the non-secret Cloudinary cloud name and Neon endpoint against the backend's provider configuration without copying secrets into chat or Git.
4. Prepare a reviewed DRAFT staging/import plan with transaction-time duplicate protection; validate it in isolation before any live write.

The user does not need to share passwords or API secrets. Keep the connected provider tabs available for future approved review work.
