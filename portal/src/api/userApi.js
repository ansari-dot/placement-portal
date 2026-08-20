import api from './axios';

export const fetchUsers = async (params) => {
  const response = await api.get('/users', { params });
  return response.data;
};

export const fetchUserStats = async () => {
  const response = await api.get('/users/stats');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.patch(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
