import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import type { JwtPayload } from "../utils/jwt.js";

type AuthenticatedRequest = Request & { user?: JwtPayload };

/**
 * Middleware to check if the authenticated user has one of the required roles.
 * @param roles Array of allowed roles
 */
export const permittedRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        code: 401,
        status: "error",
        message: "Authentication required",
      });
      return;
    }
    
    if (!roles.includes(authReq.user.role as Role)) {
      res.status(403).json({
        code: 403,
        status: "error",
        message: "Forbidden: You do not have the required role",
      });
      return;
    }

    next();
  };
};
