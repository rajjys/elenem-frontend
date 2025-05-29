// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, setAuthToken } from '@/services/api'; // Your API service
import Cookies from 'js-cookie'; // <-- Add this import

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  leagueId?: string;
  firstName?: string;
  lastName?: string;
  // ... other user fields from /auth/me
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  login: (usernameOrEmail: string, password: string, leagueCode?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setTokens: (tokens: AuthTokens) => void;
  // Add refreshToken logic if needed
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
          // Set client-readable cookies for middleware (less secure for accessToken)
          Cookies.set('accessToken', newTokens.accessToken, { expires: 7, secure: process.env.NODE_ENV === 'production' });
          // Assuming user.role is available right after login:
          const currentUserRole = get().user?.role;
          if (currentUserRole) {
            Cookies.set('userRole', currentUserRole, { expires: 7, secure: process.env.NODE_ENV === 'production' });
          }
        } else {
          setAuthToken(null);
          // Clear cookies on logout
          Cookies.remove('accessToken');
          Cookies.remove('userRole');
        }
      },
      login: async (usernameOrEmail, password, leagueCode) => {
        const response = await api.post('/auth/login', { usernameOrEmail, password, leagueCode });
        const { accessToken, refreshToken, user } = response.data;

        // Set user immediately after login (important for role to be available for cookie)
        set({ user });
        get().setTokens({ accessToken, refreshToken }); // This will now set cookies via setTokens
      },
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error("Logout failed on backend:", error);
        } finally {
          get().setTokens(null as any);
          set({ user: null });
          setAuthToken(null);
          // Cookies are cleared by setTokens(null) call
        }
      },
      fetchUser: async () => {
        if (!get().tokens?.accessToken) return;
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data });
          // If role might be stale in cookie, update it here after fetching fresh user data
          Cookies.set('userRole', response.data.role, { expires: 7, secure: process.env.NODE_ENV === 'production' });
        } catch (error) {
          console.error("Failed to fetch user:", error);
          if ((error as any).response?.status === 401) {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.tokens?.accessToken) {
          setAuthToken(state.tokens.accessToken);
        }
      }
    }
  )
);