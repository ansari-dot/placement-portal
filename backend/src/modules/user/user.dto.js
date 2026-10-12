import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(6).optional().default('User@123'),
  role: z.enum(['Administrator', 'Coordinator', 'RTO Manager', 'Staff', 'Industry', 'Student']).optional().default('Staff'),
  department: z.string().trim().optional().default('Placement Operations'),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional().default('Active'),
  phone: z.string().trim().optional().default(''),
  avatar: z.string().trim().optional().default(''),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['Administrator', 'Coordinator', 'RTO Manager', 'Staff', 'Industry', 'Student']).optional(),
  department: z.string().trim().optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional(),
  phone: z.string().trim().optional(),
  avatar: z.string().trim().optional(),
});
