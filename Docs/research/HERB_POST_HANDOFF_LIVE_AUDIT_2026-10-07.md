# Added-herb live audit after external handoff

## Status update — 8 October 2026

The original findings below are historical evidence, not the current backlog count. `Docs/testing/HERB_INDEX_COVERAGE_2026-10-08.md` now records 88/88 published 768-dimensional vectors, no missing vectors, and changed values for all ten previously unchanged older vectors. Three live semantic samples and one authenticated unnamed chat query passed; complete generation-input freshness is not inferred from vector presence alone. The four alias searches and lost login question were repaired and released in `f922b9e`, as recorded in `Docs/testing/LIBRARY_TO_AI_RELEASE_CHECK.md`. Lokoloko's occurrence field is now populated, without source certification implied. Preparation/source, regional-display and media/provenance findings not independently closed by those newer reports remain separate work. The original snapshots and findings are retained below without rewriting their observed outcomes.

Date: 7 October 2026, Asia/Manila. Database/public-detail receipt captured at 15:18 Manila (`2026-10-07T07:18:01.795Z`); subsequent image, alias and vector-freshness checks are recorded in the JSON evidence. This report evaluates observed results, not the identity of the tool that produced them.

## Publication is already complete

Independent read-only queries to the previously confirmed live Neon host `ep-icy-sound-aqfe958d.c-8.us-east-1.aws.neon.tech`, database `neondb`, returned **88 Herb rows**. The Railway public catalog returned HTTP 200, total 88, including **all 50 expansion IDs**. All fifty are PUBLISHED and verified; none remains DRAFT. The public browser independently displayed **88 herbs found**.

All fifty detail endpoints returned HTTP 200, matched the live database fields checked, and contained the same source-row IDs as the database. All fifty have nonblank preparation text, at least one preparation-tagged source and a Cloudinary cover. All 88 public image URLs returned HTTP 200 with image MIME types after resolving relative original-image paths against the frontend origin. There were no exact normalized scientific-name duplicates among the 88 Herb rows, and no database/public catalog ID mismatch.

**No repeat herb import or data-publication push is needed.** Earlier reports saying 48 public / 40 drafts are now historical and superseded by this receipt. A code deployment is still relevant to the common-name functionality below.

## Confirmed issues

### 1. Forty additions have no semantic-search embedding — high

Database `vector_dims(embedding)` returned NULL for forty new records. The list is in the JSON matrix; only the original ten have 768-dimensional vectors. `src/repositories/herb.repository.ts:249` excludes NULL embeddings from semantic retrieval.

This is a semantic-search coverage gap, not proof that named-herb chat always fails: `src/services/ai/chat/ask-ai-service.ts` has a separate named-catalog route that can retrieve a record without its vector.

Repair: after correcting source/text inconsistencies, generate bounded, real 768-dimensional vectors from approved current content, save generation results before writing, and use targeted backed-up updates. Test representative semantic queries and an actual signed-in chat flow. Do not run a blind global provider job.

### 2. The other ten vectors describe older content — high

All ten live vectors are float32-equivalent to the saved first-ten generation receipt. Their current category, preparation and dosage differ from the text inputs used to generate those vectors. The saved before-images, current database records and unchanged-vector comparisons are recorded under `existingVectorFreshness`.

Repair: reembed the changed approved text for these ten as well. The existing null-only reembedding script would miss this set. Missing forty plus stale ten means all fifty need an explicit indexing decision against current reviewed text, not a claim that forty absent vectors are the entire backlog.

### 3. Four tested English common-name searches fail live — medium

| Query | Expected stored record | Actual public search |
| --- | --- | --- |
| Holy Basil | Balanay | HTTP 200, zero results |
| Indian Mallow | Abutilon indicum | HTTP 200, zero results |
| Portia Tree | Thespesia populnea | HTTP 200, zero results |
| Sponge Gourd | Luffa aegyptiaca | HTTP 200, zero results |

The actual browser also returned zero for Holy Basil, then found Balanay when its stored title was searched. These queries match the local frontend common-name registry.

There is a reproducible local mapping defect, not merely an assumed deployment issue: `src/content/regionalCommonNames.ts:925` returns the first Tagalog alias as the database title. The four mappings return Sulasi, Malvas, Banalo and Patola, while the intended database titles are Balanay, Abutilon indicum, Thespesia populnea and Luffa aegyptiaca. `herb.repository.ts` compares those returned aliases to `localName` using equality. Deploying this unchanged mapping is not a sufficient repair.

Repair: resolve aliases to actual stored record identifiers or canonical titles, preferably with an explicit exact-species mapping. Add regressions for these four cases and ambiguous aliases. Test server-side filtering/pagination, not only a local client helper returning true.

### 4. Local regional-name UI is not present in the inspected live details — medium

