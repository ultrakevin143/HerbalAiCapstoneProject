import { Router } from "express";
import authRoutes from "./auth.routes.js";
import chatRoutes from "./chat.routes.js";
import knowledgeBaseRoutes from "./knowledgebase.routes.js";
import suggestRoutes from "./suggest.routes.js";
import herbRoutes from "./herb.routes.js";
import forumRoutes from "./forum.routes.js";
import statsRoutes from "./stats.routes.js";
import messageRoutes from "./message.routes.js";
import auditRoutes from "./audit.routes.js";
import notificationRoutes from "./notification.routes.js";

const router = Router();

// Mount all routes
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/knowledge-base", knowledgeBaseRoutes);
router.use("/suggest", suggestRoutes);
router.use("/herbs", herbRoutes);
router.use("/forum", forumRoutes);
router.use("/stats", statsRoutes);
router.use("/messages", messageRoutes);
router.use("/admin/audit-logs", auditRoutes);
router.use("/notifications", notificationRoutes);

// Health check endpoint inside /api
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Herbal AI APIs are functional",
    timestamp: new Date().toISOString()
  });
});

export default router;
