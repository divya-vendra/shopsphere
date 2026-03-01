import api from './axios';

export const wishlistApi = {
  get:    ()          => api.get('/wishlist'),
  add:    (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};
