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

  dateOfBirth: z.coerce.date({
    message: "Valid date of birth is required",
  }),

  gender: z.enum(["Male", "Female", "Other"]),

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
    .min(1, "Address is required"),

  suburb: z
    .string()
    .trim()
    .min(1, "Suburb is required"),

  state: z
    .string()
    .trim()
    .min(1, "State is required"),

  postCode: z
    .string()
    .trim()
    .min(1, "Post code is required"),

  country: z
    .string()
    .trim()
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
    .min(1, "Course level is required"),

  studyMode: z
    .string()
    .trim()
    .min(1, "Study mode is required"),

  enrollmentId: z
    .string()
    .trim()
    .optional()
    .default(""),

  institute: z
    .string()
    .trim()
    .min(1, "Institute is required"),

  campus: z
    .string()
    .trim()
    .optional()
    .default(""),

  startDate: z.coerce.date(),

  expectedEndDate: z.coerce.date(),

  currentYearSemester: z
    .string()
    .trim()
    .min(1, "Current year/semester is required"),

  attendanceStatus: z
    .string()
    .trim()
    .min(1, "Attendance status is required"),

  academicStatus: z
    .string()
    .trim()
    .min(1, "Academic status is required"),

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
    .min(1, "Assigned RTO is required"),

  courses: z
    .string()
    .trim()
    .min(1, "Course is required"),

  internshipPriority: z
    .string()
    .trim()
    .min(1, "Internship priority is required"),

  studentSource: z
    .string()
    .trim()
    .min(1, "Student source is required"),

  transport: z
    .string()
    .trim()
    .min(1, "Transport is required"),

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

  preferredIndustry: z
    .string()
    .trim()
    .optional()
    .default(""),

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

  // ===== Additional Information =====
  visaStatus: z
    .string()
    .trim()
    .min(1, "Visa status is required"),

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
    .min(1, "Resume selection is required"),

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