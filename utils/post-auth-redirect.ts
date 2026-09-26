import { Roles } from '@/schemas';

/**
 * A signed-in reader's home: the dashboard for the widest thing they administer.
 *
 * One function, because there were three copies — here, `app/not-found.tsx` and `AppLayout` — and
 * they had drifted: `AppLayout`'s also sent players, coaches and referees to `/player/dashboard`,
 * `/coach/dashboard` and `/referee/dashboard`, none of which exist (the first even matched
 * `/player/[playerId]`). It takes roles alone so the middleware can call it with a token's claims.
 */
export function homeForRoles(roles: readonly (Roles | string)[] | null | undefined): string {
  const has = (role: Roles) => (roles ?? []).includes(role);
  if (has(Roles.SYSTEM_ADMIN)) return '/admin/dashboard';
  if (has(Roles.TENANT_ADMIN)) return '/tenant/dashboard';
  if (has(Roles.LEAGUE_ADMIN)) return '/league/dashboard';
  if (has(Roles.TEAM_ADMIN)) return '/team/dashboard';
  return '/account/dashboard';
}

/**
 * Where to send a user immediately after authentication.
 *
 * A plain user used to go to `/welcome` on their first login, a page that offered the old
 * organisation-creation form. Both are gone: organisations are created by signing up
 * (`/register`), so every reader has a dashboard to land on.
 */
export function getPostAuthRedirect(user: { roles?: Roles[] | null }): string {
  return homeForRoles(user.roles);
}

/**
 * A `redirect` parameter, if it is safe to follow: a path on this site, nothing else.
 *
 * It was pushed as-is, so `/login?redirect=https://evil.example` — or `//evil.example`, which a
 * browser reads as another host — sent a user who had just typed their password somewhere else
 * (`UI_CONVENTIONS` §8). Only a single leading slash is accepted.
 */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}
