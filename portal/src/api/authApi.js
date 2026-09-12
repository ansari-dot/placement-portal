import api from './axios';

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const sendHeartbeat = async () => {
  const response = await api.post('/auth/heartbeat');
  return response.data;
};

export const fetchPresence = async () => {
  const response = await api.get('/auth/presence');
  return response.data;
};

