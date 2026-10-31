import {
  CHARGEABLE_PLACEMENT_STATUSES,
  THIRTY_PERCENT_STATUSES,
  resolveRtoCoursePrice,
  syncChargeableStudents,
  getPaymentsService,
  getPaymentTotalsService,
  updatePaymentStatusService,
  bulkPaymentReceivedService,
} from './payment.service.js';
import {
  bulkGenerateInvoiceController,
  downloadInvoicePDFController,
  retrySendInvoiceEmailController,
} from '../invoice/invoice.controller.js';
import logger from '../../core/utils/logger.js';

export {
  CHARGEABLE_PLACEMENT_STATUSES,
  THIRTY_PERCENT_STATUSES,
  resolveRtoCoursePrice,
  syncChargeableStudents,
  bulkGenerateInvoiceController,
  downloadInvoicePDFController,
  retrySendInvoiceEmailController,
};

import RtoModel from '../rto/rto.model.js';
import StudentModel from '../student/student.model.js';
import { getStudentQueryScope } from '../../core/utils/rbacScope.js';

export const getPaymentsController = async (req, res, next) => {
  try {
    const user = req.user;
    const query = { ...req.query };
    if (user && (user.role === 'RTO Manager' || user.role === 'RTO')) {
      const studentScope = await getStudentQueryScope(user);
      const studentDocs = await StudentModel.find(studentScope, { _id: 1, studentId: 1, assignedRto: 1, institute: 1 }).lean();
      const studentDbIds = studentDocs.map((s) => s._id).filter(Boolean);
      const studentBizIds = studentDocs.map((s) => s.studentId).filter(Boolean);

      let rtoName = user.rtoName;
      if (!rtoName && user.rtoId) {
        const rtoDoc = await RtoModel.findById(user.rtoId).lean();
        if (rtoDoc) rtoName = rtoDoc.name;
      }
      if (!rtoName && user.email) {
        const matchedRto = await RtoModel.findOne({ contactEmail: user.email.toLowerCase().trim() }).lean();
        if (matchedRto) rtoName = matchedRto.name;
      }
      if (!rtoName && user.requestedOrgName) {
        rtoName = user.requestedOrgName;
      }

      const rtoNames = [
        ...new Set([rtoName, ...studentDocs.flatMap((s) => [s.assignedRto, s.institute])].filter(Boolean)),
      ];

      query.allowedStudentDbIds = studentDbIds;
      query.allowedStudentIds = studentBizIds;
      query.rtoNames = rtoNames;
      if (rtoName) {
        query.rto = rtoName;
      }
    }

    const result = await getPaymentsService(query);

    if (result.pagination) {
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error(`getPaymentsController error: ${error.message}`);
    return next ? next(error) : res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getPaymentTotalsController = async (req, res, next) => {
  try {
    const user = req.user;
    const query = { ...req.query };
    if (user && (user.role === 'RTO Manager' || user.role === 'RTO')) {
      const studentScope = await getStudentQueryScope(user);
      const studentDocs = await StudentModel.find(studentScope, { _id: 1, studentId: 1, assignedRto: 1, institute: 1 }).lean();
      const studentDbIds = studentDocs.map((s) => s._id).filter(Boolean);
      const studentBizIds = studentDocs.map((s) => s.studentId).filter(Boolean);

      let rtoName = user.rtoName;
      if (!rtoName && user.rtoId) {
        const rtoDoc = await RtoModel.findById(user.rtoId).lean();
        if (rtoDoc) rtoName = rtoDoc.name;
      }
      if (!rtoName && user.email) {
        const matchedRto = await RtoModel.findOne({ contactEmail: user.email.toLowerCase().trim() }).lean();
        if (matchedRto) rtoName = matchedRto.name;
      }
      if (!rtoName && user.requestedOrgName) {
        rtoName = user.requestedOrgName;
      }

      const rtoNames = [
        ...new Set([rtoName, ...studentDocs.flatMap((s) => [s.assignedRto, s.institute])].filter(Boolean)),
      ];

      query.allowedStudentDbIds = studentDbIds;
      query.allowedStudentIds = studentBizIds;
      query.rtoNames = rtoNames;
      if (rtoName) {
        query.rto = rtoName;
      }
    }

    const data = await getPaymentTotalsService(query);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`getPaymentTotalsController error: ${error.message}`);
    return next ? next(error) : res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updatePaymentStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await updatePaymentStatusService(id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: `Payment status updated to ${payment.paymentStatus}`,
      data: payment,
    });
  } catch (error) {
    logger.error(`updatePaymentStatusController error: ${error.message}`);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next ? next(error) : res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkPaymentReceivedController = async (req, res, next) => {
  try {
    const result = await bulkPaymentReceivedService(req.body.paymentIds, req.user);
    return res.status(200).json({
      success: true,
      message: `Successfully updated ${result.updatedCount} payment record(s) to received status.`,
      data: result,
    });
  } catch (error) {
    logger.error(`bulkPaymentReceivedController error: ${error.message}`);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next ? next(error) : res.status(500).json({ success: false, message: error.message });
  }
};
