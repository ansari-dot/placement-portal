import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: false,
    default: 'User@123',
    select: false,
  },
  role: {
    type: String,
    enum: [
      'Administrator',
      'Admin',
      'Coordinator',
      'Placement Coordinator',
      'RTO Manager',
      'RTO',
      'Staff',
      'Student',
      'Industry',
      'Industry/Host',
    ],
    default: 'Staff',
  },
  department: {
    type: String,
    trim: true,
    default: 'Placement Operations',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending', 'Rejected', 'Disabled'],
    default: 'Pending',
  },
  approved: {
    type: Boolean,
    default: false,
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
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  // Public signup registration requests metadata
  registrationNotes: {
    type: String,
    trim: true,
    default: '',
  },
  requestedOrgName: {
    type: String,
    trim: true,
    default: '',
  },
  requestedCourse: {
    type: String,
    trim: true,
    default: '',
  },
  requestedFacilityName: {
    type: String,
    trim: true,
    default: '',
  },
  requestedStudentId: {
    type: String,
    trim: true,
    default: '',
  },
  // Entity bindings for strict Role-Based Access Control (RBAC)
  rtoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rto',
    default: null,
  },
  rtoName: {
    type: String,
    trim: true,
    default: '',
  },
  industryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Industry',
    default: null,
  },
  facilityName: {
    type: String,
    trim: true,
    default: '',
  },
  studentIdRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null,
  },
}, {
  timestamps: true,
});

userSchema.index({ status: 1, role: 1, isDeleted: 1 });
userSchema.index({ approved: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Support one-time migration of passwords previously written without running the bcrypt hook.
  if (!/^\$2[aby]\$\d{2}\$/.test(this.password || '')) {
    return this.password === candidatePassword;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
