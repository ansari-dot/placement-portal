import NotificationModel from '../model/notification.model.js';

// GET /notifications - Fetch all real notifications
export const getAllNotificationsController = async (req, res) => {
  try {
    // Delete any past dummy sample seed data if present
    await NotificationModel.deleteMany({
      $or: [
        { desc: /John Smith applied for Software Developer/i },
        { desc: /Aisha Khan interview with TechSolutions/i },
        { desc: /Priya Sharma was successfully enrolled/i },
        { desc: /Ali Raza has officially joined GreenView/i }
      ]
    });

    const notifications = await NotificationModel.find().sort({ createdAt: -1 });
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /notifications - Create a new notification
export const createNotificationController = async (req, res) => {
  try {
    const { title, desc, type, link } = req.body;
    if (!title || !desc) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const notification = await NotificationModel.create({
      title,
      desc,
      type: type || 'system',
      link: link || '',
      isRead: false,
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /notifications/:id/read - Mark single notification as read
export const markReadController = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /notifications/read-all - Mark all notifications as read
export const markAllReadController = async (req, res) => {
  try {
    await NotificationModel.updateMany({ isRead: false }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /notifications/:id - Delete a notification
export const deleteNotificationController = async (req, res) => {
  try {
    const { id } = req.params;
    await NotificationModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /notifications - Clear all notifications
export const clearAllNotificationsController = async (req, res) => {
  try {
    await NotificationModel.deleteMany({});

    res.status(200).json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
