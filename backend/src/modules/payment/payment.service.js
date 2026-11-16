import mongoose from 'mongoose';
import PaymentModel from './payment.model.js';
import StudentModel from '../student/student.model.js';
import RtoModel from '../rto/rto.model.js';
import { getNextSequence } from '../invoice/counter.model.js';
import { sendPaymentInvoiceEmail } from '../email/email.service.js';
import { acquireDistributedLock, releaseDistributedLock } from '../../core/utils/distributedLock.js';
import { BadRequestError, NotFoundError } from '../../core/errors/AppError.js';
import logger from '../../core/utils/logger.js';
import { InvoiceService } from '../invoice/invoice.service.js';

export const CHARGEABLE_PLACEMENT_STATUSES = [
  'Appointment Scheduled',
  'Appointment Successful',
  'Student Withdraw',
  'Withdrawn',
  'Student Missed Appointment',
  'No Show',
  'Not Suitable Site',
  'Placement Started',
  'Placement Completed',
  'Waiting to Join',
  'Joined',
  'Active',
  'Completed',
  'Confirmed',
];

export const THIRTY_PERCENT_STATUSES = [
  'Student Withdraw',
  'Withdrawn',
  'Student Missed Appointment',
  'No Show',
  'Not Suitable Site',
];

/**
 * Resolve price & charging triggers for student based on assigned RTO and course
 */
