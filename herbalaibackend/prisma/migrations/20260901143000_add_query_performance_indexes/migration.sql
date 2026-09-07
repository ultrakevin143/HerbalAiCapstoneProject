CREATE INDEX "HerbComment_herbId_isDeleted_date_idx"
ON "HerbComment"("herbId", "isDeleted", "date");

CREATE INDEX "SuggestedHerb_status_submittedAt_idx"
ON "SuggestedHerb"("status", "submittedAt");

CREATE INDEX "Thread_isDeleted_date_idx"
ON "Thread"("isDeleted", "date");

CREATE INDEX "ThreadComment_threadId_isDeleted_date_idx"
ON "ThreadComment"("threadId", "isDeleted", "date");

CREATE INDEX "ChatMessage_senderId_receiverId_time_idx"
ON "ChatMessage"("senderId", "receiverId", "time");

CREATE INDEX "Notification_userId_isRead_createdAt_idx"
ON "Notification"("userId", "isRead", "createdAt");

CREATE INDEX "Herb_embedding_hnsw_idx"
ON "Herb" USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;

CREATE INDEX "KnowledgeBase_embedding_hnsw_idx"
ON "KnowledgeBase" USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;
