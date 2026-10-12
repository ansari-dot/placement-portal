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
    studentType: {
      type: String,
      enum: ['RTO Student', 'Independent Student', 'Awaiting RTO Assignment'],
      default: 'RTO Student',
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
    isPriceOverridden: {
      type: Boolean,
      default: false,
    },
    defaultPlacementFee: {
      type: Number,
      default: 0,
    },
    feeOverrideReason: {
      type: String,
      trim: true,
      default: '',
    },
    feeUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    feeUpdatedAt: {
      type: Date,
      default: null,
    },
    chargePercentage: {
      type: Number,
      default: 100,
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    service: {
      type: String,
      trim: true,
      default: 'Placement status',
    },
    spokesperson: {
      type: String,
      trim: true,
      default: '',
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    gstEnabled: {
      type: Boolean,
      default: false,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Invoice Generated', 'Invoice Sent', '30% Received', 'Full Payment Received'],
      default: 'Pending',
    },
    invoiceGeneratedDate: {
      type: Date,
      default: null,
    },
    invoiceSentDate: {
      type: Date,
      default: null,
    },
    paymentDueDate: {
      type: Date,
      default: null,
    },
    paymentReceivedDate: {
      type: Date,
      default: null,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
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

paymentSchema.index({ student: 1 });
paymentSchema.index({ rto: 1, placementStatus: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ invoiceNumber: 1 });
paymentSchema.index({ createdAt: -1 });

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
