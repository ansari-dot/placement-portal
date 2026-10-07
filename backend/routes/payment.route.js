import express from 'express';
import {
  getPaymentsController,
  getPaymentTotalsController,
  updatePaymentStatusController,
  bulkGenerateInvoiceController,
  bulkPaymentReceivedController,
  downloadInvoicePDFController,
  retrySendInvoiceEmailController,
} from '../controller/payment.controller.js';
import { protectRoute, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /payments — list with filters (Admin required)
router.get('/', protectRoute, requireAdmin, getPaymentsController);

// GET /payments/totals — dynamic server-side summary totals (Admin required)
router.get('/totals', protectRoute, requireAdmin, getPaymentTotalsController);

// PATCH /payments/:id/status — update payment status (Admin required)
router.patch('/:id/status', protectRoute, requireAdmin, updatePaymentStatusController);

// POST /payments/bulk-invoice — bulk generate/send invoice (Admin required)
router.post('/bulk-invoice', protectRoute, requireAdmin, bulkGenerateInvoiceController);

// POST /payments/bulk-payment-received — bulk mark payment received (Admin required)
router.post('/bulk-payment-received', protectRoute, requireAdmin, bulkPaymentReceivedController);

// GET /payments/invoice/:invoiceNumber/pdf — download PDF invoice (Admin required)
router.get('/invoice/:invoiceNumber/pdf', protectRoute, requireAdmin, downloadInvoicePDFController);

// POST /payments/invoice/:invoiceNumber/send — retry sending invoice email (Admin required)
router.post('/invoice/:invoiceNumber/send', protectRoute, requireAdmin, retrySendInvoiceEmailController);

export default router;
