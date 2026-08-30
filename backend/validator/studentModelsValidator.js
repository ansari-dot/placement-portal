import { z } from "zod";

//! Define the Zod schema for student validation
export const studentSchema = z.object({
  // ===== Personal Information =====
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),

  middleName: z
    .string()
    .trim()
    .optional()
    .default(""),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),

  preferredName: z
    .string()
    .trim()
    .optional()
    .default(""),

  dateOfBirth: z.coerce.date().nullable().optional(),

  gender: z
    .string()
    .trim()
    .optional()
    .default(""),

  nationality: z
    .string()
    .trim()
    .optional()
    .default(""),

  language: z
    .string()
    .trim()
    .optional()
    .default(""),

  emailAddress: z
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),

  phoneCode: z
    .string()
    .default("+61"),

  phoneNumber: z
    .string()
    .trim()
    .regex(
      /^[+]?[\d\s-]{10,15}$/,
      "Please provide a valid phone number"
    ),

  altPhoneCode: z
    .string()
    .optional()
    .default("+61"),

  alternatePhone: z
    .string()
    .trim()
    .optional()
    .default(""),

  waPhoneCode: z
    .string()
    .optional()
    .default("+61"),

  whatsappNumber: z
    .string()
    .trim()
    .optional()
    .default(""),

  address: z
    .string()
    .trim()
    .optional()
    .default(""),

  suburb: z
    .string()
    .trim()
    .optional()
    .default(""),

  state: z
    .string()
    .trim()
    .optional()
    .default(""),

  postCode: z
    .string()
    .trim()
    .optional()
    .default(""),

  country: z
    .string()
    .trim()
    .optional()
    .default("Australia"),

  // ===== Education Details =====
  courseQualification: z
    .string()
    .trim()
    .min(1, "Course qualification is required"),

  specialisation: z
    .string()
    .trim()
    .optional()
    .default(""),

  courseLevel: z
    .string()
    .trim()
    .optional()
    .default(""),

  studyMode: z
    .string()
    .trim()
    .optional()
    .default(""),


  enrollmentId: z
    .string()
    .trim()
    .optional()
    .default(""),

  institute: z
    .string()
    .trim()
    .optional()
    .default(""),

  campus: z
    .string()
    .trim()
    .optional()
    .default(""),

  startDate: z.coerce.date().nullable().optional(),

  expectedEndDate: z.coerce.date().nullable().optional(),

  currentYearSemester: z
    .string()
    .trim()
    .optional()
    .default(""),

  attendanceStatus: z
    .string()
    .trim()
    .optional()
    .default(""),

  academicStatus: z
    .string()
    .trim()
    .optional()
    .default(""),

  gpa: z
    .string()
    .trim()
    .optional()
    .default(""),

  previousQualification: z
    .string()
    .trim()
    .optional()
    .default(""),

  yearOfCompletion: z
    .string()
    .trim()
    .optional()
    .default(""),

  documents: z
    .string()
    .nullable()
    .optional()
    .default(null),

  // ===== RTO & Source =====
  assignedRto: z
    .string()
    .trim()
    .optional()
    .default(""),

  courses: z
    .string()
    .trim()
    .optional()
    .default(""),

  internshipPriority: z
    .string()
    .trim()
    .optional()
    .default("Normal"),

  studentSource: z
    .string()
    .trim()
    .optional()
    .default(""),

  transport: z
    .string()
    .trim()
    .optional()
    .default(""),

  licenceNumber: z
    .string()
    .trim()
    .optional()
    .default(""),

  policeCheckDoc: z
    .string()
    .nullable()
    .optional()
    .default(null),

  covidCheckDoc: z
    .string()
    .nullable()
    .optional()
    .default(null),

  additionalDocuments: z
    .any()
    .optional()
    .default([]),

  preferredLocation: z
    .string()
    .trim()
    .optional()
    .default(""),

  placementRadius: z
    .string()
    .trim()
    .optional()
    .default(""),

  placementSite: z
    .any()
    .optional()
    .default([]),

  preferredIndustry: z
    .any()
    .optional()
    .default([]),

  availabilityDays: z
    .record(z.string(), z.boolean())
    .optional()
    .default({}),

  availabilityFrom: z
    .string()
    .default("09:00 AM"),

  availabilityTo: z
    .string()
    .default("05:00 PM"),

  willingToRelocate: z
    .string()
    .trim()
    .optional()
    .default(""),

  placementNotes: z
    .string()
    .trim()
    .optional()
    .default(""),

  placementHours: z
    .coerce
    .number()
    .nullable()
    .optional()
    .default(null),

  // ===== Additional Information =====
  visaStatus: z
    .string()
    .trim()
    .optional()
    .default(""),

  visaSubclass: z
    .string()
    .trim()
    .optional()
    .default(""),

  visaExpiryDate: z
    .coerce
    .date()
    .nullable()
    .optional()
    .default(null),

  workRights: z
    .string()
    .trim()
    .optional()
    .default(""),

  workExperience: z
    .string()
    .trim()
    .optional()
    .default(""),

  englishProficiency: z
    .string()
    .trim()
    .optional()
    .default(""),

  emergencyContactName: z
    .string()
    .trim()
    .optional()
    .default(""),

  emergencyContactPhone: z
    .string()
    .trim()
    .optional()
    .default(""),

  heardAboutUs: z
    .string()
    .trim()
    .optional()
    .default(""),

  hasResume: z
    .string()
    .trim()
    .optional()
    .default("No"),

  resumeFile: z
    .string()
    .nullable()
    .optional()
    .default(null),

  additionalNotes: z
    .string()
    .trim()
    .max(2000, "Additional notes cannot exceed 2000 characters")
    .optional()
    .default(""),

  // ===== Coordinator Assignment =====
  assignedCoordinator: z
    .string()
    .nullable()
    .optional()
    .default(null),

  assignedCoordinatorName: z
    .string()
    .trim()
    .optional()
    .default(''),

  // ===== System / Display Fields =====
  studentId: z
    .string()
    .trim()
    .uppercase()
    .optional(),

  avatar: z
    .string()
    .optional()
    .default(""),

  status: z
    .enum(["Active", "Pending", "Inactive", "Graduated", "Suspended"])
    .optional()
    .default("Active"),

  created: z
    .string()
    .optional()
    .default(""),
});