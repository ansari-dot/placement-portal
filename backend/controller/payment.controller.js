import PaymentModel from '../model/payment.model.js';
import StudentModel from '../model/student.model.js';
import RtoModel from '../model/rto.model.js';
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
 * Helper: Resolve price for student based on assigned RTO and course
 */
const resolveRtoCoursePrice = (rtoDoc, student) => {
  if (!rtoDoc) {
    return {
      priceConfigured: true,
      originalPrice: 500,
      pricingError: '',
    };
  }

  const studentCourse = (student.courseQualification || student.courses || '').trim().toLowerCase();
  const coursePricingList = rtoDoc.coursePricing || [];

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
      return {
        priceConfigured: true,
        originalPrice: Number(matchedPricing.pricing),
        pricingError: '',
      };
    }
  }

  if (Number(rtoDoc.payoutRate) > 0) {
    return {
      priceConfigured: true,
      originalPrice: Number(rtoDoc.payoutRate),
      pricingError: '',
    };
  }

  // Fallback to standard base placement rate ($500 AUD) if custom RTO pricing has not been configured yet
  const DEFAULT_FALLBACK_PRICE = 500;
  return {
    priceConfigured: true,
    originalPrice: DEFAULT_FALLBACK_PRICE,
    pricingError: '',
  };
};

let isSyncing = false;

/**
 * Helper: Sync eligible students into Payment collection safely with lock and deduplication
 */
const syncChargeableStudents = async () => {
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

      // Prevent duplicate processing in single loop
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

      const { priceConfigured, originalPrice, pricingError } = resolveRtoCoursePrice(matchedRto, stu);

      const is30Percent = THIRTY_PERCENT_STATUSES.includes(stu.placementStatus);
      const chargePercentage = is30Percent ? 30 : 100;
      const paymentAmount = is30Percent ? Number((originalPrice * 0.3).toFixed(2)) : originalPrice;

      const existingPayment = existingPaymentMap.get(stuDbId) || (stuBizId ? existingPaymentMap.get(stuBizId) : null);

      if (existingPayment) {
        // Update fields if placementStatus or pricing changed
        bulkOps.push({
          updateOne: {
            filter: { _id: existingPayment._id },
            update: {
              $set: {
                studentName: stuName || existingPayment.studentName,
                rto: assignedRtoName || existingPayment.rto,
                course: stu.courseQualification || stu.courses || existingPayment.course,
                placementStatus: stu.placementStatus,
                chargePercentage,
                originalPrice,
                paymentAmount,
                priceConfigured,
                pricingError,
              },
            },
          },
        });
      } else {
        // Insert new payment record with Pending status
        bulkOps.push({
          insertOne: {
            document: {
              studentId: stuBizId || stuDbId,
              student: stu._id,
              studentName: stuName,
              rto: assignedRtoName,
              course: stu.courseQualification || stu.courses || '',
              placementStatus: stu.placementStatus,
              originalPrice,
              chargePercentage,
              paymentAmount,
              paymentStatus: 'Pending',
              invoiceGeneratedDate: null,
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
    // Synchronize latest student placement status & prices into Payment collection
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
      // Apply date filter against invoiceGeneratedDate, paymentReceivedDate, or createdAt
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
 * Calculates Total 100% Price, Total 30% Price, and Total Revenue dynamically matching filters
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
      } else if (p.chargePercentage === 30) {
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
 * Update status of an individual payment record
 */
export const updatePaymentStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validStatuses = ['Pending', 'Invoice Sent', '30% Received', 'Full Payment Received'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const payment = await PaymentModel.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    payment.paymentStatus = paymentStatus;

    if (paymentStatus === 'Invoice Sent') {
      payment.invoiceGeneratedDate = new Date();
    } else if (paymentStatus === '30% Received' || paymentStatus === 'Full Payment Received') {
      payment.paymentReceivedDate = new Date();
      if (!payment.invoiceGeneratedDate) {
        payment.invoiceGeneratedDate = new Date();
      }
    }

    if (req.user) {
      payment.updatedBy = req.user._id;
      payment.updatedByName = req.user.name || '';
    }

    await payment.save();

    // Trigger Tax Invoice email & in-app notification if status is Invoice Sent
    if (paymentStatus === 'Invoice Sent') {
      sendPaymentInvoiceEmail(payment).catch((err) =>
        console.error('Single invoice email trigger error:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /payments/bulk-invoice
 * Bulk action: Generate Invoice for selected/matching records
 */
export const bulkGenerateInvoiceController = async (req, res) => {
  try {
    const { paymentIds } = req.body;

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one student to generate invoices.',
      });
    }

    const now = new Date();
    const result = await PaymentModel.updateMany(
      { _id: { $in: paymentIds } },
      {
        $set: {
          paymentStatus: 'Invoice Sent',
          invoiceGeneratedDate: now,
          ...(req.user ? { updatedBy: req.user._id, updatedByName: req.user.name || '' } : {}),
        },
      }
    );

    // Trigger Tax Invoice email & in-app notifications for all updated records
    const updatedPayments = await PaymentModel.find({ _id: { $in: paymentIds } });
    updatedPayments.forEach((p) => {
      sendPaymentInvoiceEmail(p).catch((err) =>
        console.error('Bulk invoice email trigger error:', err)
      );
    });

    res.status(200).json({
      success: true,
      message: `Successfully generated/sent invoices for ${result.modifiedCount} student(s).`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /payments/bulk-payment-received
 * Bulk action: Mark Payment Received for selected records
 * Automatically sets 30% Received for 30% charge students and Full Payment Received for 100% charge students
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
      const targetStatus = p.chargePercentage === 30 ? '30% Received' : 'Full Payment Received';
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
