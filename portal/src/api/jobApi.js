import api from "./axios";

export const fetchJobs = async (params) => {
  const response = await api.get("/jobs", { params });
  return response.data;
};

export const fetchJobStats = async () => {
  const response = await api.get("/jobs/stats");
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await api.post("/jobs", jobData);
  return response.data;
};

export const deleteJob = async (id) => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
};

export const updateJob = async (id, data) => {
  const response = await api.patch(`/jobs/${id}`, data);
  return response.data;
};
