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
  // Targeted roles: e.g. ['All'], ['Student'], ['Industry'], ['RTO'], ['Coordinator'], ['Administrator']
  targetRoles: {
    type: [String],
    default: [],
  },
  targetRole: {
    type: String,
    default: null,
  },
  // Targeted direct recipient (if single user)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  senderName: {
    type: String,
    default: '',
  },
  // Contextual attributes for role/entity scoping
  studentName: {
    type: String,
    default: '',
    trim: true,
  },
  studentId: {
    type: String,
    default: '',
    trim: true,
  },
  company: {
    type: String,
    default: '',
    trim: true,
  },
  rtoName: {
    type: String,
    default: '',
    trim: true,
  },
  // Multi-user tracking: stores IDs of users who marked this notification as read
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Multi-user tracking: stores IDs of users who dismissed/cleared this notification
  clearedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Backward compatibility flag
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

notificationSchema.index({ targetRoles: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ readBy: 1 });
notificationSchema.index({ clearedBy: 1 });

const NotificationModel = mongoose.model('Notification', notificationSchema);

export default NotificationModel;

