import { unstable_cache } from 'next/cache';
import type { ApiSchema } from '@/types/api-types';

/**
 * The league site's server fetchers (PHASE5B_LEAGUE_SITES §4.1).
 *
 * Plain `fetch` on the server, its parsed result cached for a minute and tagged by league
 * (`siteGet`), rather than the app's axios client and React Query: a league site has no client data layer at all. It renders HTML
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
 *
 * Cached for a minute per URL, tagged by league, through `unstable_cache` rather than `fetch`'s own
 * data cache. Next stores a fetched response only when its status is 200 (patch-fetch.js:626), so
 * with `fetch` caching a page that *became* a 404 — a deleted organisation, communiqué, match or
 * club, a player hidden by the names switch — kept its last 200 forever: each refresh got the 404,
 * did not store it, and the stale page was served again. Here the cached value is the parsed
 * result, `null` included, so a disappearance replaces what was there within a minute. An error
 * still throws: a refresh that fails keeps the last good page, and a first load shows the error.
 */
export async function siteGet<T>(
  slug: string,
  path = '',
  query: Record<string, string | undefined> = {},
): Promise<T | null> {
  const qs = new URLSearchParams(
    Object.entries(query).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== ''),
  ).toString();
  const url = `${API_URL}/public/sites/${encodeURIComponent(slug)}${path}${qs ? `?${qs}` : ''}`;

  return unstable_cache(
    async (): Promise<T | null> => {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`League site API answered ${res.status} for ${slug}${path}`);
      return (await res.json()) as T;
    },
    ['public-site', url],
    { revalidate: SITE_REVALIDATE_SECONDS, tags: [`site:${slug}`] },
  )();
}

export type PublicStandings = ApiSchema<'PublicStandingsDto'>;
export type PublicStandingsRow = ApiSchema<'PublicStandingsRowDto'>;
export type PublicGames = ApiSchema<'PublicGamesDto'>;
export type PublicGameRow = ApiSchema<'PublicGameRowDto'>;
export type PublicGame = ApiSchema<'PublicGameDto'>;
export type PublicClubRef = ApiSchema<'PublicClubRefDto'>;
export type PublicGameStatus = ApiSchema<'PublicGameStatus'>;
export type PublicScorers = ApiSchema<'PublicScorersDto'>;
export type PublicPostSummary = ApiSchema<'PublicPostSummaryDto'>;
export type PublicClub = ApiSchema<'PublicClubDto'>;
export type PublicClubListItem = ApiSchema<'PublicClubListItemDto'>;
export type PublicPost = ApiSchema<'PublicPostDto'>;
export type PublicKnockout = ApiSchema<'PublicKnockoutDto'>;
export type PublicPlayer = ApiSchema<'PublicPlayerDto'>;
