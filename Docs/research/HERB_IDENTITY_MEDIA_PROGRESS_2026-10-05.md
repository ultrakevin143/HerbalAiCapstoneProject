# Identity and media follow-up

Date: 2026-10-05. Current result: **20 of 50 expansion candidates have selected, uploaded, byte-verified media**. No new herb rows were staged or published.

## Generator repair

The offline generator previously truncated accepted and historical scientific names to their first two tokens. This would lose a subspecies epithet or turn a hybrid name into an incomplete label. Its CLI also wrote directly over the reviewed research queue and ignored an explicit output argument.

`scripts/build-herb-research-queue.py` now preserves named hybrid markers and supported infraspecific ranks, normalizes `ssp.` to `subsp.`, strips supported author suffixes, and rejects incomplete names, parent-cross formulas, unsupported ranks and cultivar strings rather than guessing. Literal epithet initials such as the x in `xanthochymus` and the authority `L.f.` remain distinguishable from hybrid/rank markers.

The CLI is a **nonwriting dry run by default**. `--output PATH` creates only a new file; exclusive creation prevents overwriting an existing reviewed file. All fifty current generated candidate identities match the stored research queue, and the repaired dry run leaves the queue bytes unchanged. These syntax changes do not establish taxonomic equivalence or reconcile stored accepted identifiers.

Observed local validation:

- Seven standard-library Python tests passed, covering eleven supported-name and nine rejection subcases, all-fifty identity preservation, altered hybrid/subspecies inventory fixtures, nonwriting default execution, new-file output and existing-file protection.
- The seven tests are scheduled in the backend CI workflow. The workflow edit has not been pushed or executed by GitHub Actions in this continuation.
- Existing seven focused herb suites passed: **99 tests**.
- New follow-up evidence and taxonomic suites passed together: **30 tests**, including six new evidence cases. Standalone strict TypeScript checking of the new evidence test passed.
- Broad local backend regression run passed **928 tests in 68 files** in 101.57 seconds. Seventeen database-dependent suites were explicitly excluded and a loopback-only unusable database URL was supplied; this does not establish database transaction, deployment or live acceptance results.

Use from the repository root:

```text
python -B scripts/build-herb-research-queue.py
python -B scripts/build-herb-research-queue.py --output NEW_RESEARCH_QUEUE_PATH.json
python -B -m unittest discover -s scripts -p test_herb_research_queue.py -v
```

Do not replace a reviewed queue with regenerated inventory data; source reconciliation is a separate review.

## Botanical and provider-name reconciliation

### Radish

