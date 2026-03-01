import api from './axios';

export const reviewApi = {
  getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create:       (data)              => api.post('/reviews', data),
  delete:       (id)                => api.delete(`/reviews/${id}`),
};
