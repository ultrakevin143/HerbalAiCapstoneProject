import csv
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/build-herb-research-queue.py"
SPEC = importlib.util.spec_from_file_location("herb_research_queue", SCRIPT)
GENERATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GENERATOR)


class ScientificNameTests(unittest.TestCase):
    def test_preserves_named_hybrids_and_ranks_without_authors(self):
        pairs = [
            ("Citrus × aurantium L.", "Citrus × aurantium"),
            ("Citrus ×aurantium L.", "Citrus × aurantium"),
            ("Citrus x aurantium L.", "Citrus × aurantium"),
            ("×Brassarda juncea (L.) Su Liu & Z.H.Feng", "× Brassarda juncea"),
            ("Raphanus raphanistrum subsp. sativus (L.) Schmalh.", "Raphanus raphanistrum subsp. sativus"),
            ("Raphanus raphanistrum L. ssp. sativus (L.) Schmalh.", "Raphanus raphanistrum subsp. sativus"),
            ("Citrus × aurantium f. aurantium", "Citrus × aurantium f. aurantium"),
            ("Raphanus raphanistrum var. sativus", "Raphanus raphanistrum var. sativus"),
            ("Garcinia xanthochymus L.f.", "Garcinia xanthochymus"),
            ("Clitoria ternatea, L.", "Clitoria ternatea"),
            ("  Citrus   aurantium  ", "Citrus aurantium"),
        ]
        for source, expected in pairs:
            with self.subTest(source=source):
                self.assertEqual(GENERATOR.scientific_identity(source), expected)

    def test_fails_closed_for_incomplete_names_formulas_and_unsupported_ranks(self):
        for source in ["Citrus ×", "Raphanus raphanistrum subsp.", "Raphanus raphanistrum subvar. sativus", "Citrus maxima × Citrus reticulata", "Citrus maxima x Citrus reticulata", "Citrus aurantium unexpected", "C.", "", "Citrus aurantium 'Cultivar'"]:
            with self.subTest(source=source):
                with self.assertRaises(ValueError):
                    GENERATOR.scientific_identity(source)

    def test_current_inventory_build_preserves_all_fifty_identities(self):
        current = json.loads((ROOT / "herbalaibackend/content/herbs/expansion-batch-03.review.json").read_text(encoding="utf-8"))
        generated = GENERATOR.build_queue()
        self.assertEqual(generated, current)
        self.assertEqual(len(generated["candidates"]), 50)

    def test_inventory_subspecies_and_hybrid_are_not_truncated(self):
        source = ROOT / "Docs/research/PARDO_HERB_INVENTORY_2026-10-04.csv"
        with source.open(encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            columns = reader.fieldnames
            rows = list(reader)
        updates = {"14": "× Brassarda juncea", "15": "Raphanus raphanistrum subsp. sativus", "54": "Citrus × aurantium"}
        for row in rows:
            if row["entry"] in updates:
                row["proposed_accepted_name"] = updates[row["entry"]]
        with tempfile.TemporaryDirectory() as temporary:
            inventory = Path(temporary) / "inventory.csv"
            with inventory.open("w", encoding="utf-8", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=columns)
                writer.writeheader()
                writer.writerows(rows)
            generated = GENERATOR.build_queue(inventory)
        for candidate in generated["candidates"]:
            entry = str(candidate["book"]["entry"])
            if entry in updates:
                self.assertEqual(candidate["scientificName"], updates[entry])
                self.assertEqual(candidate["identityReview"], "PENDING")
                self.assertEqual(candidate["medicalReview"], "PENDING")


class OutputSafetyTests(unittest.TestCase):
    def run_generator(self, *arguments):
        return subprocess.run([sys.executable, "-B", str(SCRIPT), *arguments], cwd=ROOT, text=True, capture_output=True, timeout=20)

    def test_default_run_is_nonwriting(self):
        queue_path = ROOT / "herbalaibackend/content/herbs/expansion-batch-03.review.json"
        before = queue_path.read_bytes()
        result = self.run_generator()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("dry run", result.stdout.lower())
        self.assertEqual(queue_path.read_bytes(), before)

    def test_explicit_new_file_does_not_make_importable_or_approved_content(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "new-queue.json"
            result = self.run_generator("--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            generated = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(generated["status"], "RESEARCH_QUEUE")
            self.assertNotIn("herbs", generated)
            self.assertTrue(all(candidate["medicalReview"] == "PENDING" for candidate in generated["candidates"]))

    def test_existing_destination_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "protected.json"
            output.write_text("preserve reviewed work", encoding="utf-8")
            result = self.run_generator("--output", str(output))
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(output.read_text(encoding="utf-8"), "preserve reviewed work")


if __name__ == "__main__":
    unittest.main()
