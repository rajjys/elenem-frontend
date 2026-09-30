/**
 * A league-site link that changes some query parameters and keeps the rest: choosing « Dames »
 * keeps the season, and moving a week keeps the competition. Empty values are dropped, so the
 * default choice is the bare address.
 */
export function withParams(
  path: string,
  current: Record<string, string | undefined>,
  changes: Record<string, string | undefined> = {},
): string {
  const merged = { ...current, ...changes };
  const qs = new URLSearchParams(
    Object.entries(merged).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== ''),
  ).toString();
  return qs ? `${path}?${qs}` : path;
}

/** The first value of a search parameter, as Next.js hands them over. */
export const param = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);
