import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { resolveTenantSlugFromHostname } from '@/utils/resolveTenantSlugFromHostname';
import { buildTenantUrl } from '@/utils/tenant-url';

/**
 * One robots.txt per host, because one deployment serves three kinds of host.
 *
 * - The app (`dxscores.com`): the public pages are crawlable; the app behind the login is not.
 * - A league site (`<slug>.dxscores.app`): all of it is public. Its sitemap arrives with 5B.
 * - Anything else — Vercel preview URLs, stray hosts — is closed, so a preview never competes with
 *   the real site in search results.
 *
 * Until this existed, `https://dxscores.com/robots.txt` answered with a redirect to `/login`.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? '';
  const bareHost = host.split(':')[0].toLowerCase();
  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN || 'dxscores.com').toLowerCase();

  const leagueSlug = resolveTenantSlugFromHostname(host);
  if (leagueSlug) {
    // A league site: open, with its own sitemap (PHASE5B §9). A PRIVATE league's sitemap is empty
    // and its pages carry noindex, which a crawler can only read if it is allowed in.
    return { rules: { userAgent: '*', allow: '/' }, sitemap: buildTenantUrl(leagueSlug, '/sitemap.xml') };
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
      sitemap: `https://${appDomain}/sitemap.xml`,
    };
  }

  return { rules: { userAgent: '*', disallow: '/' } };
}
