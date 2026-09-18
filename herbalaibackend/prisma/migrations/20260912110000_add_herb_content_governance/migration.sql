-- CreateEnum
CREATE TYPE "HerbPublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HerbEvidenceClass" AS ENUM ('DOH_PITAHC_LISTED', 'EVIDENCE_SUPPORTED_PHILIPPINE_USE', 'DOCUMENTED_TRADITIONAL_USE', 'UNASSESSED');

-- CreateEnum
CREATE TYPE "HerbProvenance" AS ENUM ('BUILT_IN', 'COMMUNITY_SUBMISSION', 'ADMIN_CREATED', 'LEGACY_IMPORT');

-- AlterTable
ALTER TABLE "Herb"
  ALTER COLUMN "isVerified" SET DEFAULT false,
  ADD COLUMN "sourceScientificName" TEXT,
  ADD COLUMN "publicationStatus" "HerbPublicationStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "evidenceClass" "HerbEvidenceClass" NOT NULL DEFAULT 'UNASSESSED',
  ADD COLUMN "provenance" "HerbProvenance" NOT NULL DEFAULT 'ADMIN_CREATED',
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "sourceSuggestionId" INTEGER,
  ADD COLUMN "imageCreator" TEXT,
  ADD COLUMN "imageSourceUrl" TEXT,
  ADD COLUMN "imageLicense" TEXT,
  ADD COLUMN "imageLicenseUrl" TEXT,
  ADD COLUMN "imageModification" TEXT;

-- Preserve the publication behavior of existing records while marking their
-- provenance and evidence as requiring explicit future reconciliation.
UPDATE "Herb"
SET
  "publicationStatus" = CASE WHEN "isVerified" THEN 'PUBLISHED'::"HerbPublicationStatus" ELSE 'DRAFT'::"HerbPublicationStatus" END,
  "evidenceClass" = CASE WHEN "isDohApproved" THEN 'DOH_PITAHC_LISTED'::"HerbEvidenceClass" ELSE 'UNASSESSED'::"HerbEvidenceClass" END,
  "provenance" = 'LEGACY_IMPORT'::"HerbProvenance",
  "reviewedAt" = CASE WHEN "isVerified" THEN "updatedAt" ELSE NULL END;

-- CreateTable
CREATE TABLE "HerbSource" (
  "id" SERIAL NOT NULL,
  "herbId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "publisher" TEXT,
  "url" TEXT,
  "citation" TEXT,
  "supports" TEXT[],
  "publishedAt" TEXT,
  "accessedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HerbSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Herb_sourceSuggestionId_key" ON "Herb"("sourceSuggestionId");
CREATE INDEX "Herb_publicationStatus_isVerified_idx" ON "Herb"("publicationStatus", "isVerified");
CREATE INDEX "Herb_provenance_idx" ON "Herb"("provenance");
CREATE INDEX "HerbSource_herbId_idx" ON "HerbSource"("herbId");

-- AddForeignKey
ALTER TABLE "Herb" ADD CONSTRAINT "Herb_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Herb" ADD CONSTRAINT "Herb_sourceSuggestionId_fkey" FOREIGN KEY ("sourceSuggestionId") REFERENCES "SuggestedHerb"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HerbSource" ADD CONSTRAINT "HerbSource_herbId_fkey" FOREIGN KEY ("herbId") REFERENCES "Herb"("id") ON DELETE CASCADE ON UPDATE CASCADE;
