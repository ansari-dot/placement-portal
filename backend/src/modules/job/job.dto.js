import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().trim().min(1, 'Job title is required'),
  employer: z.string().trim().min(1, 'Employer name is required'),
  industry: z.string().trim().optional().default(''),
  rto: z.string().trim().optional().default(''),
  location: z.string().trim().optional().default(''),
  employmentType: z.string().trim().optional().default('Full-time'),
  description: z.string().trim().optional().default(''),
  requirements: z.string().trim().optional().default(''),
  salary: z.string().trim().optional().default(''),
  expiryDate: z.string().trim().optional().default(''),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['Open', 'Filled', 'Draft', 'Expired', 'Cancelled']).optional(),
  applicantsCount: z.number().int().optional(),
});
