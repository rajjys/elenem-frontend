/* eslint-disable @typescript-eslint/no-explicit-any */
// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, setAuthToken } from '@/services/api';
import Cookies from 'js-cookie';
import { User } from '@/schemas'; // Import User and Role from your new frontend types

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  login: (usernameOrEmail: string, password: string, tenantCode?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setTokens: (tokens: AuthTokens | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      setTokens: (newTokens) => {
        set({ tokens: newTokens });
        if (newTokens?.accessToken) {
          setAuthToken(newTokens.accessToken);
          Cookies.set('accessToken', newTokens.accessToken, { expires: 7, secure: process.env.NODE_ENV === 'production' });
          // When setting tokens, we don't have the full user object yet with roles array.
          // The middleware will rely on decoding the JWT for roles, or `fetchUser` will populate it.
          // For now, let's remove the singular `userRole` cookie set here, as it's unreliable with roles array.
          // The middleware and `fetchUser` are responsible for definitive role handling.
        } else {
          setAuthToken(null);
          Cookies.remove('accessToken');
          // Cookies.remove('userRole'); // Removed as discussed.
        }
      },
      login: async (usernameOrEmail, password, tenantCode) => {
        const payload = tenantCode ? { usernameOrEmail, password, tenantCode } : { usernameOrEmail, password };
        const response = await api.post('/auth/login', payload);
        const { accessToken, refreshToken, user } = response.data; // Assuming backend returns user object on login
        get().setTokens({ accessToken, refreshToken });
        set({ user }); // Set the user object directly from login response
        // Optionally, if the backend doesn't return the full user on login, call fetchUser here:
        // await get().fetchUser();
      },
      logout: async () => {
        try {
          // Consider adding a backend logout call to invalidate refresh tokens
          // await api.post('/auth/logout');
        } catch (error) {
          console.error("Logout failed on backend:", error);
        } finally {
          get().setTokens(null);
          set({ user: null });
          // Cookies are cleared by setTokens(null) call and direct removal if any specific ones remain
          Cookies.remove('accessToken');
          Cookies.remove('userRole'); // Ensure this is removed if it was ever set somewhere else
        }
      },
      fetchUser: async () => {
        if (!get().tokens?.accessToken) return;
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data });
          // After fetching fresh user data, we rely on the `user.roles` array for client-side logic.
          // No need to set `userRole` cookie here as it's singular and can be misleading.
        } catch (error) {
          console.error("Failed to fetch user:", error);
          if ((error as any).response?.status === 401 || (error as any).response?.status === 403) {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Re-apply auth token on rehydration (client-side only)
        if (state?.tokens?.accessToken) {
          setAuthToken(state.tokens.accessToken);
        }
      }
    }
  )
);
