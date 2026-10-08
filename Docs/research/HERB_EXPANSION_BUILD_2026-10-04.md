# Fifty-herb expansion: local build and release gates

Date: 2026-10-04. Status: research queue only; no new live records or uploads.

## Scope and decisions

- Use fifty candidates from the 143 preliminary species candidates in `PARDO_HERB_INVENTORY_2026-10-04.csv`, not the fifty unresolved historical identities.
- Divide the review into five batches of ten. Selection is not an assertion of medicinal safety, efficacy, Philippine occurrence, or final identity.
- Use clear real-species photographs with verified CC0 permission for new entries that must not display photo credits. Retain creator, source, licence and review evidence internally. Do not remove existing legally required credits.
- Preserve per-herb Sources & references. Add a lightweight Sources & methodology footer link and page, rather than dumping all citations into the footer.
- Store approved images in Cloudinary and cited plant records in Neon only after clearance. Neither happened during this build.

## Provisional shortlist

Display names and historical synonym mappings still need review. The canonical names below are the preliminary taxonomy mappings from the inventory, not independently completed modern identity reviews.

| Batch | Proposed display name | Preliminary scientific identity |
| --- | --- | --- |
| 1 | Duhat | Syzygium cumini |
| 1 | Sampalok | Tamarindus indica |
| 1 | Atis | Annona squamosa |
| 1 | Talisay | Terminalia catappa |
| 1 | Butterfly pea | Clitoria ternatea |
| 1 | Mangga | Mangifera indica |
| 1 | Santol | Sandoricum koetjape |
| 1 | Papaya | Carica papaya |
| 1 | Granada | Punica granatum |
| 1 | Chico | Manilkara zapota |
| 2 | Mustasa | Brassica juncea |
| 2 | Radish | Raphanus sativus |
| 2 | Olasiman | Portulaca oleracea |
| 2 | Cacao | Theobroma cacao |
| 2 | Linga | Sesamum indicum |
| 2 | Niog | Cocos nucifera |
| 2 | Maize | Zea mays |
| 2 | Tubo | Saccharum officinarum |
| 2 | Fennel | Foeniculum vulgare |
| 2 | Paminta | Piper nigrum |
| 3 | Solasi | Ocimum basilicum |
| 3 | Lokoloko | Ocimum gratissimum |
| 3 | Balanay | Ocimum tenuiflorum |
| 3 | Romero | Salvia rosmarinus |
| 3 | Katuray | Sesbania grandiflora |
| 3 | Alibangbang | Piliostigma malabaricum |
| 3 | Kupang | Parkia timoriana |
| 3 | Nipa | Nypa fruticans |
| 3 | Bottle gourd | Lagenaria siceraria |
| 3 | Luffa aegyptiaca | Luffa aegyptiaca |
| 4 | Santan | Ixora coccinea |
| 4 | Sampaguita | Jasminum sambac |
| 4 | Kabiki | Mimusops elengi |
| 4 | Balibago | Hibiscus tiliaceus |
| 4 | Thespesia populnea | Thespesia populnea |
| 4 | Doldol | Ceiba pentandra |
| 4 | Kalumpang | Sterculia foetida |
| 4 | Manzanitas | Ziziphus mauritiana |
| 4 | Asana | Pterocarpus indicus |
| 4 | Coffee | Coffea arabica |
| 5 | Kamias | Averrhoa bilimbi |
| 5 | Balimbing | Averrhoa carambola |
| 5 | Kasuy | Anacardium occidentale |
| 5 | Bankundo | Morinda citrifolia |
| 5 | Oxalis corniculata | Oxalis corniculata |
| 5 | Kahel | Citrus aurantium |
| 5 | Tsampaka | Magnolia champaca |
| 5 | Abutilon indicum | Abutilon indicum |
| 5 | Kastuli | Abelmoschus moschatus |
| 5 | Ayapana | Ayapana triplinervis |

## Built artifacts

- `herbalaibackend/content/herbs/expansion-batch-03.review.json`: fifty research candidates, each with book entry/page references, preliminary taxon key, taxonomy lookup URL, explicit pending identity/medical review, and `photo: null`. No treatment or dosage text is invented.
- `scripts/build-herb-research-queue.py`: reproducible selection from the existing inventory. Refuses entries outside the candidate category. Preserves book headings separately from normalized names.
- `herbalaibackend/src/content/herb-expansion-review.ts`: strict research-queue validator and identity-conflict comparison; checks IDs, taxa, canonical names, historical synonyms, local aliases, book-entry duplication and batch sizes.
- `herbalaibackend/prisma/review-herb-expansion.ts`: offline, read-only report against the recorded 38-record public baseline. No Prisma, database connection, upload, seed, or publishing action.
- `herbalaifrontend/app/sources/page.tsx` and the shared footer link: educational reference navigation and methodology, using existing theme/layout tokens. Existing hero-photo attribution remains unchanged.

