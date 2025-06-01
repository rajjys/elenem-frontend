// services/api.ts
import { useAuthStore } from '@/store/auth.store';
import axios from 'axios';

export const api = axios.create({
  baseURL: "http://localhost:3333/", // Your backend API URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Add interceptors for error handling or token refresh if needed
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    // Prevent infinite loop
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      console.warn('Unauthorizd request. Session might have expired. Attempting to refresh token...')
      originalRequest._retry = true;
      try {
        // Get refresh token from Zustand store
        const { tokens, setTokens, logout } = useAuthStore.getState();
        if (tokens?.refreshToken) {
          // Attempt to refresh
          const res = await api.post('/auth/refresh', { refreshToken: tokens.refreshToken });
          setTokens(res.data); // This updates tokens in store and cookies
          // Set new access token for retry
          originalRequest.headers['Authorization'] = `Bearer ${res.data.accessToken}`;
          return api(originalRequest); // Retry original request
        }
      } catch (refreshError) {
        // If refresh fails, logout
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);