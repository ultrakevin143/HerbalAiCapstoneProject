# Talisay preparation source follow-up

Date: 2026-10-05. Research-only proposal, not a database update or publication.

## Missing description investigated

The first-ten preparation supplement had nine food descriptions and one unresolved method: Talisay, `research-pardo-094`, *Terminalia catappa*. The candidate identity, historical entry 94/page 110, existing photo and earlier bark-safety hold are unchanged.

The [World Agroforestry species profile](https://apps.worldagroforestry.org/treedb/AFTPDFS/Terminalia_catappa.PDF), page 3, supports kernel-food use, including roasting. Its adjacent medicinal assertions were not adopted. The downloaded five-page PDF was rendered and its Food paragraph visually inspected.

The [original Biego et al. paper](https://www.ccsenet.org/journal/index.php/sar/article/view/15860), DOI `10.5539/sar.v1n2p1`, was downloaded after the web PDF fetch failed. Its six-page file's printed page 2 was rendered and methods sections 2.1 and 2.3.1 inspected. They supply the processing sequence in the accompanying JSON, but no roasting settings. The sensory work is not a therapeutic trial or a complete household recipe.

## Recorded outcome and limits

- A single food-processing proposal supersedes only the earlier Talisay preparation description. The original supplement and safety review remain historical evidence, not rewritten as if the earlier gap never existed.
- Effective first-ten coverage is now ten cited food descriptions and zero entirely unestablished descriptive methods; zero fully specified household recipes or medicinal instructions were added.
- Bark, leaf, root and medicinal-dose advice remains withheld. The retained part-specific medical review, fresh all-state duplicate check and isolated staging gates still block publication.
- No identity was added, draft regenerated, image uploaded, live field changed or Dr. Ai retrieval claimed. The remaining thirty candidates still need their own source/content review; the existing twenty-placeholder live update has a separate PostgreSQL gate.
- The inaccessible PMC page and two unavailable agroforestry.org PDF paths were not treated as reviewed sources. Temporary PDF/render files stay outside Git; byte counts and hashes are recorded in the JSON, not the raw copyrighted publications.

## Validation

Six new regression cases cover identity preservation, coverage arithmetic, source linkage, exact observed method limits, retained safety holds and rejection by the existing preparation writer. The combined six-file source/staging/preparation subset passed **91 tests**, 8.06 seconds. Strict TypeScript checking of the new test, backend build and lint passed. New-file whitespace and narrow credential-pattern checks passed. The real Git index remained empty and HEAD was unchanged; nothing was committed or pushed. Evidence-contract tests do not establish clinical safety, actual live duplicate absence or successful database staging.

The completed broad working-tree run passed **1,128 non-database tests across 82 files**, 47.84 seconds, with eighteen database-dependent suites explicitly excluded, an unused loopback database URL and an empty Gemini API key. This includes unrelated local research tests, so it is not the eighteen-file release-bundle count or a remote CI result. The eight preparation PostgreSQL checks remain unrun.

Next: complete the remaining preparation research in batches, retain exact scientific identities and part-specific restrictions, and run isolated database CI before a separately reviewed live operation. Do not manufacture cooking timings or therapeutic doses to fill a field.