Local `herbalaifrontend/app/library/page.tsx:409` renders a Regional & Common Names section with English, Tagalog, Cebuano, Ilocano and Bikol rows. Live Abutilon and Balanay dialogs went directly from their scientific-name subtitle to Ask Dr. Ai and medicinal/preparation sections; the new regional-name block was absent. Live card/detail primary titles also still include scientific-only names such as Abutilon indicum.

This establishes a live/local display gap for the inspected records, not proof that every alias is wrong. Repair the search mapping first, then review/build/deploy the intended frontend/backend bundle and recheck these same dialogs. Do not stage the unrelated dirty checkout wholesale.

### 5. Lokoloko has a blank occurrence field — low

The live database/API `regionFound` value for Lokoloko is NULL. Other required descriptive fields were nonblank for all fifty. There is no verified Philippine locality provided by this audit.

Repair: use an exact-species authoritative occurrence source, or display an explicit "Not documented" limitation. Do not invent a region or silently transfer locality from another Ocimum species.

### 6. Abutilon's displayed method and attached preparation evidence are inconsistent — high content-review priority

Its current method offers a leaf/stem external decoction or topical poultice. The attached preparation-tagged reference is Krisanapun et al. (2011), DOI `10.1093/ecam/neq004`; the stored citation describes a combined leaf/twig/root experimental extract and fractionation, not a household remedy. The live warning simultaneously says no medicinal household recipe is cleared. The inspected UI presents both texts together.

The [primary article abstract](https://pubmed.ncbi.nlm.nih.gov/21603234/) describes experimental whole-plant extract, diabetic rats and cell-related studies. It does not substantiate the displayed external-wash/poultice instruction. This is a source-to-current-text inconsistency; it is not a claim that no traditional external-use account exists anywhere.

Repair: attach an exact preparation source supporting the specific method and route, clearly distinguish a documented traditional practice from validated treatment, or restore a source-faithful limited description. Review other newly simplified methods against their own citations before teaching step-by-step instructions or reindexing them. For example, Lokoloko now includes a five-to-ten-minute infusion while its attached modern citation explicitly warns against converting laboratory handling into household instructions; the timing needs an identified supporting passage, not an invented replacement. The [cited Lokoloko study record](https://pubmed.ncbi.nlm.nih.gov/34945464/) concerns Nigerian sampling, metal/proximate analysis and brine-shrimp testing. Full-text PMC access was blocked during this audit; no claim of a complete fifty-record medical/source certification is made.

## Additional evidence gaps, not counted as reproduced user-facing bugs

- Forty new records lack `reviewedById`, and the queried expansion audit actions show fifty staging events but only ten publication and ten indexing events. This is a provenance/accountability gap; it does not prove that nobody reviewed them elsewhere. Reconcile external review evidence rather than invent reviewers or historical audit events.
- Exact-string scientific uniqueness is not a completed synonym/hybrid botanical review. Historical identity caveats remain in several occurrence/source texts.
- Image delivery is confirmed; this audit does not certify all botanical identifications, individual licenses, attribution compliance or creators. Several newly selected assets have non-CC0 metadata and taxon-page source URLs; inspect the original individual photo records before claiming license clearance. No new image was uploaded during this audit.
- A complete signed-in Dr. Ai exchange, all source originals, physical-device testing and participant/UAT outcomes were not tested or fabricated.

## What was actually run

- Read-only Neon transactions selecting public herb fields, source rows, vector dimensions, suggestion identities and aggregate audit actions; no account passwords or private email data queried.
- One full public catalog check and fifty bounded-concurrency public detail comparisons.
- 88 image-delivery HEAD checks; relative paths correctly resolved. Initial invalid-URL TypeErrors in the audit runner were corrected and are not reported as website bugs.
- Four English alias API checks, local frontend/backend mapping checks, and real-browser Holy Basil/Balanay reproduction.
- Ten read-only vector-value comparisons against saved indexing before-images; no embedding/chat provider calls.
- Two actual live detail inspections: Abutilon and Balanay.

No production writes, imports, uploads, migrations, commits or pushes were performed. No full application regression suite is claimed by this read-only audit.

Evidence:
- `HERB_POST_HANDOFF_LIVE_AUDIT_2026-10-07.json` — all fifty database/detail rows, image results, alias cases and vector freshness.
- `herbalaibackend/tmp/live-holy-basil-search-2026-10-07.jpg` — live zero-results reproduction.
- `herbalaibackend/tmp/live-balanay-detail-2026-10-07.jpg` — live counterpart record and missing regional block.

## Focused next batch

1. Repair and regression-test alias-to-record mapping; review the common-name UI deployment bundle.
2. Reconcile preparation/source inconsistencies and Lokoloko's blank field using exact sources, preserving before-images.
3. Index missing forty and refresh stale ten only after current text passes that review.
4. Deploy only reviewed code changes; independently recheck search, regional-name display, indexed retrieval and a bounded authenticated AI conversation. Keep the already-published fifty rows rather than reimporting them.
