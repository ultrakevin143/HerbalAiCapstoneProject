import type { Request, Response, NextFunction } from "express";
import {  
  CreateKnowledgeBaseService, 
  UpdateKnowledgeBaseService, 
  DeleteKnowledgeBaseService, 
  GetAllKnowledgeBaseService 
} from "../services/ai/knowledge-base/index.js";

export class KnowledgeBaseController {
  // Create Knowledge
  public createKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await CreateKnowledgeBaseService(req.body);
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
      res.status(result.code).json(result);
    } catch (error) {
      next(error);
    }
  };
}
