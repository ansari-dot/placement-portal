import {
  createWorkflow,
  getAllWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  updateWorkflowStep,
  addStudentsToWorkflow,
  removeStudentFromWorkflow,
  createInternshipRequest,
  updateInternshipRequest,
  deleteInternshipRequest,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  createInternship,
  updateInternship,
  deleteInternship,
  getWorkflowDashboardData,
  getWorkflowStudents,
} from "../service/workflow.service.js";
import {
  workflowSchema,
  internshipRequestSchema,
  appointmentSchema,
  internshipSchema,
} from "../validator/workflowValidator.js";

// Helper to handle Zod validation errors
const handleValidationError = (error, res) => {
  if (error.name === "ZodError") {
    return res.status(400).json({
      message: "Validation failed",
      success: false,
      errors: error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }
  return res.status(400).json({ message: error.message, success: false });
};

// ===== Workflow CRUD Controllers =====
export const createWorkflowController = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = workflowSchema.parse(req.body);
    const workflow = await createWorkflow(validatedData);

    res.status(201).json({
      message: "Workflow created successfully",
      success: true,
      data: workflow,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

export const getAllWorkflowsController = async (req, res) => {
  try {
    const workflows = await getAllWorkflows();
    res.status(200).json({
      message: "Workflows fetched successfully",
      success: true,
      data: workflows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const getWorkflowByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await getWorkflowById(id);

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Workflow fetched successfully",
      success: true,
      data: workflow,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const updateWorkflowController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = workflowSchema.partial().parse(req.body);
    const workflow = await updateWorkflow(id, validatedData);

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Workflow updated successfully",
      success: true,
      data: workflow,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

export const deleteWorkflowController = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await deleteWorkflow(id);

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Workflow deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// ===== Workflow Step Controllers =====
export const updateWorkflowStepController = async (req, res) => {
  try {
    const { id } = req.params;
    const { step } = req.body;

    if (!step || step < 1 || step > 4) {
      return res.status(400).json({
        message: "Step must be between 1 and 4",
        success: false,
      });
    }

    const workflow = await updateWorkflowStep(id, step);

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Workflow step updated successfully",
      success: true,
      data: workflow,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// ===== Students in Workflow Controllers =====
export const addStudentsToWorkflowController = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        message: "studentIds array is required",
        success: false,
      });
    }

    const workflow = await addStudentsToWorkflow(id, studentIds);

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Students added to workflow successfully",
      success: true,
      data: workflow,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const removeStudentFromWorkflowController = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const workflow = await removeStudentFromWorkflow(id, studentId);

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Student removed from workflow successfully",
      success: true,
      data: workflow,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// ===== Internship Request Controllers (Step 2) =====
export const createInternshipRequestController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = internshipRequestSchema.parse(req.body);
    const request = await createInternshipRequest(id, validatedData);

    if (!request) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(201).json({
      message: "Internship request created successfully",
      success: true,
      data: request,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

export const updateInternshipRequestController = async (req, res) => {
  try {
    const { id, requestId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = internshipRequestSchema.partial().parse(req.body);
    const request = await updateInternshipRequest(id, requestId, validatedData);

    if (!request) {
      return res.status(404).json({
        message: "Internship request not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Internship request updated successfully",
      success: true,
      data: request,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

export const deleteInternshipRequestController = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const request = await deleteInternshipRequest(id, requestId);

    if (!request) {
      return res.status(404).json({
        message: "Internship request not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Internship request deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// ===== Appointment Controllers (Step 3) =====
export const createAppointmentController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = appointmentSchema.parse(req.body);
    const appointment = await createAppointment(id, validatedData);

    if (!appointment) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(201).json({
      message: "Appointment created successfully",
      success: true,
      data: appointment,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

export const updateAppointmentController = async (req, res) => {
  try {
    const { id, appointmentId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = appointmentSchema.partial().parse(req.body);
    const appointment = await updateAppointment(id, appointmentId, validatedData);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Appointment updated successfully",
      success: true,
      data: appointment,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

export const deleteAppointmentController = async (req, res) => {
  try {
    const { id, appointmentId } = req.params;
    const appointment = await deleteAppointment(id, appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Appointment deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// ===== Internship Controllers (Step 4) =====
export const createInternshipController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = internshipSchema.parse(req.body);
    const internship = await createInternship(id, validatedData);

    if (!internship) {
      return res.status(404).json({
        message: "Workflow not found",
        success: false,
      });
    }

    res.status(201).json({
      message: "Internship created successfully",
      success: true,
      data: internship,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

export const updateInternshipController = async (req, res) => {
  try {
    const { id, internshipId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = internshipSchema.partial().parse(req.body);
    const internship = await updateInternship(id, internshipId, validatedData);

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Internship updated successfully",
      success: true,
      data: internship,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

export const deleteInternshipController = async (req, res) => {
  try {
    const { id, internshipId } = req.params;
    const internship = await deleteInternship(id, internshipId);

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Internship deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// ===== Dashboard & Students Controllers =====
export const getWorkflowDashboardDataController = async (req, res) => {
  try {
    const data = await getWorkflowDashboardData();
    res.status(200).json({
      message: "Workflow dashboard data fetched successfully",
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const getWorkflowStudentsController = async (req, res) => {
  try {
    const students = await getWorkflowStudents();
    res.status(200).json({
      message: "Workflow students fetched successfully",
      success: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};