import api from './axios';

export const fetchUserLogs = async (params = {}) => {
  const response = await api.get('/user-logs', { params });
  return response.data;
};

export const revertUserLog = async (id) => {
  const response = await api.post(`/user-logs/${id}/revert`);
  return response.data;
};
