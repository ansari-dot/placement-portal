import express from 'express';
import {
  bulkGenerateInvoiceController,
  downloadInvoicePDFController,
  retrySendInvoiceEmailController,
  getAllInvoicesController,
  getInvoiceByNumberController,
} from './invoice.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { requireAdmin } from '../../core/guards/roles.guard.js';
import { validateBody, validateParams, validateQuery } from '../../core/middlewares/validate.middleware.js';
import {
  bulkGenerateInvoiceSchema,
  invoiceNumberParamSchema,
  getAllInvoicesQuerySchema,
} from './invoice.dto.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', validateQuery(getAllInvoicesQuerySchema), getAllInvoicesController);
router.post('/bulk-generate', validateBody(bulkGenerateInvoiceSchema), bulkGenerateInvoiceController);
router.get('/:invoiceNumber', validateParams(invoiceNumberParamSchema), getInvoiceByNumberController);
router.get('/:invoiceNumber/pdf', validateParams(invoiceNumberParamSchema), downloadInvoicePDFController);
router.post('/:invoiceNumber/send', validateParams(invoiceNumberParamSchema), retrySendInvoiceEmailController);

export default router;
