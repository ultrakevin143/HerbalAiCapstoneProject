import { readFile } from 'node:fs/promises';
import type { SourceTagClient } from '../../src/content/herb-preparation-source-tag-release.js';

export const sourceTagReview = JSON.parse(await readFile(new URL('../../../Docs/research/HERB_PREPARATION_SOURCE_TAG_REVIEW_2026-10-06.json', import.meta.url), 'utf8'));
const baseline = JSON.parse(await readFile(new URL('../../../Docs/research/HERB_PREPARATION_SOURCE_TAG_BASELINE_2026-10-06.json', import.meta.url), 'utf8'));
export const sourceTagIds: string[] = baseline.records.map((record: { id: string }) => record.id);
export const fixtureTimestamp = new Date('2026-10-06T09:00:00.000Z');

export const initializeSourceTagFixture = async (client: SourceTagClient, vector = false) => {
  await client.query(`CREATE TABLE "Herb" (
    id text PRIMARY KEY, "localName" text NOT NULL, "scientificName" text NOT NULL,
    "preparationMethod" text NOT NULL, dosage text NOT NULL, warnings text, "imageUrl" text,
    "publicationStatus" text NOT NULL, "isVerified" boolean NOT NULL,
    "createdAt" timestamp NOT NULL, "updatedAt" timestamp NOT NULL, embedding ${vector ? 'vector(768)' : 'text'},
    "cebuanoName" text, "imageLicense" text, "evidenceClass" text
  )`);
  await client.query(`CREATE TABLE "HerbSource" (
    id int PRIMARY KEY, "herbId" text NOT NULL REFERENCES "Herb"(id), title text NOT NULL,
    publisher text, url text, citation text, supports text[] NOT NULL, "publishedAt" text,
    "accessedAt" timestamp, "createdAt" timestamp NOT NULL
  )`);
  await client.query('CREATE TYPE "Role" AS ENUM (\'admin\', \'contributor\')');
  await client.query('CREATE TABLE "User" (id text PRIMARY KEY, role "Role" NOT NULL, "isBanned" boolean NOT NULL)');
  await client.query(`CREATE TABLE "AuditLog" (
    id serial PRIMARY KEY, "adminId" text NOT NULL REFERENCES "User"(id), action text NOT NULL,
    "targetType" text NOT NULL, "targetId" text NOT NULL, details jsonb, "createdAt" timestamp DEFAULT now()
  )`);
};

export const resetSourceTagFixture = async (client: SourceTagClient, vector = false) => {
  await client.query('TRUNCATE "AuditLog", "HerbSource", "Herb", "User" RESTART IDENTITY');
  await client.query('INSERT INTO "User" VALUES ($1, $2, false)', ['qa-admin', 'admin']);
  for (const record of baseline.records) {
    await client.query(`INSERT INTO "Herb" VALUES ($1, $2, $3, $4, $5, $6, $7, 'PUBLISHED', true,
      '2026-10-06 08:00:00', '2026-10-06 08:00:00', $8, $9, $10, $11)`,
    [record.id, record.localName, record.scientificName, record.preparationMethod,
      'Protected dosage wording', 'Protected warning wording', 'https://example.org/fixture.jpg',
      vector ? `[${Array(768).fill(0.1).join(',')}]` : '[0.1,0.2,0.3]', 'Protected local alias', 'Protected license', 'DOCUMENTED_TRADITIONAL_USE']);
    for (const source of record.sources) {
      await client.query(`INSERT INTO "HerbSource" VALUES ($1, $2, $3, $4, $5, $6, $7::text[], null, $8, '2026-10-06 08:00:00')`,
        [source.id, source.herbId, source.title, source.publisher, source.url, source.citation, source.supports, source.accessedAt]);
    }
  }
};
