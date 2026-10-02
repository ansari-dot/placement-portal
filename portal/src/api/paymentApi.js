import api from './axios';

export const fetchPayments = async (params = {}) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const fetchPaymentTotals = async (params = {}) => {
  const response = await api.get('/payments/totals', { params });
  return response.data;
};

export const updatePaymentStatus = async (id, paymentStatus) => {
  const response = await api.patch(`/payments/${id}/status`, { paymentStatus });
  return response.data;
};

export const bulkGenerateInvoices = async (paymentIds) => {
  const response = await api.post('/payments/bulk-invoice', { paymentIds });
  return response.data;
};

export const bulkMarkPaymentReceived = async (paymentIds) => {
  const response = await api.post('/payments/bulk-payment-received', { paymentIds });
  return response.data;
};
