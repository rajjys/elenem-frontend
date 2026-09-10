'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useScopeContext } from './useScopeContext';

/**
 * A link into a leaf resource that remembers which surface you left from.
 *
 * `/game/abc123` and `/player/abc123` are flat, self-owned routes, and that is deliberate — they
 * survive being pasted into a message, which `/league/game?ctxGameId=abc123` does not. But it cost
 * something: a match names its own league, so the *page* always knew where it was, while the
 * *sidebar* did not. It was chosen by role, so a tenant administrator who had drilled into a
 * competition and opened a fixture from its calendar came back to the organisation's menu, and
 * getting to the next fixture meant Compétitions → the league → the calendar → the date. Every
 * time.
 *
 * So the link carries the surface it was made on, as a hint the destination may use and does not
 * need. Nothing breaks without it: paste `/game/abc123` into WhatsApp and the reader still gets the
 * match, with whatever menu their own role gives them.
 *
 * **The hint is the surface, not the scope.** A league administrator's own league is not appended —
 * their role already selects that menu, and twenty-five characters of identifier in every link they
 * copy buys nothing. It is appended when the reader is somewhere their role would not have put
 * them, which is exactly the case that was broken.
 *
 * See `UI_CONVENTIONS` §1 for why these are pages at all, and `navItemsForSurface` for what the
 * other end does with the hint.
 */
export function useSurfaceLink() {
  const pathname = usePathname() ?? '';
  const params = useSearchParams();
  const scope = useScopeContext();

  return (href: string): string => {
    const carried = new URLSearchParams();

    // Deepest first. A club's surface is inside a competition's, which is inside an organisation's,
    // and the innermost one is the menu the reader is actually using.
    if (pathname.startsWith('/team') && scope.teamId) {
      carried.set('ctxTeamId', scope.teamId);
    } else if (pathname.startsWith('/league') && scope.leagueId) {
      carried.set('ctxLeagueId', scope.leagueId);
    } else if (pathname.startsWith('/tenant') && scope.tenantId) {
      carried.set('ctxTenantId', scope.tenantId);
    } else if (pathname.startsWith('/game/') || pathname.startsWith('/player/')) {
      // Already on a leaf: forward whatever brought us here, so calendar → match → scorer → another
      // match keeps one menu instead of losing it at the first hop.
      for (const key of ['ctxTeamId', 'ctxLeagueId', 'ctxTenantId']) {
        const value = params.get(key);
        if (value) {
          carried.set(key, value);
          break;
        }
      }
    }

    const query = carried.toString();
    if (!query) return href;
    return href.includes('?') ? `${href}&${query}` : `${href}?${query}`;
  };
}
