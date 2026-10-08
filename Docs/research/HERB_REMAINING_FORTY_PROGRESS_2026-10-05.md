# Remaining forty herbs: provisional photo research

Date: 2026-10-05. Scope: research only; no additional Cloudinary uploads or Neon writes.

## Observed results

Queried all forty candidates in batches 2-5. The bounded iNaturalist search found 69 individual-photo CC0 leads for 35 candidates. Searches require an exact scientific-name match at species rank, a research-grade observation, a CC0 licence on the individual photo, and original dimensions with a short edge of at least 600 pixels. At most two leads are retained per candidate. These checks do not replace accepted-name, historical-identity, local-occurrence or medical review.

Two requests initially returned an empty server reply for Thespesia populnea and Morinda citrifolia. Each was retried once; both recovered and returned two leads. Two exact-taxon queries and three qualifying-photo queries remain unresolved. Empty bounded results do not prove that a species or suitable image does not exist.

No derivative in this remaining-forty search was downloaded, fully decoded, hashed, visually checked, retouched, uploaded or integrated into the application. Some returned assets are PNG rather than JPEG; follow-up download validation must inspect actual format and MIME rather than assume every source is JPEG. The metadata regression check now accepts the observed JPEG/PNG source suffixes without declaring an image valid.

## Candidate work matrix

| Batch | Proposed name, still subject to review | Scientific name in queue | Book entry | Photo leads | Media follow-up |
| --- | --- | --- | --- | --- | --- |
| 2 | Mustasa | Brassica juncea | 14 | 2 | Download and visual review pending |
| 2 | Radish | Raphanus sativus | 15 | 0 | Exact taxon not found in bounded query |
| 2 | Olasiman | Portulaca oleracea | 20 | 2 | Download and visual review pending |
| 2 | Cacao | Theobroma cacao | 44 | 2 | Download and visual review pending |
| 2 | Linga | Sesamum indicum | 159 | 2 | Download and visual review pending |
| 2 | Niog | Cocos nucifera | 214 | 2 | Download and visual review pending |
| 2 | Maize | Zea mays | 217 | 2 | Download and visual review pending |
| 2 | Tubo | Saccharum officinarum | 219 | 2 | Download and visual review pending |
| 2 | Fennel | Foeniculum vulgare | 119 | 2 | Download and visual review pending |
| 2 | Paminta | Piper nigrum | 184 | 2 | Download and visual review pending |
| 3 | Solasi | Ocimum basilicum | 170 | 2 | Download and visual review pending |
| 3 | Lokoloko | Ocimum gratissimum | 171 | 2 | Download and visual review pending |
| 3 | Balanay | Ocimum tenuiflorum | 172 | 2 | Download and visual review pending |
| 3 | Romero | Salvia rosmarinus | 174 | 2 | Download and visual review pending |
| 3 | Katuray | Sesbania grandiflora | 73 | 2 | Download and visual review pending |
| 3 | Alibangbang | Piliostigma malabaricum | 89 | 0 | No qualifying CC0 lead in bounded query |
| 3 | Kupang | Parkia timoriana | 91 | 0 | No qualifying CC0 lead in bounded query |
| 3 | Nipa | Nypa fruticans | 215 | 2 | Download and visual review pending |
| 3 | Bottle gourd | Lagenaria siceraria | 108 | 2 | Download and visual review pending |
| 3 | Luffa aegyptiaca | Luffa aegyptiaca | 112 | 2 | Download and visual review pending |
| 4 | Santan | Ixora coccinea | 124 | 2 | Download and visual review pending |
| 4 | Sampaguita | Jasminum sambac | 139 | 1 | Download and visual review pending |
| 4 | Kabiki | Mimusops elengi | 138 | 2 | Download and visual review pending |
| 4 | Balibago | Hibiscus tiliaceus | 33 | 2 | Download and visual review pending |
| 4 | Thespesia populnea | Thespesia populnea | 35 | 2 | Download and visual review pending |
| 4 | Doldol | Ceiba pentandra | 38 | 2 | Download and visual review pending |
| 4 | Kalumpang | Sterculia foetida | 39 | 2 | Download and visual review pending |
| 4 | Manzanitas | Ziziphus mauritiana | 67 | 2 | Download and visual review pending |
| 4 | Asana | Pterocarpus indicus | 79 | 2 | Download and visual review pending |
| 4 | Coffee | Coffea arabica | 125 | 2 | Download and visual review pending |
| 5 | Kamias | Averrhoa bilimbi | 47 | 2 | Download and visual review pending |
| 5 | Balimbing | Averrhoa carambola | 48 | 2 | Download and visual review pending |
| 5 | Kasuy | Anacardium occidentale | 70 | 2 | Download and visual review pending |
| 5 | Bankundo | Morinda citrifolia | 126 | 2 | Download and visual review pending |
| 5 | Oxalis corniculata | Oxalis corniculata | 45 | 2 | Download and visual review pending |
| 5 | Kahel | Citrus aurantium | 54 | 0 | Exact taxon not found in bounded query |
| 5 | Tsampaka | Magnolia champaca | 3 | 2 | Download and visual review pending |
| 5 | Abutilon indicum | Abutilon indicum | 30 | 2 | Download and visual review pending |
| 5 | Kastuli | Abelmoschus moschatus | 32 | 2 | Download and visual review pending |
| 5 | Ayapana | Ayapana triplinervis | 130 | 0 | No qualifying CC0 lead in bounded query |

