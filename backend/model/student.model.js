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
      default: null,
    },
    gender: {
      type: String,
      trim: true,
      default: "",
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
      trim: true,
      default: "",
    },
    suburb: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    postCode: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
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
      trim: true,
      default: "",
    },
    studyMode: {
      type: String,
      trim: true,
      default: "",
    },
    enrollmentId: {
      type: String,
      trim: true,
      default: "",
    },
    institute: {
      type: String,
      trim: true,
      default: "",
    },
    campus: {
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: Date,
      default: null,
    },
    expectedEndDate: {
      type: Date,
      default: null,
    },
    currentYearSemester: {
      type: String,
      trim: true,
      default: "",
    },
    attendanceStatus: {
      type: String,
      trim: true,
      default: "",
    },
    academicStatus: {
      type: String,
      trim: true,
      default: "",
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
      trim: true,
      default: "",
    },
    courses: {
      type: String,
      trim: true,
      default: "",
    },
    internshipPriority: {
      type: String,
      trim: true,
      default: "Normal",
    },
    studentSource: {
      type: String,
      trim: true,
      default: "",
    },
    transport: {
      type: String,
      trim: true,
      default: "",
    },
    licenceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    policeCheckDoc: {
      type: String,
      default: null,
    },
    covidCheckDoc: {
      type: String,
      default: null,
    },
    additionalDocuments: [
      {
        title: { type: String, trim: true, default: "" },
        file: { type: String, default: "" },
      }
    ],
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
    placementSite: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    preferredIndustry: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
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
    placementHours: {
      type: Number,
      default: null,
    },

    // ===== Contacted Industries / Placement History =====
    contactedIndustries: [
      {
        organizationName: { type: String, trim: true, default: "" },
        email: { type: String, trim: true, default: "" },
        address: { type: String, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
        contactPerson: { type: String, trim: true, default: "" },
        industryType: { type: String, trim: true, default: "" },
        notes: { type: String, trim: true, default: "" },
        response: { type: String, trim: true, default: "" },
        contactedDate: { type: Date, default: Date.now }
      }
    ],

    // ===== Additional Information =====
    visaStatus: {
      type: String,
      trim: true,
      default: "",
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
      trim: true,
      default: "No",
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

    // ===== Coordinator Assignment =====
    assignedCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedCoordinatorName: {
      type: String,
      default: '',
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