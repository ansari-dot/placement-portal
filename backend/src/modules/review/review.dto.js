import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().trim().min(5, 'Review comment must be at least 5 characters').max(2000, 'Review comment cannot exceed 2000 characters'),
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional().default(''),
  category: z.string().optional().default('Platform Experience'),
});

export const createPublicReviewSchema = z.object({
  reviewerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  reviewerRole: z.string().trim().min(2, 'Role is required').default('Student'),
  reviewerEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional().default(''),
  comment: z.string().trim().min(5, 'Review comment must be at least 5 characters').max(2000, 'Review comment cannot exceed 2000 characters'),
  category: z.string().optional().default('Platform Experience'),
  rtoName: z.string().trim().max(120, 'RTO Name cannot exceed 120 characters').optional().default(''),
  facilityName: z.string().trim().max(120, 'Facility Name cannot exceed 120 characters').optional().default(''),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(['Approved', 'Rejected'], {
    errorMap: () => ({ message: 'Status must be Approved or Rejected' }),
  }),
  rejectionReason: z.string().trim().max(500).optional().default(''),
  isFeatured: z.boolean().optional(),
});
