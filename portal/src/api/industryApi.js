import api from "./axios";

export const fetchIndustries = async (params) => {
  const response = await api.get("/industries", { params });
  return response.data;
};

export const createIndustry = async (industryData) => {
  const response = await api.post("/industries", industryData);
  return response.data;
};

export const fetchIndustryStats = async () => {
  const response = await api.get("/industries/stats");
  return response.data;
};

export const deleteIndustry = async (id) => {
  const response = await api.delete(`/industries/${id}`);
  return response.data;
};
