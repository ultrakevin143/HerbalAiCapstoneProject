ALTER TABLE "User"
  ADD COLUMN "banReason" VARCHAR(500),
  ADD COLUMN "banExpiresAt" TIMESTAMP(3);

ALTER TABLE "User"
  ADD CONSTRAINT "User_ban_reason_length" CHECK ("banReason" IS NULL OR length(btrim("banReason")) BETWEEN 1 AND 500),
  ADD CONSTRAINT "User_ban_expiry_requires_ban" CHECK ("banExpiresAt" IS NULL OR "isBanned" = true);
