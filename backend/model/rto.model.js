import mongoose from 'mongoose';

const rtoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: '' }, // Optional code
  loc: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  students: { type: Number, default: 0 },
  date: { type: String, default: '' },
  abn: { type: String, default: '' },
  acn: { type: String, default: '' },
  website: { type: String, default: '' },
  yearEstablished: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  
  // Payment Cycle / Invoice Period (Appointment, Placement, 15 Days)
  paymentCycle: { 
    type: String, 
    enum: ['Appointment', 'Placement', '15 Days', ''], 
    default: 'Placement' 
  },
  
  // General Base Payout Rate
  payoutRate: { type: Number, default: 0 },
  
  // Course & Qualification specific pricing
  coursePricing: [
    {
      course: { type: String, default: '' },
      qualification: { type: String, default: '' },
      pricing: { type: Number, default: 0 },
      notes: { type: String, default: '' },
    }
  ],
  
  // Dynamic Documents & Media
  logo: { type: String, default: '' },
  registrationCertificate: { type: String, default: '' },
  registrationCertificateName: { type: String, default: '' },
  documents: [
    {
      name: { type: String, default: '' },
      file: { type: String, default: '' },
      size: { type: String, default: '' },
      uploadDate: { type: String, default: '' },
    }
  ],
  
  // Contact Details
  contactName: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactTitle: { type: String, default: '' },
  contactDepartment: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactWhatsapp: { type: String, default: '' },
  contactMobile: { type: String, default: '' },
  contactFax: { type: String, default: '' },
  
  // Address & Location
  address: { type: String, default: '' },
  addressLine2: { type: String, default: '' },
  suburb: { type: String, default: '' },
  state: { type: String, default: '' },
  postcode: { type: String, default: '' },
  country: { type: String, default: 'Australia' },
  
  // Partnership Details
  partnershipSince: { type: String, default: '' },
  registrationNumber: { type: String, default: '' },
  issuingAuthority: { type: String, default: '' },

  // Live Presence & Activity Status
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

const RtoModel = mongoose.model('Rto', rtoSchema);

export default RtoModel;