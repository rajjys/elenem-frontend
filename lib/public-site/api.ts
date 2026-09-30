import type { ApiSchema } from '@/types/api-types';

/**
 * The league site's server fetchers (PHASE5B_LEAGUE_SITES §4.1).
 *
 * Plain `fetch` on the server, cached for a minute and tagged by league, rather than the app's
 * axios client and React Query: a league site has no client data layer at all. It renders HTML
 * with the numbers in it, which is how it stays small, previews in WhatsApp and loads on 3G.
 * Responses are typed from the generated OpenAPI contract, so a change on the API side fails the
 * build rather than a supporter's page.
 */

const API_URL = (
  process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_API_URL ?? '' : 'http://localhost:3333'
).replace(/\/$/, '');

/** A score entered in the dashboard reaches the public site within this many seconds. */
export const SITE_REVALIDATE_SECONDS = 60;

export type PublicSite = ApiSchema<'PublicSiteDto'>;
export type PublicSitemap = ApiSchema<'PublicSitemapDto'>;

/**
 * GET /public/sites/:slug<path>. Null on 404 — an unknown league, or a page that does not exist
 * inside one — and an error for anything else, so a down API is never mistaken for a missing site.
 */
export async function siteGet<T>(
  slug: string,
  path = '',
  query: Record<string, string | undefined> = {},
): Promise<T | null> {
  const qs = new URLSearchParams(
    Object.entries(query).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== ''),
  ).toString();
  const res = await fetch(`${API_URL}/public/sites/${encodeURIComponent(slug)}${path}${qs ? `?${qs}` : ''}`, {
    next: { revalidate: SITE_REVALIDATE_SECONDS, tags: [`site:${slug}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`League site API answered ${res.status} for ${slug}${path}`);
  return (await res.json()) as T;
}
