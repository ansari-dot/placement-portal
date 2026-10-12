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
      enum: ['Present', 'Absent', 'Late', 'Half Day', 'Completed'],
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
  },
  {
    timestamps: true,
  }
);

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
