import mongoose from 'mongoose';

const rtoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  loc: { type: String },
  status: { type: String, default: 'Active' },
  students: { type: Number, default: 0 },
  date: { type: String },
  abn: { type: String },
  website: { type: String },
  cricosCode: { type: String },
  rtoType: { type: String },
  contactName: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  address: { type: String },
  suburb: { type: String },
  state: { type: String },
  postcode: { type: String },
}, { timestamps: true });

const RtoModel = mongoose.model('Rto', rtoSchema);

export default RtoModel;