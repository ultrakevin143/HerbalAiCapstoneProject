# Fifty-herb publication preflight — 7 October 2026

## Decision

**Do not publish this queue yet.** The user authorised publication, but the saved research does not satisfy the requested sourced, accurate and complete medicinal-library release. Permission to deploy is not content or safety clearance.

The new read-only preflight inspected all fifty candidates and read the live public list at 2026-10-06T16:16:08.579Z (7 October, Manila). Live count is 38. The requested fifty remain held; zero candidates are publication-cleared. No database writes, credential reads, Cloudinary uploads, embedding generation, Git commit or push occurred.

The separate fixes for the current 38 herbs and the final all-library acceptance remain later work. They are not marked complete by this preflight.

## Verified local readiness counts

| Gate | Result |
| --- | --- |
| Queued candidates reconciled by stable ID and exact stored taxon | 50 |
| Current public herbs | 38 |
| Held full-content draft plans | 10 |
| Candidates without equivalent full-content drafts | 40 |
| Earlier selected uploaded covers | 37 |
| Missing selected covers | 13 |
| Held secondary-source identity matches | 2 |
| Matching public identities using queued synonyms and aliases | 0 |
| Public release clearance | 0 |

Ten full drafts are still DRAFT / UNASSESSED / unverified, without a reviewer or embedding. Their later preparation/occurrence repairs are retained; this report does not repeat the older claim that all ten lack region descriptions. Their category is still Uncategorized and their safety/content review notes remain open.

All fifty previously recorded preparation descriptions are preserved in the [JSON report](HERB_FIFTY_PUBLICATION_PREFLIGHT_2026-10-07.json), together with their owning evidence file and source IDs. This is descriptive research coverage, not fifty completed beginner recipes. The report does not create recipes, doses, uses or occurrence claims.

## Immediate blockers

- **40 incomplete content drafts:** the remaining four tens have preparation research but not complete, comparable field drafts for identity, uses, evidence limits, warnings, occurrence and source-to-field mappings.
- **13 selected covers missing:** Lokoloko, Alibangbang, Kupang, Nipa, Bottle gourd, Kabiki, Balibago, Asana, Kamias, Kahel, Abutilon indicum, Kastuli and Ayapana.
- **Two secondary identity holds:** Lokoloko and Manzanitas. Resolve exact taxon/author/synonym relationships against authoritative botanical evidence; do not take a same-common-name preparation from another species.
- **Review clearance:** every queue entry still has pending identity and medical review. First-ten planning does not establish safe medicinal household instructions or a clinical dose.
- **Import safeguards:** no completed reviewed import manifest or tested DRAFT-first transactional importer exists for this queue. Do not rename RESEARCH_QUEUE to DRAFT, remove holds, insert it into deployment bootstrap or reuse a broad overwrite import to reach the target.
- **Target/freshness:** private all-state evidence is historical. The new public check cannot see unpublished Herb states or SuggestedHerb rows and does not prove the intended Neon target or prevent concurrent duplicates.
- **Media freshness:** 37 selected Cloudinary URLs are historical checked candidates, not 37 newly verified photo/taxon/license approvals in this run.

No numeric dose should be supplied merely because a field is missing. Correct “no established human dose” or preparation restrictions may remain complete educational content after appropriate review.

## Focused implementation

New files:

- `herbalaibackend/src/content/herb-expansion-release-preflight.ts`: validates queue/evidence ownership, all fifty unique identities, draft-state restrictions, source/media URL shape and complete public catalog counts; derives individual blockers rather than trusting historical totals.
- `herbalaibackend/prisma/check-herb-expansion-release.ts`: read-only local preflight. It imports no database, mailer, Cloudinary or AI client; there is no write/publish mode.
- `herbalaibackend/tests/herb-expansion-release-preflight.test.ts`: regression coverage for held clearance, duplicate/wrong-queue/wrong-species evidence, public synonym conflicts, unsafe credential-bearing cover URLs, missing catalog rows and rejected CLI write flags.

Command, from the backend directory:

```powershell
node --import tsx prisma/check-herb-expansion-release.ts --check-public
```

The CLI emits a machine-readable held report and deliberately exits 2. This nonzero result is **release blocked**, not evidence of a backend outage. A parent Node subprocess observed exit 2 and empty stderr. Invalid arguments or malformed evidence exit 1. The tool cannot be used as a production importer or medical approval system.

The checker is not attached to the production deployment bootstrap, and adding it alone does not make that existing bootstrap safe for the new batch. No production safeguard rollout or database test is claimed.

## Candidate matrix

Cover presence is historical ledger evidence; secondary source location is not publication approval. Preparation and exact individual review notes are preserved in the JSON.

