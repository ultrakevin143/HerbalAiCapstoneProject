# Herb expansion continuation checkpoint

Historical checkpoint: PAUSED at the user's explicit request on 2026-10-04. The user explicitly resumed herb work on 2026-10-05 and cancelled promotion-video work. See `HERB_EXPANSION_PROGRESS_2026-10-05.md` for the subsequent observed work; the findings below remain the original 2026-10-04 checkpoint. No new Neon writes, Cloudinary uploads, publication, commits or pushes were performed in that original continuation.

## Working location

Use `C:/Users/Hp/.codex/worktrees/selective-release-check/CAPSTONE PROJECT`, branch `codex/mvp-acceptance-ci`. Preserve the unrelated dirty changes in this worktree and the primary desktop checkout. Production watches a different branch; do not push a research queue into production.

## Existing completed foundation

- Fifty selected research candidates in five groups of ten, plus a strict fail-closed queue validator and read-only comparison tool. See `HERB_EXPANSION_BUILD_2026-10-04.md` for earlier observed tests; they were not rerun in this continuation.
- A captured all-state Neon identity inventory contains 38 Herb rows and 17 SuggestedHerb rows. Fifty candidates had zero direct recorded-name/synonym/alias conflicts at that snapshot. Repeat the comparison before staging; this does not resolve every possible synonym or prevent concurrent duplicates.
- Sources & methodology page and footer link are local, uncommitted changes. Existing legally required image attribution remains intact.
- Connected Cloudinary environment: `dclqw6at7`. This continuation successfully observed the `herbal_ai_herbs` folder with 12 assets, resolving the prior uncertain folder-navigation result. No upload was attempted. Railway's non-secret provider binding has not been independently compared.

## Research performed in this continuation

The first ten historical book sections were extracted from the same-edition Gutenberg transcript: Duhat, Sampalok, Atis, Talisay, Butterfly pea, Mangga, Santol, Papaya, Granada and Chico. Do not copy their historical doses or treatment instructions into patient-facing content.

Authoritative botanical records were read for the ten proposed species. Kew explicitly lists Philippine occurrence for Syzygium cumini, Terminalia catappa, Clitoria ternatea, Mangifera indica and Sandoricum koetjape. Some other inspected Kew distribution lists do not list the Philippines; do not present that omission as proof of absence or invent a native-status classification. Resolve cultivation/occurrence through additional botanical or local primary records.

Mappings observed directly in Kew include Sandoricum indicum to Sandoricum koetjape, and the historical spelling Achras sapota under Manilkara zapota. Anona versus Annona needs to remain documented as a historical spelling, not an invented separate species.

Relevant sources and cautions:

