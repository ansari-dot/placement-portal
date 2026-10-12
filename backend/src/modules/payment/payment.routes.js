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
import { requireAdmin } from '../../core/guards/roles.guard.js';
import { validateBody, validateParams } from '../../core/middlewares/validate.middleware.js';
import {
  updatePaymentStatusSchema,
  bulkInvoiceSchema,
  bulkPaymentReceivedSchema,
} from './payment.dto.js';
import { invoiceNumberParamSchema } from '../invoice/invoice.dto.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', getPaymentsController);
router.get('/totals', getPaymentTotalsController);
router.patch('/:id/status', validateBody(updatePaymentStatusSchema), updatePaymentStatusController);
router.post('/bulk-invoice', validateBody(bulkInvoiceSchema), bulkGenerateInvoiceController);
router.post('/bulk-payment-received', validateBody(bulkPaymentReceivedSchema), bulkPaymentReceivedController);
router.get('/invoice/:invoiceNumber/pdf', validateParams(invoiceNumberParamSchema), downloadInvoicePDFController);
router.post('/invoice/:invoiceNumber/send', validateParams(invoiceNumberParamSchema), retrySendInvoiceEmailController);

export default router;
