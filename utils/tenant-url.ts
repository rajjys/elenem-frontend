// Build the absolute URL to a tenant's public subdomain site. Kept consistent
// with resolveTenantSlugFromHostname: dev uses lvh.me:3000, prod uses the root
// domain (NEXT_PUBLIC_ROOT_DOMAIN, default elenem.site). Centralized here so the
// domain logic lives in one place instead of being rebuilt per component with
// mismatched/unset env vars (which produced URLs like `slug.undefined`).
export function buildTenantUrl(slug: string, path = ''): string {
  const isDev = process.env.NODE_ENV === 'development';
  const protocol = isDev ? 'http://' : 'https://';
  const rootDomain = isDev
    ? 'lvh.me:3000'
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'elenem.site';
  return `${protocol}${slug}.${rootDomain}${path}`;
}
