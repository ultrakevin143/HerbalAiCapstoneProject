import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import type { Herb } from "@prisma/client";
import { ENV } from "../src/config/env.js";

const database = new Client({ connectionString: ENV.DATABASE_URL });
let connected = false;

const legacyHerbs = [
  ["Akapulko", "Senna alata"],
  ["Ampalaya", "Momordica charantia"],
  ["Bawang", "Allium sativum"],
  ["Bayabas", "Psidium guajava"],
  ["Lagundi", "Vitex negundo"],
  ["Niyog-niyogan", "Quisqualis indica"],
  ["Sambong", "Blumea balsamifera"],
  ["Tsaang Gubat", "Carmona retusa"],
  ["Ulasimang Bato", "Peperomia pellucida"],
  ["Yerba Buena", "Clinopodium douglasii"],
  ["Hilbas", "Clinopodium douglasii"],
  ["Gumamela", "Hibiscus rosa-sinensis"],
  ["Indian Heliotrope", "Heliotropium indicum"],
  ["Tanglad", "Cymbopogon citratus"],
];

const catalogMigrations = [
  "20260912130000_remediate_existing_herb_catalog",
  "20260913090000_local_verified_herb_images",
  "20260913093000_restore_evidence_supported_herbs",
  "20260913094500_simplify_herb_descriptions",
  "20260913095000_polish_herb_descriptions",
];

type CatalogHerb = Herb & { sources: Array<{ publisher: string | null }> };

const findHerbs = async (names: string[]) => {
  const result = await database.query<CatalogHerb>(`
    SELECT herb.*, COALESCE((
      SELECT json_agg(json_build_object('publisher', source.publisher))
      FROM pg_temp."HerbSource" source WHERE source."herbId" = herb.id
    ), '[]'::json) AS sources
    FROM pg_temp."Herb" herb WHERE herb."localName" = ANY($1::text[])
  `, [names]);
  return result.rows;
};

beforeAll(async () => {
  const target = new URL(ENV.DATABASE_URL ?? "postgresql://localhost/invalid");
  if (process.env.NODE_ENV !== "test" || !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || target.pathname !== "/herbalai_test") {
    throw new Error("Catalog migration tests require the isolated loopback herbalai_test database.");
  }
  await database.connect();
  connected = true;
  await database.query('BEGIN');
  await database.query('SET LOCAL search_path TO pg_temp, public');
  await database.query('CREATE TEMP TABLE "Herb" (LIKE public."Herb" INCLUDING DEFAULTS) ON COMMIT DROP');
  await database.query('CREATE TEMP TABLE "HerbSource" (LIKE public."HerbSource" INCLUDING DEFAULTS) ON COMMIT DROP');
  await database.query('ALTER TABLE pg_temp."HerbSource" ALTER COLUMN id DROP DEFAULT');
  await database.query('ALTER TABLE pg_temp."HerbSource" ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY');
  await database.query('CREATE TEMP TABLE "HerbComment" (LIKE public."HerbComment" INCLUDING DEFAULTS) ON COMMIT DROP');

  for (const [localName, scientificName] of legacyHerbs) {
    await database.query(`
      INSERT INTO pg_temp."Herb" (id, "localName", "scientificName", category, "medicinalUses", "preparationMethod", dosage, "isDohApproved", "updatedAt")
      VALUES ($1, $2, $3, 'TEST ONLY', 'TEST ONLY', 'TEST ONLY', 'TEST ONLY', $4, NOW())
    `, [localName, localName, scientificName, localName !== "Hilbas"]);
  }
  await database.query(`
    INSERT INTO pg_temp."HerbComment" (id, "herbId", "authorId", content)
    VALUES (1, 'Hilbas', 'fixture-author', 'TEST ONLY duplicate comment')
  `);
  await database.query(`
    INSERT INTO pg_temp."HerbSource" ("herbId", title, publisher, supports)
    VALUES ('Hilbas', 'TEST ONLY retained source', 'Fixture publisher', ARRAY['identity'])
  `);

  for (const migration of catalogMigrations) {
    const sql = await readFile(new URL(`../prisma/migrations/${migration}/migration.sql`, import.meta.url), "utf8");
    await database.query(sql);
  }
});

