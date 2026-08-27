// workflowValidator.js
import { z } from "zod";

// ===== Workflow Schema =====
export const workflowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workflow name is required")
    .max(100, "Workflow name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .optional()
    .default(""),

  status: z
    .enum(["Active", "Completed", "On Hold", "Cancelled"])
    .optional()
    .default("Active"),

  currentStep: z
    .number()
    .int()
    .min(1, "Step must be at least 1")
    .max(4, "Step cannot exceed 4")
    .optional()
    .default(1),

  students: z
    .array(z.string())
    .optional()
    .default([]),

  createdBy: z
    .string()
    .trim()
    .optional()
    .default(""),
});

// ===== Internship Request Schema (Step 2) =====
export const internshipRequestSchema = z.object({
  reqId: z
    .string()
    .trim()
    .uppercase()
    .optional(),

  title: z
    .string()
    .trim()
    .min(1, "Internship title is required"),

  student: z
    .string()
    .trim()
    .min(1, "Student name is required"),

  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required"),

  company: z
    .string()
    .trim()
    .min(1, "Company is required"),

  rto: z
    .string()
    .trim()
    .optional()
    .default(""),

  status: z
    .enum(["New", "Coordinator Review", "RTO Review", "Appointment", "Approved", "Rejected", "On Hold"])
    .optional()
    .default("New"),

  preferredStart: z
    .string()
    .trim()
    .optional()
    .default(""),

  duration: z
    .string()
    .trim()
    .optional()
    .default(""),

  workType: z
    .string()
    .trim()
    .optional()
    .default(""),

  location: z
    .string()
    .trim()
    .optional()
    .default(""),

  coordinator: z
    .string()
    .trim()
    .optional()
    .default(""),

  date: z
    .string()
    .trim()
    .optional()
    .default(""),

  priority: z
    .enum(["Normal", "Urgent"])
    .optional()
    .default("Normal"),

  contactedIndustries: z
    .array(
      z.object({
        organizationName: z.string().trim().optional().default(""),
        email: z.string().trim().optional().default(""),
        address: z.string().trim().optional().default(""),
        phone: z.string().trim().optional().default(""),
        contactPerson: z.string().trim().optional().default(""),
        industryType: z.string().trim().optional().default(""),
        notes: z.string().trim().optional().default(""),
        response: z.string().trim().optional().default("Waiting for Response"),
        contactedDate: z.any().optional(),
        appointmentDate: z.string().trim().optional().default(""),
        appointmentTime: z.string().trim().optional().default(""),
      })
    )
    .optional()
    .default([]),

  notes: z
    .string()
    .trim()
    .optional()
    .default(""),
});

// ===== Appointment Schema (Step 3) - FIXED =====
export const appointmentSchema = z.object({
  apptId: z
    .string()
    .trim()
    .uppercase()
    .optional(),

  student: z
    .string()
    .trim()
    .min(1, "Student name is required"),

  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required"),

  rto: z
    .string()
    .trim()
    .min(1, "RTO is required"),

  email: z
    .string()
    .email("Please provide a valid email address")
    .or(z.literal(""))
    .optional()
    .default(""),

  phone: z
    .string()
    .trim()
    .optional()
    .default(""),

  date: z
    .string()
    .trim()
    .min(1, "Appointment date is required"),

  time: z
    .string()
    .trim()
    .min(1, "Appointment time is required"),

  company: z
    .string()
    .trim()
    .min(1, "Company is required"),

  interviewer: z
    .string()
    .trim()
    .optional()
    .default(""),

  location: z
    .string()
    .trim()
    .optional()
    .default(""),

  meetingType: z
    .enum(["In-Person", "Video", "Phone"])
    .optional()
    .default("In-Person"),

  position: z
    .string()
    .trim()
    .optional()
    .default(""),

  linkedReq: z
    .string()
    .trim()
    .optional()
    .default(""),

  linkedReqStatus: z
    .string()
    .trim()
    .optional()
    .default(""),

  industryContactId: z
    .string()
    .trim()
    .optional()
    .default(""),

  // ✅ FIX: Added 'Withdrawn' and 'Declined'
  status: z
    .enum(["Scheduled", "Completed", "Cancelled", "Rescheduled", "No Show", "Withdrawn", "Declined"])
    .optional()
    .default("Scheduled"),

  cancellationReason: z
    .string()
    .trim()
    .optional()
    .default(""),

  cancellationType: z
    .enum(["student", "industry", "withdrawn", "other"])
    .optional()
    .default("student"),

  cancelledAt: z
    .string()
    .trim()
    .optional()
    .default(""),

  notes: z
    .string()
    .trim()
    .optional()
    .default(""),
});

// ===== Internship Schema (Step 4) - FIXED =====
export const internshipSchema = z.object({
  intId: z
    .string()
    .trim()
    .uppercase()
    .optional(),

  title: z
    .string()
    .trim()
    .min(1, "Internship title is required"),

  student: z
    .string()
    .trim()
    .min(1, "Student name is required"),

  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required"),

  company: z
    .string()
    .trim()
    .min(1, "Company is required"),

  rto: z
    .string()
    .trim()
    .optional()
    .default(""),

  // ✅ FIX: Added 'Declined' and 'Withdrawn'
  status: z
    .enum(["Active", "Joined", "Waiting to Join", "Completed", "Cancelled", "On Hold", "Declined", "Withdrawn"])
    .optional()
    .default("Active"),

  start: z
    .string()
    .trim()
    .optional()
    .default(""),

  end: z
    .string()
    .trim()
    .optional()
    .default(""),

  duration: z
    .string()
    .trim()
    .optional()
    .default(""),

  workType: z
    .string()
    .trim()
    .optional()
    .default(""),

  location: z
    .string()
    .trim()
    .optional()
    .default(""),

  coordinator: z
    .string()
    .trim()
    .optional()
    .default(""),

  progress: z
    .number()
    .min(0, "Progress cannot be less than 0")
    .max(100, "Progress cannot exceed 100")
    .optional()
    .default(0),

  tasksCompleted: z
    .string()
    .trim()
    .optional()
    .default(""),

  trainingCompleted: z
    .string()
    .trim()
    .optional()
    .default(""),

  reviewsCompleted: z
    .string()
    .trim()
    .optional()
    .default(""),

  cancellationReason: z
    .string()
    .trim()
    .optional()
    .default(""),

  cancellationType: z
    .string()
    .trim()
    .optional()
    .default(""),

  notes: z
    .string()
    .trim()
    .optional()
    .default(""),
});