## Outstanding searches

Primary-source follow-up confirmed that the two empty exact-name queries need deliberate taxonomic reconciliation: Kew treats the Radish queue name as a synonym of a subspecies and records Kahel's name with a hybrid marker. See `HERB_TAXONOMY_FOLLOW_UP_2026-10-05.md` for source links and the research-parser regression gate. Neither the queue nor a live record was silently renamed.

- Radish (Raphanus sativus) and Kahel (Citrus aurantium): no exact species match was returned in the bounded taxon search. Review the accepted-name mapping and alternative search strategy before accepting a differently named taxon. No substitution was made.
- Alibangbang (Piliostigma malabaricum), Kupang (Parkia timoriana) and Ayapana (Ayapana triplinervis): no qualifying CC0 lead was returned in the bounded observation search. Try additional individually licensed sources; do not substitute a different plant, copy a watermarked image or silently change the licence requirement.

## Provenance and validation

The full metadata ledger is HERB_REMAINING_FORTY_PHOTO_LEADS_2026-10-05.json. It records source/asset URLs, individual observation and photo IDs, creator, observed licence, original dimensions and explicit pending review flags. It is not importer-compatible and keeps uploadAllowed and publicationAllowed false. Raw public API responses remain outside Git in the herb-photo-review scratch directory.

Seven new regression tests validate forty queue identities, counts of 69 leads/35 represented candidates, unique photo IDs, individual licence/source IDs, exact candidate linkage, bounded search size, unresolved-query distinctions and nonpublishing/nonimportable status. All five focused herb suites passed together: 69 tests. Standalone strict TypeScript validation also passed with noUncheckedIndexedAccess and exactOptionalPropertyTypes. A separate final broad backend run, including the seven new checks, passed 892 tests in 65 files with exit 0. Seventeen database-dependent suites remain excluded; this is not SQL or live-system acceptance.

## Next autonomous batch

1. Resolve the five search gaps and check the remaining forty historical identities/local names against accepted taxonomy and Philippine occurrence sources.
2. Download bounded candidates, inspect actual file formats, enforce long-edge/short-edge size gates, decode fully and hash files. Reject unsuitable photos without altering their identifying features or removing marks.
3. Visually compare selected photos with botanical references and keep individual licence/provenance evidence. Upload only selected assets, then verify actual Cloudinary delivery and byte hashes.
4. Produce cited, part-specific educational drafts. Keep unvalidated recipes/doses withheld and distinguish historical or preclinical reporting from human clinical evidence.
5. Reuse the first-ten isolated staging gates: target verification, fresh all-state identity read, coordinated transaction/concurrency testing, no overwrite, DRAFT-only staging and explicit review before public Library/AI integration.

Do not feed this ledger or the fifty-candidate research queue into deployment bootstrap. The first ten have completed media checks, not final medicinal-content approval; the remaining forty are at lead-research stage.
