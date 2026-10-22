import api from "./axios";
import { notifyPlacementDataChanged } from "./placementEvents";

// Get all students (backend filters by assignedCoordinator for non-admin users)
export const fetchStudents = async () => {
  const response = await api.get("/students");
  return response.data;
};

// Get ALL students without any coordinator filtering — used by "Students" search page
export const fetchAllStudents = async () => {
  const response = await api.get("/students/all");
  return response.data;
};

// Get a single student by ID
export const fetchStudentById = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

// Create a new student
export const createStudent = async (studentData) => {
  const response = await api.post("/students", studentData);
  notifyPlacementDataChanged();
  return response.data;
};

// Update a student
export const updateStudent = async (id, studentData) => {
  const response = await api.put(`/students/${id}`, studentData);
  notifyPlacementDataChanged();
  return response.data;
};

// Assign (or unassign) a coordinator to a student
export const assignCoordinator = async (studentId, coordinatorId, coordinatorName) => {
  const response = await api.patch(`/students/${studentId}/assign-coordinator`, {
    coordinatorId:   coordinatorId || null,
    coordinatorName: coordinatorName || '',
  });
  return response.data;
};

// Delete a student
export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  notifyPlacementDataChanged();
  return response.data;
};

// Snooze a student — persists snoozed state to the database
export const snoozeStudent = async (id, { snoozed, snoozedAt, snoozeUntil, snoozeReason }) => {
  const response = await api.put(`/students/${id}`, {
    snoozed,
    snoozedAt: snoozedAt ?? null,
    snoozeUntil: snoozeUntil ?? null,
    snoozeReason: snoozeReason ?? '',
  });
  return response.data;
};

// ===== Bulk import =====

// Download the Excel template (all Add-Student form fields)
export const downloadBulkTemplate = async () => {
  const response = await api.get("/students/bulk/template", { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student_bulk_import_template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
};

// Preview (commit=false) or import (commit=true) an Excel file
export const bulkImportStudents = async (file, commit = false) => {
  const fd = new FormData();
  fd.append("file", file);
  const response = await api.post(`/students/bulk/import?commit=${commit}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (commit) notifyPlacementDataChanged();
  return response.data;
};

// Upload many documents; each file is matched to a student by its name
export const bulkUploadStudentDocuments = async (files, onProgress) => {
  const fd = new FormData();
  files.forEach((f) => {
    fd.append("files", f);
    fd.append("paths", f.webkitRelativePath || f.name);
  });
  const response = await api.post("/students/bulk/documents", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
  });
  notifyPlacementDataChanged();
  return response.data;
};

// Open a stored document (/uploads/...) using the logged-in session
export const openStudentDocument = async (url) => {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(response.data);
  window.open(blobUrl, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

export const isStoredDocument = (v) => typeof v === "string" && v.startsWith("/uploads/");

export const repairStudentRto = async (payload = {}) => {
  const response = await api.post("/students/repair/rto", payload);
  return response.data;
};

export const bulkAssignRto = async (studentIds, rtoId, rtoName) => {
  const response = await api.post("/students/bulk/assign-rto", { studentIds, rtoId, rtoName });
  notifyPlacementDataChanged();
  return response.data;
};

export const bulkUpdateStudentStatus = async (studentIds, { status, placementStatus }) => {
  const response = await api.patch("/students/bulk/status", { studentIds, status, placementStatus });
  notifyPlacementDataChanged();
  return response.data;
};

export const bulkDeleteStudents = async (studentIds) => {
  const response = await api.post("/students/bulk/delete", { studentIds });
  notifyPlacementDataChanged();
  return response.data;
};


