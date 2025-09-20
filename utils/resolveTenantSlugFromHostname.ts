export function resolveTenantSlugFromHostname( 
  hostname: string, 
  allowedDevSuffixes: string[] = ['localhost'] ): string | null { 
    // Define your root domain from environment variables. 
    // // Use a fallback for development if NEXT_PUBLIC_ROOT_DOMAIN is not set. 
    // // For Vercel deployments, this will typically be your production domain. 
    // // For local development, you might use 'localhost:3000', 'lvh.me:3000' or similar. 
    const rawRootDomain = process.env.NODE_ENV === 'development' ? 'lvh.me' : process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'elenem.site'; 
    const rootDomain = rawRootDomain.split(':')[0]; // Remove port if present
    const noPortHostname = hostname.split(':')[0]
    const isRootDomain = noPortHostname === rootDomain || noPortHostname === `www.${rootDomain}`; 
    if (isRootDomain) return null; 
    const parts = noPortHostname.split('.'); 
    // Dev mode: Check if hostname ends with a known dev suffix like .localhost 
      for (const suffix of allowedDevSuffixes) { 
        if (noPortHostname.endsWith(`.${suffix}`)) { 
          if (parts.length >= 2 && parts[parts.length - 1] === suffix) { 
            return parts[0]; // e.g., 'ligue1.localhost' -> 'ligue1' 
          } 
        } 
      } 
      // // Prod mode: Validate against root domain (e.g., 'website.com') 
      const rootParts = rootDomain.split('.').slice(-2).join('.'); 
      const hostRoot = parts.slice(-2).join('.'); 
      if (hostRoot === rootParts) { 
        return parts[0]; // e.g., 'ligue1.website.com' -> 'ligue1' 
      } 
      return null; 
      }