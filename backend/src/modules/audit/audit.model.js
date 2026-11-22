import mongoose from 'mongoose';

const userLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  actorName: { type: String, default: 'Unauthenticated / system' },
  actorEmail: { type: String, default: '' },
  actorRole: { type: String, default: '' },
  action: { type: String, required: true, index: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  resource: { type: String, default: 'portal' },
  resourceId: { type: String, default: '' },
  humanDescription: { type: String, default: '' },
  previousState: { type: mongoose.Schema.Types.Mixed, default: null },
  isReverted: { type: Boolean, default: false, index: true },
  revertedAt: { type: Date, default: null },
  revertedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  revertedByName: { type: String, default: '' },
  changes: { type: mongoose.Schema.Types.Mixed, default: {} },
  statusCode: { type: Number, default: 200 },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

userLogSchema.index({ createdAt: -1 });

export default mongoose.model('UserLog', userLogSchema);
