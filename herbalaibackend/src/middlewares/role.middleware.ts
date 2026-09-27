import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { JwtPayload } from "../utils/jwt.js";

type AuthenticatedRequest = Request & { user?: JwtPayload };

/**
 * Middleware to check if the authenticated user has one of the required roles.
 * @param roles Array of allowed roles
 */
export const permittedRole = (roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user?.userId) {
      res.status(401).json({
        code: 401,
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    try {
      const account = await prisma.user.findUnique({
        where: { id: authReq.user.userId },
        select: { role: true, isBanned: true },
      });

      if (!account) {
        res.status(401).json({ code: 401, status: "error", message: "Authentication required" });
        return;
      }

      if (account.isBanned || !roles.includes(account.role)) {
        res.status(403).json({
          code: 403,
          status: "error",
          message: "Forbidden: You do not have the required role",
        });
        return;
      }

      authReq.user.role = account.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};
