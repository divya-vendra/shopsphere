import api from './axios';

export const productApi = {
  getAll:      (params) => api.get('/products', { params }),
  getFeatured: ()       => api.get('/products/featured'),
  getById:     (id)     => api.get(`/products/${id}`),
  getBySlug:   (slug)   => api.get(`/products/slug/${slug}`),

  // Admin
  create:      (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:      (id, formData) => api.patch(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:      (id)       => api.delete(`/products/${id}`),
  deleteImage: (id, publicId) => api.delete(`/products/${id}/images/${publicId}`),
};
