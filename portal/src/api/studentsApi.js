import api from "./axios";

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
  return response.data;
};

// Update a student
export const updateStudent = async (id, studentData) => {
  const response = await api.put(`/students/${id}`, studentData);
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
  return response.data;
};
