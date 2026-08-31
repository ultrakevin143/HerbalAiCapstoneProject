import { Router } from "express";
import { AuditController } from "../controllers/audit.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { permittedRole } from "../middlewares/role.middleware.js";
import { Role } from "@prisma/client";

const router = Router();
const auditController = new AuditController();
const authMiddleware = new AuthMiddleware();

// GET /api/admin/audit-logs - View audit trail (Admin only)
router.get(
  "/",
  authMiddleware.execute,
  permittedRole([Role.admin]),
  auditController.getAuditLogs
);

export default router;
