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

export const getPaymentsController = async (req, res, next) => {
  try {
    const result = await getPaymentsService(req.query);

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
    const data = await getPaymentTotalsService(req.query);
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
