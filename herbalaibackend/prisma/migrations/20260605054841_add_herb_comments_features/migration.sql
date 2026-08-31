-- AlterTable
ALTER TABLE "HerbComment" ADD COLUMN     "parentCommentId" INTEGER;

-- CreateTable
CREATE TABLE "HerbCommentLike" (
    "commentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HerbCommentLike_pkey" PRIMARY KEY ("commentId","userId")
);

-- AddForeignKey
ALTER TABLE "HerbComment" ADD CONSTRAINT "HerbComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "HerbComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HerbCommentLike" ADD CONSTRAINT "HerbCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "HerbComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HerbCommentLike" ADD CONSTRAINT "HerbCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
