import api from './axios';

export const cartApi = {
  getCart:    ()                         => api.get('/cart'),
  addItem:    (productId, quantity = 1)  => api.post('/cart', { productId, quantity }),
  updateItem: (itemId, quantity)         => api.patch(`/cart/${itemId}`, { quantity }),
  removeItem: (itemId)                   => api.delete(`/cart/${itemId}`),
  clearCart:  ()                         => api.delete('/cart'),
};
