import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  studentId: { type: String, default: '' },
  studentName: { type: String, required: true },
  service: { type: String, default: 'Placement status' },
  placementFee: { type: Number, default: 0 },
  chargePercentage: { type: Number, default: 100 },
  amount: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rtoName: {
      type: String,
      default: '',
      index: true,
    },
    isIndependent: {
      type: Boolean,
      default: false,
    },
    billedTo: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    rtoSnapshot: {
      spokesperson: { type: String, default: '' },
      contactEmail: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    gstEnabled: {
      type: Boolean,
      default: false,
    },
    gstRate: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: function () {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d;
      },
    },
    paymentReceivedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Generated', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', 'Email Failed'],
      default: 'Generated',
    },
    emailStatus: {
      type: String,
      enum: ['Not Sent', 'Sent', 'Failed'],
      default: 'Not Sent',
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    recipientEmail: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdByName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

invoiceSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

const InvoiceModel = mongoose.model('Invoice', invoiceSchema);
export default InvoiceModel;
