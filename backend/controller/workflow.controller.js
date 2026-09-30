import StudentModel from "../model/student.model.js";
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
import { checkAndSendPlacementAlerts } from "../service/email.service.js";
import {
  workflowSchema,
  internshipRequestSchema,
  appointmentSchema,
  internshipSchema,
} from "../validator/workflowValidator.js";

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

// Filter workflow subdocuments dynamically: Coordinators only see their assigned students, Admins see all
const filterWorkflowForUser = async (workflow, user) => {
  if (!workflow) return workflow;
  if (!user || user.role === 'Administrator') return workflow;

  try {
    const assignedStudents = await StudentModel.find(
      {
        $or: [
          { assignedCoordinator: user._id },
          { assignedCoordinator: String(user._id) },
          { assignedCoordinatorName: user.name },
          { assignedCoordinatorEmail: user.email },
        ]
      },
      { _id: 1, studentId: 1, firstName: 1, lastName: 1, name: 1 }
    );

    const allowedKeys = new Set();
    assignedStudents.forEach((stu) => {
      if (stu._id) allowedKeys.add(String(stu._id).toLowerCase());
      if (stu.studentId) allowedKeys.add(String(stu.studentId).toLowerCase());
      const fullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim().toLowerCase();
      const name = String(stu.name || fullName).trim().toLowerCase();
      if (name) allowedKeys.add(name);
    });

    const wfObj = workflow.toObject ? workflow.toObject() : JSON.parse(JSON.stringify(workflow));

    if (Array.isArray(wfObj.appointments)) {
      wfObj.appointments = wfObj.appointments.filter((a) => {
        const aId = String(a.studentId || '').toLowerCase();
        const aName = String(a.student || '').toLowerCase();
        return allowedKeys.has(aId) || allowedKeys.has(aName);
      });
    }

    if (Array.isArray(wfObj.requests)) {
      wfObj.requests = wfObj.requests.filter((r) => {
        const rId = String(r.studentId || '').toLowerCase();
        const rName = String(r.student || '').toLowerCase();
        return allowedKeys.has(rId) || allowedKeys.has(rName);
      });
    }

    if (Array.isArray(wfObj.students)) {
      wfObj.students = wfObj.students.filter((s) => {
        const sId = String(s._id || s.id || s.studentId || '').toLowerCase();
        return allowedKeys.has(sId);
      });
    }

    return wfObj;
  } catch (err) {
    console.warn("filterWorkflowForUser error:", err.message);
    return workflow;
  }
};

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
    const filteredWorkflows = await Promise.all(
      workflows.map((wf) => filterWorkflowForUser(wf, req.user))
    );
    res.status(200).json({
      message: "Workflows fetched successfully",
      success: true,
      data: filteredWorkflows,
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

    const filteredWorkflow = await filterWorkflowForUser(workflow, req.user);

    res.status(200).json({
      message: "Workflow fetched successfully",
      success: true,
      data: filteredWorkflow,
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

// FIXED: internshipRequestSchema.partial() still fills in `.default()`
// values for every field the client did NOT send (rto: "", status: "New",
// priority: "Normal", workType: "", notes: "" ...). That was silently
// wiping real data every time "Add Industry" (or any partial update) ran,
// and could cause the request to look "gone". We now only forward the
// keys the client actually sent in req.body.
export const updateInternshipRequestController = async (req, res) => {
  try {
    const { id, requestId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const validatedData = internshipRequestSchema.partial().parse(req.body);

    const cleanedData = {};
    Object.keys(req.body).forEach((key) => {
      if (key in validatedData) {
        cleanedData[key] = validatedData[key];
      }
    });

    const request = await updateInternshipRequest(id, requestId, cleanedData);

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

    const cleanedData = {};
    Object.keys(req.body).forEach((key) => {
      if (key in validatedData) {
        cleanedData[key] = validatedData[key];
      }
    });

    const appointment = await updateAppointment(id, appointmentId, cleanedData);

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

    const cleanedData = {};
    Object.keys(req.body).forEach((key) => {
      if (key in validatedData) {
        cleanedData[key] = validatedData[key];
      }
    });

    const internship = await updateInternship(id, internshipId, cleanedData);

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
    // Non-admin users only see students assigned to them
    let filter = {};
    if (req.user && req.user.role !== 'Administrator') {
      filter = { assignedCoordinator: req.user._id };
    } else if (req.query.coordinatorId) {
      if (req.query.coordinatorId === 'unassigned') {
        filter = { $or: [{ assignedCoordinator: null }, { assignedCoordinator: { $exists: false } }] };
      } else {
        filter = { assignedCoordinator: req.query.coordinatorId };
      }
    }
    const students = await getWorkflowStudents(filter);
    res.status(200).json({
      message: "Workflow students fetched successfully",
      success: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// ─── Placement Ending-Soon Alert Controller ───────────────────────────────────
// POST /workflows/check-placement-alerts
// Manually triggers (or is called by the scheduler) to scan all placements
// whose expectedCompletionDate is within 7 days and send email + in-app alerts.
export const checkPlacementAlertsController = async (req, res) => {
  try {
    const result = await checkAndSendPlacementAlerts();
    res.status(200).json({
      message: "Placement alert check completed",
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};
