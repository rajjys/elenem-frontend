import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

/**
 * One sitemap per host, like robots.txt (PHASE5A_PRODUCT_SITE §8.4).
 *
 * dxscores.com lists its public pages — the landing and the pages it links to — and nothing behind
 * the login. A league site's sitemap is built from its own data in 5B (PHASE5B §9); until then a
 * league host, like any other host, lists nothing rather than the product's pages under its name.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = ((await headers()).get('host') ?? '').split(':')[0].toLowerCase();
  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN || 'dxscores.com').toLowerCase();
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
