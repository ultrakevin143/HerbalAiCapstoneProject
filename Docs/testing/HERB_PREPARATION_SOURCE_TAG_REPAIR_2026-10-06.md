# Preparation source-tag review and held correction — 6 October 2026

## Result and boundary

The two previously identified preparation-reference gaps were re-reviewed. A local, additive proposal now binds **three existing source rows** to `preparationMethod`: Indian Heliotrope source 21, and Tanglad sources 19 and 20. WHO source 22 remains warnings-only. No live database write, Git commit/push, publication, image upload, embedding generation or UI change occurred.

**This is not an applied live fix.** The planner has no write mode and returns `SOURCE_TAG_PLAN_NOT_EXECUTABLE`, `writeAllowed: false` and `publicationAllowed: false`. The 50-herb expansion remains separately held. Adding citation metadata would not turn the two entries into validated household recipes.

## Actual baseline and root cause

A normal public catalog GET returned HTTP 200. The two selected public records and their source IDs were captured at `2026-10-06T07:26:11.889Z` (3:26 PM Manila), in `Docs/research/HERB_PREPARATION_SOURCE_TAG_BASELINE_2026-10-06.json`. Both remain published and verified. Their actual preparation wording still withholds an Indian Heliotrope method and distinguishes Tanglad research formulations from household preparations.

The applied historical migration `20260913093000_restore_evidence_supported_herbs` created these relevant references with use/evidence/limitation tags but without `preparationMethod`. That explains the metadata gap despite relevant source material. The historical migration was not edited or replayed. This public baseline is a selected-field API observation, **not** a full database recovery export or transaction-safe snapshot.

## Sources actually inspected

PMC HTML returned browser-check pages. The public Europe PMC full-text XML endpoint returned HTTP 200 for all three articles; no challenge bypass or browser credentials were used.

- [Heliotropium review, full-text XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8187075/fullTextXML): abstract, toxicological profile and conclusion/future directions were inspected. The limitations support retaining the library's conservative withholding policy; they do not validate a household method or prove that no human research exists. Actual bibliographic title is retained in the review ledger; existing display labels are not rewritten.
- [Tanglad pilot study, full-text XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC3754369/fullTextXML): methods describe pharmaceutical shampoo/cream formulations in a clinical protocol. This supports the existing study-formulation description, not household oil preparation or culinary leaf tea.
- [Lemongrass scoping review, full-text XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10892616/fullTextXML): the reviewed text distinguishes exact C. citratus interventions, C. flexuosus, uncertain-species formulations and mixed-oil products. Those interventions must not be combined into a new recipe. Bibliographic identity was also checked against [PubMed 38399374](https://pubmed.ncbi.nlm.nih.gov/38399374/).
- [WHO natural toxins fact sheet](https://www.who.int/news-room/fact-sheets/detail/natural-toxins-in-food): its general pyrrolizidine-alkaloid discussion is background warning evidence, not an exact-species preparation method. Its stored warnings tag is preserved, with no preparation tag proposed.
- [NParks C. citratus](https://www.nparks.gov.sg/florafaunaweb/flora/1/9/1918): the exact-species culinary paragraph was re-read. Its crushed-stalk food use remains a separate, already documented content proposal; it is not mixed into this metadata-only repair and no medicinal tea claim was adopted.

The reviewed bindings and limitations are in `Docs/research/HERB_PREPARATION_SOURCE_TAG_REVIEW_2026-10-06.json`; the deterministic output is `Docs/research/HERB_PREPARATION_SOURCE_TAG_PLAN_2026-10-06.json`.

## Implemented local safeguards

`src/content/herb-preparation-source-tags.ts` checks matching herb ID, local/scientific names, exact preparation text, published/verified state, source ownership, species-bound review references and exactly one existing source per reviewed URL. It rejects duplicate identities, duplicate source IDs/definitions/references, ambiguous URLs, missing or unbound sources, unsafe credential-bearing URLs and unexpected recipe fields or support tags.

The proposal appends only `preparationMethod` to each existing support list, preserving all original tags and source text. Already-present tags produce no repeated amendment. Source fields and a digest are retained for review, without mutating input. Exact preparation whitespace changes are detected rather than normalized away.

`prisma/plan-herb-source-tags.ts` reads local files and prints a proposal. It does not import the application database client, load environment files, call a provider, or expose an apply/publish mode. Example, from `herbalaibackend`:

```text
node node_modules/tsx/dist/cli.mjs prisma/plan-herb-source-tags.ts --snapshot ../Docs/research/HERB_PREPARATION_SOURCE_TAG_BASELINE_2026-10-06.json
```

## Observed validation

- **30 new regression cases**, including exact saved-output reproduction, additive/idempotent behavior, species/identity/content conflicts, unpublished/unverified states, source ownership and ambiguity, URL checks, input immutability and forbidden recipe changes.
- CLI execution with empty database/provider variables passed. An `--apply` argument was rejected without a database connection.
- Final combined suite: **13 files, 379 tests passed**, duration **12.08 seconds**. Backend lint and TypeScript build passed. Git's index remained empty. The scoped diff check passed; no formatter or dependency was added.
- Tests used intentionally unreachable loopback database settings and mocked provider requests. This was not a real PostgreSQL transaction/rollback test, a live mutation, or live generation after deployment.

## Next release work

Continuation: `Docs/testing/HERB_PREPARATION_SOURCE_TAG_TRANSACTION_2026-10-06.md` records the implemented local transaction helper, 31 new SQL-backed regressions and 410 combined passing tests. Native independent-session checks are authored but unexecuted locally; the proposed tags remain unapplied live.

1. Review this source-only proposal alongside the existing local beginner-guidance batch; keep unrelated auth/mail/UI/research changes out of the release bundle.
2. Before applying metadata, obtain a fresh independently matched complete database/source backup, build a narrowly scoped additive transaction with active-admin audit attribution, and test rollback/concurrent-change protection in isolated PostgreSQL. Compare the exact selected source values at transaction time. Do not use the twenty-placeholder updater: these are non-placeholder records with different IDs and scope.
3. Apply only the reviewed tags after those checks, preserve all preparation/dosage/warning/media/publication/vector fields, and reconcile source rows and audit attribution. Then verify public cache expiry and actual Dr. Ai source context. Do not label those gates passed based on this offline plan.
4. Continue the remaining expansion content/media/identity work separately; never use these metadata tags as a blanket clinical approval or completion claim for fifty herbs.
