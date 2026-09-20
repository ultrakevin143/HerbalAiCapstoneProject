ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "email_verified" TIMESTAMP(3);

ALTER TABLE "Herb"
  ADD COLUMN IF NOT EXISTS "isDohApproved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ChatMessage"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "isEdited" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" SERIAL NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'SUGGESTION_UPDATE',
  "link" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_adminId_idx" ON "AuditLog"("adminId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_adminId_fkey') THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
