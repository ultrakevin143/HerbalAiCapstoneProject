import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { createAuditLog } from "../repositories/audit.repository.js";
import {  
  CreateKnowledgeBaseService, 
  UpdateKnowledgeBaseService, 
  DeleteKnowledgeBaseService, 
  GetAllKnowledgeBaseService,
  ImportKnowledgeBaseService,
} from "../services/ai/knowledge-base/index.js";

export class KnowledgeBaseController {
  public importKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await ImportKnowledgeBaseService(req.body.facts);
      const adminId = (req as AuthenticatedRequest).user?.userId;
      if (result.status === 'success' && adminId && result.data) {
        await createAuditLog({
          adminId,
          action: 'IMPORT_KNOWLEDGE_BASE',
          targetType: 'KnowledgeBase',
          targetId: 'bulk-import',
          details: result.data,
        });
      }
      res.status(result.code).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Create Knowledge
  public createKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await CreateKnowledgeBaseService(req.body);
      const adminId = (req as AuthenticatedRequest).user?.userId;
      if (result.status === "success" && adminId && result.data?.id) {
        await createAuditLog({
          adminId,
          action: "CREATE_KNOWLEDGE_BASE",
          targetType: "KnowledgeBase",
          targetId: result.data.id,
          details: { question: req.body.question },
        });
      }
      res.status(result.code).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Get All Knowledge
  public getAllKnowledge = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await GetAllKnowledgeBaseService();
      res.status(result.code).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Update Knowledge
  public updateKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const data = { ...req.body, id };
      const result = await UpdateKnowledgeBaseService(data);
      const adminId = (req as AuthenticatedRequest).user?.userId;
      if (result.status === "success" && adminId) {
        await createAuditLog({
          adminId,
          action: "UPDATE_KNOWLEDGE_BASE",
          targetType: "KnowledgeBase",
          targetId: id,
          details: { fields: Object.keys(req.body) },
        });
      }
      res.status(result.code).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Delete Knowledge
  public deleteKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await DeleteKnowledgeBaseService(id);
      const adminId = (req as AuthenticatedRequest).user?.userId;
      if (result.status === "success" && adminId) {
        await createAuditLog({
          adminId,
          action: "DELETE_KNOWLEDGE_BASE",
          targetType: "KnowledgeBase",
          targetId: id,
        });
      }
      res.status(result.code).json(result);
    } catch (error) {
      next(error);
    }
  };
}
