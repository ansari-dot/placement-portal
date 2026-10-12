import { NotificationService } from './notification.service.js';

export const getAllNotificationsController = async (req, res, next) => {
  try {
    const { notifications, unreadCount } = await NotificationService.getAllNotifications();
    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const createNotificationController = async (req, res, next) => {
  try {
    const notification = await NotificationService.createNotification(req.body);
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markReadController = async (req, res, next) => {
  try {
    const notification = await NotificationService.markRead(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllReadController = async (req, res, next) => {
  try {
    await NotificationService.markAllRead();
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotificationController = async (req, res, next) => {
  try {
    await NotificationService.deleteNotification(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllNotificationsController = async (req, res, next) => {
  try {
    await NotificationService.clearAllNotifications();
    res.status(200).json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    next(error);
  }
};
