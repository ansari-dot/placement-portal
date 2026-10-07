import api from './axios';

export const fetchAttendanceRecords = async (params = {}) => {
  const response = await api.get('/attendance', { params });
  return response.data;
};

export const createAttendanceRecord = async (data) => {
  const response = await api.post('/attendance', data);
  return response.data;
};

export const updateAttendanceRecord = async (id, data) => {
  const response = await api.put(`/attendance/${id}`, data);
  return response.data;
};

export const deleteAttendanceRecord = async (id) => {
  const response = await api.delete(`/attendance/${id}`);
  return response.data;
};
