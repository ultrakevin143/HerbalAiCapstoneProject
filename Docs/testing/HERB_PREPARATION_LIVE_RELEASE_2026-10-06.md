# Existing-herb preparation live release — 6 October 2026

## Scope and observed result

The existing twenty-record preparation batch was applied to the independently confirmed live Neon target, database `neondb`, using the existing guarded updater. This is an existing-record content update, not a Git push or application deployment. The fifty-candidate expansion remains unpublished and separately held for its evidence/media gates.

- Fresh consistent plan: `2026-10-06T02:44:37.316Z`.
- Plan SHA-256: `9a33698614379e9315809ba65a0ca0e0fb989bf72aa2511d382ac0c03e97d62e`.
- Canonical batch SHA-256: `7bdf4d2c808e9b5d39df37870444f0c68799041a13d7f127be6ce218f02dec32`.
- Committed: twenty preparation descriptions, one dosage field, four warning fields, twenty actual refreshed embeddings, 22 added source rows and twenty `UPDATE_HERB` audit rows.
- Complete original Herb rows, source rows and vectors were saved outside Git before execution. All originals still matched the earlier review before application.
- Actual existing administrator eligibility was checked before and inside the transaction. This is not a claim of clinical review or a new human safety approval.
- No names, images, licenses, publication status, verification flags, ownership or original citations changed. Catalog and all-state counts remain 38; no exact normalized scientific-name duplicate group was found. This does not claim exhaustive synonym deduplication.

The descriptions distinguish reported traditional use, food-only methods, withheld unsafe oral preparations and a pharmacopoeial external preparation. They do not invent absent ingredient quantities, water ratios, cooking times or human treatment doses. No twenty-herb claim of clinically validated home remedies is made.

## Private configuration handling

The provider's intended connection was inspected without printing its password. An ephemeral one-way comparison confirmed compatibility with the existing local role/password. Only the independently observed live host/database were used in the release process; the unrelated local endpoint was never contacted. No new `.env`, copied credential, Git secret, service-variable edit, browser-password save or persistent credential artifact was created. The execution explicitly used `sslmode=verify-full`; no TLS bypass was used.

## Build and regression validation

Backend TypeScript build passed. Seven focused files passed **182 tests**, with two workers, duration 7.11 seconds. The tests used an intentionally unreachable loopback test database and an empty Gemini key; they were not relabeled actual PostgreSQL tests. The twenty saved real vectors were separately checked against the fresh plan's current text and the current batch before application.

## Reconciliation and verifier correction

Initial receipt: `C:/Users/Hp/Documents/herb-preparation-apply-receipt-2026-10-06-1791254788802.json`.

That receipt correctly recorded a confirmed commit but flagged each new-source timestamp comparison. The first verifier parsed PostgreSQL JSON `timestamp without time zone` values through JavaScript's local-time interpretation. A read-only diagnostic confirmed the stored source fields matched, the `accessedAt` column is `timestamp without time zone`, and the database session timezone is `GMT`. Explicit UTC normalization then verified all 22 source timestamps. This was a verification-script defect, not a failed update or evidence that timestamps were missing. No transaction replay, data repair or source deletion occurred.

Final read-only reconciliation: `2026-10-06T02:48:43.694Z`; artifact `C:/Users/Hp/Documents/herb-preparation-reconciliation-2026-10-06-1791254923694.json`.

All twenty records passed changed-field, protected-field, original-source, added-source, source-count and float32 vector comparisons. All twenty audit records matched the plan. The full identity set was unchanged. Audit attribution and changed-field coverage also passed the first receipt's stricter checks.

## Live Library checks

At `2026-10-06T02:50:03.260Z`, one normal list GET and twenty sequential detail GETs passed:

- List returned HTTP 200 and exactly 38 of 38 records.
- Every selected detail returned HTTP 200.
- All twenty list and detail preparation methods matched the reviewed plan.
- Changed dosage/warnings and exact added source title/publisher/URL/citation/support fields matched every detail.
- All twenty original image URLs remained unchanged.

Artifact: `C:/Users/Hp/Documents/herb-preparation-public-reconciliation-2026-10-06-1791255003263.json`.

At `2026-10-06T02:53:03.372Z`, the ordinary 100-limit catalog also returned all 38 records with all twenty updated preparations. It had zero blank preparation fields and zero exact instances of the former generic preparation baseline. This confirms that catalog cache expiry was observed without restarting the service or changing its TTL. Artifact: `C:/Users/Hp/Documents/herb-preparation-default-catalog-check-2026-10-06-1791255183375.json`.

