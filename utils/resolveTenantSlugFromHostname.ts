export function resolveTenantSlugFromHostname(
  hostname: string,
  allowedDevSuffixes: string[] = ['localhost']
): string | null {
  const noPortHostname = hostname.split(':')[0].toLowerCase();

  // Development helpers: allow lvh.me and localhost-based tenant lookups
  if (process.env.NODE_ENV === 'development') {
    // lvh.me maps any subdomain to localhost which is convenient for dev
    if (noPortHostname === 'lvh.me' || noPortHostname.endsWith('.lvh.me')) {
      const parts = noPortHostname.split('.');
      if (parts.length >= 3) return parts[0]; // slug.lvh.me
      return null;
    }

    // hostname like slug.localhost => treat as tenant
    for (const suffix of allowedDevSuffixes) {
      if (noPortHostname === suffix) return null;
      if (noPortHostname.endsWith(`.${suffix}`)) {
        const parts = noPortHostname.split('.');
        if (parts.length >= 2) return parts[0];
      }
    }
    return null;
  }

  // Production: prefer explicit tenant/app domain separation
  const tenantDomainRaw = process.env.NEXT_PUBLIC_TENANT_DOMAIN; // e.g. dxscores.app
  const appDomainRaw = process.env.NEXT_PUBLIC_APP_DOMAIN; // e.g. dxscores.com

  const tenantDomain = tenantDomainRaw ? tenantDomainRaw.split(':')[0].toLowerCase() : '';
  const appDomain = appDomainRaw ? appDomainRaw.split(':')[0].toLowerCase() : '';

  // If a dedicated tenant domain is configured, only treat its subdomains as tenant sites
  if (tenantDomain) {
    if (noPortHostname === tenantDomain || noPortHostname === `www.${tenantDomain}`) return null;
    if (noPortHostname.endsWith(`.${tenantDomain}`)) {
      const parts = noPortHostname.split('.');
      const tenantPartsCount = tenantDomain.split('.').length;
      const slugParts = parts.slice(0, parts.length - tenantPartsCount);
      if (slugParts.length >= 1) return slugParts.join('.');
    }
    return null;
  }

  // Fallback (legacy) behaviour: treat subdomains of NEXT_PUBLIC_ROOT_DOMAIN or default as tenants
  const rawRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'elenem.site';
  const rootDomain = rawRootDomain.split(':')[0].toLowerCase();
  if (noPortHostname === rootDomain || noPortHostname === `www.${rootDomain}`) return null;
  const parts = noPortHostname.split('.');
  const rootParts = rootDomain.split('.').slice(-2).join('.');
  const hostRoot = parts.slice(-2).join('.');
  if (hostRoot === rootParts) return parts[0];
  return null;
}