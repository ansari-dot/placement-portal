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
  // Placement contacts are random by default; formal partnerships are onboarded separately.
  // New records are classified explicitly by their creation flow. Leave legacy
  // records unclassified until their existing data provides a reliable type.
  industryCategory: { type: String, enum: ['Random', 'Partner'], index: true },
  onboardedByName: { type: String, trim: true, default: '' },
  onboardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  partnershipInfo: { type: String, trim: true, default: '' },
  documents: [{ name: { type: String, trim: true }, url: { type: String, trim: true }, file: { type: String }, fileName: { type: String, trim: true }, size: { type: String, trim: true }, uploadDate: { type: String, trim: true } }],
  // Ownership — which user created / is credited with this industry.
  // Optional so all pre-existing documents remain valid with no migration needed.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const IndustryModel = mongoose.model('Industry', industrySchema);

export default IndustryModel;
