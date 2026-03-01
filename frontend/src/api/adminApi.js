import api from './axios';

export const adminApi = {
  getAnalytics:     ()          => api.get('/admin/analytics'),
  getProducts:      (params)    => api.get('/admin/products', { params }),
  getLowStock:      (threshold) => api.get('/admin/low-stock', { params: { threshold } }),
  getAllUsers:       (params)    => api.get('/users', { params }),
  updateUser:       (id, data)  => api.patch(`/users/${id}`, data),
  deleteUser:       (id)        => api.delete(`/users/${id}`),
};
