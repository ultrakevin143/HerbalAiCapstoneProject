export interface NotificationItem {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export const isOwnedNotification = (value: unknown, userId: string): value is NotificationItem => {
  if (!value || typeof value !== 'object') return false;
  const notification = value as Partial<NotificationItem>;
  return Number.isSafeInteger(notification.id) && notification.id! > 0 && notification.id! <= 2147483647 &&
    notification.userId === userId && typeof notification.title === 'string' && typeof notification.message === 'string' &&
    typeof notification.type === 'string' && typeof notification.isRead === 'boolean' && typeof notification.createdAt === 'string' &&
    (notification.link === null || typeof notification.link === 'string');
};

export const notificationSnapshot = (data: unknown, userId: string): { notifications: NotificationItem[]; unreadCount: number } => {
  const snapshot = data as { notifications?: unknown; unreadCount?: unknown } | null;
  if (!snapshot || !Array.isArray(snapshot.notifications) || snapshot.notifications.some(item => !isOwnedNotification(item, userId))) {
    throw new Error('Invalid notification snapshot for the current account.');
  }
  const notifications = [...new Map((snapshot.notifications as NotificationItem[]).map(item => [item.id, item])).values()];
  const visibleUnread = notifications.filter(item => !item.isRead).length;
  const count = snapshot.unreadCount;
  const unreadCount = typeof count === 'number' && Number.isSafeInteger(count) && count >= 0 ? Math.max(count, visibleUnread) : visibleUnread;
  return { notifications, unreadCount };
};
