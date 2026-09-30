import { NotificationItem } from "../types";
import { storageService } from "./storageService";

export const notificationService = {
  /**
   * Get all active notifications
   */
  async getNotifications(): Promise<NotificationItem[]> {
    return storageService.getNotifications();
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const list = storageService.getNotifications();
    return list.filter((n) => !n.read).length;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const list = storageService.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      storageService.saveNotifications(list);
    }
  },

  /**
   * Add a new notification in demo storage
   */
  async addNotification(notification: Omit<NotificationItem, "id" | "date" | "read">): Promise<NotificationItem> {
    const list = storageService.getNotifications();
    const newItem: NotificationItem = {
      ...notification,
      id: storageService.getNextNotificationId(),
      date: "Today",
      read: false
    };
    list.unshift(newItem);
    storageService.saveNotifications(list);
    return newItem;
  },

  /**
   * Reset in-memory / persisted state back to original baseline
   */
  async resetState(): Promise<void> {
    storageService.resetDemoState();
  }
};
