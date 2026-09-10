'use client';

import { useSearchParams } from 'next/navigation';
import { useCurrentUser } from './useAuth';
import { Roles } from '@/schemas';
import { BACK_PHRASES } from '@/components/layouts/page-titles';

/**
 * « Retour … », to the screen you actually came from.
 *
 * The back links on `/game/[gameId]` and `/player/[playerId]` were fixed strings pointing at fixed
 * routes — « Retour au calendrier » always went to the calendar, « Retour aux joueurs » always to a
 * roster — so opening a scorer from the statistics table and pressing back put you somewhere you
 * had never been, and did it without the competition you were reading, on a route your role might
 * not even allow.
 *
 * `useSurfaceLink` already appends the surface a link was made on. It appends the **path** too, and
 * this reads it back: the destination is exactly where the reader was, with the ctx it was carrying,
 * and the label names it — « Retour aux statistiques », « Retour à l'effectif ».
 *
 * **A pasted link has no origin, and gets the role's own default.** Someone opening
 * `/game/abc123` from WhatsApp has nowhere to go back to; sending them to their own calendar is a
 * guess, but it is the guess that is true for the person most likely to have followed such a link.
 */
export function useBackLink(): { href: string; label: string } | null {
  const params = useSearchParams();
  const user = useCurrentUser();
  const roles = user?.roles ?? [];

  const carried = new URLSearchParams();
  for (const key of ['ctxTeamId', 'ctxLeagueId', 'ctxTenantId']) {
    const value = params.get(key);
    if (value) carried.set(key, value);
  }

  const from = params.get('from');

  // Only ever a path we produced: same-origin, absolute, no protocol. An open redirect through a
  // query parameter is a small door, but it is a door.
  const safeFrom = from && /^\/[A-Za-z0-9/_-]*$/.test(from) ? from : null;

  if (safeFrom) {
    const segment = safeFrom.split('/').filter(Boolean).pop() ?? '';
    const phrase = BACK_PHRASES[segment];
    if (phrase) {
      const query = carried.toString();
      return { href: query ? `${safeFrom}?${query}` : safeFrom, label: `Retour ${phrase}` };
    }
  }

  // No usable origin. The reader's own surface, which is where their menu points anyway.
  const surface = roles.includes(Roles.TEAM_ADMIN)
    ? '/team'
    : roles.includes(Roles.LEAGUE_ADMIN)
      ? '/league'
      : roles.includes(Roles.TENANT_ADMIN)
        ? '/tenant'
        : null;

  if (!surface) return null;
  return { href: `${surface}/calendar`, label: 'Retour au calendrier' };
}
