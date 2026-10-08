# Santan and Kabiki preparation continuation - 7 October 2026
Status: HELD. This is the current source checkpoint after HERB_BALIBAGO_TKDL_CONTINUATION_2026-10-07.md. No live herb was added or edited.

## Completed
- Santan (Ixora coccinea): recorded a secondary, source-bound Philippine root-decoction description from [StuartXchange](https://www.stuartxchange.org/Santan). This is folklore documentation, not a primary trial, safe recipe, child guidance or clinically validated dose. Shared Santan names and the genus-only flower-food lead remain unresolved.
- Kabiki (Mimusops elengi): reviewed the authenticated stem-bark extraction method in [Gupta and Jain's publisher PDF](https://journals.athmsi.org/index.php/ajtcam/article/download/1216/643/2836), printed pages 98-99. The draft describes laboratory methanol extraction for mouse experiments only. Experimental quantities, schedules and animal procedures are not adopted as human instructions.
- Found an explicit historical species merger on [StuartXchange's Kabiki page](https://www.stuartxchange.org/Kabiki). Its merged Kabiki/Bansalagin remedies and names are quarantined as a research gap, not transferred into exact-species methods.
- Added separately dated citation ownership in HERB_SANTAN_KABIKI_PREPARATION_FOLLOW_UP_2026-10-07.json and updated only the two corresponding field-plan records plus aggregate counts. The earlier fourth-ten preparation ledger remains unchanged; other plant methods, cover provenance, doses and review flags are preserved.
- Preserved separate food-processing gaps for Balibago leaves, Santan species/cultivar-specific flower use and Kabiki fruit. A bark or laboratory method does not resolve an edible-part gap.

## Source retrieval
Direct bounded retrieval obtained both HTML pages and the publisher PDF. Their byte counts and hashes are recorded in the source follow-up. The PDF was 295452 bytes, SHA-256 779aef574132783d643bc4a07bdb960f36d09779a4cbc823fbc262225108749f; local renders of printed pages 98 and 99 were inspected for species, voucher and methods. The remaining four PDF pages were not visually reviewed.
EuropePMC XML returned HTTP 500; NLM presented CAPTCHA; web PDF screenshots timed out. These routes are not counted as successful full-text validation. A normal publisher download and local rendering supplied the method review. Poppler warned about Symbol/ArialUnicode fonts but the reviewed text was legible. The optional pdftotext command was unavailable on PATH; no successful text-extraction claim is made.

## Observed validation
- 36 focused test files, 592 passing tests, zero failures; 16 new source-bound regression cases.
- Backend typecheck, strict changed-test typecheck, targeted ESLint and git whitespace check passed.
- The initial media test expected Kabiki's descriptive method to remain missing. That obsolete expectation was corrected to assert remaining content-safety, human-review and draft-gap holds; the final broad focused run passed.
- Read-only public preflight at 2026-10-07T00:56:16.832Z: 38 live herbs; 50 held draft plans; 47 descriptive core-field drafts; three partial; eleven missing selected covers; two secondary identity holds; zero public stored-name conflicts; zero publication clearance. Checker exit 2 is the intentional HELD result, not a deployable release.
- Complete command/result receipt: HERB_SANTAN_KABIKI_VALIDATION_2026-10-07.json. Public receipt: HERB_SANTAN_KABIKI_PUBLIC_PREFLIGHT_2026-10-07.json.

## Remaining work, in order
1. Resolve Lokoloko's identity/occurrence without treating holy-basil material as Ocimum gratissimum evidence. Resolve Oxalis corniculata and Kastuli's exact-part food-processing gaps without inventing recipes.
2. Review the eleven outstanding permitted, exact-species covers. Separately correct 17 draft imageCreator values that currently contain the rights phrase "no rights reserved"; retain historical receipts and use unknown creator rather than inventing a name.
3. Complete plant-part/category/content/botanical and genuine human review. No medicinal or beginner instructions are cleared by these source descriptions.
4. Obtain target backup and fresh all-state duplicate comparison; implement and test a guarded importer against isolated PostgreSQL, including rollback and concurrent duplicates. These database tests were not run in this batch; no installed database tooling is claimed.
5. Only then stage a reviewed batch and confirm live Library and retrieval outcomes. The fifty drafts are not public AI knowledge yet.

No Neon write, upload, credential access, frontend change, embedding update, live AI request, commit or push occurred. HEAD remains 741167b on codex/mvp-acceptance-ci. Unrelated working-tree changes remain untouched. This source-focused validation is not full live MVP or participant acceptance.

Later checkpoint: HERB_OXALIS_KASTULI_CONTINUATION_2026-10-07.md records the subsequent source batch. This report's counts and validation remain historical rather than silently overwritten.
