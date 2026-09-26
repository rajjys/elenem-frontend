import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { resolveTenantSlugFromHostname } from '@/utils/resolveTenantSlugFromHostname';

/**
 * One robots.txt per host, because one deployment serves three kinds of host.
 *
 * - The app (`dxscores.com`): the public pages are crawlable; the app behind the login is not.
 * - A league site (`<slug>.dxscores.app`): all of it is public. Its sitemap arrives with 5B.
 * - Anything else — Vercel preview URLs, stray hosts — is closed, so a preview never competes with
 *   the real site in search results.
 *
 * Until this existed, `https://dxscores.com/robots.txt` answered with a redirect to `/login`.
 * The sitemap for the app host is added in 5A.3.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? '';
  const bareHost = host.split(':')[0].toLowerCase();
  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN || 'dxscores.com').toLowerCase();

  if (resolveTenantSlugFromHostname(host)) {
    return { rules: { userAgent: '*', allow: '/' } };
  }

  if (bareHost === appDomain || bareHost === 'localhost') {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin', '/tenant', '/league', '/team', '/account', '/onboarding',
          '/game', '/player', '/post', '/public/', '/access-denied',
        ],
      },
    };
  }

  return { rules: { userAgent: '*', disallow: '/' } };
}
