import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
      default: null,
    },
    facilityName: {
      type: String,
      trim: true,
      default: '',
    },
    placement: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    placementId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    breakMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    date: {
      type: String,
      required: [true, 'Attendance date is required'],
      trim: true,
    },
    startTime: {
      type: String,
      trim: true,
      default: '09:00 AM',
    },
    finishTime: {
      type: String,
      trim: true,
      default: '05:00 PM',
    },
    totalHours: {
      type: Number,
      required: true,
      min: 0,
      default: 8,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half Day', 'Completed', 'Excused', 'Sick Leave'],
      default: 'Present',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recordedByName: {
      type: String,
      trim: true,
      default: '',
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

// Prevent duplicate attendance for the same student on the same date (excluding soft-deleted records)
attendanceSchema.index(
  { student: 1, date: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
attendanceSchema.index({ industry: 1, date: 1 });
attendanceSchema.index({ facilityName: 1, date: 1 });
attendanceSchema.index({ date: -1, createdAt: -1 });

attendanceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

attendanceSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

const AttendanceModel = mongoose.model('Attendance', attendanceSchema);
export default AttendanceModel;
