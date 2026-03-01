import api from './axios';

export const authApi = {
  register:       (data)  => api.post('/auth/register', data),
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  refreshToken:   ()      => api.post('/auth/refresh-token'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, data) => api.post(`/auth/reset-password/${token}`, data),
  getMe:          ()      => api.get('/users/me'),
  updateMe:       (data)  => api.patch('/users/me', data),
};
