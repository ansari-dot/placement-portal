import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Non-admin roles permitted for public registration
export const ALLOWED_SIGNUP_ROLES = [
  'RTO',
  'RTO Manager',
  'Student',
  'Placement Coordinator',
  'Coordinator',
  'Industry',
  'Industry/Host',
];

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password cannot exceed 128 characters'),
  role: z.enum(
    [
      'RTO',
      'RTO Manager',
      'Student',
      'Placement Coordinator',
      'Coordinator',
      'Industry',
      'Industry/Host',
    ],
    {
      errorMap: () => ({
        message: 'Invalid role selected. Public signup only supports RTO, Student, Placement Coordinator, or Industry/Host.',
      }),
    }
  ),
  phone: z.string().trim().optional().default(''),
  // Role-specific registration requests
  rtoName: z.string().trim().optional().default(''),
  facilityName: z.string().trim().optional().default(''),
  course: z.string().trim().optional().default(''),
  studentId: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
});
