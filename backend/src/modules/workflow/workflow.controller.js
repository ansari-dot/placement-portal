import StudentModel from '../student/student.model.js';
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
} from './workflow.service.js';
import { checkAndSendPlacementAlerts } from '../email/email.service.js';
import {
  workflowSchema,
  internshipRequestSchema,
  appointmentSchema,
  internshipSchema,
} from './workflow.dto.js';

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
        ],
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
    console.warn('filterWorkflowForUser error:', err.message);
    return workflow;
  }
};

export const createWorkflowController = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is missing' });
    }

    const validatedData = workflowSchema.parse(req.body);
    const workflow = await createWorkflow(validatedData);

    res.status(201).json({
      message: 'Workflow created successfully',
      success: true,
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllWorkflowsController = async (req, res, next) => {
  try {
    const workflows = await getAllWorkflows();
    const filteredWorkflows = await Promise.all(
      workflows.map((wf) => filterWorkflowForUser(wf, req.user))
    );
    res.status(200).json({
      message: 'Workflows fetched successfully',
      success: true,
      data: filteredWorkflows,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflowByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workflow = await getWorkflowById(id);

    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    const filteredWorkflow = await filterWorkflowForUser(workflow, req.user);

    res.status(200).json({
      message: 'Workflow fetched successfully',
      success: true,
      data: filteredWorkflow,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkflowController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is missing' });
    }

    const validatedData = workflowSchema.partial().parse(req.body);
    const workflow = await updateWorkflow(id, validatedData);

    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Workflow updated successfully',
      success: true,
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkflowController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workflow = await deleteWorkflow(id);

    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Workflow deleted successfully',
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkflowStepController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { step } = req.body;

    if (!step || step < 1 || step > 4) {
      return res.status(400).json({
        message: 'Step must be between 1 and 4',
        success: false,
      });
    }

    const workflow = await updateWorkflowStep(id, step);

    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Workflow step updated successfully',
      success: true,
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
};

export const addStudentsToWorkflowController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        message: 'studentIds array is required',
        success: false,
      });
    }

    const workflow = await addStudentsToWorkflow(id, studentIds);

    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Students added to workflow successfully',
      success: true,
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
};

export const removeStudentFromWorkflowController = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;
    const workflow = await removeStudentFromWorkflow(id, studentId);

    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Student removed from workflow successfully',
      success: true,
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
};

export const createInternshipRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is missing' });
    }

    const validatedData = internshipRequestSchema.parse(req.body);
    const request = await createInternshipRequest(id, validatedData);

    if (!request) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    res.status(201).json({
      message: 'Internship request created successfully',
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInternshipRequestController = async (req, res, next) => {
  try {
    const { id, requestId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is missing' });
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
        message: 'Internship request not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Internship request updated successfully',
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInternshipRequestController = async (req, res, next) => {
  try {
    const { id, requestId } = req.params;
    const request = await deleteInternshipRequest(id, requestId);

    if (!request) {
      return res.status(404).json({
        message: 'Internship request not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Internship request deleted successfully',
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointmentController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is missing' });
    }

    const validatedData = appointmentSchema.parse(req.body);
    const appointment = await createAppointment(id, validatedData);

    if (!appointment) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    res.status(201).json({
      message: 'Appointment created successfully',
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentController = async (req, res, next) => {
  try {
    const { id, appointmentId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is missing' });
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
        message: 'Appointment not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Appointment updated successfully',
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAppointmentController = async (req, res, next) => {
  try {
    const { id, appointmentId } = req.params;
    const appointment = await deleteAppointment(id, appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Appointment deleted successfully',
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const createInternshipController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is missing' });
    }

    const validatedData = internshipSchema.parse(req.body);
    const internship = await createInternship(id, validatedData);

    if (!internship) {
      return res.status(404).json({
        message: 'Workflow not found',
        success: false,
      });
    }

    res.status(201).json({
      message: 'Internship created successfully',
      success: true,
      data: internship,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInternshipController = async (req, res, next) => {
  try {
    const { id, internshipId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is missing' });
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
        message: 'Internship not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Internship updated successfully',
      success: true,
      data: internship,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInternshipController = async (req, res, next) => {
  try {
    const { id, internshipId } = req.params;
    const internship = await deleteInternship(id, internshipId);

    if (!internship) {
      return res.status(404).json({
        message: 'Internship not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Internship deleted successfully',
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflowDashboardDataController = async (req, res, next) => {
  try {
    const data = await getWorkflowDashboardData();
    res.status(200).json({
      message: 'Workflow dashboard data fetched successfully',
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflowStudentsController = async (req, res, next) => {
  try {
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
      message: 'Workflow students fetched successfully',
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const checkPlacementAlertsController = async (req, res, next) => {
  try {
    const result = await checkAndSendPlacementAlerts();
    res.status(200).json({
      message: 'Placement alert check completed',
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
