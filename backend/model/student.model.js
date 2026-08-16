import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    //* ===== Personal Information =====
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    middleName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    preferredName: {
      type: String,
      trim: true,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female", "Other"],
        message: "Gender must be Male, Female, or Other",
      },
      required: [true, "Gender is required"],
    },
    nationality: {
      type: String,
      trim: true,
      default: "",
    },
    language: {
      type: String,
      trim: true,
      default: "",
    },
    emailAddress: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email address",
      ],
    },
    phoneCode: {
      type: String,
      default: "+61",
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^[+]?[\d\s-]{10,15}$/,
        "Please provide a valid phone number",
      ],
    },
    altPhoneCode: {
      type: String,
      default: "+61",
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },
    waPhoneCode: {
      type: String,
      default: "+61",
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    suburb: {
      type: String,
      required: [true, "Suburb is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    postCode: {
      type: String,
      required: [true, "Post code is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "Australia",
    },

    //* */ ===== Education Details =====
    courseQualification: {
      type: String,
      required: [true, "Course qualification is required"],
      trim: true,
    },
    specialisation: {
      type: String,
      trim: true,
      default: "",
    },
    courseLevel: {
      type: String,
      required: [true, "Course level is required"],
      trim: true,
    },
    studyMode: {
      type: String,
      required: [true, "Study mode is required"],
      trim: true,
    },
    enrollmentId: {
      type: String,
      trim: true,
      default: "",
    },
    institute: {
      type: String,
      required: [true, "Institute is required"],
      trim: true,
    },
    campus: {
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    expectedEndDate: {
      type: Date,
      required: [true, "Expected end date is required"],
    },
    currentYearSemester: {
      type: String,
      required: [true, "Current year/semester is required"],
      trim: true,
    },
    attendanceStatus: {
      type: String,
      required: [true, "Attendance status is required"],
      trim: true,
    },
    academicStatus: {
      type: String,
      required: [true, "Academic status is required"],
      trim: true,
    },
    gpa: {
      type: String,
      trim: true,
      default: "",
    },
    previousQualification: {
      type: String,
      trim: true,
      default: "",
    },
    yearOfCompletion: {
      type: String,
      trim: true,
      default: "",
    },
    documents: {
      type: String,
      default: null,
    },

    //** */ ===== RTO & Source =====
    assignedRto: {
      type: String,
      required: [true, "Assigned RTO is required"],
      trim: true,
    },
    courses: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
    },
    internshipPriority: {
      type: String,
      required: [true, "Internship priority is required"],
      trim: true,
    },
    studentSource: {
      type: String,
      required: [true, "Student source is required"],
      trim: true,
    },
    transport: {
      type: String,
      required: [true, "Transport is required"],
      trim: true,
    },
    preferredLocation: {
      type: String,
      trim: true,
      default: "",
    },
    placementRadius: {
      type: String,
      trim: true,
      default: "",
    },
    preferredIndustry: {
      type: String,
      trim: true,
      default: "",
    },
    availabilityDays: {
      type: Map,
      of: Boolean,
      default: {},
    },
    availabilityFrom: {
      type: String,
      default: "09:00 AM",
    },
    availabilityTo: {
      type: String,
      default: "05:00 PM",
    },
    willingToRelocate: {
      type: String,
      trim: true,
      default: "",
    },
    placementNotes: {
      type: String,
      trim: true,
      default: "",
    },

    // ===== Additional Information =====
    visaStatus: {
      type: String,
      required: [true, "Visa status is required"],
      trim: true,
    },
    visaSubclass: {
      type: String,
      trim: true,
      default: "",
    },
    visaExpiryDate: {
      type: Date,
      default: null,
    },
    workRights: {
      type: String,
      trim: true,
      default: "",
    },
    workExperience: {
      type: String,
      trim: true,
      default: "",
    },
    englishProficiency: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContactName: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      default: "",
    },
    heardAboutUs: {
      type: String,
      trim: true,
      default: "",
    },
    hasResume: {
      type: String,
      required: [true, "Resume selection is required"],
      trim: true,
    },
    resumeFile: {
      type: String,
      default: null,
    },
    additionalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Additional notes cannot exceed 2000 characters"],
      default: "",
    },

    // ===== System / Display Fields =====
    studentId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Pending", "Inactive", "Graduated", "Suspended"],
        message: "Status must be Active, Pending, Inactive, Graduated, or Suspended",
      },
      default: "Active",
    },
    created: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
studentSchema.virtual("name").get(function () {
  return [this.firstName, this.middleName, this.lastName].filter(Boolean).join(" ");
});

// Virtual for age
studentSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return "N/A";
  const age = new Date().getFullYear() - new Date(this.dateOfBirth).getFullYear();
  return `${age} years`;
});

// Virtual for location (suburb)
studentSchema.virtual("location").get(function () {
  return this.suburb;
});

// Virtual for email (alias for emailAddress)
studentSchema.virtual("email").get(function () {
  return this.emailAddress;
});

// Virtual for phone (alias for phoneNumber)
studentSchema.virtual("phone").get(function () {
  return this.phoneNumber;
});

// Virtual for rto (alias for assignedRto)
studentSchema.virtual("rto").get(function () {
  return this.assignedRto;
});

// Virtual for course (alias for courseQualification)
studentSchema.virtual("course").get(function () {
  return this.courseQualification;
});

// Virtual for source (alias for studentSource)
studentSchema.virtual("source").get(function () {
  return this.studentSource;
});

// Ensure virtuals are included in JSON output
studentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

studentSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

const StudentModel = mongoose.model("Student", studentSchema);
export default StudentModel;