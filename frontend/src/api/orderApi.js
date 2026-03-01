import api from './axios';

export const orderApi = {
  create:         (data)         => api.post('/orders', data),
  getMyOrders:    (params)       => api.get('/orders/me', { params }),
  getById:        (id)           => api.get(`/orders/${id}`),
  // Admin
  getAll:         (params)       => api.get('/orders', { params }),
  updateStatus:   (id, data)     => api.patch(`/orders/${id}/status`, data),
};
