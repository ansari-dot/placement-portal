import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },
    reviewerName: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
    },
    reviewerRole: {
      type: String,
      enum: ['Student', 'RTO Manager', 'RTO', 'Industry', 'Industry/Host', 'Host Facility', 'Coordinator', 'Staff', 'Administrator', 'Partner', 'Other'],
      required: [true, 'Reviewer role is required'],
    },
    reviewerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    reviewerAvatar: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [5, 'Comment must be at least 5 characters'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: [
        'Platform Experience',
        'Placement Support',
        'Compliance & Tracking',
        'Host Facility Experience',
        'General',
      ],
      default: 'Platform Experience',
    },
    rtoName: {
      type: String,
      trim: true,
      default: '',
    },
    facilityName: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
reviewSchema.index({ reviewerRole: 1, status: 1 });

const ReviewModel = mongoose.model('Review', reviewSchema);
export default ReviewModel;
