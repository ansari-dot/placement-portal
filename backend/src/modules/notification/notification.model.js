import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
  },
  desc: {
    type: String,
    required: [true, 'Notification description is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['request', 'appointment', 'student', 'internship', 'job', 'rto', 'system'],
    default: 'system',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  link: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const NotificationModel = mongoose.model('Notification', notificationSchema);

export default NotificationModel;
