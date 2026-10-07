import PaymentModel from '../model/payment.model.js';
import StudentModel from '../model/student.model.js';
import RtoModel from '../model/rto.model.js';
import { getNextSequence } from '../model/counter.model.js';
import { sendPaymentInvoiceEmail } from '../service/email.service.js';

export const CHARGEABLE_PLACEMENT_STATUSES = [
  'Appointment Scheduled',
  'Appointment Successful',
  'Student Withdraw',
  'Student Missed Appointment',
  'Placement Started',
  'Placement Completed',
];

export const THIRTY_PERCENT_STATUSES = [
  'Student Withdraw',
  'Student Missed Appointment',
];

/**
 * Helper: Resolve price & charging triggers for student based on assigned RTO and course
 */
const resolveRtoCoursePrice = (rtoDoc, student) => {
  if (!rtoDoc) {
    return {
      priceConfigured: true,
      originalPrice: 500,
      pricingError: '',
      withdrawalFeeRule: '30%',
      withdrawalFeePercentage: 30,
    };
  }

  const studentCourse = (student.courseQualification || student.courses || '').trim().toLowerCase();
  const coursePricingList = rtoDoc.coursePricing || [];

  let originalPrice = 0;

  if (studentCourse && coursePricingList.length > 0) {
    const matchedPricing = coursePricingList.find((cp) => {
      const courseName = (cp.course || '').trim().toLowerCase();
      const qualName = (cp.qualification || '').trim().toLowerCase();
      return (
        (courseName && studentCourse.includes(courseName)) ||
        (qualName && studentCourse.includes(qualName)) ||
        (courseName && courseName.includes(studentCourse)) ||
        (qualName && qualName.includes(studentCourse))
      );
    });

    if (matchedPricing && Number(matchedPricing.pricing) > 0) {
      originalPrice = Number(matchedPricing.pricing);
    }
  }

  if (!originalPrice && Number(rtoDoc.payoutRate) > 0) {
    originalPrice = Number(rtoDoc.payoutRate);
  }

  if (!originalPrice) {
    originalPrice = 500; // standard fallback
  }

  return {
    priceConfigured: true,
    originalPrice,
    pricingError: '',
    spokesperson: rtoDoc.spokesperson || rtoDoc.contactName || '',
    withdrawalFeeRule: rtoDoc.withdrawalFeeRule || '30%',
    withdrawalFeePercentage: rtoDoc.withdrawalFeePercentage ?? 30,
  };
};

let isSyncing = false;

/**
 * Helper: Sync eligible students into Payment collection safely with lock and deduplication
 */
