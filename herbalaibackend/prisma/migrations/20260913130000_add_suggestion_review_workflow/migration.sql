ALTER TYPE "SuggestionStatus" ADD VALUE IF NOT EXISTS 'ChangesRequested';

ALTER TABLE "SuggestedHerb"
  ADD COLUMN "reviewNotes" TEXT,
  ADD COLUMN "evidenceClass" "HerbEvidenceClass" NOT NULL DEFAULT 'UNASSESSED',
  ADD COLUMN "reviewedAt" TIMESTAMP(3);
