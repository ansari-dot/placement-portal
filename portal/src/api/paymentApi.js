import api from './axios';

export const fetchPayments = async (params = {}) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const fetchPaymentTotals = async (params = {}) => {
  const response = await api.get('/payments/totals', { params });
  return response.data;
};

export const updatePaymentStatus = async (id, data) => {
  const payload = typeof data === 'object' ? data : { paymentStatus: data };
  const response = await api.patch(`/payments/${id}/status`, payload);
  return response.data;
};

export const bulkGenerateInvoices = async (paymentSelections, gstEnabled = false) => {
  const payload = Array.isArray(paymentSelections) && typeof paymentSelections[0] === 'object'
    ? { paymentSelections, gstEnabled }
    : { paymentIds: paymentSelections, gstEnabled };
  const response = await api.post('/payments/bulk-invoice', payload);
  return response.data;
};

export const bulkMarkPaymentReceived = async (paymentIds) => {
  const response = await api.post('/payments/bulk-payment-received', { paymentIds });
  return response.data;
};
