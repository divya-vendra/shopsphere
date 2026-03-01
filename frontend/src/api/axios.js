import axios from 'axios';
import { store } from '../app/store';
import { setAccessToken, logout } from '../features/auth/authSlice';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true, // send httpOnly refresh token cookie on every request
  headers:         { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: transparent token refresh ───────────────────────────
// When any request returns 401, we attempt one refresh cycle.
// If that also fails, we log the user out and redirect to /login.
let isRefreshing   = false;
let failedQueue    = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) { prom.reject(error); }
    else       { prom.resolve(token); }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token lives in the httpOnly cookie — sent automatically
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        store.dispatch(setAccessToken(newToken));
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
