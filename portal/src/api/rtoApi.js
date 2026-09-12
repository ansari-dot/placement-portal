import api from "./axios";

export const fetchRtos = async (params) => {
  const response = await api.get("/rtos", { params });
  return response.data;
};

export const createRto = async (rtoData) => {
  const response = await api.post("/rtos", rtoData);
  return response.data;
};

export const fetchRtoStats = async () => {
  const response = await api.get("/rtos/stats");
  return response.data;
};

export const fetchRtoById = async (id) => {
  const response = await api.get(`/rtos/${id}`);
  return response.data;
};

export const updateRto = async (id, rtoData) => {
  const response = await api.put(`/rtos/${id}`, rtoData);
  return response.data;
};

export const deleteRto = async (id) => {
  const response = await api.delete(`/rtos/${id}`);
  return response.data;
};
