import { z } from 'zod';

export const bulkGenerateInvoiceSchema = z.object({
  paymentSelections: z.array(z.any()).optional(),
  paymentIds: z.array(z.string()).optional(),
  gstEnabled: z.boolean().optional().default(false),
}).refine(
  (data) => (data.paymentSelections && data.paymentSelections.length > 0) || (data.paymentIds && data.paymentIds.length > 0),
  { message: 'Please select at least one student to generate invoices.' }
);

export const invoiceNumberParamSchema = z.object({
  invoiceNumber: z.string().trim().min(1, 'Invoice number is required'),
});

export const getAllInvoicesQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(500).optional().default(50),
});