afterAll(async () => {
  if (!connected) return;
  try {
    await database.query('ROLLBACK');
  } finally {
    await database.end();
  }
});

const officialNames = [
  "Akapulko",
  "Ampalaya",
  "Bawang",
  "Bayabas",
  "Lagundi",
  "Niyog-niyogan",
  "Sambong",
  "Tsaang Gubat",
  "Ulasimang Bato",
  "Yerba Buena",
];

describe("Remediated herb catalog", () => {
  it("publishes one governed record for every official PITAHC herb", async () => {
    const herbs = await findHerbs(officialNames);

    expect(herbs).toHaveLength(officialNames.length);
    for (const herb of herbs) {
      expect(herb).toMatchObject({
        isDohApproved: true,
        isVerified: true,
        publicationStatus: "PUBLISHED",
        evidenceClass: "DOH_PITAHC_LISTED",
        provenance: "BUILT_IN",
      });
      expect(herb.sources.some(source => source.publisher === "Philippine Institute of Traditional and Alternative Health Care")).toBe(true);
      expect(herb.imageUrl).toMatch(/^\/images\/herbs\/[a-z-]+\.(?:jpg|png)$/);
      expect(herb.imageCreator).toBeTruthy();
      expect(herb.imageSourceUrl).toMatch(/^https:\/\//);
      expect(herb.imageLicense).toBeTruthy();
      expect(herb.imageLicenseUrl).toMatch(/^https:\/\//);
      expect(`${herb.medicinalUses} ${herb.preparationMethod} ${herb.dosage}`).not.toMatch(/PITAHC/i);
    }
  });

  it("uses the corrected Yerba Buena identity without a duplicate Hilbas record", async () => {
    const [yerbaBuena] = await findHerbs(["Yerba Buena"]);
    const hilbas = await findHerbs(["Hilbas"]);

    expect(yerbaBuena).toMatchObject({
      scientificName: "Mentha × villosa",
      sourceScientificName: "Mentha cordifolia",
      imageUrl: "/images/herbs/yerba-buena.png",
    });
    expect(hilbas).toHaveLength(0);
  });

  it("publishes non-DOH herbs with evidence-specific classifications", async () => {
    const additionalHerbs = await findHerbs(["Gumamela", "Indian Heliotrope", "Tanglad"]);

    expect(additionalHerbs).toHaveLength(3);
    expect(additionalHerbs.find(herb => herb.localName === "Gumamela")).toMatchObject({ publicationStatus: "PUBLISHED", evidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE", isDohApproved: false, isVerified: true });
    expect(additionalHerbs.find(herb => herb.localName === "Tanglad")).toMatchObject({ publicationStatus: "PUBLISHED", evidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE", isDohApproved: false, isVerified: true });
    expect(additionalHerbs.find(herb => herb.localName === "Indian Heliotrope")).toMatchObject({ publicationStatus: "PUBLISHED", evidenceClass: "DOCUMENTED_TRADITIONAL_USE", isDohApproved: false, isVerified: true });
    for (const herb of additionalHerbs) {
      expect(herb.sources.length).toBeGreaterThan(0);
      expect(herb.imageUrl).toMatch(/^\/images\/herbs\/[a-z-]+\.jpg$/);
    }
  });

  it("preserves the duplicate herb's comment and source when merging identities", async () => {
    const comments = await database.query('SELECT "herbId", content FROM pg_temp."HerbComment"');
    expect(comments.rows).toEqual([{ herbId: "Yerba Buena", content: "TEST ONLY duplicate comment" }]);
    const [yerbaBuena] = await findHerbs(["Yerba Buena"]);
    expect(yerbaBuena.sources).toContainEqual({ publisher: "Fixture publisher" });
  });
});
