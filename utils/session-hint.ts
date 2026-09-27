/**
 * Who the browser's session cookie says is signed in — for a UI choice, never for access.
 *
 * The product site's header only needs to know whether to show "Tableau de bord", and where it
 * goes. Asking the auth store for that loaded zustand, axios and zod on every marketing page; the
 * cookie already carries the answer in its payload. Nothing is verified here: the middleware
 * verifies the token on every protected request, and a wrong guess costs one redirect.
 */
export function readSessionRoles(): string[] | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
  if (!match) return null;
  try {
    const part = decodeURIComponent(match[1]).split('.')[1];
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { roles?: unknown };
    return Array.isArray(payload.roles) && payload.roles.length > 0 ? (payload.roles as string[]) : null;
  } catch {
    return null;
  }
}
