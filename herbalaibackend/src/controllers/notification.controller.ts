import type { Request, Response, NextFunction } from "express";
import * as notifRepo from "../repositories/notification.repository.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { parsePositiveIntString } from "../utils/positive-int.js";

export class NotificationController {
  /**
   * GET /api/notifications
   * Fetch current user's notifications and unread count.
   */
  public getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ status: "error", code: 401, message: "Authentication required" });
        return;
      }

      const requestedLimit = req.query["limit"];
      const limit = requestedLimit === undefined ? 30 : parsePositiveIntString(requestedLimit, 100);
      if (limit === null) {
        res.status(400).json({ status: "error", code: 400, message: "Invalid notification limit. Use an integer from 1 to 100." });
        return;
      }
      const [notifications, unreadCount] = await Promise.all([
        notifRepo.getUserNotifications(userId, limit),
        notifRepo.countUnreadNotifications(userId),
      ]);

      res.status(200).json({
        status: "success",
        code: 200,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  public markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ status: "error", code: 401, message: "Authentication required" });
        return;
      }

      const id = parsePositiveIntString(req.params["id"]);
      if (id === null) {
        res.status(400).json({ status: "error", code: 400, message: "Invalid notification ID" });
        return;
      }

      await notifRepo.markAsRead(id, userId);

      res.status(200).json({
        status: "success",
        code: 200,
        message: "Notification marked as read",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications for the current user as read.
   */
  public markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ status: "error", code: 401, message: "Authentication required" });
        return;
      }

      await notifRepo.markAllAsRead(userId);

      res.status(200).json({
        status: "success",
        code: 200,
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  };
}