export const syncChargeableStudents = async () => {
  if (isSyncing) return;
  isSyncing = true;

  try {
    // 0. Deduplicate any existing duplicate payment entries in DB
    const allPayments = await PaymentModel.find().sort({ updatedAt: -1 }).lean();
    const seenKeys = new Set();
    const duplicateIds = [];

    for (const p of allPayments) {
      const studentKey = p.student ? String(p.student) : (p.studentId ? String(p.studentId) : null);
      if (studentKey) {
        if (seenKeys.has(studentKey)) {
          duplicateIds.push(p._id);
        } else {
          seenKeys.add(studentKey);
        }
      }
    }

    if (duplicateIds.length > 0) {
      await PaymentModel.deleteMany({ _id: { $in: duplicateIds } });
    }

    // 1. Fetch all eligible students
    const eligibleStudents = await StudentModel.find({
      placementStatus: { $in: CHARGEABLE_PLACEMENT_STATUSES },
    }).lean();

    if (!eligibleStudents || eligibleStudents.length === 0) return;

    // 2. Fetch all RTOs to resolve pricing efficiently
    const rtos = await RtoModel.find().lean();
    const rtoMapByName = new Map();
    const rtoMapByCode = new Map();
    rtos.forEach((r) => {
      if (r.name) rtoMapByName.set(r.name.trim().toLowerCase(), r);
      if (r.code) rtoMapByCode.set(r.code.trim().toLowerCase(), r);
    });

    const existingPayments = await PaymentModel.find().lean();
    const existingPaymentMap = new Map();
    existingPayments.forEach((p) => {
      if (p.studentId) existingPaymentMap.set(String(p.studentId), p);
      if (p.student) existingPaymentMap.set(String(p.student), p);
    });

    const bulkOps = [];
    const processedKeysInLoop = new Set();

    for (const stu of eligibleStudents) {
      const stuDbId = String(stu._id || stu.id);
      const stuBizId = stu.studentId ? String(stu.studentId) : '';
      const stuName = [stu.firstName, stu.middleName, stu.lastName].filter(Boolean).join(' ');

      if (processedKeysInLoop.has(stuDbId) || (stuBizId && processedKeysInLoop.has(stuBizId))) {
        continue;
      }
      processedKeysInLoop.add(stuDbId);
      if (stuBizId) processedKeysInLoop.add(stuBizId);

      const assignedRtoName = (stu.assignedRto || '').trim();
      const matchedRto =
        rtoMapByName.get(assignedRtoName.toLowerCase()) ||
        rtoMapByCode.get(assignedRtoName.toLowerCase()) ||
        null;

      const { priceConfigured, originalPrice, pricingError, spokesperson, withdrawalFeeRule, withdrawalFeePercentage } = resolveRtoCoursePrice(matchedRto, stu);

      const isWithdrawal = THIRTY_PERCENT_STATUSES.includes(stu.placementStatus);

      let chargePercentage = 100;
      if (isWithdrawal) {
        if (withdrawalFeeRule === 'No Fee') {
          chargePercentage = 0;
        } else if (withdrawalFeeRule === 'Custom') {
          chargePercentage = withdrawalFeePercentage;
        } else {
          chargePercentage = 30;
        }
      }

      const paymentAmount = Number(((originalPrice * chargePercentage) / 100).toFixed(2));

      const existingPayment = existingPaymentMap.get(stuDbId) || (stuBizId ? existingPaymentMap.get(stuBizId) : null);

      if (existingPayment) {
        bulkOps.push({
          updateOne: {
            filter: { _id: existingPayment._id },
            update: {
              $set: {
                studentName: stuName || existingPayment.studentName,
                rto: assignedRtoName || existingPayment.rto,
                spokesperson: spokesperson || matchedRto?.contactName || existingPayment.spokesperson || '',
                course: stu.courseQualification || stu.courses || existingPayment.course,
                placementStatus: stu.placementStatus,
                chargePercentage: existingPayment.chargePercentage ?? chargePercentage,
                originalPrice,
                paymentAmount: existingPayment.chargePercentage !== undefined
                  ? Number(((originalPrice * existingPayment.chargePercentage) / 100).toFixed(2))
                  : paymentAmount,
                priceConfigured,
                pricingError,
              },
            },
          },
        });
      } else {
        bulkOps.push({
          insertOne: {
            document: {
              studentId: stuBizId || stuDbId,
              student: stu._id,
              studentName: stuName,
              rto: assignedRtoName,
              spokesperson: spokesperson || matchedRto?.contactName || '',
              course: stu.courseQualification || stu.courses || '',
              placementStatus: stu.placementStatus,
              service: 'Placement status',
              originalPrice,
              chargePercentage,
              paymentAmount,
              paymentStatus: 'Pending',
              invoiceGeneratedDate: null,
              invoiceSentDate: null,
              paymentReceivedDate: null,
              priceConfigured,
              pricingError,
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await PaymentModel.bulkWrite(bulkOps);
    }
  } finally {
    isSyncing = false;
  }
};

/**
 * GET /payments
 * Returns list of payments matching filters
 */
export const getPaymentsController = async (req, res) => {
  try {
    await syncChargeableStudents();

    const { rto, placementStatus, paymentStatus, fromDate, toDate, search } = req.query;

    const filter = {};

    if (rto && rto !== 'All') {
      filter.rto = { $regex: rto, $options: 'i' };
    }

    if (placementStatus && placementStatus !== 'All') {
      filter.placementStatus = placementStatus;
    } else {
      filter.placementStatus = { $in: CHARGEABLE_PLACEMENT_STATUSES };
    }

    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { studentName: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { rto: { $regex: q, $options: 'i' } },
        { course: { $regex: q, $options: 'i' } },
        { invoiceNumber: { $regex: q, $options: 'i' } },
      ];
    }

    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }
      filter.$or = [
        { invoiceGeneratedDate: dateFilter },
        { paymentReceivedDate: dateFilter },
        { createdAt: dateFilter },
      ];
    }

    const payments = await PaymentModel.find(filter)
      .populate('student', 'firstName lastName emailAddress phoneNumber avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('getPaymentsController error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /payments/totals
 * Calculates Total Revenue dynamically matching filters
 */
export const getPaymentTotalsController = async (req, res) => {
  try {
    await syncChargeableStudents();

    const { rto, placementStatus, paymentStatus, fromDate, toDate, search } = req.query;

    const filter = {};

    if (rto && rto !== 'All') {
      filter.rto = { $regex: rto, $options: 'i' };
    }

    if (placementStatus && placementStatus !== 'All') {
      filter.placementStatus = placementStatus;
    } else {
      filter.placementStatus = { $in: CHARGEABLE_PLACEMENT_STATUSES };
    }

    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { studentName: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { rto: { $regex: q, $options: 'i' } },
        { course: { $regex: q, $options: 'i' } },
      ];
    }

    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }
      filter.$or = [
        { invoiceGeneratedDate: dateFilter },
        { paymentReceivedDate: dateFilter },
        { createdAt: dateFilter },
      ];
    }

    const payments = await PaymentModel.find(filter).lean();

    let total100Price = 0;
    let total30Price = 0;
    let missingPricingCount = 0;

    payments.forEach((p) => {
      if (!p.priceConfigured) {
        missingPricingCount++;
      }
      if (p.chargePercentage === 100) {
        total100Price += p.paymentAmount || 0;
      } else {
        total30Price += p.paymentAmount || 0;
      }
    });

    total100Price = Number(total100Price.toFixed(2));
    total30Price = Number(total30Price.toFixed(2));
    const totalRevenue = Number((total100Price + total30Price).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        total100Price,
        total30Price,
        totalRevenue,
        totalCount: payments.length,
        missingPricingCount,
      },
    });
  } catch (error) {
    console.error('getPaymentTotalsController error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /payments/:id/status
 * Update status & pricing details of an individual payment record
 */
export const updatePaymentStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, chargePercentage, originalPrice, gstEnabled } = req.body;

    const payment = await PaymentModel.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (paymentStatus) {
      const validStatuses = ['Pending', 'Invoice Sent', '30% Received', 'Full Payment Received'];
      if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      payment.paymentStatus = paymentStatus;
    }

    if (chargePercentage !== undefined) {
      payment.chargePercentage = Number(chargePercentage);
    }

    if (originalPrice !== undefined) {
      payment.originalPrice = Number(originalPrice);
    }

    if (gstEnabled !== undefined) {
      payment.gstEnabled = Boolean(gstEnabled);
    }

    // Recalculate amounts
    const pct = payment.chargePercentage ?? 100;
    const orig = payment.originalPrice ?? 500;
    payment.paymentAmount = Number(((orig * pct) / 100).toFixed(2));

    if (payment.gstEnabled) {
      payment.gstAmount = Number((payment.paymentAmount * 0.10).toFixed(2));
    } else {
      payment.gstAmount = 0;
    }
    payment.totalAmount = Number((payment.paymentAmount + payment.gstAmount).toFixed(2));

    const now = new Date();
    if (paymentStatus === 'Invoice Sent') {
      if (!payment.invoiceGeneratedDate) payment.invoiceGeneratedDate = now;
      payment.invoiceSentDate = now;
      if (!payment.invoiceNumber) {
        const seq = await getNextSequence('invoiceNumber', 51);
        const yearSuffix = String(now.getFullYear()).slice(-2);
        payment.invoiceNumber = `WM-${seq}-${yearSuffix}`;
      }
    } else if (paymentStatus === '30% Received' || paymentStatus === 'Full Payment Received') {
      payment.paymentReceivedDate = now;
      if (!payment.invoiceGeneratedDate) payment.invoiceGeneratedDate = now;
    }

    if (req.user) {
      payment.updatedBy = req.user._id;
      payment.updatedByName = req.user.name || '';
    }

    await payment.save();

    if (paymentStatus === 'Invoice Sent') {
      sendPaymentInvoiceEmail(payment).catch((err) =>
        console.error('Single invoice email trigger error:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${payment.paymentStatus}`,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /payments/bulk-invoice
 * Bulk action: Group selected students by RTO, assign sequential invoice numbers (WM-XX-YY),
 * set individual payment percentages, calculate amounts, generate separate invoices per RTO,
 * and email each to the corresponding RTO from wasiq@mantisplacements.com.au
 */
export const bulkGenerateInvoiceController = async (req, res) => {
  try {
    const { paymentSelections, paymentIds, gstEnabled = false } = req.body;

    // Build map of paymentId -> custom chargePercentage if supplied
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
      return res.status(400).json({
        success: false,
        message: 'Please select at least one student to generate invoices.',
      });
    }

    const payments = await PaymentModel.find({ _id: { $in: targetIds } });
    if (!payments || payments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No matching payment records found.',
      });
    }

    // Group selected payments by RTO
    const rtoGroups = new Map(); // rtoName -> Array<Payment>
    for (const p of payments) {
      const rtoKey = (p.rto || 'Unassigned RTO').trim();
      if (!rtoGroups.has(rtoKey)) {
        rtoGroups.set(rtoKey, []);
      }
      rtoGroups.get(rtoKey).push(p);
    }

    const now = new Date();
    const yearSuffix = String(now.getFullYear()).slice(-2);
    const generatedInvoices = [];
    const confirmationMessages = [];

    for (const [rtoName, rtoPayments] of rtoGroups.entries()) {
      // Get unique auto-incrementing invoice number sequence for this RTO invoice
      const seq = await getNextSequence('invoiceNumber', 51);
      const invoiceNum = `WM-${seq}-${yearSuffix}`;

      // Resolve RTO spokesperson & email
      const rtoDoc = await RtoModel.findOne({ name: new RegExp('^' + rtoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).lean();
      const spokesperson = rtoDoc?.spokesperson || rtoDoc?.contactName || 'RTO Manager';
      const rtoEmail = rtoDoc?.contactEmail || '';

      let rtoSubtotal = 0;

      for (const p of rtoPayments) {
        const pIdStr = String(p._id);
        if (percentageMap.has(pIdStr)) {
          p.chargePercentage = percentageMap.get(pIdStr);
        }
        const pct = p.chargePercentage ?? 100;
        const orig = p.originalPrice || 500;
        p.paymentAmount = Number(((orig * pct) / 100).toFixed(2));
        p.gstEnabled = Boolean(gstEnabled);
        p.gstAmount = p.gstEnabled ? Number((p.paymentAmount * 0.10).toFixed(2)) : 0;
        p.totalAmount = Number((p.paymentAmount + p.gstAmount).toFixed(2));

        p.paymentStatus = 'Invoice Sent';
        p.invoiceNumber = invoiceNum;
        if (!p.invoiceGeneratedDate) p.invoiceGeneratedDate = now;
        p.invoiceSentDate = now;
        p.spokesperson = spokesperson;
        if (req.user) {
          p.updatedBy = req.user._id;
          p.updatedByName = req.user.name || '';
        }

        rtoSubtotal += p.paymentAmount;
        await p.save();
      }

      // Trigger Email send for this RTO invoice
      const sendResult = await sendPaymentInvoiceEmail({
        rtoName,
        rtoPayments,
        invoiceNumber: invoiceNum,
        spokesperson,
        rtoEmail,
        gstEnabled: Boolean(gstEnabled),
      });

      const targetEmail = rtoEmail || sendResult.recipientEmail || 'RTO inbox';
      const msg = `Your invoice ${invoiceNum} for ${rtoName} (${rtoPayments.length} student${rtoPayments.length > 1 ? 's' : ''}) has been sent successfully to ${targetEmail}.`;

      confirmationMessages.push(msg);

      generatedInvoices.push({
        rtoName,
        invoiceNumber: invoiceNum,
        studentCount: rtoPayments.length,
        subtotal: rtoSubtotal,
        recipientEmail: targetEmail,
        sent: sendResult.sent,
        message: msg,
      });
    }

    res.status(200).json({
      success: true,
      message: confirmationMessages.join('\n'),
      confirmationMessages,
      data: {
        invoicesCount: generatedInvoices.length,
        studentsCount: payments.length,
        invoices: generatedInvoices,
      },
    });
  } catch (error) {
    console.error('bulkGenerateInvoiceController error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /payments/bulk-payment-received
 * Bulk action: Mark Payment Received for selected records
 */
export const bulkPaymentReceivedController = async (req, res) => {
  try {
    const { paymentIds } = req.body;

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one student to mark payment received.',
      });
    }

    const now = new Date();
    const payments = await PaymentModel.find({ _id: { $in: paymentIds } });

    const bulkOps = payments.map((p) => {
      const targetStatus = p.chargePercentage < 100 ? '30% Received' : 'Full Payment Received';
      return {
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              paymentStatus: targetStatus,
              paymentReceivedDate: now,
              invoiceGeneratedDate: p.invoiceGeneratedDate || now,
              ...(req.user ? { updatedBy: req.user._id, updatedByName: req.user.name || '' } : {}),
            },
          },
        },
      };
    });

    if (bulkOps.length > 0) {
      await PaymentModel.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      message: `Successfully marked payment received for ${payments.length} student(s).`,
      data: { modifiedCount: payments.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
