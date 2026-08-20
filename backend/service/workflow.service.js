import WorkflowModel, {
  InternshipRequestModel,
  AppointmentModel,
  InternshipModel,
} from "../model/workflow.model.js";
import StudentModel from "../model/student.model.js";
import NotificationModel from "../model/notification.model.js";

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

  // Trigger Notification
  try {
    await NotificationModel.create({
      title: "New Internship Request",
      desc: `${request.student} applied for ${request.title || "placement"} at ${request.company}`,
      type: "request",
      link: "/workflow?step=2",
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }

  return request;
};

export const updateInternshipRequest = async (workflowId, requestId, requestData) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const requestIndex = workflow.requests.findIndex(
    (r) => r._id.toString() === requestId
  );
  if (requestIndex === -1) return null;

  // Sync update with stand-alone InternshipRequest collection
  await InternshipRequestModel.findByIdAndUpdate(requestId, requestData, { runValidators: true });

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

  // Sync deletion with stand-alone InternshipRequest collection
  await InternshipRequestModel.findByIdAndDelete(requestId);

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

  // Trigger Notification
  try {
    await NotificationModel.create({
      title: "Appointment Scheduled",
      desc: `Interview scheduled for ${appointment.student} at ${appointment.company} on ${appointment.date}`,
      type: "appointment",
      link: "/workflow?step=3",
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }

  return appointment;
};

export const updateAppointment = async (workflowId, appointmentId, appointmentData) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const appointmentIndex = workflow.appointments.findIndex(
    (a) => a._id.toString() === appointmentId
  );
  if (appointmentIndex === -1) return null;

  // Sync update with stand-alone Appointment collection
  const updatedAppt = await AppointmentModel.findByIdAndUpdate(
    appointmentId,
    appointmentData,
    { returnDocument: "after", runValidators: true }
  );

  Object.assign(workflow.appointments[appointmentIndex], appointmentData);
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

  // Sync deletion with stand-alone Appointment collection
  await AppointmentModel.findByIdAndDelete(appointmentId);

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

  // Trigger Notification
  try {
    await NotificationModel.create({
      title: "Internship Placement Created",
      desc: `${internship.student} placed as ${internship.title || "Intern"} at ${internship.company}`,
      type: "internship",
      link: "/workflow?step=4",
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }

  return internship;
};

export const updateInternship = async (workflowId, internshipId, internshipData) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  const internshipIndex = workflow.internships.findIndex(
    (i) => i._id.toString() === internshipId
  );
  if (internshipIndex === -1) return null;

  // Sync update with stand-alone Internship collection
  await InternshipModel.findByIdAndUpdate(internshipId, internshipData, { runValidators: true });

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

  // Sync deletion with stand-alone Internship collection
  await InternshipModel.findByIdAndDelete(internshipId);

  const [removed] = workflow.internships.splice(internshipIndex, 1);
  await workflow.save();
  return removed;
};

// ===== Workflow Data Aggregation =====
export const getWorkflowDashboardData = async () => {
  const [
    totalWorkflows,
    activeWorkflows,
    totalRequests,
    totalAppointments,
    totalInternships,
    requests,
    appointments,
    internships,
    latestWorkflows
  ] = await Promise.all([
    WorkflowModel.countDocuments(),
    WorkflowModel.countDocuments({ status: "Active" }),
    InternshipRequestModel.countDocuments(),
    AppointmentModel.countDocuments(),
    InternshipModel.countDocuments(),
    InternshipRequestModel.find().sort({ createdAt: -1 }),
    AppointmentModel.find().sort({ createdAt: -1 }),
    InternshipModel.find().sort({ createdAt: -1 }),
    WorkflowModel.find().sort({ updatedAt: -1 }).limit(5)
  ]);

  // Breakdown for Internship Requests
  const requestsStats = {
    pending: requests.filter((r) => ["New", "Coordinator Review", "RTO Review"].includes(r.status)).length,
    assigned: requests.filter((r) => ["Coordinator Review", "RTO Review"].includes(r.status)).length,
    appointment: requests.filter((r) => r.status === "Appointment").length,
    placed: requests.filter((r) => r.status === "Approved").length,
    failed: requests.filter((r) => r.status === "Rejected").length,
    withdrawn: requests.filter((r) => r.status === "On Hold").length,
    declined: requests.filter((r) => r.status === "Rejected").length,
  };

  // Breakdown for Appointments
  const appointmentsStats = {
    scheduled: appointments.filter((a) => ["Scheduled", "Rescheduled"].includes(a.status)).length,
    completed: appointments.filter((a) => a.status === "Completed").length,
    cancelled: appointments.filter((a) => ["Cancelled", "No Show"].includes(a.status)).length,
  };

  // Breakdown for Internships
  const internshipsStats = {
    active: internships.filter((i) => i.status === "Active").length,
    joined: internships.filter((i) => i.status === "Joined").length,
    waitingToJoin: internships.filter((i) => i.status === "Waiting to Join").length,
    completed: internships.filter((i) => i.status === "Completed").length,
    onHold: internships.filter((i) => i.status === "On Hold").length,
    cancelled: internships.filter((i) => i.status === "Cancelled").length,
  };

  // Format Recent Activity Feed from actual database records
  const rawActivities = [];

  requests.slice(0, 5).forEach((r) => {
    rawActivities.push({
      id: r._id.toString(),
      title: `${r.student} submitted request for ${r.company}`,
      subtitle: `Internship Request (${r.status})`,
      createdAt: r.createdAt || new Date(),
      type: "request"
    });
  });

  appointments.slice(0, 5).forEach((a) => {
    rawActivities.push({
      id: a._id.toString(),
      title: `Appointment with ${a.student} at ${a.company}`,
      subtitle: `Appointment (${a.status})`,
      createdAt: a.createdAt || new Date(),
      type: "appointment"
    });
  });

  internships.slice(0, 5).forEach((i) => {
    rawActivities.push({
      id: i._id.toString(),
      title: `${i.student} internship at ${i.company}`,
      subtitle: `Internship Placement (${i.status})`,
      createdAt: i.createdAt || new Date(),
      type: "internship"
    });
  });

  // Sort activities by most recent timestamp first
  rawActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const recentActivities = rawActivities.slice(0, 5).map((act) => {
    const diffMs = new Date() - new Date(act.createdAt);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let timeAgo = "Just now";
    if (diffDays > 0) timeAgo = `${diffDays}d ago`;
    else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
    else if (diffMins > 0) timeAgo = `${diffMins}m ago`;

    return {
      title: act.title,
      subtitle: act.subtitle,
      time: timeAgo,
      type: act.type
    };
  });

  // 6-Month Trend Data for Requests vs Placements Chart
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    const monthKey = `${monthName} ${year}`;
    
    // Count requests in this month
    const reqCount = requests.filter((r) => {
      const rDate = new Date(r.createdAt || now);
      return rDate.getMonth() === d.getMonth() && rDate.getFullYear() === d.getFullYear();
    }).length;

    // Count placements (Approved requests or active internships) in this month
    const placeCount = internships.filter((intItem) => {
      const iDate = new Date(intItem.createdAt || now);
      return iDate.getMonth() === d.getMonth() && iDate.getFullYear() === d.getFullYear();
    }).length;

    months.push({
      label: monthKey,
      requests: reqCount,
      placements: placeCount
    });
  }

  return {
    totalWorkflows,
    activeWorkflows,
    totalRequests,
    totalAppointments,
    totalInternships,
    requestsStats,
    appointmentsStats,
    internshipsStats,
    recentActivities,
    chartData: months
  };
};

// ===== Get all students for workflow step 1 =====
export const getWorkflowStudents = async () => {
  return await StudentModel.find().sort({ createdAt: -1 });
};