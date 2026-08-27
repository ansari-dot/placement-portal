// workflow.model.js
import mongoose from "mongoose";

// ===== Internship Request Schema (Step 2) =====
const internshipRequestSchema = new mongoose.Schema(
  {
    reqId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, "Internship title is required"],
      trim: true,
    },
    student: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
    },
    rto: {
      type: String,
      required: [true, "RTO is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          "New",
          "Coordinator Review",
          "RTO Review",
          "Appointment",
          "Approved",
          "Rejected",
          "On Hold",
        ],
        message: "Invalid request status",
      },
      default: "New",
    },
    preferredStart: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      trim: true,
      default: "",
    },
    workType: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    coordinator: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: String,
      trim: true,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Normal", "Urgent"],
      default: "Normal",
    },
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
        contactedDate: { type: Date, default: Date.now },
        // ✅ NEW: Appointment fields
        appointmentDate: { type: String, trim: true, default: "" },
        appointmentTime: { type: String, trim: true, default: "" },
      }
    ],
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ===== Appointment Schema (Step 3) - FIXED =====
const appointmentSchema = new mongoose.Schema(
  {
    apptId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    student: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
    },
    rto: {
      type: String,
      required: [true, "RTO is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: String,
      required: [true, "Appointment date is required"],
      trim: true,
    },
    time: {
      type: String,
      required: [true, "Appointment time is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
    },
    interviewer: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    meetingType: {
      type: String,
      enum: {
        values: ["In-Person", "Video", "Phone"],
        message: "Meeting type must be In-Person, Video, or Phone",
      },
      default: "In-Person",
    },
    position: {
      type: String,
      trim: true,
      default: "",
    },
    linkedReq: {
      type: String,
      trim: true,
      default: "",
    },
    linkedReqStatus: {
      type: String,
      trim: true,
      default: "",
    },
    industryContactId: {
      type: String,
      trim: true,
      default: "",
    },
    // ✅ FIX: Added 'Withdrawn' and 'Declined' to status enum
    status: {
      type: String,
      enum: {
        values: [
          "Scheduled",
          "Completed",
          "Cancelled",
          "Rescheduled",
          "No Show",
          "Withdrawn",
          "Declined"
        ],
        message: "Invalid appointment status",
      },
      default: "Scheduled",
    },
    // ✅ NEW: Cancellation fields
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    cancellationType: {
      type: String,
      enum: {
        values: ["student", "industry", "withdrawn", "other"],
        message: "Invalid cancellation type",
      },
      default: "student",
    },
    cancelledAt: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ===== Internship Schema (Step 4) - FIXED =====
const internshipSchema = new mongoose.Schema(
  {
    intId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, "Internship title is required"],
      trim: true,
    },
    student: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
    },
    rto: {
      type: String,
      trim: true,
      default: "",
    },
    // ✅ FIX: Added 'Declined' and 'Withdrawn' to status enum
    status: {
      type: String,
      enum: {
        values: [
          "Active",
          "Joined",
          "Waiting to Join",
          "Completed",
          "Cancelled",
          "On Hold",
          "Declined",
          "Withdrawn"
        ],
        message: "Invalid internship status",
      },
      default: "Active",
    },
    start: {
      type: String,
      trim: true,
      default: "",
    },
    end: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      trim: true,
      default: "",
    },
    workType: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    coordinator: {
      type: String,
      trim: true,
      default: "",
    },
    progress: {
      type: Number,
      min: [0, "Progress cannot be less than 0"],
      max: [100, "Progress cannot exceed 100"],
      default: 0,
    },
    tasksCompleted: {
      type: String,
      trim: true,
      default: "",
    },
    trainingCompleted: {
      type: String,
      trim: true,
      default: "",
    },
    reviewsCompleted: {
      type: String,
      trim: true,
      default: "",
    },
    // ✅ NEW: Cancellation fields for internships
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    cancellationType: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ===== Workflow Schema (Master container) =====
const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workflow name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Completed", "On Hold", "Cancelled"],
        message: "Invalid workflow status",
      },
      default: "Active",
    },
    currentStep: {
      type: Number,
      min: [1, "Step must be at least 1"],
      max: [4, "Step cannot exceed 4"],
      default: 1,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    requests: [internshipRequestSchema],
    appointments: [appointmentSchema],
    internships: [internshipSchema],
    createdBy: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure virtuals are included in JSON output
workflowSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

workflowSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
    delete ret._id;
    return ret;
  },
});

// Export sub-schemas for use in services
export const InternshipRequestModel = mongoose.model(
  "InternshipRequest",
  internshipRequestSchema
);
export const AppointmentModel = mongoose.model("Appointment", appointmentSchema);
export const InternshipModel = mongoose.model("Internship", internshipSchema);

const WorkflowModel = mongoose.model("Workflow", workflowSchema);
export default WorkflowModel;