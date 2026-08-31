import { prisma } from "../lib/prisma.js";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}

/**
 * Create a new notification for a user.
 */
export const createNotification = async (data: CreateNotificationParams) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || "SUGGESTION_UPDATE",
      link: data.link || null,
    },
  });
};

/**
 * Get all notifications for a specific user.
 */
export const getUserNotifications = async (userId: string, limit: number = 30) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

/**
 * Count unread notifications for a user.
 */
export const countUnreadNotifications = async (userId: string) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

/**
 * Mark a specific notification as read.
 */
export const markAsRead = async (id: number, userId: string) => {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
};

/**
 * Mark all notifications for a user as read.
 */
export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
