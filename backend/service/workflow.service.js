import WorkflowModel, {
  InternshipRequestModel,
  AppointmentModel,
  InternshipModel,
} from "../model/workflow.model.js";
import StudentModel from "../model/student.model.js";

// ===== ID Generators =====
const generateReqId = async () => {
  const prefix = "REQ";
  const lastReq = await InternshipRequestModel.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastReq?.reqId) {
    const lastNumber = parseInt(lastReq.reqId.split("-")[1], 10);
    if (!Number.isNaN(lastNumber)) {
      newIdNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${newIdNumber.toString().padStart(6, "0")}`;
};

const generateApptId = async () => {
  const prefix = "APPT";
  const lastAppt = await AppointmentModel.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastAppt?.apptId) {
    const lastNumber = parseInt(lastAppt.apptId.split("-")[1], 10);
    if (!Number.isNaN(lastNumber)) {
      newIdNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${newIdNumber.toString().padStart(6, "0")}`;
};

const generateIntId = async () => {
  const prefix = "INT";
  const lastInt = await InternshipModel.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastInt?.intId) {
    const lastNumber = parseInt(lastInt.intId.split("-")[1], 10);
    if (!Number.isNaN(lastNumber)) {
      newIdNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${newIdNumber.toString().padStart(6, "0")}`;
};

// ===== Workflow CRUD =====
export const createWorkflow = async (workflowData) => {
  const workflow = await WorkflowModel.create(workflowData);
  return workflow;
};

export const getAllWorkflows = async () => {
  return await WorkflowModel.find().sort({ createdAt: -1 }).populate("students");
};

export const getWorkflowById = async (id) => {
  return await WorkflowModel.findById(id).populate("students");
};

export const updateWorkflow = async (id, workflowData) => {
  return await WorkflowModel.findByIdAndUpdate(id, workflowData, {
    returnDocument: "after",
    runValidators: true,
  }).populate("students");
};

export const deleteWorkflow = async (id) => {
  return await WorkflowModel.findByIdAndDelete(id);
};

// ===== Workflow Step Management =====
export const updateWorkflowStep = async (id, step) => {
  return await WorkflowModel.findByIdAndUpdate(
    id,
    { currentStep: step },
    { returnDocument: "after", runValidators: true }
  );
};

// ===== Students in Workflow =====
export const addStudentsToWorkflow = async (workflowId, studentIds) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const existingIds = workflow.students.map((s) => s.toString());
  const newIds = studentIds.filter((id) => !existingIds.includes(id));
  workflow.students.push(...newIds);
  await workflow.save();
  return await WorkflowModel.findById(workflowId).populate("students");
};

export const removeStudentFromWorkflow = async (workflowId, studentId) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  workflow.students = workflow.students.filter(
    (s) => s.toString() !== studentId
  );
  await workflow.save();
  return await WorkflowModel.findById(workflowId).populate("students");
};

// ===== Internship Requests (Step 2) =====
export const createInternshipRequest = async (workflowId, requestData) => {
  if (!requestData.reqId) {
    requestData.reqId = await generateReqId();
  }
  const request = await InternshipRequestModel.create(requestData);

  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  workflow.requests.push(request);
  await workflow.save();
  return request;
};

export const updateInternshipRequest = async (workflowId, requestId, requestData) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const requestIndex = workflow.requests.findIndex(
    (r) => r._id.toString() === requestId
  );
  if (requestIndex === -1) return null;

  workflow.requests[requestIndex] = {
    ...workflow.requests[requestIndex].toObject(),
    ...requestData,
  };
  await workflow.save();
  return workflow.requests[requestIndex];
};

export const deleteInternshipRequest = async (workflowId, requestId) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const requestIndex = workflow.requests.findIndex(
    (r) => r._id.toString() === requestId
  );
  if (requestIndex === -1) return null;

  const [removed] = workflow.requests.splice(requestIndex, 1);
  await workflow.save();
  return removed;
};

// ===== Appointments (Step 3) =====
export const createAppointment = async (workflowId, appointmentData) => {
  if (!appointmentData.apptId) {
    appointmentData.apptId = await generateApptId();
  }
  const appointment = await AppointmentModel.create(appointmentData);

  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  workflow.appointments.push(appointment);
  await workflow.save();
  return appointment;
};

export const updateAppointment = async (workflowId, appointmentId, appointmentData) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const appointmentIndex = workflow.appointments.findIndex(
    (a) => a._id.toString() === appointmentId
  );
  if (appointmentIndex === -1) return null;

  workflow.appointments[appointmentIndex] = {
    ...workflow.appointments[appointmentIndex].toObject(),
    ...appointmentData,
  };
  await workflow.save();
  return workflow.appointments[appointmentIndex];
};

export const deleteAppointment = async (workflowId, appointmentId) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const appointmentIndex = workflow.appointments.findIndex(
    (a) => a._id.toString() === appointmentId
  );
  if (appointmentIndex === -1) return null;

  const [removed] = workflow.appointments.splice(appointmentIndex, 1);
  await workflow.save();
  return removed;
};

// ===== Internships (Step 4) =====
export const createInternship = async (workflowId, internshipData) => {
  if (!internshipData.intId) {
    internshipData.intId = await generateIntId();
  }
  const internship = await InternshipModel.create(internshipData);

  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  workflow.internships.push(internship);
  await workflow.save();
  return internship;
};

export const updateInternship = async (workflowId, internshipId, internshipData) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const internshipIndex = workflow.internships.findIndex(
    (i) => i._id.toString() === internshipId
  );
  if (internshipIndex === -1) return null;

  workflow.internships[internshipIndex] = {
    ...workflow.internships[internshipIndex].toObject(),
    ...internshipData,
  };
  await workflow.save();
  return workflow.internships[internshipIndex];
};

export const deleteInternship = async (workflowId, internshipId) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const internshipIndex = workflow.internships.findIndex(
    (i) => i._id.toString() === internshipId
  );
  if (internshipIndex === -1) return null;

  const [removed] = workflow.internships.splice(internshipIndex, 1);
  await workflow.save();
  return removed;
};

// ===== Workflow Data Aggregation =====
export const getWorkflowDashboardData = async () => {
  const [totalWorkflows, activeWorkflows, totalRequests, totalAppointments, totalInternships] =
    await Promise.all([
      WorkflowModel.countDocuments(),
      WorkflowModel.countDocuments({ status: "Active" }),
      InternshipRequestModel.countDocuments(),
      AppointmentModel.countDocuments(),
      InternshipModel.countDocuments(),
    ]);

  return {
    totalWorkflows,
    activeWorkflows,
    totalRequests,
    totalAppointments,
    totalInternships,
  };
};

// ===== Get all students for workflow step 1 =====
export const getWorkflowStudents = async () => {
  return await StudentModel.find().sort({ createdAt: -1 });
};