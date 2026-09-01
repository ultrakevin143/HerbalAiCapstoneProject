-- Existing counters cannot be attributed to users, so reset them before
-- introducing database-enforced per-user reactions.
UPDATE "Thread" SET "likes" = 0;
UPDATE "ThreadComment" SET "likes" = 0;

CREATE TABLE "ThreadLike" (
    "threadId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThreadLike_pkey" PRIMARY KEY ("threadId", "userId")
);

CREATE TABLE "ThreadCommentLike" (
    "commentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThreadCommentLike_pkey" PRIMARY KEY ("commentId", "userId")
);

CREATE INDEX "ThreadLike_userId_idx" ON "ThreadLike"("userId");
CREATE INDEX "ThreadCommentLike_userId_idx" ON "ThreadCommentLike"("userId");

ALTER TABLE "ThreadLike" ADD CONSTRAINT "ThreadLike_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ThreadLike" ADD CONSTRAINT "ThreadLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ThreadCommentLike" ADD CONSTRAINT "ThreadCommentLike_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "ThreadComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ThreadCommentLike" ADD CONSTRAINT "ThreadCommentLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
