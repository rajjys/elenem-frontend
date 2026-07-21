import { Roles } from '@/schemas';

// Where to send a user immediately after authentication.
// Admins always land on their dedicated dashboard. A plain user goes to
// /welcome only on their FIRST login (lastLoginAt still null) and to their
// account dashboard on every subsequent login.
export function getPostAuthRedirect(user: {
  roles?: Roles[] | null;
  lastLoginAt?: string | null;
}): string {
  const roles = user.roles ?? [];
  if (roles.includes(Roles.SYSTEM_ADMIN)) return '/admin/dashboard';
  if (roles.includes(Roles.TENANT_ADMIN)) return '/tenant/dashboard';
  if (roles.includes(Roles.LEAGUE_ADMIN)) return '/league/dashboard';
  if (roles.includes(Roles.TEAM_ADMIN)) return '/team/dashboard';
  return user.lastLoginAt ? '/account/dashboard' : '/welcome';
}
