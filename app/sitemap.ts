import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { resolveTenantSlugFromHostname } from '@/utils/resolveTenantSlugFromHostname';
import { buildTenantUrl } from '@/utils/tenant-url';
import { siteGet, type PublicSitemap } from '@/lib/public-site/api';

/**
 * One sitemap per host, like robots.txt (PHASE5A_PRODUCT_SITE §8.4).
 *
 * dxscores.com lists its public pages — the landing and the pages it links to — and nothing behind
 * the login. A league site lists its own pages, from its data (PHASE5B §9): competitions, clubs,
 * this season's games and its posts, each with the date it last changed, so a new score is news to
 * a crawler. A PRIVATE league's list is empty. Any other host lists nothing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawHost = (await headers()).get('host') ?? '';
  const host = rawHost.split(':')[0].toLowerCase();
  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN || 'dxscores.com').toLowerCase();

  const leagueSlug = resolveTenantSlugFromHostname(rawHost);
  if (leagueSlug) {
    const map = await siteGet<PublicSitemap>(leagueSlug, '/sitemap');
    if (!map?.indexable) return [];
    return map.entries.map((e) => ({
      url: buildTenantUrl(leagueSlug, e.path),
      ...(e.lastModified ? { lastModified: new Date(e.lastModified) } : {}),
    }));
  }

  if (host !== appDomain && host !== 'localhost') return [];

  const base = `https://${appDomain}`;
  const updated = new Date('2026-09-29');
  return [
    { url: `${base}/`, lastModified: updated, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/contact`, lastModified: updated, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/legal`, lastModified: updated, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, lastModified: updated, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacy`, lastModified: updated, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
