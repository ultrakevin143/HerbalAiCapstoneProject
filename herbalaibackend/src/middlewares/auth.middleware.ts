import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import type { JwtPayload } from "../utils/jwt.js";

export type AuthenticatedRequest = Request & { user?: JwtPayload };

export class AuthMiddleware {
  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    
    // 1. Try to get token from Authorization Header
    let accessToken = this.extractBearerToken(req.headers.authorization);

    // 2. Fallback to Cookies (for Web applications)
    if (!accessToken && req.cookies) {
      accessToken = req.cookies['accessToken'];
    }

    if (!accessToken) {
      res.status(401).json({ code: 401, status: "error", message: "Authentication required" });
      return;
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      res.status(401).json({ code: 401, status: "error", message: "Invalid or expired token" });
      return;
    }

    authReq.user = payload;
    next();
  };

  private extractBearerToken(header?: string): string | undefined {
    if (!header) return undefined;
    const [scheme, token] = header.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return undefined;
    return token.trim();
  }
}
