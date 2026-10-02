import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rto: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    placementStatus: {
      type: String,
      required: true,
      trim: true,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    chargePercentage: {
      type: Number,
      enum: [100, 30],
      default: 100,
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Invoice Sent', '30% Received', 'Full Payment Received'],
      default: 'Pending',
    },
    invoiceGeneratedDate: {
      type: Date,
      default: null,
    },
    paymentReceivedDate: {
      type: Date,
      default: null,
    },
    priceConfigured: {
      type: Boolean,
      default: true,
    },
    pricingError: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedByName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

paymentSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

const PaymentModel = mongoose.model('Payment', paymentSchema);
export default PaymentModel;
