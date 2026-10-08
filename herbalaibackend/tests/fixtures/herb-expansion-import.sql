CREATE TYPE "HerbPublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HOLD', 'ARCHIVED');
CREATE TYPE "HerbEvidenceClass" AS ENUM ('DOH_PITAHC_LISTED', 'EVIDENCE_SUPPORTED_PHILIPPINE_USE', 'DOCUMENTED_TRADITIONAL_USE', 'UNASSESSED');
CREATE TYPE "HerbProvenance" AS ENUM ('BUILT_IN', 'COMMUNITY_SUBMISSION', 'ADMIN_CREATED', 'LEGACY_IMPORT');
CREATE TABLE "User" (id text PRIMARY KEY, role text NOT NULL, "isBanned" boolean NOT NULL DEFAULT false);
CREATE TABLE "Herb" (
  id text PRIMARY KEY, "localName" text NOT NULL, "cebuanoName" text,
  "scientificName" text NOT NULL, "sourceScientificName" text, category text NOT NULL,
  "medicinalUses" text NOT NULL, "preparationMethod" text NOT NULL, dosage text NOT NULL,
  "regionFound" text, warnings text, "imageUrl" text,
  "isDohApproved" boolean NOT NULL DEFAULT false, "isVerified" boolean NOT NULL DEFAULT false,
  "publicationStatus" "HerbPublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "evidenceClass" "HerbEvidenceClass" NOT NULL DEFAULT 'UNASSESSED',
  provenance "HerbProvenance" NOT NULL DEFAULT 'ADMIN_CREATED',
  "reviewedAt" timestamp, "reviewedById" text REFERENCES "User"(id),
  "imageCreator" text, "imageSourceUrl" text, "imageLicense" text,
  "imageLicenseUrl" text, "imageModification" text, embedding text,
  "createdAt" timestamp NOT NULL DEFAULT NOW(), "updatedAt" timestamp NOT NULL
);
CREATE TABLE "HerbSource" (
  id serial PRIMARY KEY, "herbId" text NOT NULL REFERENCES "Herb"(id) ON DELETE CASCADE,
  title text NOT NULL, publisher text, url text, citation text, supports text[] NOT NULL,
  "accessedAt" timestamp, "createdAt" timestamp NOT NULL DEFAULT NOW()
);
CREATE TABLE "SuggestedHerb" (
  id serial PRIMARY KEY, "localName" text NOT NULL, "scientificName" text NOT NULL,
  "cebuanoName" text, status text NOT NULL
);
CREATE TABLE "AuditLog" (
  id serial PRIMARY KEY, "adminId" text NOT NULL REFERENCES "User"(id), action text NOT NULL,
  "targetType" text NOT NULL, "targetId" text NOT NULL, details jsonb,
  "createdAt" timestamp NOT NULL DEFAULT NOW()
);
