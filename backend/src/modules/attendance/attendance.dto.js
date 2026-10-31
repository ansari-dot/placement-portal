import { z } from 'zod';

export const createAttendanceSchema = z.object({
  student: z.string().trim().optional(),
  studentId: z.string().trim().min(1, 'Student ID is required'),
  date: z.string().trim().min(1, 'Date is required'),
  startTime: z.string().trim().optional().default('09:00 AM'),
  finishTime: z.string().trim().optional().default('05:00 PM'),
  breakMinutes: z.coerce.number().min(0).optional().default(0),
  totalHours: z.coerce.number().optional(),
  status: z.enum(['Present', 'Absent', 'Late', 'Half Day', 'Completed', 'Sick Leave', 'Excused']).optional().default('Present'),
  notes: z.string().trim().optional().default(''),
  facilityName: z.string().trim().optional().default(''),
  placement: z.string().trim().optional(),
  placementId: z.string().trim().optional(),
});

export const updateAttendanceSchema = createAttendanceSchema.partial();
