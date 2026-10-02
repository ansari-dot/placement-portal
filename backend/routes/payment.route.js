import express from 'express';
import {
  getPaymentsController,
  getPaymentTotalsController,
  updatePaymentStatusController,
  bulkGenerateInvoiceController,
  bulkPaymentReceivedController,
} from '../controller/payment.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /payments — list with filters
router.get('/', protectRoute, getPaymentsController);

// GET /payments/totals — dynamic server-side summary totals
router.get('/totals', protectRoute, getPaymentTotalsController);

// PATCH /payments/:id/status — update payment status
router.patch('/:id/status', protectRoute, updatePaymentStatusController);

// POST /payments/bulk-invoice — bulk generate/send invoice
router.post('/bulk-invoice', protectRoute, bulkGenerateInvoiceController);

// POST /payments/bulk-payment-received — bulk mark payment received
router.post('/bulk-payment-received', protectRoute, bulkPaymentReceivedController);

export default router;
