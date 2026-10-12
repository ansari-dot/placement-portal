import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  employer: { type: String, required: true },
  industry: { type: String },
  rto: { type: String },
  location: { type: String },
  employmentType: { type: String, default: 'Full-time' }, // Full-time, Part-time, Casual, Internship
  status: { type: String, default: 'Open' }, // Open, Filled, Draft, Expired, Cancelled
  description: { type: String },
  requirements: { type: String },
  salary: { type: String },
  applicantsCount: { type: Number, default: 0 },
  postedDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
}, { timestamps: true });

const JobModel = mongoose.model('Job', jobSchema);

export default JobModel;
