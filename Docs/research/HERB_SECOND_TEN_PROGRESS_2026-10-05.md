# Second-ten photo screening and taxonomy repair

Date: 2026-10-05. Status: seven selected photographs uploaded and delivered correctly; no herb records staged or published. This is media preparation, not approval of medicinal claims.

Latest follow-up: Mustasa, Radish and a source-original maize foliage photograph were selected and uploaded separately, bringing second-batch media to ten and total expansion media to twenty. The generator is now repaired and nonwriting by default. This report's seven-photo counts and three holds describe its earlier snapshot, preserved unchanged in the associated photo ledger. See `HERB_IDENTITY_MEDIA_PROGRESS_2026-10-05.md` and its separate evidence ledger for the superseding media results and remaining identity/publication gates.

## Completed

- Downloaded the original 18 leads for nine second-batch candidates. Radish had no exact-name lead in the earlier bounded query.
- Searched four species for clearer alternatives, retaining 16 additional individually CC0 photo leads.
- All 34 downloaded JPEGs fully decoded. Thirty met the unchanged minimum 800-pixel long edge and 600-pixel short edge. Four maize derivatives failed the short-edge threshold: 498, 578, 577 and 576 pixels respectively. Their decoding success is recorded separately from their failed size gate; they were not visually approved or uploaded.
- Visually inspected all 30 size-cleared images against primary botanical descriptions. Recorded selections, rejected covers, supporting images and holds separately. Research-grade observation status alone was insufficient: some images showed a decayed stump, washed-up husks, blurred roadside specimens or a timestamp watermark.
- Rechecked individual photo licences, exact observation taxon names and research quality through the public iNaturalist API. Retained source/observation/photo IDs, creator names, licence links, actual dimensions and SHA-256 hashes in `HERB_SECOND_TEN_PHOTO_REVIEW_2026-10-05.json`.
- Uploaded only the seven selected originals to Cloudinary account `dclqw6at7`, folder `herbal_ai_herbs`. The widget showed **7 uploaded** and the folder increased from **22 to 29 assets**. No existing media was overwritten or deleted.
- Each of the seven original public delivery URLs returned HTTP 200, `image/jpeg`, fully decoded with matching dimensions, and matched the downloaded source bytes by SHA-256. No retouching, watermark removal or AI-generated botanical substitute was used.

## Selections and holds

| Candidate | Observed selection or outstanding gate |
| --- | --- |
| Mustasa | Two pictures inspected; clearer flower photo held. Reconcile the current Kew `× Brassarda juncea` treatment with historical and observation names before assigning a final identity. |
| Radish | No picture selected. Resolve the cultivated subspecies concept before another exact-taxon media query. |
| Olasiman | Uploaded 141904820: flower, fleshy oval leaves and reddish edges. |
| Cacao | Uploaded 627816005: detailed trunk-borne flowers, not a pod photograph. |
| Linga | Uploaded 309170794: tubular flowers, narrow leaves and green capsules. |
| Niog | Uploaded 237055447: living ringed trunk, pinnate fronds and husked fruit clusters. |
| Maize | Neither initial young roadside picture selected as a cover; four alternative derivatives failed the size gate. Seek a clearer, adequately sized mature specimen without lowering the gate. |
| Tubo | Uploaded 59112165: jointed culms and long leaves. Morphology does not distinguish a pure species from a cultivated hybrid; final identity remains open. |
| Fennel | Uploaded 216910898: yellow compound umbels. A flower picture, not a whole-plant voucher. |
| Paminta | Uploaded 65746891: green fruit spikes with glossy leaves. |

The seven selections raise the expansion-media total to **17 of 50 candidates**, including the ten separately documented first-batch uploads. The folder's 29 assets include 12 pre-existing assets; it does not mean 29 new herb records. No second-batch medicinal summary, dose or preparation method has been approved.

## Reproduced code issue and focused repair

The research-only queue validator rejected explicit hybrid and subspecies names, while its first-two-token comparison could collapse distinct named hybrids or discard infraspecific identities. Regression tests reproduced this limitation before repair.

`herbalaibackend/src/content/herb-expansion-review.ts` now handles named hybrid markers, leading nothogenus markers and explicit subspecies/variety/form ranks. It preserves infraspecific distinctions, permits reviewed authority suffix comparisons, and does not reduce a parent-cross expression to its first parent. Twenty-four new tests cover these boundaries. Actual queue names and accepted identifiers remain unchanged pending reconciliation; production matching and database schemas were untouched.

The historical Python queue generator still truncates names to two tokens. Do not regenerate a reconciled hybrid/subspecies queue through it until that separate boundary is repaired and tested.

## Observed validation

- Six focused herb suites: **93 tests passed**, including the 24 new taxonomic cases.
- New photo-ledger and taxonomic suites together: **30 tests passed**, including six media evidence/data-contract cases.
- Backend TypeScript build and source ESLint: passed.
- Standalone strict TypeScript checking of both new test files: passed.
- Broader non-database suite before adding the six photo-ledger cases: **916 tests passed in 66 files**. Final combined rerun including the photo-ledger cases: **922 tests passed in 67 files**, exit 0, duration 74.62 seconds.
- Public original-image delivery: **7 of 7 passed** full decode, HTTP/content-type and byte-hash checks.
- Tracked `git diff --check`: passed, with existing Windows line-ending notices. A separate trailing-whitespace check covered the newly authored ledger, progress report and two test files.

The broad suite uses an intentionally unusable loopback database URL, not Neon. Seventeen PostgreSQL-dependent suites are explicitly excluded; these results must not be labelled database integration or live acceptance. Raw local logs and image bytes remain outside Git.

## External operations

- Cloudinary: seven new media assets only.
- Neon: zero writes; no new duplicate snapshot was taken during this second-batch continuation.
- Git: no commit or push. Preserve unrelated working-tree edits.
- Credentials: none copied to repository files or chat.
- Frontend: no styling or runtime changes in this continuation.

## Next work, without reopening unrelated workflows

1. Repair/test the offline generator's scientific-name boundary without overwriting the reviewed queue. Reconcile Radish, Kahel and Mustasa through primary taxonomy sources, retain historical synonym mapping, then query exactly identified photo concepts.
2. Obtain a clear adequately sized maize cover and continue the bounded CC0 search for Alibangbang, Kupang and Ayapana. Do not substitute a similar-looking species or remove a watermark.
3. Download and visually screen the remaining third-to-fifth-batch leads, with source/licence/hash evidence and quality holds.
4. Review modern Philippine occurrence, plant-part-specific safety and evidence classification before drafting second-batch catalog text. Historical book recipes remain excluded unless independently validated.
5. Use an isolated PostgreSQL database to verify staging transactions and concurrent duplicate rejection. Repeat the fresh all-state Neon identity check immediately before an approved import, using reconciled synonyms and accepted identifiers.
6. Only after those gates pass, propose the exact DRAFT records for Neon and a selective release bundle. Media upload alone never authorizes publication.
