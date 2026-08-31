import { Router } from "express";
import { KnowledgeBaseController } from "../controllers/knowledgebase.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { permittedRole } from "../middlewares/role.middleware.js";
import { Role } from "@prisma/client";
import { validateSchema } from "../middlewares/validate.js";
import { createKnowledgeSchema, updateKnowledgeSchema } from "../schema/ai/knowledge.schema.js";

const router = Router();
const knowledgeBaseController = new KnowledgeBaseController();
const authMiddleware = new AuthMiddleware();

// Private Routes (Admin Only)
router.get("/all", authMiddleware.execute, permittedRole([Role.admin]), knowledgeBaseController.getAllKnowledge);
router.post("/create", authMiddleware.execute, permittedRole([Role.admin]), validateSchema(createKnowledgeSchema), knowledgeBaseController.createKnowledge);
router.patch("/:id", authMiddleware.execute, permittedRole([Role.admin]), validateSchema(updateKnowledgeSchema), knowledgeBaseController.updateKnowledge);
router.delete("/:id", authMiddleware.execute, permittedRole([Role.admin]), knowledgeBaseController.deleteKnowledge);

export default router;