[Kew's accepted subspecies entry](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77159305-1) explicitly lists `Raphanus sativus` as a synonym of `Raphanus raphanistrum subsp. sativus`. The public iNaturalist taxon API uses `Raphanus raphanistrum sativus`, taxon 995125, with an explicit **subspecies** rank. It omits the written rank marker; searching only the old species spelling or requiring a species rank misses this concept.

The exact-subspecies photo query returned 329 results before bounded screening. Four individually CC0 photographs were downloaded and fully decoded. The broader `Raphanus raphanistrum` and a returned infrahybrid were not accepted as substitutes. The stored queue remains `Raphanus sativus` with key `4RJXT`; proposed accepted-name and provider-name mapping are recorded separately.

The [BPI seed-production PDF](https://library.buplant.da.gov.ph/images/1641882970Radish%20Seed%20Production%20Guide.pdf) returned HTTP 404 when opened. Its search snippet is not counted as a successful full source review or final Philippine-occurrence clearance.

### Mustasa

[Kew's Brassica × juncea synonym entry](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:60442520-2/general-information) links to [the accepted × Brassarda juncea treatment](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77354001-1). This resolves the apparent genus discrepancy for choosing a provisional source photograph; it does not assign a replacement checklist key or approve medicinal content. Historical unmarked spellings remain auditable source names, not silent accepted-name rewrites.

The original queue `Brassica juncea`, key `N7ZK`, is unchanged. A separately recorded proposed name and explicit synonyms permit a later reviewed duplicate comparison under either treatment. The selected photo's observation still uses `Brassica juncea`.

### Kahel and other media gaps

Removing the inappropriate species-only filter found `Citrus × aurantium` as a hybrid and `Citrus × aurantium aurantium` as a form in the provider API. The [Kew form entry](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:3287406-4) includes bigaradia names among numerous citrus synonyms. That alone does not settle the historical book author's intended bitter-orange crop concept. No broad orange, mandarin or grapefruit picture was substituted.

Fresh exact-taxon, research-quality, individual-CC0 queries for the candidate Kahel form, Alibangbang, Kupang and Ayapana each returned zero observations. These are bounded query results, not proof that no suitable photograph exists elsewhere. Their identities/licences were not broadened simply to reach fifty.

## Three completed media selections

| Candidate | Actual selected image and limitation |
| --- | --- |
| Mustasa | Photo 131251463: clear yellow four-petalled flower cluster; consistent with Kew's linked description. It does not show every diagnostic vegetative feature. |
| Radish | Photo 62230932: sharp pink-purple veined four-petalled flower. Explicit subspecies observation; not a root photograph or cultivar guarantee. |
| Maize | Photo 312217428: field-grown foliage with prominent midribs and alternating long leaves. Selected as a foliage cover, not a mature-ear or tassel image. |

Four previously undersized maize derivatives were retried using their public source **originals**, not upscaled. All four originals decoded and passed the unchanged 800-long-edge/600-short-edge gate within the 10 MB cap. Actual screening rejected a blurred trash-container scene and an annotation-circle image; increasing resolution did not make them appropriate covers. The chosen field-foliage original is 1152 × 2048 pixels and 3,534,053 bytes. The earlier failed derivative remains recorded as failed in its historical ledger.

All eight new downloads and the one previously downloaded Mustasa picture were visually inspected. Primary morphology references: [Radish](https://www.nparks.gov.sg/florafaunaweb/flora/8/0/8073), [Maize](https://www.nparks.gov.sg/florafaunaweb/flora/2/5/2568), [Mustasa under Kew's linked synonyms](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77354001-1/general-information). Descriptions support visible consistency, not expert specimen authentication or medical approval.

Immediately before upload, all three selected observations were re-read: expected taxon/rank, research quality and individual photo `license_code: cc0` passed. Files were uploaded without retouching or removing markings to Cloudinary `dclqw6at7/herbal_ai_herbs`. The widget showed **3 uploaded**, and the folder increased from **29 to 32 assets**. Its total includes 12 pre-existing assets.

Each new public original returned HTTP 200, `image/jpeg`, fully decoded with the source dimensions, and matched the source SHA-256. Photo provenance, identity proposals, exact Cloudinary asset/public IDs, URLs and observed delivery hashes are recorded in `HERB_IDENTITY_MEDIA_FOLLOW_UP_2026-10-05.json`. No invented delivery URLs are counted as verified.

## Boundaries and next batch

### Remaining-thirty download intake

The existing 51 CC0 leads for 26 of the remaining thirty candidates were downloaded after fresh individual provenance checks. The first combined 38-observation request returned HTTP 422 before downloads began. Four bounded requests of at most ten observation IDs each then returned all 38 expected observations. This recovered the request; an endpoint ID limit was not independently confirmed.

**50 of 51 derivatives fully decoded and passed the unchanged size gate.** Thespesia populnea photo 211848399 failed the size threshold; its companion passed. This failure is not described as proof of corrupt bytes. Four candidates still have no leads. No images from this intake have yet been visually inspected, selected or uploaded. Raw API responses and downloaded image bytes remain outside Git; `HERB_REMAINING_THIRTY_DOWNLOAD_INTAKE_2026-10-05.json` retains actual provenance, checksums, counts and the failed result without exposing local paths or enabling import.

Six new intake data-contract regressions passed. Together with the identity/media follow-up and taxonomic suites, **36 tests in three files passed**. Strict standalone TypeScript checking of the new intake test passed. These checks verify evidence consistency, not image morphology or medicinal efficacy. The full continuation order is in `HERB_EXPANSION_CONTINUATION_PLAN_2026-10-05.md`.

Final broad rerun including the intake suite: **934 tests passed in 69 files**, duration 109.20 seconds. The same seventeen database-dependent suites remained excluded, with a loopback-only unusable database URL. The seven Python generator tests were rerun and passed. Changed-batch whitespace checks passed; Git printed its existing Windows LF/CRLF notice. No GitHub CI, PostgreSQL integration or live database import result is claimed.

- **Media complete for the first twenty; final clinical/publication approval is not complete.** Food or ornamental use is not medicinal safety evidence.
- No actual accepted queue name/key was replaced. The new evidence ledger is not importer-compatible and explicitly disables staging/publication.
- No Neon reads or writes occurred in this continuation. The earlier unfiltered snapshot is not independent proof of Railway's target: its target-verification and live-fingerprint gates remain unresolved.
- No new credentials, deployment, commit or push. Unrelated edits and prior evidence snapshots are preserved.
- PostgreSQL integration/concurrency tests remain unrun locally; production Neon must not be a destructive fixture.

Next: screen third-to-fifth-batch photos, try additional legitimately licensed sources for the four remaining media/search gaps, then review modern Philippine occurrence and part-specific medical safety. Before any import, verify the intended live database target, repeat all-state duplicate comparison with reconciled synonyms, and prove DRAFT-only transaction/concurrency behavior in isolated PostgreSQL. The fifty-record expansion is not ready for publication merely because twenty images are uploaded.
