import { useAuthStore } from '@/store/auth.store';
import { Roles } from '@/schemas';

// Single source for reading the logged-in user + role checks, replacing the
// `user?.roles?.includes(...)` logic duplicated across the app.
export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

/** True if the current user holds ANY of the given roles. */
export function useHasRole(...roles: Roles[]): boolean {
  const user = useAuthStore((s) => s.user);
  const userRoles = user?.roles ?? [];
  return roles.some((r) => userRoles.includes(r));
}

export function useIsSystemAdmin(): boolean {
  return useHasRole(Roles.SYSTEM_ADMIN);
}
