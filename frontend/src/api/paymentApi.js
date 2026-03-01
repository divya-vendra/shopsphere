import api from './axios';

export const paymentApi = {
  createCheckoutSession: (orderId)    => api.post('/payments/create-checkout-session', { orderId }),
  getSessionStatus:      (sessionId)  => api.get(`/payments/session/${sessionId}`),
  // Admin: issue full or partial refund
  createRefund: (orderId, amountCents, reason) =>
    api.post('/payments/refund', { orderId, amountCents, reason }),
};
