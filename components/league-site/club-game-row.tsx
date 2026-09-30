import Link from 'next/link';
import { cn } from '@/utils/cn';
import type { PublicClubRef, PublicGameRow } from '@/lib/public-site/api';
import { formatShortDate, formatTime } from '@/lib/public-site/format';
import { ClubMark } from './club-mark';
import { StatusBadge, isPlayed } from './status-badge';

/**
 * One game seen from one club (PHASE5B_LEAGUE_SITES §6, club page): the date, home or away, the
 * opponent, and — once played — the club's own score first, with V or D. The row opens the game.
 *
 * On a phone the opponent's name gets the room: home or away (and the kickoff, before the game)
 * sits under the date rather than in a column of its own, and there is no chevron — the whole row
 * is the link.
 */
export function ClubGameRow({ game, club }: { game: PublicGameRow; club: PublicClubRef }) {
  const atHome = game.home.name === club.name && game.home.slug === club.slug;
  const opponent = atHome ? game.away : game.home;
  const played = isPlayed(game.status);
  const own = (atHome ? game.homeScore : game.awayScore) ?? 0;
  const other = (atHome ? game.awayScore : game.homeScore) ?? 0;
  const won = own > other;

  return (
    <li>
      <Link
        href={`/games/${game.competition.slug}/${game.slug}`}
        className="grid grid-cols-[5.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 transition-colors hover:bg-surface-sunk sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:px-5"
      >
        <span className="text-sm">
          <span className="block font-medium text-ink">{formatShortDate(game.localDate)}</span>
          <span className="block text-xs tabular-nums text-ink-subtle">
            {played ? (atHome ? 'Domicile' : 'Extérieur') : `${formatTime(game.localTime)} · ${atHome ? 'Dom.' : 'Ext.'}`}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <ClubMark club={opponent} size="sm" />
          <span className="truncate text-ink">{opponent.name}</span>
        </span>
        {played ? (
          <span className="flex items-center gap-2">
            <span className="text-right text-sm font-semibold tabular-nums text-ink">
              {own}–{other}
              {game.status === 'FORFEIT' && <span className="block text-[0.65rem] font-normal text-ink-subtle">forfait</span>}
            </span>
            <span
              aria-label={won ? 'Victoire' : 'Défaite'}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold',
                won ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative',
              )}
            >
              {won ? 'V' : 'D'}
            </span>
          </span>
        ) : (
          <StatusBadge status={game.status} compact />
        )}
      </Link>
    </li>
  );
}
