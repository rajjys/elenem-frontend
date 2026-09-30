// Build the absolute URL to a tenant's public subdomain site. Kept consistent
// with resolveTenantSlugFromHostname: dev uses lvh.me:3000, prod uses the root
// domain (NEXT_PUBLIC_ROOT_DOMAIN, default elenem.site). Centralized here so the
// domain logic lives in one place instead of being rebuilt per component with
// mismatched/unset env vars (which produced URLs like `slug.undefined`).
export function buildTenantUrl(slug: string, path = ''): string {
  const isDev = process.env.NODE_ENV === 'development';
  const protocol = isDev ? 'http://' : 'https://';
  if (isDev) {
    return `${protocol}${slug}.lvh.me:3000${path}`;
  }
  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'dxscores.app';
  return `${protocol}${slug}.${tenantDomain}${path}`;
}

/**
 * The absolute URL of a page on the product itself, dxscores.com — for links out of a league
 * site (« Espace organisateur », « Propulsé par DXScores »), where a relative path would stay on
 * the league's host.
 */
export function buildAppUrl(path = ''): string {
  if (process.env.NODE_ENV === 'development') return `http://localhost:3000${path}`;
  return `https://${process.env.NEXT_PUBLIC_APP_DOMAIN || 'dxscores.com'}${path}`;
}