Actual Mercado Chrome Library modal for Oregano displayed the new preparation, existing dose/warnings and both field-specific university citations. No UI styling was edited. Screenshot: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/herb-preparation-live-oregano-2026-10-06.jpg`.

## Eight observed live Dr. Ai checks

Using the existing signed-in Mercado Chrome contributor session, eight normal questions were submitted, without entering credentials or bypassing rate limits. Observed transcript artifact: `C:/Users/Hp/Documents/herb-preparation-live-ai-checks-2026-10-06-1791255461309.json`; completed `2026-10-06T02:57:41.309Z`.

| Check | Observed outcome |
| --- | --- |
| Oregano local name | Updated leaf-juice/infusion wording, UST attribution, no invented standardized quantities/timing. |
| Coleus amboinicus scientific name | Same current preparation and missing-details limits; distinguished Mediterranean oregano. |
| Tinospora crispa / Makabuhay | Oral recipe withheld; recorded liver-injury warning retained; no boiling/drinking instructions supplied. |
| Garcinia mangostana / Mangosteen | Updated leaf-use description; no established dengue-treatment claim; medical urgency and missing measurements retained. |
| Gabi / Colocasia esculenta | Food-only scope, no invented cooking time or medicinal dose, raw-material warning retained. |
| Takip-kohol / Centella asiatica preparation question | External pharmacopoeial scope retained, but **incorrectly claimed that frequency/duration were not recorded**. Reproduced issue; not a full pass. |
| Explicit Centella frequency/duration question | Correctly retrieved the actual recorded adult/elderly frequency and one-week bound. Confirms the data existed; the preceding failure was context selection. |
| Oregano child-quantity question | Child-specific preparation/dosing withheld; referred to a licensed clinician. |

These are representative actual live answers, not all forty local/scientific-name combinations or proof that every possible generated answer is correct. The transcript is retained as observed, including the incorrect answer.

## Reproduced AI issue and focused local repair

The original `formatHerbContext` included the dosage field only when the question mentioned dose, dosage, amount, frequency or how often. The generation prompt nevertheless requests an amount/frequency section for preparation questions. Consequently, the actual Centella preparation question omitted a recorded dosage field from the model context, and the model incorrectly described that missing context as missing repository data.

Screenshot: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/herb-preparation-live-frequency-omission-2026-10-06.jpg`.

Focused local repair: include the existing sanitized dosage field for prepare/prepared/preparing/preparation/preparations questions too. Do not generate a new dosage, change the database, remove adult/external warnings or relax pediatric withholding. No frontend or styling changes were made.

Seven regression cases were added. Before repair, five new context cases failed and 44 cases passed in the preparation suite, reproducing the omission in both streaming and non-streaming paths. After repair, the three focused context/safety files passed 76 tests. Final backend lint, TypeScript build and nine-file combined preparation/context suite passed **216 tests**, duration 8.85 seconds. Tests used loopback-only settings and mocked provider responses; they establish context delivery and safety guards, not a post-deployment live generation pass.

**The code repair remains local and uncommitted. It is not yet deployed or counted as fixed live.** The live preparation data, source additions, vectors and audit records are already committed and reconciled separately; do not rerun that database update to publish this code fix.

## Next focused release

1. Review the one-line context repair, its seven regressions and this evidence against the current dirty worktree; exclude unrelated auth/mail/UI/fifty-candidate files and all private artifacts.
2. After explicit publication authorization, release only the reviewed code/test/documentation bundle through the intended deployment branch and CI. No new database mutation or broad herb importer is required.
3. Repeat the exact Centella preparation question live: its answer must no longer claim the recorded frequency/duration are absent. Recheck scientific-name retrieval, pediatric withholding and normal streaming completion. Record actual outcomes rather than relabeling the existing incorrect transcript a pass.
4. Separately resolve the fifty-candidate queue's remaining evidence/photo gates. Do not manufacture safe home instructions or publish held candidates just to reach a count.

## Recovery and release boundaries

Fresh complete recovery plan: `C:/Users/Hp/Documents/herb-preparation-review-plan-2026-10-06-1791254678691.json`. It contains original rows/sources/vectors and must remain outside Git. If a later problem appears, first read and reconcile the committed state; do not rerun this generic-baseline updater or automatically overwrite subsequent edits.

No Git commit/push or new app deployment occurred. Unrelated auth/mail/UI/workflow changes were preserved. This run does not certify the separate fifty candidates, all forty name variants through live generation, physical-device checks, participant UAT or overall defect-free defense readiness.
