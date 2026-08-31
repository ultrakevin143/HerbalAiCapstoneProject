import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const notificationController = new NotificationController();
const authMiddleware = new AuthMiddleware();

// All notification routes require authentication
router.use(authMiddleware.execute);

// GET /api/notifications - Get current user's notifications
router.get("/", notificationController.getMyNotifications);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch("/read-all", notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark specific notification as read
router.patch("/:id/read", notificationController.markAsRead);

export default router;
