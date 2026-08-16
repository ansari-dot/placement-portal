import api from "./axios";

// ===== Workflow CRUD =====
export const fetchWorkflows = async () => {
  const response = await api.get("/workflows");
  return response.data;
};

export const fetchWorkflowById = async (id) => {
  const response = await api.get(`/workflows/${id}`);
  return response.data;
};

export const createWorkflow = async (workflowData) => {
  const response = await api.post("/workflows", workflowData);
  return response.data;
};

export const updateWorkflow = async (id, workflowData) => {
  const response = await api.put(`/workflows/${id}`, workflowData);
  return response.data;
};

export const deleteWorkflow = async (id) => {
  const response = await api.delete(`/workflows/${id}`);
  return response.data;
};

// ===== Workflow Step Management =====
export const updateWorkflowStep = async (id, step) => {
  const response = await api.patch(`/workflows/${id}/step`, { step });
  return response.data;
};

// ===== Students in Workflow =====
export const addStudentsToWorkflow = async (id, studentIds) => {
  const response = await api.post(`/workflows/${id}/students`, { studentIds });
  return response.data;
};

export const removeStudentFromWorkflow = async (id, studentId) => {
  const response = await api.delete(`/workflows/${id}/students/${studentId}`);
  return response.data;
};

// ===== Internship Requests (Step 2) =====
export const createInternshipRequest = async (workflowId, requestData) => {
  const response = await api.post(`/workflows/${workflowId}/requests`, requestData);
  return response.data;
};

export const updateInternshipRequest = async (workflowId, requestId, requestData) => {
  const response = await api.put(`/workflows/${workflowId}/requests/${requestId}`, requestData);
  return response.data;
};

export const deleteInternshipRequest = async (workflowId, requestId) => {
  const response = await api.delete(`/workflows/${workflowId}/requests/${requestId}`);
  return response.data;
};

// ===== Appointments (Step 3) =====
export const createAppointment = async (workflowId, appointmentData) => {
  const response = await api.post(`/workflows/${workflowId}/appointments`, appointmentData);
  return response.data;
};

export const updateAppointment = async (workflowId, appointmentId, appointmentData) => {
  const response = await api.put(`/workflows/${workflowId}/appointments/${appointmentId}`, appointmentData);
  return response.data;
};

export const deleteAppointment = async (workflowId, appointmentId) => {
  const response = await api.delete(`/workflows/${workflowId}/appointments/${appointmentId}`);
  return response.data;
};

// ===== Internships (Step 4) =====
export const createInternship = async (workflowId, internshipData) => {
  const response = await api.post(`/workflows/${workflowId}/internships`, internshipData);
  return response.data;
};

export const updateInternship = async (workflowId, internshipId, internshipData) => {
  const response = await api.put(`/workflows/${workflowId}/internships/${internshipId}`, internshipData);
  return response.data;
};

export const deleteInternship = async (workflowId, internshipId) => {
  const response = await api.delete(`/workflows/${workflowId}/internships/${internshipId}`);
  return response.data;
};

// ===== Dashboard & Students =====
export const fetchWorkflowDashboardData = async () => {
  const response = await api.get("/workflows/dashboard");
  return response.data;
};

export const fetchWorkflowStudents = async () => {
  const response = await api.get("/workflows/students");
  return response.data;
};