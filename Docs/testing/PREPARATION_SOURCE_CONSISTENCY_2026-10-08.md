# Abutilon and Lokoloko preparation/source correction

Date: 8 October 2026, Asia/Manila. Scope: two existing published herbs and two existing source rows. This was a live data correction, not a new application deployment or a complete clinical/content certification of the Library.

## Confirmed findings and reviewed sources

| Record | Observed problem | Applied correction |
| --- | --- | --- |
| `builtin-expansion-03-pardo-030`, Abutilon indicum | Source 358 pointed to `https://www.stuartxchange.org/Gling.html`, which returned HTTP 404. The method specified stems and a crushed poultice not substantiated by the reviewed external-wash passage. | The existing source now links to the retrieved HTTP-200 [Malbas page](https://www.stuartxchange.org/Malbas.html), Folkloric uses section. Preparation describes the reported leaf-decoction wash, without invented quantities, timing or a poultice recipe. |
| `builtin-expansion-03-pardo-171`, Lokoloko / Ocimum gratissimum | The stored method prescribed crushing leaves and steeping for 5–10 minutes. The current references did not substantiate these instructions. | The method describes the historical grouped-basil infusion and the separately named leaf decoction, explicitly stating the lack of a measured species-specific recipe. Source 242 now attributes preparation to [the 1901 book](https://www.gutenberg.org/files/26393/26393-h/26393-h.htm), Mint Family, pages 195–196. |

Abutilon already had a newer StuartXchange source; the older audit's “laboratory source only” description was no longer current. This work verified and corrected that source rather than assuming it was absent. StuartXchange's traditional-use report is not a clinical trial. The book's historical treatment claims were not adopted as current medical advice. The Diyaolu contamination/brine-shrimp study remains a limitation reference, not evidence of a timed household infusion.

Exact before/after wording and source corrections are preserved in `Docs/research/PREPARATION_SOURCE_CORRECTIONS_2026-10-08.json`. No medicinal dose, child regimen or unsupported beginner steps were added.

## Production write controls and receipts

- Independently confirmed target: `ep-icy-sound-aqfe958d.c-8.us-east-1.aws.neon.tech`, database `neondb`. No environment variable or credential was changed, printed or committed.
- A read-only snapshot preserved both complete records, their sources and prior vectors before writing. The private backup is outside the Git checkout.
- Only the two allowlisted identities were accepted; their scientific names, published/verified status, original methods and source ownership/URLs were checked.
- Two bounded `gemini-embedding-2` requests generated 768-dimensional replacement vectors from the actual corrected text and unchanged surrounding fields. No all-catalog reembedding or repeat import was run.
- A reviewed plan hash, matching complete before-images, active authorized administrator, serializable transaction, row locks, timeout bounds and affected-row counts guarded the update. Both preparations, both source corrections, both vectors and both audit entries committed together.
- Transaction update timestamp: **17:01:18.934 Manila**; post-commit receipt: **17:01:23.513 Manila**. Audit IDs **262** and **263**, action `UPDATE_HERB`, operation `PREPARATION_SOURCE_CONSISTENCY_CORRECTION`. Audit details explicitly identify authorized maintenance-script execution rather than claiming a UI edit.
- Record count remains **88**; source count remains **301**. Checksums of the other 86 herbs and every source outside IDs 358/242 remained unchanged. All other fields on the selected herbs, including dosage, warnings, images and identities, were independently compared and remain unchanged.
- Full readback confirmed the vectors match the generated values at pgvector float32 precision. No historical audit entry or source row was deleted.

| Herb | Embedding input SHA-256 |
| --- | --- |
| Abutilon | `d49d4560effe62263abfdab12f7a67fde1b769ed7d277255ac11fee2716c2ab6` |
| Lokoloko | `fdd8287e9f0c8ac88affb4c78c16e9673f6efac289d4747d4229844ef2731075` |

Reviewed plan SHA-256: `5f266d39e1d1aef0c29a210a870219a65efec600fca21a8cb8824d52ba9f65b9`.

## Executed validation

- **92 tests passed across four files**, using the clean exported release checkout, plus only the new review fixture and regression file: `herb-source-consistency-rag.test.ts`, `herb-preparation-rag.test.ts`, `chat-safety-boundaries.test.ts`, `gemini-fallback.test.ts`.
- Nine new tests cover local/scientific-name retrieval, exact corrected wording/source propagation, streaming, provider-failure fallback and child-specific recipe withholding. These use isolated fixtures and mocked providers; they are not live-provider or clinical tests.
- A first fixture run failed because it passed the review-only `expectedUrl` into AI context. The fixture was corrected to select actual public source fields; no production defect was inferred from that fixture failure.
- The first post-write verification compared JSON decimal representations directly with float32 values and failed. The verifier was corrected to compare both sides at float32 precision; full readback then passed. No second database write or vector regeneration was needed.
- Both public detail endpoints returned **HTTP 200**, with the exact corrected preparation and source URL.
- Actual live Library UI displayed both corrected preparations and their updated references.
- One authenticated Library → Dr. Ai exchange for Lokoloko completed. It retrieved the new grouped-infusion/species-specific-decoction distinction, stated that measured quantities and steeping/boiling times were missing, cited Lokoloko and did not repeat the removed 5–10 minute instruction. No repeated AI prompts or manufactured outage were used.

No fresh live Abutilon chat was sent; its public UI, database/vector readback and isolated named-retrieval/stream/fallback tests passed. No new build/deployment was required for this data-only maintenance. The JSON review, new regression file and documentation are saved locally and are **not committed or pushed**.

## Evidence and continuation

Local evidence directory:

`C:\Users\Hp\Documents\Codex\2026-10-07\what-can-you-proposed-fix-for\preparation-source-review-2026-10-08`

Contains public before/after responses, `corrections.json`, guarded `repair.mjs`, private database/vector backup and reviewed plan, `apply-receipt.json`, `verification-receipt.json`, `public-api-receipt.json`, two live Library screenshots and the Lokoloko live AI transcript/screenshot. Keep the complete vector backups/plans out of Git. Test log: `C:\Users\Hp\Documents\Codex\2026-10-07\what-can-you-proposed-fix-for\ban-release-5fff94ce6d394d8b8532832eac5327de\source-consistency-safety-tests.log`.

These two preparation/source findings are repaired and verified within this scope. Remaining earlier gates—catalog-wide embedding-input provenance, image licensing/review provenance, regional-name presentation and unperformed participant UAT—are not closed by this correction. Continue from those recorded gates without repeating this import or inventing measured recipes to fill unavailable evidence.
