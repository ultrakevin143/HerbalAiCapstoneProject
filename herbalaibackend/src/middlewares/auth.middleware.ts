import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "../utils/jwt.js";
import { validateAccessSession } from "../lib/access-session.js";

export type AuthenticatedRequest = Request & { user?: JwtPayload };

export class AuthMiddleware {
  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.setHeader('Cache-Control', 'private, no-store');
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

    try {
      const session = await validateAccessSession(accessToken);
      if (session.status === 'invalid') {
        res.status(401).json({ code: 401, status: "error", message: "Session expired. Please sign in again." });
        return;
      }
      if (session.status === 'banned') {
        res.status(403).json({ code: 403, status: "error", message: session.message });
        return;
      }
      authReq.user = session.payload;
      next();
    } catch (error) {
      next(error);
    }
  };

  private extractBearerToken(header?: string): string | undefined {
    if (!header) return undefined;
    const [scheme, token] = header.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return undefined;
    return token.trim();
  }
}
