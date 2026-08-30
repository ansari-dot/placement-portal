import mongoose from 'mongoose';

const industrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  sector: { type: String, required: true },
  // Contact details
  contactPersonName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactJobTitle: { type: String },
  // Address
  address: { type: String, required: true },
  suburb: { type: String },
  state: { type: String },
  postCode: { type: String },
  country: { type: String, default: 'Australia' },
  location: { type: String },
  status: { type: String, default: 'Active' },
  students: { type: Number, default: 0 },
  jobs: { type: Number, default: 0 },
  abn: { type: String },
  website: { type: String },
  shortDescription: { type: String },
}, { timestamps: true });

const IndustryModel = mongoose.model('Industry', industrySchema);

export default IndustryModel;