The queue deliberately uses `RESEARCH_QUEUE` and `candidates`, not the built-in importer's `DRAFT` / `herbs` format. The validator rejects photo insertion or completed-review flags: reviewed publishing content must be prepared separately rather than turning this preliminary queue into a production import by changing one flag. Deployment bootstrap is unchanged.

The read-only tool exits successfully when its structural checks and public-baseline comparison pass; that exit code is NOT release approval. Its report always states `publicationAllowed: false` and lists remaining blockers.

### Reproduce locally

From the repository root, run `python scripts/build-herb-research-queue.py` using an available Python runtime. Then, from `herbalaibackend`, run `npx tsx prisma/review-herb-expansion.ts` and `npx vitest run tests/herb-expansion-review.test.ts tests/herb-expansion-batch-02.test.ts`.

From the root, run `node --test scripts/sources-methodology.test.mjs` for the page/footer rendering regression tests.

## Observed validation

- Fifty candidates generated, with fifty distinct preliminary accepted taxon keys, arranged 10/10/10/10/10.
- No identity conflicts against the saved public-only 38-record baseline. This does NOT prove absence from drafts, holds, archives or pending suggestions in Neon.
- Focused Vitest run: 37 passed across the research-queue suite (15) and existing second-batch suite (22).
- New page/footer server-rendering tests: 2 passed. Checks include real source links, Library navigation, one main heading, no embedded media, accessible footer-link classes and preservation of conditional existing photo attribution.
- Backend TypeScript build passed. Separate strict TypeScript check of the read-only review CLI passed. Targeted ESLint checks passed for the new backend module/test and frontend page/footer.
- Frontend TypeScript check and production build passed; `/sources` is statically generated.
- Impeccable detector returned no findings for the changed page/footer.
- Local browser inspection at 1366 × 900 and 390 × 844: page uses the existing light theme, readable desktop/mobile section layout, no horizontal document overflow. Footer sources link measured 44 px high at both sizes. This is browser emulation, not physical-device evidence.
- Local preview: `http://127.0.0.1:4390/sources`. The backend is not running for this preview; the existing navigation may offer Retry session. No authenticated flow was counted as passed.
- Working-tree whitespace check passed. Unrelated working-tree changes were preserved. Nothing committed or pushed.

### Issue caught during validation

The book uses the ligature `æ` in `Luffa ægyptiaca`. Initial strict-name validation rejected it. The generator normalizes it to `ae`, while retaining the original book heading. Conflict comparison also normalizes Latin ligatures, and a regression test checks this cannot produce a second Luffa identity.

## Photo research observed

`HERB_PHOTO_CANDIDATES_2026-10-04.json` records ten leads: two each for Duhat, Sampalok, Atis, Talisay and Butterfly pea. Public iNaturalist requests used research-grade observations and exact API species names. Each selected PHOTO's `license_code` was checked as `cc0`; the API's observation filter alone only guarantees at least one qualifying photo per observation.

Official API definitions reviewed: <https://api.inaturalist.org/v1/swagger.json>. CC0 terms: <https://creativecommons.org/publicdomain/zero/1.0/>. A community species identification is not an independent botanical guarantee.

All ten leads remain PENDING visual review with no Cloudinary URL. Download attempts did not provide a completed, reliable review set. The partial local Atis JPEG failed a full decode with `image file is truncated`; it is outside Git and must not be uploaded. The network download attempts were stopped. No photo is approved, and no source image was edited or AI-generated.

## Required next steps, in order

1. Review batch 1 identities, contemporary local names and Philippine occurrence. Check historical synonyms against authoritative botanical records; retain ambiguity as a hold.
2. Obtain an authorized complete read-only identity inventory of all Neon Herb states and SuggestedHerb records. Include reviewed taxonomy keys from the same checklist and synonym/alias mappings where available. Public API results cannot substitute for this. A name comparison alone does not resolve unknown synonyms.
3. Research modern plant-part-specific safety and medicinal statements. Add field-level citations, distinguish traditional/animal/laboratory/human evidence, and withhold unvalidated human doses. Replace any candidate that cannot be responsibly documented; never fill the target count with fabricated evidence.
4. Finish bounded photo downloads and full decode/visual checks. Verify intended species and useful diagnostic features, clarity, permission and source record. Keep the no-visible-credit policy limited to genuinely eligible new photos.
5. Upload only cleared photos to the intended Cloudinary account, retain upload IDs and licensing evidence, and use responsive Cloudinary delivery. Do not add originals or credentials to Git.
6. Build a separate DRAFT staging batch and reviewed importer with full-state conflict checks and a transaction/concurrency strategy. Validate in an isolated test database before any Neon write. The new comparison helper is not currently a production database uniqueness constraint or race-safe importer.
7. Stage ten at a time, inspect citations/images on desktop and mobile, verify no duplicate published taxon, then publish only cleared records. Repeat for batches 2–5.

## Current blockers

No configured Neon/Cloudinary credentials or connected provider dashboards were available in this worktree/browser inventory. Do not paste secrets into chat. Complete database duplicate clearance, uploads, staging and live validation remain pending. All fifty candidates also still need identity, evidence and safety clearance. No database-dependent tests were run.
