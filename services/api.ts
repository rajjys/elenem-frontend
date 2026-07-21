/* eslint-disable @typescript-eslint/no-explicit-any */
// services/api.ts
import { useAuthStore } from '@/store/auth.store';
import axios from 'axios';

const isProd = process.env.NODE_ENV === 'production';
export const api = axios.create({
  baseURL: isProd
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:3333/", // Use env var only in prod, localhost in dev
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Re-exported so error-handling code can type-guard axios errors without
// importing `axios` directly (which the ESLint rule restricts — all API calls
// should go through this shared `api` client for auth + token refresh).
export const isAxiosError = axios.isAxiosError;

// Normalize any thrown error into a human-readable message. The backend returns
// { message: string | string[] } (arrays for validation errors), so arrays are
// joined. Use this in catch blocks / mutation onError instead of hand-rolling
// `error.response?.data?.message` everywhere.
export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.filter(Boolean).join(' ');
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Add interceptors for error handling or token refresh if needed
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; config: any; }[] = [];

const processQueue = (error: any | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(prom.config); // Resolve with the original config, now that token is refreshed
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If a refresh is already in progress, add to queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        })
        .then(() => api(originalRequest)) // Retry the original request after refresh
        .catch(err => Promise.reject(err));
      }

      isRefreshing = true; // Mark refresh as in progress

      try {
        const { tokens, setTokens, logout } = useAuthStore.getState();
        if (tokens?.refreshToken) {
          console.warn('Unauthorized request. Session might have expired. Attempting to refresh token...');
          const res = await api.post('/auth/refresh', { refreshToken: tokens.refreshToken });
          setTokens(res.data); // This updates tokens in store and cookies
          setAuthToken(res.data.accessToken); // Ensure the new token is set for the axios instance

          originalRequest.headers['Authorization'] = `Bearer ${res.data.accessToken}`;
          processQueue(null); // Process all queued requests successfully
          return api(originalRequest); // Retry the original request
        } else {
            logout(); // No refresh token, force logout
            processQueue(error); // Reject queued requests
            return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        useAuthStore.getState().logout();
        processQueue(refreshError); // Reject all queued requests if refresh fails
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // Mark refresh as complete
      }
    }
    return Promise.reject(error);
  }
);