- [Dapar et al. (2020)](https://doi.org/10.1186/s13002-020-00363-7), Table 4: Philippine community use reports for Mangifera indica, Sandoricum koetjape and Carica papaya. This is ethnobotanical documentation, not a clinical efficacy or validated-dose trial. The XML table uses row spans; read continuation rows, not only the row containing the scientific name. Reported absence of adverse effects is not a safety guarantee.
- [Teixeira et al. (2006)](https://pubmed.ncbi.nlm.nih.gov/16476114/): the studied Duhat leaf tea did not lower glucose in a small randomized clinical trial. Do not convert historical diabetes claims into an established treatment claim or generalize one preparation's result to every plant part.
- [Atis seed ocular toxicity](https://pmc.ncbi.nlm.nih.gov/articles/PMC5056555/): primary human case-series safety evidence contradicts treating the book's seed/scalp recipe as harmless. Withhold that recipe.
- [Santol seed injury report](https://www.herdin.ph/index.php/partner/journal?cid=7017&view=research): a Philippine case report documents intestinal injury. Do not advise swallowing seeds.
- [Papaya latex experiment](https://pubmed.ncbi.nlm.nih.gov/10837984/): rat uterine preparations, not a human pregnancy study. Keep the distinction explicit; do not infer validated human medicinal safety or dosage.
- [NCCIH pomegranate guidance](https://www.nccih.nih.gov/health/pomegranate): distinguish juice from root, stem and peel preparations; the latter cannot be treated as equivalent food safety.
- [Mango sap contact-dermatitis case](https://doi.org/10.1016/j.anai.2022.08.963): safety lead for skin exposure. It is a conference case abstract, not evidence of medicinal benefit.
- [The 53-plant Philippine screening paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC8685920/): none of these first ten exact species names appeared in the inspected experimental table rows. Annona squamosa appeared in discussion/reference text. Do not mislabel a cited species as directly tested by this paper.

No first-ten medical content manifest or approval flags were authored in this continuation. All candidates remain research-only; the findings above are review inputs, not publication approval.

## Photo status

Ten individually CC0-labelled photo leads for the first five candidates remain in `HERB_PHOTO_CANDIDATES_2026-10-04.json`. Research-grade community identification alone is not independent botanical clearance.

A bounded download run attempted all ten large derivatives, with 35-second per-file limits. All ten timed out, some leaving partial bytes; none passed full decode in that initial run. The later bounded byte-resume run completed before cancellation: Butterfly pea photos 173979704 and 173979709 both passed full decode at 1024 x 768 (287970 and 259879 bytes respectively), while Sampalok photo 580527782 still timed out. Their SHA-256 hashes and paths are recorded in `download-results.json`. Neither completed photo was visually approved before the pause. A browser attempt to load photo 173979704 also timed out. No photo was approved or uploaded. Never upload an incomplete JPEG.

## Scratch evidence outside Git

Directory: `C:/Users/Hp/.codex/visualizations/2026/09/09/01a08515-decf-7f51-9c41-87d224cf7dc4/tmp/`.

- `pdfs/first-ten-book-sections.json`: extracted historical sections.
- `pdfs/philippine-53.xml`: primary-paper XML.
- `pdfs/dapar-manobo.xml`: successfully retrieved primary-paper XML after an initial disconnected request.
- `pdfs/dapar-search.json`: bibliographic lookup identifying PMC7227330.
- `herb-photo-review/download-results.json`: bounded-download outcomes; inspect current statuses and fully decode any apparent success.
- `herb-photo-review/photo-*.jpg`: review downloads, potentially partial; keep out of Git and production.
- `herb-photo-review/download_review_photos.py`: scratch download helper, not deployment tooling.

## Resume plan, in order

1. Inspect the working diff and checkpoint evidence; preserve unrelated changes and verify any download-resume outcome without assuming success.
2. Finish first-ten synonym, local-name and Philippine-occurrence checks. Record botanical identity separately from medical safety.
3. Create a separate cited content-review manifest for those ten, with field-level source mapping, traditional versus clinical evidence, omitted historical doses and explicit unresolved safety holds. Do not change the preliminary queue to an importable/published format.
4. Complete real-photo acquisition with bounded retries, full decode, dimensions and hashes; inspect diagnostic features and individual CC0 permission. Research photo leads for the remaining five. Never substitute generated plants or remove required attribution.
5. Upload only cleared photos to the intended Cloudinary herb folder; retain actual secure URLs, upload IDs and licence evidence. Verify the backend's intended non-secret media account before URL integration.
6. Design and test a DRAFT-only staging path with fresh all-state duplicate checks and transaction/concurrency protection. Use an isolated database for tests; never run destructive test suites against Neon live data. No local PostgreSQL/Docker is currently available.
7. Stage only cleared records, inspect source links and Cloudinary images on desktop/mobile, then publish only after the content and import gates pass. Continue the remaining four batches the same way.
8. Document observed tests and actual writes/uploads separately from planned checks. Review the combined production diff before proposing a commit/push.

The legacy malformed Approved suggestion 3 remains a separate data-quality backlog, documented in `HERB_PROVIDER_PREFLIGHT_2026-10-04.md`; it was not changed or deleted.
