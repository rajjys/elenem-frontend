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
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<User | undefined>;
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
      login: async (usernameOrEmail, password) => {
        const response = await api.post('/auth/login', { usernameOrEmail, password });
        const { accessToken, refreshToken, user } = response.data; // Assuming backend returns user object on login
        get().setTokens({ accessToken, refreshToken });
        set({ user }); // Set the user object directly from login response
        // Optionally, if the backend doesn't return the full user on login, call fetchUser here:
        // await get().fetchUser();
      },
      /**
       * Ends the session here first, then tells the server.
       *
       * The server call existed and was never made, so a signed-out browser left a valid refresh
       * token behind for seven days. It is fired after the local state is gone and never awaited:
       * signing out must not wait on the network, and must not fail because of it. Its own 401 (an
       * access token that expired an hour ago) is ignored by the interceptor, so it cannot re-enter
       * the refresh flow.
       */
      logout: async () => {
        const accessToken = get().tokens?.accessToken;
        get().setTokens(null);
        set({ user: null });
        Cookies.remove('accessToken');
        Cookies.remove('userRole');
        if (accessToken) {
          api
            .post('/auth/logout', null, { headers: { Authorization: `Bearer ${accessToken}` } })
            .catch(() => {});
        }
      },
      fetchUser: async () => {
        if (!get().tokens?.accessToken) return;
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data });
          return response.data as User;
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
