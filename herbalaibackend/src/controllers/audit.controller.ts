import type { Request, Response, NextFunction } from "express";
import * as auditRepo from "../repositories/audit.repository.js";
import { parsePositiveIntString } from "../utils/positive-int.js";

export class AuditController {
  /**
   * GET /api/admin/audit-logs
   * Retrieve platform audit trail (Admin only).
   */
  public getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestedLimit = req.query["limit"];
      const limit = requestedLimit === undefined ? 50 : parsePositiveIntString(requestedLimit, 100);
      if (limit === null) {
        res.status(400).json({ status: "error", code: 400, message: "Invalid audit limit. Use an integer from 1 to 100." });
        return;
      }
      const requestedOffset = req.query["offset"];
      const offset = requestedOffset === undefined || requestedOffset === "0" ? 0 : parsePositiveIntString(requestedOffset, 10000);
      if (offset === null) {
        res.status(400).json({ status: "error", code: 400, message: "Invalid audit offset. Use an integer from 0 to 10000." });
        return;
      }

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
