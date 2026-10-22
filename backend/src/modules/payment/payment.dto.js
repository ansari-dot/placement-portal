import { z } from 'zod';

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum([
    'Pending',
    '30% Advance Invoiced',
    '30% Advance Received',
    'Invoice Sent',
    'Full Payment Received',
    'Payment Overdue',
    'Refunded',
    'Cancelled',
  ]).optional(),
  originalPrice: z.coerce.number().min(0, 'Original price cannot be negative').optional(),
  feeOverrideReason: z.string().trim().optional(),
  chargePercentage: z.coerce.number().min(0).max(100).optional(),
  comments: z.string().trim().optional(),
});

export const bulkInvoiceSchema = z.object({
  paymentSelections: z.array(z.any()).optional(),
  paymentIds: z.array(z.string()).optional(),
  gstEnabled: z.boolean().optional().default(false),
}).refine(
  (data) => (data.paymentSelections && data.paymentSelections.length > 0) || (data.paymentIds && data.paymentIds.length > 0),
  { message: 'At least one payment record must be selected' }
);

export const bulkPaymentReceivedSchema = z.object({
  paymentIds: z.array(z.string()).min(1, 'At least one payment record must be selected'),
});
