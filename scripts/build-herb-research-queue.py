import argparse
import csv
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SELECTION = [
    (98, "Duhat"), (88, "Sampalok"), (5, "Atis"), (94, "Talisay"), (77, "Butterfly pea"),
    (69, "Mangga"), (63, "Santol"), (104, "Papaya"), (102, "Granada"), (137, "Chico"),
    (14, "Mustasa"), (15, "Radish"), (20, "Olasiman"), (44, "Cacao"), (159, "Linga"),
    (214, "Niog"), (217, "Maize"), (219, "Tubo"), (119, "Fennel"), (184, "Paminta"),
    (170, "Solasi"), (171, "Lokoloko"), (172, "Balanay"), (174, "Romero"), (73, "Katuray"),
    (89, "Alibangbang"), (91, "Kupang"), (215, "Nipa"), (108, "Bottle gourd"), (112, "Luffa aegyptiaca"),
    (124, "Santan"), (139, "Sampaguita"), (138, "Kabiki"), (33, "Balibago"), (35, "Thespesia populnea"),
    (38, "Doldol"), (39, "Kalumpang"), (67, "Manzanitas"), (79, "Asana"), (125, "Coffee"),
    (47, "Kamias"), (48, "Balimbing"), (70, "Kasuy"), (126, "Bankundo"), (45, "Oxalis corniculata"),
    (54, "Kahel"), (3, "Tsampaka"), (30, "Abutilon indicum"), (32, "Kastuli"), (130, "Ayapana"),
]


def scientific_identity(value):
    normalized = " ".join(value.replace("æ", "ae").replace("œ", "oe").split())
    match = re.match(r"^(?P<genus_hybrid>×\s*|x\s+)?(?P<genus>[A-Z][a-z]+) (?P<species_hybrid>×\s*|x\s+)?(?P<epithet>[a-z-]+)(?=\s|,|$)", normalized)
    if not match:
        raise ValueError(f"Unsupported scientific name: {value}")
    remainder = normalized[match.end():].strip()
    if re.search(r"×|\bx\b|(?:^|\s)(?:subvar|subf|subsp|ssp|var|f)\.(?!\s+[a-z-]+(?:\s|$))", remainder):
        raise ValueError(f"Incomplete rank or parent-cross formula: {value}")
    rank = re.search(r"(?:^|\s)(subsp\.|ssp\.|var\.|f\.)\s+([a-z-]+)(?=\s|$)", remainder)
    authority_parts = [remainder[:rank.start()].strip(), remainder[rank.end():].strip()] if rank else [remainder]
    if any(part and not re.match(r"^[,(A-Z&]", part) for part in authority_parts):
        raise ValueError(f"Unsupported name suffix: {value}")
    if any(re.search(r"(?:^|\s)(?:subvar|subf|subsp|ssp|var|f)\.", part) for part in authority_parts):
        raise ValueError(f"Unsupported or multiple ranks: {value}")
    genus = ("× " if match.group("genus_hybrid") else "") + match.group("genus")
    epithet = ("× " if match.group("species_hybrid") else "") + match.group("epithet")
    name = f"{genus} {epithet}"
    if rank:
        name += f" {'subsp.' if rank[1] == 'ssp.' else rank[1]} {rank[2]}"
    return name


def build_queue(inventory_path=None):
    with (inventory_path or ROOT / "Docs/research/PARDO_HERB_INVENTORY_2026-10-04.csv").open(encoding="utf-8-sig", newline="") as source:
        inventory = {int(row["entry"]): row for row in csv.DictReader(source)}
    candidates = []
    for index, (entry, local_name) in enumerate(SELECTION):
        row = inventory[entry]
        if row["decision"] != "CANDIDATE_ABSENT_PUBLIC_CATALOG":
            raise ValueError(f"Entry {entry} is not a candidate: {row['decision']}")
        canonical_name = scientific_identity(row["proposed_accepted_name"])
        source_name = scientific_identity(row["expanded_name"])
        candidates.append({
            "id": f"research-pardo-{entry:03d}",
            "batch": index // 10 + 1,
            "proposedLocalName": local_name,
            "scientificName": canonical_name,
            "acceptedTaxonKey": row["accepted_key"],
            "scientificSynonyms": [source_name] if source_name != canonical_name else [],
            "localAliases": ["Lomboy"] if entry == 98 else [],
            "book": {
                "entry": entry,
                "heading": row["book_heading"],
                "commonNames": row["common_names_as_book"],
                "printedPage": int(row["printed_page"]),
                "pdfPage": int(row["pdf_page_matched"]),
            },
            "taxonomyUrl": row["taxonomy_url"],
            "identityReview": "PENDING",
            "medicalReview": "PENDING",
            "safetyNote": "Research candidate only. Verify historical species identity, Philippine occurrence, local names, plant parts, contraindications and modern evidence; food or ornamental use does not establish medicinal safety.",
            "photo": None,
        })
    return {
        "schemaVersion": 1,
        "batchId": "pardo-fifty-research-2026-10-04",
        "preparedAt": "2026-10-04",
        "status": "RESEARCH_QUEUE",
        "taxonomyChecklist": "7ddf754f-d193-4cc9-b351-99906754a03b",
        "historicalSource": {
            "title": "The Medicinal Plants of the Philippines (1901), T. H. Pardo de Tavera; translated and revised by Jerome B. Thomas, Jr.",
            "url": "https://www.gutenberg.org/files/26393/26393-h/26393-h.htm",
            "pdfSha256": "d0f8a1fec9514578deddf99bbc1c0e8b5e01153df0ebf24aa4745a103cb6adb3",
        },
        "selectionNote": "Fifty provisional candidates from the 143 name-matched entries absent from the 38-record public baseline, not the fifty unresolved historical identities. Five batches of ten prioritize familiar plants and avoid several obvious high-hazard entries. Selection does not imply safety or medical efficacy. Proposed display names and synonym mappings remain subject to manual review; no record is cleared against the full database.",
        "candidates": candidates,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare a nonimportable research queue; dry run unless a new output path is provided.")
    parser.add_argument("--output", type=Path, help="Create a new JSON file; existing files are never overwritten.")
    arguments = parser.parse_args()
    queue = build_queue()
    if arguments.output:
        with arguments.output.open("x", encoding="utf-8") as destination:
            destination.write(json.dumps(queue, ensure_ascii=False, indent=2) + "\n")
        print(f"Prepared {len(queue['candidates'])} research candidates in {arguments.output}; no database or media writes.")
    else:
        print(f"Dry run: prepared {len(queue['candidates'])} research candidates; no files, database or media written.")
