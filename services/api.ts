// services/api.ts
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
    // Example: Refresh token logic (simplified)
    // if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
    //   originalRequest._retry = true;
    //   try {
    //     const { tokens, setTokens } = useAuthStore.getState();
    //     if (tokens?.refreshToken) {
    //       const res = await api.post('/auth/refresh', { refreshToken: tokens.refreshToken });
    //       setTokens(res.data);
    //       originalRequest.headers['Authorization'] = `Bearer ${res.data.accessToken}`;
    //       return api(originalRequest);
    //     }
    //   } catch (refreshError) {
    //      useAuthStore.getState().logout(); // Logout on refresh failure
    //      return Promise.reject(refreshError);
    //   }
    // }
    return Promise.reject(error);
  }
);