# Balibago TKDL source continuation — 7 October 2026
Status: HELD. This is the current source checkpoint after HERB_COVER_INTEGRATION_CONTINUATION_2026-10-07.md. No live herb was added or edited.

## Completed source repair
- Added one separately owned, exact-species traditional preparation description for Balibago (Hibiscus tiliaceus). TKDL describes an inner-bark sap extraction in a Tagabawa account concerning cough. The draft summarizes the process without adopting oral quantities, repetition, child guidance or harvesting beliefs as treatment instructions.
- Recorded Luwago as Tagabawa and Malabago as Tagalog, preserving the account's context. Neither is inserted into a generic Cebuano field, assumed exclusive to a region, or used to overwrite the historical book's names.
- Preserved the earlier fourth-ten preparation ledger. The new field-plan method and source tags identify HERB_BALIBAGO_TKDL_FOLLOW_UP_2026-10-07.json; all other fourth-ten preparations, doses, warnings, images and held publication flags remain unchanged.
- Retained the separate leaf-food gap. A bark practice does not supply young-leaf cooking instructions or establish oral safety, clinical efficacy, a safe dose or expert review.

## Source and retrieval boundaries
- Reviewed the species heading, plant part, method, local-language names and account-location fields in the [TKDL record](https://www.tkdlph.com/index.php/ct-menu-item-3/ct-menu-item-7/davao/20105-luwago-tagabawa-malabago-tagalog) through the web tool's page extract. Informant names and personal details were not retained.
- [DOST-PCHRD's 2016 workshop notice](https://www.pchrd.dost.gov.ph/news_and_updates/philippines-dost-to-host-apec-workshop-on-the-development-of-herbal-medicine-database-in-asia-pacific-region/) identifies tkdlph.com as the Traditional Knowledge Digital Library. This establishes historical project provenance, not current clinical endorsement.
- The requested tkdl.ph host timed out in the web tool. It was not silently treated as the same host as tkdlph.com.
- A direct 20-second Node fetch of the TKDL record timed out, and the direct DOST request failed. No fresh origin HTTP 200, raw download, byte count or hash is claimed. The follow-up explicitly records web-extract review and null raw-download evidence. A fresh source/permission check remains a publication gate.
- A bounded check of Co's Digital Flora Lamiaceae page did not locate Ocimum gratissimum. Lokoloko's range remains unresolved; no absence or holy-basil identity is inferred.

## Current observed state
- 50 held field drafts; 45 have descriptive core fields and preparation evidence; five remain partial.
- 39 selected covers and eleven missing covers. Balibago still has no selected cover.
- Two secondary identity holds and zero publication clearance. All medicinal instructions, beginner steps and human reviewer flags remain uncleared.
- Public GET at 2026-10-07T00:43:14.254Z returned 38 live herbs and zero public stored-name conflicts. The read-only checker returned intentional exit 2; this is not an all-state private or transactional duplicate clearance.
- A descriptive traditional method is not a validated medicinal recipe. Balibago's leaf-food processing gap remains separately recorded despite the improved descriptive-field count.

## Validation and next work
Validation commands and actual outcomes are recorded in HERB_BALIBAGO_TKDL_VALIDATION_2026-10-07.json; the public checker receipt is HERB_BALIBAGO_TKDL_PUBLIC_PREFLIGHT_2026-10-07.json. Unit/contract and mocked RAG suites do not prove real database import, rollback or concurrent duplicate safety.

Next, resolve Santan and Kabiki's source-bound method gaps, Lokoloko's identity/occurrence, and Oxalis/Kastuli's food-processing limits; review the eleven outstanding permitted covers. Preserve Balibago's leaf-food and human-safety limits. Before any import/publication, obtain targeted backup/transactional duplicate evidence, isolated PostgreSQL import/rollback/concurrency validation, actual category/content review and fresh source/photo checks. Docker/PostgreSQL availability has not been changed by this source batch.

No commit, push, Neon write, image upload, credential access, frontend change, embedding update or live AI request occurred. HEAD remains 741167b on codex/mvp-acceptance-ci. Unrelated changes remain untouched.

Later checkpoint: HERB_SANTAN_KABIKI_CONTINUATION_2026-10-07.md records the next source batch. Counts and validation above are historical to this Balibago checkpoint, not overwritten with later results.
