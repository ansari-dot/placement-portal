import api from './axios';

export const createReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

export const fetchMyReviews = async () => {
  const response = await api.get('/reviews/my');
  return response.data?.data || [];
};

export const fetchAdminReviews = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'All') query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const qs = query.toString();
  const url = qs ? `/reviews/admin?${qs}` : '/reviews/admin';
  const response = await api.get(url);
  return response.data;
};

export const updateReviewStatus = async (id, { status, rejectionReason, isFeatured }) => {
  const response = await api.patch(`/reviews/admin/${id}/status`, {
    status,
    rejectionReason,
    isFeatured,
  });
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/reviews/admin/${id}`);
  return response.data;
};

export const fetchPublicReviews = async () => {
  const response = await api.get('/reviews/public');
  return response.data?.data || [];
};
