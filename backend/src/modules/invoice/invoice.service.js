import InvoiceModel from './invoice.model.js';
import PaymentModel from '../payment/payment.model.js';
import StudentModel from '../student/student.model.js';
import RtoModel from '../rto/rto.model.js';
import { getNextSequence } from '../invoice/counter.model.js';
import { sendPaymentInvoiceEmail } from '../email/email.service.js';
import { generateInvoicePDFBuffer } from './invoicePdf.service.js';
import {
  BadRequestError,
  NotFoundError,
} from '../../core/errors/AppError.js';
import logger from '../../core/utils/logger.js';

export class InvoiceService {
  /**
   * Bulk action: Group selected payments by RTO (or individual student for Independent),
   * calculate amounts with optional GST, persist invoice records, and send email.
   */
  static async bulkGenerateInvoice({ paymentSelections, paymentIds, gstEnabled = false }, currentUser = null) {
    const percentageMap = new Map();
    let targetIds = [];

    if (Array.isArray(paymentSelections) && paymentSelections.length > 0) {
      paymentSelections.forEach((item) => {
        const id = item.paymentId || item.id || item._id;
        if (id) {
          targetIds.push(String(id));
          if (item.chargePercentage !== undefined) {
            percentageMap.set(String(id), Number(item.chargePercentage));
          }
        }
      });
    } else if (Array.isArray(paymentIds) && paymentIds.length > 0) {
      targetIds = paymentIds.map(String);
    }

    if (targetIds.length === 0) {
      throw new BadRequestError('Please select at least one student to generate invoices.');
    }

    const payments = await PaymentModel.find({ _id: { $in: targetIds } });
    if (!payments || payments.length === 0) {
      throw new BadRequestError('No matching payment records found.');
    }

    // Pre-validate: Verify that missing/unconfigured pricing cannot silently create finalized invoices
    const unconfiguredPayments = payments.filter(
      (p) => (!p.originalPrice || p.originalPrice <= 0) && !p.isPriceOverridden
    );
    if (unconfiguredPayments.length > 0) {
      const studentNames = unconfiguredPayments.map((p) => p.studentName || p.studentId).join(', ');
      throw new BadRequestError(
        `Cannot generate invoice: pricing is not configured for the following student(s): ${studentNames}. Please configure RTO course pricing or apply an authorized fee override before generating an invoice.`
      );
    }

    // Group selected payments:
    // Regular RTO students are grouped by RTO name.
    // Independent students are billed individually directly to the student.
    const invoiceGroups = [];
    const rtoGroups = new Map();

    for (const p of payments) {
      const isInd = p.studentType === 'Independent Student' || (p.rto || '').trim() === 'Independent Student';
      if (isInd) {
        invoiceGroups.push({
          isIndependent: true,
          rtoName: 'Independent Student',
          payments: [p],
        });
      } else {
        const rtoKey = (p.rto || 'Unassigned RTO').trim();
        if (!rtoGroups.has(rtoKey)) {
          rtoGroups.set(rtoKey, []);
        }
        rtoGroups.get(rtoKey).push(p);
      }
    }

    for (const [rtoName, rtoPayments] of rtoGroups.entries()) {
      invoiceGroups.push({
        isIndependent: false,
        rtoName,
        payments: rtoPayments,
      });
    }

    const now = new Date();
    const yearSuffix = String(now.getFullYear()).slice(-2);
    const generatedInvoices = [];
    const confirmationMessages = [];

    for (const group of invoiceGroups) {
      const { isIndependent, rtoName, payments: rtoPayments } = group;
      const seq = await getNextSequence('invoiceNumber', 51);
      const invoiceNum = `WM-${seq}-${yearSuffix}`;

      let spokesperson = '';
      let rtoEmail = '';
      let billedTo = { name: '', email: '', phone: '', address: '' };

      if (isIndependent) {
        const p = rtoPayments[0];
        let stuDoc = null;
        if (p.student) {
          stuDoc = await StudentModel.findById(p.student).lean();
        } else if (p.studentId) {
          stuDoc = await StudentModel.findOne({ studentId: p.studentId }).lean();
        }

        spokesperson = p.studentName;
        rtoEmail = stuDoc?.emailAddress || stuDoc?.email || '';
        billedTo = {
          name: p.studentName,
          email: rtoEmail,
          phone: stuDoc?.phoneNumber || stuDoc?.phone || '',
          address: stuDoc?.address || [stuDoc?.suburb, stuDoc?.state].filter(Boolean).join(', ') || '',
        };
      } else {
        const rtoDoc = await RtoModel.findOne({
          name: new RegExp('^' + rtoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
        }).lean();
        spokesperson = rtoDoc?.spokesperson || rtoDoc?.contactName || rtoDoc?.name || rtoName;
        rtoEmail = rtoDoc?.contactEmail || '';
        billedTo = {
          name: spokesperson,
          email: rtoEmail,
          phone: rtoDoc?.contactPhone || '',
          address: rtoDoc?.address || '',
        };
      }

      let rtoSubtotal = 0;
      const invoiceItems = [];

      for (const p of rtoPayments) {
        const pIdStr = String(p._id);
        if (percentageMap.has(pIdStr)) {
          p.chargePercentage = percentageMap.get(pIdStr);
        }
        const pct = p.chargePercentage ?? 100;
        const orig = p.originalPrice;
        p.paymentAmount = Number(((orig * pct) / 100).toFixed(2));
        p.gstEnabled = Boolean(gstEnabled);
        p.gstAmount = p.gstEnabled ? Number((p.paymentAmount * 0.10).toFixed(2)) : 0;
        p.totalAmount = Number((p.paymentAmount + p.gstAmount).toFixed(2));

        p.paymentStatus = 'Invoice Generated';
        p.invoiceNumber = invoiceNum;
        if (!p.invoiceGeneratedDate) p.invoiceGeneratedDate = now;
        p.invoiceSentDate = now;
        p.spokesperson = spokesperson;
        if (currentUser) {
          p.updatedBy = currentUser._id;
          p.updatedByName = currentUser.name || '';
        }

        rtoSubtotal += p.paymentAmount;
        await p.save();

        invoiceItems.push({
          paymentId: p._id,
          studentId: p.studentId || '',
          studentName: p.studentName,
          service: p.service || 'Placement status',
          placementFee: orig,
          chargePercentage: pct,
          amount: p.paymentAmount,
        });
      }

      const gstAmt = gstEnabled ? Number((rtoSubtotal * 0.10).toFixed(2)) : 0;
      const totalAmt = Number((rtoSubtotal + gstAmt).toFixed(2));

      const sendResult = await sendPaymentInvoiceEmail({
        isIndependent,
        rtoName,
        rtoPayments,
        invoiceNumber: invoiceNum,
        spokesperson,
        rtoEmail,
        studentEmail: isIndependent ? rtoEmail : '',
        billedTo,
        gstEnabled: Boolean(gstEnabled),
      });

      try {
        await InvoiceModel.findOneAndUpdate(
          { invoiceNumber: invoiceNum },
          {
            $set: {
              invoiceNumber: invoiceNum,
              rtoName,
              isIndependent,
              billedTo,
              rtoSnapshot: {
                spokesperson,
                contactEmail: rtoEmail,
                contactPhone: billedTo.phone || '',
                address: billedTo.address || '',
              },
              items: invoiceItems,
              subtotal: rtoSubtotal,
              gstEnabled: Boolean(gstEnabled),
              gstRate: gstEnabled ? 10 : 0,
              gstAmount: gstAmt,
              totalAmount: totalAmt,
              amountPaid: 0,
              outstandingBalance: totalAmt,
              invoiceDate: now,
              status: sendResult.sent ? 'Sent' : 'Email Failed',
              emailStatus: sendResult.sent ? 'Sent' : 'Failed',
              emailSentAt: sendResult.sent ? now : null,
              recipientEmail: rtoEmail || sendResult.recipientEmail || '',
              createdBy: currentUser?._id || null,
              createdByName: currentUser?.name || '',
            },
          },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (invErr) {
        logger.warn(`[InvoiceModel] Snapshot save error: ${invErr.message}`);
      }

      const displayName = isIndependent ? `${rtoPayments[0]?.studentName} (Independent Student)` : rtoName;
      const targetEmail = rtoEmail || sendResult.recipientEmail || (isIndependent ? 'Student inbox' : 'RTO inbox');
      const msg = sendResult.sent
        ? `Your invoice ${invoiceNum} for ${displayName} (${rtoPayments.length} student${rtoPayments.length > 1 ? 's' : ''}) has been sent successfully to ${targetEmail}.`
        : `Invoice ${invoiceNum} generated for ${displayName}, but email could not be sent to ${targetEmail}. Retry available.`;

      confirmationMessages.push(msg);

      generatedInvoices.push({
        rtoName: displayName,
        invoiceNumber: invoiceNum,
        studentCount: rtoPayments.length,
        subtotal: rtoSubtotal,
        gstAmount: gstAmt,
        totalAmount: totalAmt,
        recipientEmail: targetEmail,
        sent: sendResult.sent,
        message: msg,
      });
    }

    return {
      confirmationMessages,
      invoicesCount: generatedInvoices.length,
      studentsCount: payments.length,
      invoices: generatedInvoices,
    };
  }

  /**
   * Generate PDF buffer for invoice download
   */
  static async getInvoicePDFBuffer(invoiceNumber) {
    let invoice = await InvoiceModel.findOne({ invoiceNumber }).lean();

    if (!invoice) {
      const payments = await PaymentModel.find({ invoiceNumber }).lean();
      if (!payments || payments.length === 0) {
        throw new NotFoundError('Invoice record not found.');
      }

      const first = payments[0];
      const items = payments.map((p) => ({
        studentName: p.studentName,
        service: p.service || 'Placement status',
        amount: p.paymentAmount || 0,
        chargePercentage: p.chargePercentage ?? 100,
      }));

      const subtotal = items.reduce((s, i) => s + i.amount, 0);
      const gstEnabled = Boolean(first.gstEnabled);
      const gstAmount = gstEnabled ? Number((subtotal * 0.10).toFixed(2)) : 0;

      invoice = {
        invoiceNumber: first.invoiceNumber,
        rtoName: first.rto,
        rtoSnapshot: { spokesperson: first.spokesperson },
        items,
        subtotal,
        gstEnabled,
        gstAmount,
        totalAmount: subtotal + gstAmount,
        invoiceDate: first.invoiceGeneratedDate || new Date(),
      };
    }

    return generateInvoicePDFBuffer(invoice);
  }

  /**
   * Retry sending invoice email
   */
  static async retrySendInvoiceEmail(invoiceNumber) {
    const payments = await PaymentModel.find({ invoiceNumber });

    if (!payments || payments.length === 0) {
      throw new NotFoundError('Invoice not found.');
    }

    const first = payments[0];
    const rtoName = first.rto || 'RTO';
    const rtoDoc = await RtoModel.findOne({
      name: new RegExp('^' + rtoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    }).lean();
    const rtoEmail = rtoDoc?.contactEmail || '';
    const spokesperson = first.spokesperson || rtoDoc?.contactName || 'RTO Manager';

    const sendResult = await sendPaymentInvoiceEmail({
      rtoName,
      rtoPayments: payments,
      invoiceNumber,
      spokesperson,
      rtoEmail,
      gstEnabled: Boolean(first.gstEnabled),
    });

    const now = new Date();
    await InvoiceModel.updateOne(
      { invoiceNumber },
      {
        $set: {
          status: sendResult.sent ? 'Sent' : 'Email Failed',
          emailStatus: sendResult.sent ? 'Sent' : 'Failed',
          emailSentAt: sendResult.sent ? now : null,
          recipientEmail: rtoEmail || sendResult.recipientEmail || '',
        },
      }
    );

    return sendResult;
  }

  /**
   * Fetch invoice details by number
   */
  static async getInvoiceByNumber(invoiceNumber) {
    const invoice = await InvoiceModel.findOne({ invoiceNumber }).lean();
    if (!invoice) {
      throw new NotFoundError(`Invoice ${invoiceNumber} not found.`);
    }
    return invoice;
  }

  /**
   * List all generated invoices with pagination & status filters
   */
  static async getAllInvoices({ search, status, page = 1, limit = 50 }) {
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { rtoName: { $regex: search, $options: 'i' } },
        { 'billedTo.name': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);

    const [invoices, total] = await Promise.all([
      InvoiceModel.find(query).sort({ invoiceDate: -1, createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      InvoiceModel.countDocuments(query),
    ]);

    return {
      invoices,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}
