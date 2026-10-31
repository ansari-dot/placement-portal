import express from 'express';
import {
  getPaymentsController,
  getPaymentTotalsController,
  updatePaymentStatusController,
  bulkGenerateInvoiceController,
  bulkPaymentReceivedController,
  downloadInvoicePDFController,
  retrySendInvoiceEmailController,
} from './payment.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { requireRoles } from '../../core/guards/roles.guard.js';
import { validateBody, validateParams } from '../../core/middlewares/validate.middleware.js';
import {
  updatePaymentStatusSchema,
  bulkInvoiceSchema,
  bulkPaymentReceivedSchema,
} from './payment.dto.js';
import { invoiceNumberParamSchema } from '../invoice/invoice.dto.js';

const router = express.Router();

router.use(authenticate);

const canManagePayments = requireRoles('Administrator', 'Admin');
const canViewPayments = requireRoles('Administrator', 'Admin', 'Coordinator', 'Placement Coordinator', 'RTO Manager', 'RTO');

router.get('/', canViewPayments, getPaymentsController);
router.get('/totals', canViewPayments, getPaymentTotalsController);
router.patch('/:id/status', canManagePayments, validateBody(updatePaymentStatusSchema), updatePaymentStatusController);
router.post('/bulk-invoice', canManagePayments, validateBody(bulkInvoiceSchema), bulkGenerateInvoiceController);
router.post('/bulk-payment-received', canManagePayments, validateBody(bulkPaymentReceivedSchema), bulkPaymentReceivedController);
router.get('/invoice/:invoiceNumber/pdf', canViewPayments, validateParams(invoiceNumberParamSchema), downloadInvoicePDFController);
router.post('/invoice/:invoiceNumber/send', canManagePayments, validateParams(invoiceNumberParamSchema), retrySendInvoiceEmailController);

export default router;
