import NotificationModel from './notification.model.js';
import { NotFoundError } from '../../core/errors/AppError.js';

export class NotificationService {
  static async getAllNotifications() {
    // Delete any past dummy sample seed data if present
    await NotificationModel.deleteMany({
      $or: [
        { desc: /John Smith applied for Software Developer/i },
        { desc: /Aisha Khan interview with TechSolutions/i },
        { desc: /Priya Sharma was successfully enrolled/i },
        { desc: /Ali Raza has officially joined GreenView/i },
      ],
    });

    const notifications = await NotificationModel.find().sort({ createdAt: -1 });
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return { notifications, unreadCount };
  }

  static async createNotification({ title, desc, type, link }) {
    return await NotificationModel.create({
      title,
      desc,
      type: type || 'system',
      link: link || '',
      isRead: false,
    });
  }

  static async markRead(id) {
    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return notification;
  }

  static async markAllRead() {
    await NotificationModel.updateMany({ isRead: false }, { isRead: true });
    return true;
  }

  static async deleteNotification(id) {
    const notification = await NotificationModel.findByIdAndDelete(id);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return true;
  }

  static async clearAllNotifications() {
    await NotificationModel.deleteMany({});
    return true;
  }
}