| Candidate | Stored taxon | Content | Cover | Secondary source | Current blockers |
| --- | --- | --- | --- | --- | --- |
| Duhat | Syzygium cumini | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Sampalok | Tamarindus indica | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Atis | Annona squamosa | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Talisay | Terminalia catappa | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Butterfly pea | Clitoria ternatea | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Mangga | Mangifera indica | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Santol | Sandoricum koetjape | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Papaya | Carica papaya | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Granada | Punica granatum | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Chico | Manilkara zapota | Held full draft | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; CATEGORY_UNRESOLVED; SOURCE_TAG_REVIEW:identity; DRAFT_REVIEW_GAPS_OPEN |
| Mustasa | Brassica juncea | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Radish | Raphanus sativus | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Olasiman | Portulaca oleracea | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Cacao | Theobroma cacao | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Linga | Sesamum indicum | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Niog | Cocos nucifera | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Maize | Zea mays | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Tubo | Saccharum officinarum | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Fennel | Foeniculum vulgare | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Paminta | Piper nigrum | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Solasi | Ocimum basilicum | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Lokoloko | Ocimum gratissimum | Incomplete content | Missing cover | Identity hold | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING; SECONDARY_SOURCE_IDENTITY_HELD |
| Balanay | Ocimum tenuiflorum | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Romero | Salvia rosmarinus | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Katuray | Sesbania grandiflora | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Alibangbang | Piliostigma malabaricum | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Kupang | Parkia timoriana | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Nipa | Nypa fruticans | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Bottle gourd | Lagenaria siceraria | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Luffa aegyptiaca | Luffa aegyptiaca | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Santan | Ixora coccinea | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Sampaguita | Jasminum sambac | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Kabiki | Mimusops elengi | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Balibago | Hibiscus tiliaceus | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Thespesia populnea | Thespesia populnea | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Doldol | Ceiba pentandra | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Kalumpang | Sterculia foetida | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Manzanitas | Ziziphus mauritiana | Incomplete content | Earlier selected cover | Identity hold | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SECONDARY_SOURCE_IDENTITY_HELD |
| Asana | Pterocarpus indicus | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Coffee | Coffea arabica | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Kamias | Averrhoa bilimbi | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Balimbing | Averrhoa carambola | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Kasuy | Anacardium occidentale | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Bankundo | Morinda citrifolia | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Oxalis corniculata | Oxalis corniculata | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Kahel | Citrus aurantium | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Tsampaka | Magnolia champaca | Incomplete content | Earlier selected cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING |
| Abutilon indicum | Abutilon indicum | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Kastuli | Abelmoschus moschatus | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |
| Ayapana | Ayapana triplinervis | Incomplete content | Missing cover | Located; pending review | IDENTITY_REVIEW_PENDING; CONTENT_SAFETY_REVIEW_PENDING; HUMAN_REVIEW_NOT_RECORDED; FULL_CONTENT_DRAFT_MISSING; SELECTED_COVER_MISSING |

## Remaining execution sequence

1. Complete missing source-bound field drafts for candidates 11–50; retain precise plant-part, preparation, population and evidence limits.
2. Resolve taxon/author holds and 13 cover gaps; retain image source, creator, licence and species identification. Recheck delivery before release.
3. Review the complete manifest and record real content review provenance. Do not fabricate reviewer IDs, clinical evidence or source-supported dose claims.
4. Validate an isolated DRAFT-first import with rollback, rerun/idempotency and concurrent all-state duplicate tests. Public-list comparison alone is insufficient.
5. Privately confirm the live Neon target, take a recovery snapshot and recheck all Herb/SuggestedHerb states inside the write transaction.
6. Publish only genuinely cleared entries with matched source/image ownership; verify saved fields and public counts. Generate embeddings for those approved entries only.
7. Execute the current 38-herb remediation checklist, then audit the combined live catalog: every detail, preparation limits, language-labelled names, sources, photo delivery, search/categories, mobile views and bounded Dr. Ai retrieval/citations.

## Validation

- Final combined regression run: **184 tests passed across nine files**, exit 0. The new preflight suite contains 19 tests, including four subprocess checks that reject unsupported publish/stage arguments before any network request.
- Backend TypeScript check passed; targeted ESLint check passed. Strict TypeScript checking of the new CLI and regression file passed.
- The live read-only CLI returned the held 50-row report with public count 38. A subprocess confirmed its deliberately nonzero child exit 2 and empty stderr.
- Initial validation caught an exact-optional-property TypeScript error and a table-driven CLI-test argument-shape error. Both were corrected; the final combined run and strict checks above passed. Neither validation failure changed live data.

No full live publication, live AI generation, private-database concurrency or fifty-image visual check is counted as passed. Passing research tests does not resolve the content, identity, media or publication holds.
