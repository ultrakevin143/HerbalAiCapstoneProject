import type { Request, Response, NextFunction } from "express";
import * as auditRepo from "../repositories/audit.repository.js";

export class AuditController {
  /**
   * GET /api/admin/audit-logs
   * Retrieve platform audit trail (Admin only).
   */
  public getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt((req.query["limit"] as string) || "50", 10);
      const offset = parseInt((req.query["offset"] as string) || "0", 10);

      const { logs, total } = await auditRepo.findAuditLogs(limit, offset);

      res.status(200).json({
        status: "success",
        code: 200,
        data: {
          logs,
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
