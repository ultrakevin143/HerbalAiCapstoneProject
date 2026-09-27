ALTER TABLE "User" ADD COLUMN "password_reset_requested_at" TIMESTAMP(3);

UPDATE "User" AS "user"
SET "password_reset_requested_at" = "recent"."createdAt"
FROM (
    SELECT "userId", MAX("createdAt") AS "createdAt"
    FROM "Token"
    WHERE "type" = 'PASSWORD_RESET'
      AND "revokedAt" IS NULL
      AND "expiresAt" > CURRENT_TIMESTAMP
    GROUP BY "userId"
) AS "recent"
WHERE "user"."id" = "recent"."userId";
