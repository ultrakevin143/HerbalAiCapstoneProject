import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import * as userRepo from "../repositories/user.repository.js";
import { ENV } from "../config/env.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { createAuditLog } from "../repositories/audit.repository.js";
import { randomBytes } from "node:crypto";

export class AuthController {
  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const isProduction = ENV.NODE_ENV === "production";

    // Set Access Token Cookie (expires in 15 minutes)
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    // Set Refresh Token Cookie (expires in 7 days)
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  public signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json({
        status: "success",
        code: 201,
        message: result.message,
        data: {
          user: {
            id: result.id,
            username: result.username,
            email: result.email,
            name: result.name,
            role: result.role,
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      
      this.setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      res.status(200).json({
        status: "success",
        code: 200,
        message: "Login successful",
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        res.status(400).json({
          status: "error",
          code: 400,
          message: "Refresh token is required",
        });
        return;
      }

      const result = await authService.refreshToken(token);

      this.setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      res.status(200).json({
        status: "success",
        code: 200,
        message: "Token refreshed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (token) {
        await authService.logout(token);
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.status(200).json({
        status: "success",
        code: 200,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({
          status: "error",
          code: 401,
          message: "Authentication required",
        });
        return;
      }

      const user = await userRepo.findUserById(userId);
      if (!user) {
        res.status(404).json({
          status: "error",
          code: 404,
          message: "User not found",
        });
        return;
      }

      if (user.isBanned) {
        // Clear cookies immediately so frontend logs them out
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(403).json({
          status: "error",
          code: 403,
          message: "Your account has been banned.",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        code: 200,
        data: {
          user,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json({ status: "error", code: 401, message: "Authentication required" });
        return;
      }

      const currentUser = await userRepo.findUserById(userId);
      if (!currentUser) {
        res.status(404).json({ status: "error", code: 404, message: "User not found" });
        return;
      }
      if (currentUser.isBanned) {
        res.status(403).json({ status: "error", code: 403, message: "Your account has been banned." });
        return;
      }

      const data = {
        ...(req.body.name !== undefined && { name: req.body.name.trim() }),
        ...(req.body.avatar !== undefined && { avatar: req.body.avatar?.trim() || null }),
        ...(req.body.bio !== undefined && { bio: req.body.bio?.trim() || null }),
      };
      const user = await userRepo.updateUserProfile(userId, data);

      res.status(200).json({
        status: "success",
        code: 200,
        message: "Profile updated successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Google SSO ---

  public googleAuth = (_req: Request, res: Response): void => {
    const url = authService.getGoogleAuthUrl();
    res.redirect(url);
  };

  public googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.query['code'] as string;
      if (!code) {
        res.status(400).json({ status: "error", message: "Authorization code missing." });
        return;
      }

      const result = await authService.googleLogin(code);
      const nonce = randomBytes(16).toString('base64');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; form-action ${ENV.FRONTEND_URL}; base-uri 'none'`);
      res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Completing sign in</title></head><body><form method="post" action="${ENV.FRONTEND_URL}/api/auth/google/complete"><input type="hidden" name="refreshToken" value="${result.refreshToken}"><button type="submit">Continue to Herbal AI</button></form><script nonce="${nonce}">document.forms[0].submit()</script></body></html>`);
    } catch (error) {
      next(error);
    }
  };

  public socketToken = (req: Request, res: Response): void => {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ status: 'success', data: { token } });
  };

  public getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({
          status: "error",
          code: 401,
          message: "Authentication required",
        });
        return;
      }

      const currentUser = await userRepo.findUserById(userId);
      if (!currentUser || currentUser.role !== 'admin') {
        res.status(403).json({
          status: "error",
          code: 403,
          message: "Forbidden: Admins only",
        });
        return;
      }

      const users = await userRepo.findAllUsers();
      res.status(200).json({
        status: "success",
        code: 200,
        data: {
          users,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public banUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.userId;
      const targetUserId = req.params['id'] as string;

      if (!adminId) {
        res.status(401).json({ status: "error", code: 401, message: "Authentication required" });
        return;
      }

      const currentUser = await userRepo.findUserById(adminId);
      if (!currentUser || currentUser.role !== 'admin') {
        res.status(403).json({ status: "error", code: 403, message: "Forbidden: Admins only" });
        return;
      }

      if (adminId === targetUserId) {
        res.status(400).json({ status: "error", code: 400, message: "You cannot ban yourself." });
        return;
      }

      const updatedUser = await userRepo.updateUserBanStatus(targetUserId, true);

      createAuditLog({
        adminId,
        action: "BAN_USER",
        targetType: "User",
        targetId: targetUserId,
        details: { targetUsername: updatedUser.username, targetEmail: updatedUser.email },
      }).catch((e) => console.error("Failed to write audit log:", e));

      res.status(200).json({
        status: "success",
        code: 200,
        message: "User has been banned successfully.",
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  };

  public unbanUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.userId;
      const targetUserId = req.params['id'] as string;

      if (!adminId) {
        res.status(401).json({ status: "error", code: 401, message: "Authentication required" });
        return;
      }

      const currentUser = await userRepo.findUserById(adminId);
      if (!currentUser || currentUser.role !== 'admin') {
        res.status(403).json({ status: "error", code: 403, message: "Forbidden: Admins only" });
        return;
      }

      const updatedUser = await userRepo.updateUserBanStatus(targetUserId, false);

      createAuditLog({
        adminId,
        action: "UNBAN_USER",
        targetType: "User",
        targetId: targetUserId,
        details: { targetUsername: updatedUser.username, targetEmail: updatedUser.email },
      }).catch((e) => console.error("Failed to write audit log:", e));

      res.status(200).json({
        status: "success",
        code: 200,
        message: "User has been unbanned successfully.",
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        res.status(400).json({ status: "error", code: 400, message: "Token is required." });
        return;
      }

      const result = await authService.verifyEmail(token);
      res.status(200).json({
        status: "success",
        code: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  public resendEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ status: "error", code: 400, message: "Email is required." });
        return;
      }

      const result = await authService.resendEmailVerification(email);
      res.status(200).json({
        status: "success",
        code: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ status: "error", code: 400, message: "Email is required." });
        return;
      }

      const result = await authService.forgotPassword(email);
      res.status(200).json({
        status: "success",
        code: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        res.status(400).json({ status: "error", code: 400, message: "Token and password are required." });
        return;
      }

      const result = await authService.resetPassword(token, password);
      res.status(200).json({
        status: "success",
        code: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
