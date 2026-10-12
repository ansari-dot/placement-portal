import { z } from 'zod';

export const createAttendanceSchema = z.object({
  studentId: z.string().trim().min(1, 'Student ID is required'),
  date: z.string().trim().min(1, 'Date is required'),
  startTime: z.string().trim().optional().default('09:00 AM'),
  finishTime: z.string().trim().optional().default('05:00 PM'),
  totalHours: z.coerce.number().optional(),
  status: z.enum(['Present', 'Absent', 'Late', 'Half Day', 'Sick Leave']).optional().default('Present'),
  notes: z.string().trim().optional().default(''),
  facilityName: z.string().trim().optional().default(''),
});

export const updateAttendanceSchema = createAttendanceSchema.partial();