export const resolveRtoCoursePrice = (rtoDoc, student = {}) => {
  if (!rtoDoc) {
    return {
      priceConfigured: false,
      originalPrice: 0,
      pricingError: 'RTO profile not found or not assigned',
      spokesperson: '',
      withdrawalFeeRule: '30%',
      withdrawalFeePercentage: 30,
    };
  }

  const studentCourse = (student?.courseQualification || student?.courses || '').trim().toLowerCase();
  const coursePricingList = rtoDoc.coursePricing || [];

  let originalPrice = 0;
  let pricingError = '';

  if (coursePricingList.length > 0) {
    if (studentCourse) {
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
    if (!studentCourse && !originalPrice && Number(rtoDoc.payoutRate) > 0) {
      originalPrice = Number(rtoDoc.payoutRate);
    }
    if (!studentCourse && !originalPrice && coursePricingList.length === 1 && Number(coursePricingList[0].pricing) > 0) {
      originalPrice = Number(coursePricingList[0].pricing);
    }
    if (!originalPrice) {
      pricingError = 'No matching pricing found for qualification in RTO course pricing schedule';
    }
  } else if (Number(rtoDoc.payoutRate) > 0) {
    originalPrice = Number(rtoDoc.payoutRate);
  }

  const priceConfigured = originalPrice > 0;
  if (priceConfigured) {
    pricingError = '';
  } else if (!pricingError) {
    pricingError = 'No pricing configured for course in RTO profile';
  }

  return {
    priceConfigured,
    originalPrice,
    pricingError,
    spokesperson: rtoDoc.spokesperson || rtoDoc.contactName || '',
    withdrawalFeeRule: rtoDoc.withdrawalFeeRule || '30%',
    withdrawalFeePercentage: rtoDoc.withdrawalFeePercentage ?? 30,
  };
};

const SYNC_LOCK_KEY = 'sync_chargeable_students';

/**
 * Helper: Sync eligible students into Payment collection safely with distributed lock and deduplication
 */
export const syncChargeableStudents = async () => {
  const lockAcquired = await acquireDistributedLock(SYNC_LOCK_KEY, 60000);
  if (!lockAcquired) {
    logger.debug('[SyncPayments] Sync already in progress, skipping overlapping execution.');
    return;
  }

  try {
    // 0. Deduplicate duplicate payment entries & purge orphaned payment records for deleted students
    const [allPayments, existingStudents] = await Promise.all([
      PaymentModel.find().sort({ updatedAt: -1 }).lean(),
      StudentModel.find({}, { _id: 1, studentId: 1 }).lean(),
    ]);

    const validStudentKeys = new Set();
    existingStudents.forEach((stu) => {
      if (stu._id) validStudentKeys.add(String(stu._id));
      if (stu.studentId) validStudentKeys.add(String(stu.studentId));
    });

    const seenKeys = new Set();
    const idsToRemove = [];

    for (const p of allPayments) {
      const studentDbId = p.student ? String(p.student) : null;
      const studentBizId = p.studentId ? String(p.studentId) : null;

      const isStudentValid =
        (studentDbId && validStudentKeys.has(studentDbId)) ||
        (studentBizId && validStudentKeys.has(studentBizId));

      if (!isStudentValid) {
        idsToRemove.push(p._id);
      } else {
        const studentKey = studentDbId || studentBizId;
        if (seenKeys.has(studentKey)) {
          idsToRemove.push(p._id);
        } else {
          seenKeys.add(studentKey);
        }
      }
    }

    if (idsToRemove.length > 0) {
      await PaymentModel.deleteMany({ _id: { $in: idsToRemove } });
    }

    // 1. Auto-sync / derive student placementStatus from live Workflow & Appointment/Internship models
    let requestsByStudent = new Map();
    const chargeableFromEventsDbIds = [];
    const chargeableFromEventsBizIds = [];
    try {
      const workflowModule = await import('../workflow/workflow.model.js');
      const WorkflowModel = workflowModule.default;
      const AppointmentModel = workflowModule.AppointmentModel;
      const InternshipModel = workflowModule.InternshipModel;

      const [workflows, standaloneAppts, standaloneInts, allStudents] = await Promise.all([
        WorkflowModel.find({}, { requests: 1, appointments: 1, internships: 1 }).lean(),
        AppointmentModel.find().lean(),
        InternshipModel.find().lean(),
        StudentModel.find(
          {},
          {
            _id: 1,
            studentId: 1,
            firstName: 1,
            lastName: 1,
            assignedRto: 1,
            courseQualification: 1,
            courses: 1,
            placementStatus: 1,
            studentType: 1,
            independentFee: 1,
            snoozed: 1,
            internshipPriority: 1,
            status: 1,
          }
        ).lean(),
      ]);

      const allWorkflowAppts = [
        ...workflows.flatMap((wf) => wf.appointments || []),
        ...standaloneAppts,
      ];
      const allWorkflowInts = [
        ...workflows.flatMap((wf) => wf.internships || []),
        ...standaloneInts,
      ];
      const allWorkflowRequests = workflows.flatMap((wf) => wf.requests || []);

      allWorkflowRequests.forEach((r) => {
        const keys = [
          r.studentId ? String(r.studentId).trim() : null,
          r._id ? String(r._id).trim() : null,
          r.student ? String(r.student).trim().toLowerCase() : null,
        ].filter(Boolean);
        keys.forEach((k) => {
          if (!requestsByStudent.has(k)) requestsByStudent.set(k, []);
          requestsByStudent.get(k).push(r);
        });
      });

      const apptsByStudent = new Map();
      allWorkflowAppts.forEach((a) => {
        const keys = [
          a.studentId ? String(a.studentId).trim() : null,
          a._id ? String(a._id).trim() : null,
          a.student ? String(a.student).trim().toLowerCase() : null,
        ].filter(Boolean);
        keys.forEach((k) => {
          if (!apptsByStudent.has(k)) apptsByStudent.set(k, []);
          apptsByStudent.get(k).push(a);
        });
      });

      const intsByStudent = new Map();
      allWorkflowInts.forEach((i) => {
        const keys = [
          i.studentId ? String(i.studentId).trim() : null,
          i._id ? String(i._id).trim() : null,
          i.student ? String(i.student).trim().toLowerCase() : null,
        ].filter(Boolean);
        keys.forEach((k) => {
          if (!intsByStudent.has(k)) intsByStudent.set(k, []);
          intsByStudent.get(k).push(i);
        });
      });

      const statusSyncOps = [];

      for (const stu of allStudents) {
        const keyId = String(stu.studentId || '').trim();
        const keyMongo = String(stu._id || '').trim();
        const fullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim().toLowerCase();
        const keyName = String(stu.name || fullName).trim().toLowerCase();

        const studentReqs = [
          ...(keyId ? (requestsByStudent.get(keyId) || []) : []),
          ...(keyMongo ? (requestsByStudent.get(keyMongo) || []) : []),
          ...(keyName ? (requestsByStudent.get(keyName) || []) : []),
          ...(fullName ? (requestsByStudent.get(fullName) || []) : []),
        ];
        const hasSnoozeReq = studentReqs.some((r) => r.priority === 'Snooze');
        const hasInactiveReq = studentReqs.some((r) => r.priority === 'Inactive');
        const isSnoozedOrInactive =
          stu.snoozed === true ||
          stu.internshipPriority === 'Snooze' ||
          stu.internshipPriority === 'Inactive' ||
          stu.status === 'Inactive' ||
          hasSnoozeReq ||
          hasInactiveReq;

        const studentAppts = [
          ...(keyId ? (apptsByStudent.get(keyId) || []) : []),
          ...(keyMongo ? (apptsByStudent.get(keyMongo) || []) : []),
          ...(keyName ? (apptsByStudent.get(keyName) || []) : []),
          ...(fullName ? (apptsByStudent.get(fullName) || []) : []),
        ];
        const studentInts = [
          ...(keyId ? (intsByStudent.get(keyId) || []) : []),
          ...(keyMongo ? (intsByStudent.get(keyMongo) || []) : []),
          ...(keyName ? (intsByStudent.get(keyName) || []) : []),
          ...(fullName ? (intsByStudent.get(fullName) || []) : []),
        ];

        let derivedStatus = null;

        if (
          studentInts.some((i) => ['Completed', 'Placement Completed'].includes(i.status)) ||
          studentAppts.some((a) => ['Completed', 'Placement Completed'].includes(a.status))
        ) {
          derivedStatus = 'Placement Completed';
        } else if (
          studentInts.some((i) =>
            ['Active', 'Joined', 'Waiting to Join', 'Placement Started', 'Confirmed'].includes(i.status)
          )
        ) {
          derivedStatus = 'Placement Started';
        } else if (
          studentAppts.some(
            (a) =>
              ['Successful', 'Appointment Successful'].includes(a.status) ||
              a.appointmentOutcome === 'completed' ||
              a.appointmentOutcome === 'successful'
          )
        ) {
          derivedStatus = 'Appointment Successful';
        } else if (studentAppts.some((a) => ['Scheduled', 'Rescheduled'].includes(a.status))) {
          derivedStatus = 'Appointment Scheduled';
        } else if (
          studentAppts.some(
            (a) =>
              ['Student Withdraw', 'Withdrawn'].includes(a.status) ||
              a.appointmentOutcome === 'student_withdrawal'
          )
        ) {
          derivedStatus = 'Student Withdraw';
        } else if (
          studentAppts.some(
            (a) =>
              ['Student Missed Appointment', 'No Show'].includes(a.status) ||
              a.appointmentOutcome === 'student_missed'
          )
        ) {
          derivedStatus = 'Student Missed Appointment';
        } else if (
          studentAppts.some(
            (a) => a.status === 'Not Suitable Site' || a.appointmentOutcome === 'not_suitable_site'
          )
        ) {
          derivedStatus = 'Not Suitable Site';
        }

        // Track students who had a successful appointment or reached placement even if later snoozed or inactive
        const hadSuccessfulApptOrPlacement =
          studentInts.length > 0 ||
          studentAppts.some(
            (a) =>
              ['Successful', 'Appointment Successful', 'Confirmed', 'Completed', 'Placement Completed', 'Placement Started', 'Active', 'Joined', 'Waiting to Join'].includes(a.status) ||
              a.appointmentOutcome === 'successful' ||
              a.appointmentOutcome === 'completed'
          );
        if (hadSuccessfulApptOrPlacement) {
          chargeableFromEventsDbIds.push(stu._id);
          if (keyId) chargeableFromEventsBizIds.push(keyId);
        }

        if (!isSnoozedOrInactive && derivedStatus && stu.placementStatus !== derivedStatus) {
          statusSyncOps.push({
            updateOne: {
              filter: { _id: stu._id },
              update: { $set: { placementStatus: derivedStatus } },
            },
          });
        }
      }

      if (statusSyncOps.length > 0) {
        await StudentModel.bulkWrite(statusSyncOps);
      }
    } catch (syncErr) {
      logger.warn(`[SyncPayments] Dynamic status sync skipped: ${syncErr.message}`);
    }

    // 2. Fetch all eligible students (chargeable placement status OR students with existing payment records OR students who had successful appointment)
    const existingPaymentStudentIds = allPayments.map((p) => p.student).filter(Boolean);
    const existingPaymentStudentBizIds = allPayments.map((p) => p.studentId).filter(Boolean);
    const eligibleStudents = await StudentModel.find({
      $or: [
        {
          placementStatus: { $in: CHARGEABLE_PLACEMENT_STATUSES },
          status: { $ne: 'Inactive' },
          snoozed: { $ne: true },
          internshipPriority: { $nin: ['Inactive', 'Snooze'] },
        },
        { _id: { $in: [...existingPaymentStudentIds, ...chargeableFromEventsDbIds] } },
        { studentId: { $in: [...existingPaymentStudentBizIds, ...chargeableFromEventsBizIds] } },
      ],
    }).lean();

    if (!eligibleStudents || eligibleStudents.length === 0) return;

    // 2a. Repair students whose assignedRto was wiped — recover from payment record or rtoId
    const repairCandidates = eligibleStudents.filter(s => !s.assignedRto);
    if (repairCandidates.length > 0) {
      const allRtosForRepair = await RtoModel.find({}, { _id: 1, name: 1 }).lean();
      const rtoIdToName = new Map(allRtosForRepair.map(r => [String(r._id), r.name]));
      const existingPaymentsForRepair = await PaymentModel.find(
        { student: { $in: repairCandidates.map(s => s._id) } },
        { student: 1, rto: 1 }
      ).lean();
      const paymentRtoByStudent = new Map(
        existingPaymentsForRepair
          .filter(p => p.rto && p.rto !== 'Independent Student')
          .map(p => [String(p.student), p.rto])
      );
      const repairOps = [];
      repairCandidates.forEach(s => {
        const rtoName = (s.rtoId && rtoIdToName.get(String(s.rtoId)))
          || paymentRtoByStudent.get(String(s._id));
        if (rtoName) {
          repairOps.push({
            updateOne: {
              filter: { _id: s._id },
              update: { $set: { assignedRto: rtoName, studentType: 'RTO Student' } },
            },
          });
          s.assignedRto = rtoName;
          s.studentType = 'RTO Student';
        }
      });
      if (repairOps.length > 0) await StudentModel.bulkWrite(repairOps);
    }

    // 3. Fetch all RTOs to resolve pricing efficiently
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

    const mapCanonicalStatus = (status) => {
      if (!status) return 'Placement Started';
      if (['Completed', 'Placement Completed'].includes(status)) return 'Placement Completed';
      if (['Active', 'Joined', 'Waiting to Join', 'Placement Started', 'Confirmed'].includes(status))
        return 'Placement Started';
      if (['Appointment Successful'].includes(status)) return 'Appointment Successful';
      if (['Appointment Scheduled', 'Scheduled'].includes(status)) return 'Appointment Scheduled';
      if (['Student Withdraw', 'Withdrawn'].includes(status)) return 'Student Withdraw';
      if (['Student Missed Appointment', 'No Show'].includes(status)) return 'Student Missed Appointment';
      if (['Not Suitable Site'].includes(status)) return 'Not Suitable Site';
      if (['Snooze', 'Snoozed'].includes(status)) return 'Snooze';
      if (['Inactive'].includes(status)) return 'Inactive';
      return status;
    };

    for (const stu of eligibleStudents) {
      const stuDbId = String(stu._id || stu.id);
      const stuBizId = stu.studentId ? String(stu.studentId) : '';
      const stuName =
        [stu.firstName, stu.middleName, stu.lastName].filter(Boolean).join(' ') || stu.name || 'Student';

      if (processedKeysInLoop.has(stuDbId) || (stuBizId && processedKeysInLoop.has(stuBizId))) {
        continue;
      }
      processedKeysInLoop.add(stuDbId);
      if (stuBizId) processedKeysInLoop.add(stuBizId);

      const isIndependentStudent = stu.studentType === 'Independent Student';
      const assignedRtoName = isIndependentStudent ? 'Independent Student' : (stu.assignedRto || '').trim();
      const matchedRto = isIndependentStudent
        ? null
        : rtoMapByName.get(assignedRtoName.toLowerCase()) ||
        rtoMapByCode.get(assignedRtoName.toLowerCase()) ||
        null;

      let priceConfigured = false;
      let originalPrice = 0;
      let pricingError = '';
      let spokesperson = '';
      let withdrawalFeeRule = '30%';
      let withdrawalFeePercentage = 30;

      if (isIndependentStudent) {
        const indFee = stu.independentFee != null ? Number(stu.independentFee) : null;
        if (indFee !== null && indFee > 0) {
          priceConfigured = true;
          originalPrice = indFee;
          pricingError = '';
        } else {
          priceConfigured = false;
          originalPrice = 0;
          pricingError = 'No placement fee entered for Independent Student';
        }
        spokesperson = stuName;
      } else {
        const pricingRes = resolveRtoCoursePrice(matchedRto, stu);
        priceConfigured = pricingRes.priceConfigured;
        originalPrice = pricingRes.originalPrice;
        pricingError = pricingRes.pricingError;
        spokesperson = pricingRes.spokesperson;
        withdrawalFeeRule = pricingRes.withdrawalFeeRule;
        withdrawalFeePercentage = pricingRes.withdrawalFeePercentage;
      }

      const studentReqs = [
        ...(stuBizId ? (requestsByStudent.get(stuBizId) || []) : []),
        ...(stuDbId ? (requestsByStudent.get(stuDbId) || []) : []),
      ];
      const hasSnoozeReq = studentReqs.some((r) => r.priority === 'Snooze');
      const hasInactiveReq = studentReqs.some((r) => r.priority === 'Inactive');

      const isSnoozed = stu.snoozed === true || stu.internshipPriority === 'Snooze' || hasSnoozeReq;
      const isInactive = stu.internshipPriority === 'Inactive' || stu.status === 'Inactive' || hasInactiveReq;

      let canonicalStatus = mapCanonicalStatus(stu.placementStatus);
      if (isSnoozed) {
        canonicalStatus = 'Snooze';
      } else if (isInactive) {
        canonicalStatus = 'Inactive';
      }

      const isWithdrawal =
        THIRTY_PERCENT_STATUSES.includes(stu.placementStatus) ||
        THIRTY_PERCENT_STATUSES.includes(canonicalStatus);

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
      const existingPayment =
        existingPaymentMap.get(stuDbId) || (stuBizId ? existingPaymentMap.get(stuBizId) : null);

      if (existingPayment) {
        const isPriceOverridden = Boolean(existingPayment.isPriceOverridden);
        const isPercentageOverridden = Boolean(existingPayment.isPercentageOverridden);
        const finalPrice = isPriceOverridden ? existingPayment.originalPrice : originalPrice;
        
        // If the percentage was manually overridden by user, respect that manual choice.
        // Otherwise, dynamically recalculate based on the student's current placementStatus
        // (100% for active appointments/placements, 30% for withdrawals/missed appointments).
        const finalPercentage = isPercentageOverridden
          ? (existingPayment.chargePercentage ?? chargePercentage)
          : chargePercentage;

        const calculatedPaymentAmount = Number(((finalPrice * finalPercentage) / 100).toFixed(2));
        const gstAmount = existingPayment.gstEnabled
          ? Number((calculatedPaymentAmount * 0.10).toFixed(2))
          : 0;
        const totalAmount = Number((calculatedPaymentAmount + gstAmount).toFixed(2));

        bulkOps.push({
          updateOne: {
            filter: { _id: existingPayment._id },
            update: {
              $set: {
                studentType: isIndependentStudent ? 'Independent Student' : stu.studentType || 'RTO Student',
                studentName: stuName || existingPayment.studentName,
                rto: assignedRtoName || existingPayment.rto,
                spokesperson: spokesperson || matchedRto?.contactName || existingPayment.spokesperson || '',
                course: stu.courseQualification || stu.courses || existingPayment.course,
                placementStatus: canonicalStatus,
                defaultPlacementFee: originalPrice,
                ...(isPriceOverridden ? {} : { originalPrice, priceConfigured, pricingError }),
                chargePercentage: finalPercentage,
                paymentAmount: calculatedPaymentAmount,
                gstAmount,
                totalAmount,
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
              studentType: isIndependentStudent ? 'Independent Student' : stu.studentType || 'RTO Student',
              studentName: stuName,
              rto: assignedRtoName,
              spokesperson: spokesperson || matchedRto?.contactName || '',
              course: stu.courseQualification || stu.courses || '',
              placementStatus: canonicalStatus,
              service: 'Placement status',
              originalPrice,
              defaultPlacementFee: originalPrice,
              isPriceOverridden: false,
              chargePercentage,
              paymentAmount,
              gstAmount: 0,
              totalAmount: paymentAmount,
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
    await releaseDistributedLock(SYNC_LOCK_KEY);
  }
};

export const buildPaymentFilter = (queryParams = {}) => {
  const {
    rto,
    rtoNames,
    allowedStudentIds,
    allowedStudentDbIds,
    placementStatus,
    paymentStatus,
    fromDate,
    toDate,
    search,
  } = queryParams;

  const andClauses = [];

  const rtoConditions = [];
  if (Array.isArray(allowedStudentDbIds) && allowedStudentDbIds.length > 0) {
    rtoConditions.push({ student: { $in: allowedStudentDbIds } });
  }
  if (Array.isArray(allowedStudentIds) && allowedStudentIds.length > 0) {
    rtoConditions.push({ studentId: { $in: allowedStudentIds } });
  }
  if (Array.isArray(rtoNames) && rtoNames.length > 0) {
    const escapedNames = rtoNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    rtoConditions.push({ rto: { $in: escapedNames.map((n) => new RegExp(`^${n}$`, 'i')) } });
  } else if (rto && rto !== 'All') {
    andClauses.push({ rto: { $regex: rto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
  }

  if (rtoConditions.length > 0) {
    andClauses.push({ $or: rtoConditions });
  } else if (allowedStudentDbIds !== undefined || allowedStudentIds !== undefined) {
    andClauses.push({ _id: null });
  }

  if (placementStatus && placementStatus !== 'All') {
    andClauses.push({ placementStatus });
  }

  if (paymentStatus && paymentStatus !== 'All') {
    andClauses.push({ paymentStatus });
  }

  if (search) {
    const q = search.trim();
    andClauses.push({
      $or: [
        { studentName: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { invoiceNumber: { $regex: q, $options: 'i' } },
        { rto: { $regex: q, $options: 'i' } },
        { course: { $regex: q, $options: 'i' } },
      ],
    });
  }

  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDate;
    }
    andClauses.push({
      $or: [
        { invoiceGeneratedDate: dateFilter },
        { paymentReceivedDate: dateFilter },
        { createdAt: dateFilter },
      ],
    });
  }

  return andClauses.length > 0 ? (andClauses.length === 1 ? andClauses[0] : { $and: andClauses }) : {};
};

/**
 * Service: Retrieve payment records with filtering, searching, and optional pagination
 */
export const getPaymentsService = async (queryParams = {}) => {
  await syncChargeableStudents();

  const { page, limit } = queryParams;
  const filter = buildPaymentFilter(queryParams);

  const queryBuilder = PaymentModel.find(filter).sort({ updatedAt: -1, createdAt: -1 });

  if (page || limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const total = await PaymentModel.countDocuments(filter);
    const data = await queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum).lean();

    return {
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  const data = await queryBuilder.lean();
  return { data };
};

/**
 * Service: Compute summary payment totals
 */
export const getPaymentTotalsService = async (queryParams = {}) => {
  const filter = buildPaymentFilter(queryParams);
  const payments = await PaymentModel.find(filter).lean();

  let total100Price = 0;
  let total30Price = 0;
  let missingPricingCount = 0;
  let invoicedAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;

  payments.forEach((p) => {
    if (!p.priceConfigured) {
      missingPricingCount++;
    }
    const amt = p.paymentAmount || 0;
    if (p.chargePercentage === 100) {
      total100Price += amt;
    } else {
      total30Price += amt;
    }

    if (['Full Payment Received', '30% Received'].includes(p.paymentStatus)) {
      paidAmount += amt;
    } else if (['Invoice Generated', 'Invoice Sent'].includes(p.paymentStatus)) {
      invoicedAmount += amt;
      pendingAmount += amt;
    } else {
      pendingAmount += amt;
    }
  });

  total100Price = Number(total100Price.toFixed(2));
  total30Price = Number(total30Price.toFixed(2));
  const totalRevenue = Number((total100Price + total30Price).toFixed(2));

  return {
    total100Price,
    total30Price,
    totalRevenue,
    totalAmount: totalRevenue,
    invoicedAmount: Number(invoicedAmount.toFixed(2)),
    paidAmount: Number(paidAmount.toFixed(2)),
    pendingAmount: Number(pendingAmount.toFixed(2)),
    totalCount: payments.length,
    missingPricingCount,
  };
};

/**
 * Service: Update status & pricing details of an individual payment record
 */
export const updatePaymentStatusService = async (id, updateBody, currentUser = null) => {
  const {
    paymentStatus,
    chargePercentage,
    isPercentageOverridden,
    originalPrice,
    gstEnabled,
    feeOverrideReason,
    percentageOverrideReason,
  } = updateBody;

  const payment = await PaymentModel.findById(id);
  if (!payment) {
    throw new NotFoundError('Payment record not found.');
  }

  if (paymentStatus) {
    let normalizedStatus = paymentStatus;
    if (paymentStatus === '30% Advance Invoiced') normalizedStatus = 'Invoice Sent';
    else if (paymentStatus === '30% Advance Received') normalizedStatus = '30% Received';

    const validStatuses = ['Pending', 'Invoice Generated', 'Invoice Sent', '30% Received', 'Full Payment Received'];
    if (!validStatuses.includes(normalizedStatus)) {
      throw new BadRequestError(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
    }
    payment.paymentStatus = normalizedStatus;
  }

  if (chargePercentage !== undefined) {
    payment.chargePercentage = Number(chargePercentage);
    payment.isPercentageOverridden = isPercentageOverridden !== undefined ? Boolean(isPercentageOverridden) : true;
    if (percentageOverrideReason) {
      payment.percentageOverrideReason = String(percentageOverrideReason).trim();
    }
  } else if (isPercentageOverridden === false) {
    payment.isPercentageOverridden = false;
    payment.percentageOverrideReason = '';
    const isWithdrawal = THIRTY_PERCENT_STATUSES.includes(payment.placementStatus);
    payment.chargePercentage = isWithdrawal ? 30 : 100;
  }

  if (originalPrice !== undefined) {
    const numPrice = Number(originalPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new BadRequestError('Invalid originalPrice. Must be a non-negative number.');
    }
    payment.originalPrice = numPrice;
    payment.isPriceOverridden = true;
    payment.priceConfigured = numPrice > 0;
    payment.pricingError = numPrice > 0 ? '' : payment.pricingError;
    payment.feeUpdatedAt = new Date();
    if (currentUser) {
      payment.feeUpdatedBy = currentUser._id;
    }
    if (feeOverrideReason) {
      payment.feeOverrideReason = String(feeOverrideReason).trim();
    }
  }

  if (gstEnabled !== undefined) {
    payment.gstEnabled = Boolean(gstEnabled);
  }

  const pct = payment.chargePercentage ?? 100;
  const orig = payment.originalPrice ?? 0;
  payment.paymentAmount = Number(((orig * pct) / 100).toFixed(2));

  if (payment.gstEnabled) {
    payment.gstAmount = Number((payment.paymentAmount * 0.10).toFixed(2));
  } else {
    payment.gstAmount = 0;
  }
  payment.totalAmount = Number((payment.paymentAmount + payment.gstAmount).toFixed(2));

  const now = new Date();
  if (paymentStatus === 'Invoice Sent' || paymentStatus === 'Invoice Generated') {
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

  if (currentUser) {
    payment.updatedBy = currentUser._id;
    payment.updatedByName = currentUser.name || '';
  }

  await payment.save();

  if (paymentStatus === 'Invoice Sent') {
    sendPaymentInvoiceEmail(payment).catch((err) =>
      logger.error(`Single invoice email trigger error: ${err.message}`)
    );
  }

  return payment;
};

/**
 * Service: Bulk action to mark payment received
 */
export const bulkPaymentReceivedService = async (paymentIds, currentUser = null) => {
  if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
    throw new BadRequestError('Please select at least one student to mark payment received.');
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
            ...(currentUser ? { updatedBy: currentUser._id, updatedByName: currentUser.name || '' } : {}),
          },
        },
      },
    };
  });

  if (bulkOps.length > 0) {
    await PaymentModel.bulkWrite(bulkOps);
  }

  return {
    updatedCount: payments.length,
  };
};

/**
 * Invoice delegators: Handled by dedicated InvoiceService
 */
export const bulkGenerateInvoiceService = async (data, currentUser = null) => {
  return InvoiceService.bulkGenerateInvoice(data, currentUser);
};

export const getInvoicePDFBufferService = async (invoiceNumber) => {
  return InvoiceService.getInvoicePDFBuffer(invoiceNumber);
};

export const retrySendInvoiceEmailService = async (invoiceNumber) => {
  return InvoiceService.retrySendInvoiceEmail(invoiceNumber);
};

/**
 * Sync a single student's payment record immediately after student update.
 */
export const syncSingleStudentPayment = async (studentDoc) => {
  if (!studentDoc) return;

  const stuDbId = String(studentDoc._id || studentDoc.id);
  const stuBizId = studentDoc.studentId ? String(studentDoc.studentId) : '';
  const stuName = [studentDoc.firstName, studentDoc.middleName, studentDoc.lastName].filter(Boolean).join(' ') || 'Student';

  const isIndependentStudent = studentDoc.studentType === 'Independent Student';
  const assignedRtoName = isIndependentStudent ? 'Independent Student' : (studentDoc.assignedRto || '').trim();

  let matchedRto = null;
  if (!isIndependentStudent && assignedRtoName) {
    const rtos = await RtoModel.find().lean();
    const rtoMapByName = new Map();
    const rtoMapByCode = new Map();
    rtos.forEach((r) => {
      if (r.name) rtoMapByName.set(r.name.trim().toLowerCase(), r);
      if (r.code) rtoMapByCode.set(r.code.trim().toLowerCase(), r);
    });
    matchedRto = rtoMapByName.get(assignedRtoName.toLowerCase()) || rtoMapByCode.get(assignedRtoName.toLowerCase()) || null;
  }

  let priceConfigured = false;
  let originalPrice = 0;
  let pricingError = '';
  let spokesperson = '';

  if (isIndependentStudent) {
    const indFee = studentDoc.independentFee != null ? Number(studentDoc.independentFee) : null;
    if (indFee !== null && indFee > 0) {
      priceConfigured = true;
      originalPrice = indFee;
    } else {
      pricingError = 'No placement fee entered for Independent Student';
    }
    spokesperson = stuName;
  } else {
    const pricingRes = resolveRtoCoursePrice(matchedRto, studentDoc);
    priceConfigured = pricingRes.priceConfigured;
    originalPrice = pricingRes.originalPrice;
    pricingError = pricingRes.pricingError;
    spokesperson = pricingRes.spokesperson;
  }

  const existingPayment = await PaymentModel.findOne({
    $or: [
      { student: studentDoc._id },
      ...(stuBizId ? [{ studentId: stuBizId }] : []),
      { studentId: stuDbId },
    ],
  });

  if (!existingPayment) return;

  const isPriceOverridden = Boolean(existingPayment.isPriceOverridden);
  const isPercentageOverridden = Boolean(existingPayment.isPercentageOverridden);
  const finalPrice = isPriceOverridden ? existingPayment.originalPrice : originalPrice;

  const currentStatus = studentDoc.placementStatus || existingPayment.placementStatus;
  const isWithdrawal = THIRTY_PERCENT_STATUSES.includes(currentStatus);
  const autoPercentage = isWithdrawal ? 30 : 100;
  const finalPercentage = isPercentageOverridden
    ? (existingPayment.chargePercentage ?? autoPercentage)
    : autoPercentage;

  const calculatedPaymentAmount = Number(((finalPrice * finalPercentage) / 100).toFixed(2));
  const gstAmount = existingPayment.gstEnabled ? Number((calculatedPaymentAmount * 0.10).toFixed(2)) : 0;
  const totalAmount = Number((calculatedPaymentAmount + gstAmount).toFixed(2));

  await PaymentModel.updateOne(
    { _id: existingPayment._id },
    {
      $set: {
        studentName: stuName,
        studentType: isIndependentStudent ? 'Independent Student' : (studentDoc.studentType || 'RTO Student'),
        rto: assignedRtoName || existingPayment.rto,
        course: studentDoc.courseQualification || studentDoc.courses || existingPayment.course,
        spokesperson: spokesperson || matchedRto?.contactName || existingPayment.spokesperson || '',
        defaultPlacementFee: originalPrice,
        ...(isPriceOverridden ? {} : { originalPrice, priceConfigured, pricingError }),
        chargePercentage: finalPercentage,
        paymentAmount: calculatedPaymentAmount,
        gstAmount,
        totalAmount,
        placementStatus: currentStatus,
      },
    }
  );
};

/**
 * Service: Manually import students into Payment section before appointment scheduling
 * Reuses existing RTO course pricing resolution and data mapping, while preventing duplicates.
 */
export const importStudentsToPaymentService = async (studentIds = []) => {
  const ids = (Array.isArray(studentIds) ? studentIds : [studentIds]).filter(Boolean).map(String);
  if (ids.length === 0) {
    throw new BadRequestError('Please provide at least one student ID to import into Payment.');
  }

  // Find students by MongoDB _id or business studentId
  const validMongoIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const students = await StudentModel.find({
    $or: [
      ...(validMongoIds.length > 0 ? [{ _id: { $in: validMongoIds } }] : []),
      { studentId: { $in: ids } },
    ],
  }).lean();

  if (students.length === 0) {
    throw new NotFoundError('No matching students found to import.');
  }

  // Duplicate prevention at backend level:
  const studentDbIds = students.map((s) => s._id);
  const studentBizIds = students.map((s) => s.studentId).filter(Boolean);

  const existingPayments = await PaymentModel.find({
    $or: [
      { student: { $in: studentDbIds } },
      { studentId: { $in: studentBizIds } },
    ],
  }).lean();

  const existingStudentKeys = new Set();
  existingPayments.forEach((p) => {
    if (p.student) existingStudentKeys.add(String(p.student));
    if (p.studentId) existingStudentKeys.add(String(p.studentId));
  });

  const studentsToImport = students.filter((stu) => {
    const dbKey = String(stu._id);
    const bizKey = stu.studentId ? String(stu.studentId) : null;
    return !existingStudentKeys.has(dbKey) && (!bizKey || !existingStudentKeys.has(bizKey));
  });

  if (studentsToImport.length === 0) {
    return {
      success: true,
      importedCount: 0,
      message: 'All selected students are already present in the Payment section.',
      data: existingPayments,
    };
  }

  // Fetch RTOs to resolve pricing schedule
  const rtos = await RtoModel.find().lean();
  const rtoMapByName = new Map();
  const rtoMapByCode = new Map();
  rtos.forEach((r) => {
    if (r.name) rtoMapByName.set(r.name.trim().toLowerCase(), r);
    if (r.code) rtoMapByCode.set(r.code.trim().toLowerCase(), r);
  });

  // Check workflow requests for any snooze/inactive priority
  const workflowModule = await import('../workflow/workflow.model.js');
  const WorkflowModel = workflowModule.default;
  const workflows = await WorkflowModel.find({}, { requests: 1 }).lean();
  const allReqs = workflows.flatMap((w) => w.requests || []);
  const reqPriorityByStudent = new Map();
  allReqs.forEach((r) => {
    if (r.priority === 'Snooze' || r.priority === 'Inactive') {
      if (r.studentId) reqPriorityByStudent.set(String(r.studentId).trim(), r.priority);
      if (r._id) reqPriorityByStudent.set(String(r._id).trim(), r.priority);
      if (r.student) reqPriorityByStudent.set(String(r.student).trim().toLowerCase(), r.priority);
    }
  });

  const mapCanonicalStatus = (status) => {
    if (!status) return 'Awaiting';
    if (['Completed', 'Placement Completed'].includes(status)) return 'Placement Completed';
    if (['Active', 'Joined', 'Waiting to Join', 'Placement Started', 'Confirmed'].includes(status))
      return 'Placement Started';
    if (['Appointment Successful', 'Successful'].includes(status)) return 'Appointment Successful';
    if (['Appointment Scheduled', 'Scheduled'].includes(status)) return 'Appointment Scheduled';
    if (['Student Withdraw', 'Withdrawn'].includes(status)) return 'Student Withdraw';
    if (['Student Missed Appointment', 'No Show'].includes(status)) return 'Student Missed Appointment';
    if (['Not Suitable Site'].includes(status)) return 'Not Suitable Site';
    if (['Snooze', 'Snoozed'].includes(status)) return 'Snooze';
    if (['Inactive'].includes(status)) return 'Inactive';
    return status;
  };

  const createdPayments = [];

  for (const stu of studentsToImport) {
    const stuDbId = String(stu._id || stu.id);
    const stuBizId = stu.studentId ? String(stu.studentId) : '';
    const stuName =
      [stu.firstName, stu.middleName, stu.lastName].filter(Boolean).join(' ') || stu.name || 'Student';

    const isIndependentStudent = stu.studentType === 'Independent Student';
    const assignedRtoName = isIndependentStudent ? 'Independent Student' : (stu.assignedRto || '').trim();
    const matchedRto = isIndependentStudent
      ? null
      : rtoMapByName.get(assignedRtoName.toLowerCase()) ||
        rtoMapByCode.get(assignedRtoName.toLowerCase()) ||
        null;

    let priceConfigured = false;
    let originalPrice = 0;
    let pricingError = '';
    let spokesperson = '';
    let withdrawalFeeRule = '30%';
    let withdrawalFeePercentage = 30;

    if (isIndependentStudent) {
      const indFee = stu.independentFee != null ? Number(stu.independentFee) : null;
      if (indFee !== null && indFee > 0) {
        priceConfigured = true;
        originalPrice = indFee;
        pricingError = '';
      } else {
        priceConfigured = false;
        originalPrice = 0;
        pricingError = 'No placement fee entered for Independent Student';
      }
      spokesperson = stuName;
    } else {
      const pricingRes = resolveRtoCoursePrice(matchedRto, stu);
      priceConfigured = pricingRes.priceConfigured;
      originalPrice = pricingRes.originalPrice;
      pricingError = pricingRes.pricingError;
      spokesperson = pricingRes.spokesperson;
      withdrawalFeeRule = pricingRes.withdrawalFeeRule;
      withdrawalFeePercentage = pricingRes.withdrawalFeePercentage;
    }

    const reqPriority =
      reqPriorityByStudent.get(stuDbId) ||
      (stuBizId ? reqPriorityByStudent.get(stuBizId) : null) ||
      (stuName ? reqPriorityByStudent.get(stuName.toLowerCase()) : null);

    const isSnoozed = stu.snoozed === true || stu.internshipPriority === 'Snooze' || reqPriority === 'Snooze';
    const isInactive = stu.internshipPriority === 'Inactive' || stu.status === 'Inactive' || reqPriority === 'Inactive';

    let canonicalStatus = mapCanonicalStatus(stu.placementStatus);
    if (isSnoozed) {
      canonicalStatus = 'Snooze';
    } else if (isInactive) {
      canonicalStatus = 'Inactive';
    }

    const isWithdrawal =
      THIRTY_PERCENT_STATUSES.includes(stu.placementStatus) ||
      THIRTY_PERCENT_STATUSES.includes(canonicalStatus);

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

    const newPayment = await PaymentModel.create({
      studentId: stuBizId || stuDbId,
      student: stu._id,
      studentType: isIndependentStudent ? 'Independent Student' : stu.studentType || 'RTO Student',
      studentName: stuName,
      rto: assignedRtoName,
      spokesperson: spokesperson || matchedRto?.contactName || '',
      course: stu.courseQualification || stu.courses || '',
      placementStatus: canonicalStatus,
      service: 'Placement status',
      originalPrice,
      defaultPlacementFee: originalPrice,
      isPriceOverridden: false,
      chargePercentage,
      paymentAmount,
      gstAmount: 0,
      totalAmount: paymentAmount,
      paymentStatus: 'Pending',
      invoiceGeneratedDate: null,
      invoiceSentDate: null,
      paymentReceivedDate: null,
      priceConfigured,
      pricingError,
    });

    createdPayments.push(newPayment);
  }

  return {
    success: true,
    importedCount: createdPayments.length,
    message: `Successfully imported ${createdPayments.length} student(s) into Payment.`,
    data: createdPayments,
  };
};

export class PaymentService {
  static getPayments = getPaymentsService;
  static getTotals = getPaymentTotalsService;
  static updateStatus = updatePaymentStatusService;
  static bulkPaymentReceived = bulkPaymentReceivedService;
  static syncChargeableStudents = syncChargeableStudents;
  static resolveRtoCoursePrice = resolveRtoCoursePrice;
  static syncSingleStudentPayment = syncSingleStudentPayment;
  static importStudents = importStudentsToPaymentService;
}
