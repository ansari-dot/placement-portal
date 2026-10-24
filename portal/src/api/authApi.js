import api from './axios';

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const signupUser = async (userData) => {
  const response = await api.post('/auth/signup', userData);
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

export const fetchRtoAutocomplete = async (query, signal) => {
  if (!query || query.trim().length < 3) return [];
  const response = await api.get(`/auth/rto-autocomplete?q=${encodeURIComponent(query.trim())}`, { signal });
  return response.data?.data || [];
};

export const fetchIndustryAutocomplete = async (query, signal) => {
  if (!query || query.trim().length < 3) return [];
  const response = await api.get(`/auth/industry-autocomplete?q=${encodeURIComponent(query.trim())}`, { signal });
  return response.data?.data || [];
};



