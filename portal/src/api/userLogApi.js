import api from './axios';

export const fetchUserLogs = async (params = {}) => {
  const response = await api.get('/user-logs', { params });
  return response.data;
};
