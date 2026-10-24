import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().trim().min(5, 'Review comment must be at least 5 characters').max(2000, 'Review comment cannot exceed 2000 characters'),
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional().default(''),
  category: z.enum([
    'Platform Experience',
    'Placement Support',
    'Compliance & Tracking',
    'Host Facility Experience',
    'General',
  ]).optional().default('Platform Experience'),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(['Approved', 'Rejected'], {
    errorMap: () => ({ message: 'Status must be Approved or Rejected' }),
  }),
  rejectionReason: z.string().trim().max(500).optional().default(''),
  isFeatured: z.boolean().optional(),
});
