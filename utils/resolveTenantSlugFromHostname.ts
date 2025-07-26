export function resolveTenantSlugFromHostname(
  hostname: string,
  rootDomain: string,
  allowedDevSuffixes: string[] = ['localhost']
): string | null {
  const isRootDomain =
    hostname === rootDomain || hostname === `www.${rootDomain}`;

  if (isRootDomain) return null;

  const parts = hostname.split('.');

  // Dev mode: Check if hostname ends with a known dev suffix like .localhost
  for (const suffix of allowedDevSuffixes) {
    if (hostname.endsWith(`.${suffix}`)) {
      if (parts.length >= 2 && parts[parts.length - 1] === suffix) {
        return parts[0]; // e.g., 'ligue1.localhost' -> 'ligue1'
      }
    }
  }

  // Prod mode: Validate against root domain (e.g., 'website.com')
  const rootParts = rootDomain.split('.').slice(-2).join('.');
  const hostRoot = parts.slice(-2).join('.');
  if (hostRoot === rootParts) {
    return parts[0]; // e.g., 'ligue1.website.com' -> 'ligue1'
  }

  return null;
}
