import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { PublicClubRef, PublicGameRow } from '@/lib/public-site/api';
import { formatTime } from '@/lib/public-site/format';
import { ClubMark } from './club-mark';
import { StatusBadge, isPlayed } from './status-badge';

/**
 * One game in a list (PHASE5B_LEAGUE_SITES §6, Matchs): the kickoff and its state on the left, the
 * two clubs stacked with their scores — the way a scoreboard reads on a phone — and the winner in
 * bold. The whole row opens the game.
 */
export function MatchRow({ game, competitionLabel }: { game: PublicGameRow; competitionLabel?: string }) {
  const played = isPlayed(game.status);
  const home = game.homeScore ?? 0;
  const away = game.awayScore ?? 0;
  return (
    <li>
      <Link
        href={`/games/${game.competition.slug}/${game.slug}`}
        className="grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 transition-colors hover:bg-surface-sunk sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:px-5"
      >
        <div className="flex flex-col items-start gap-1">
          <span className={cn('text-sm tabular-nums', played ? 'text-ink-subtle' : 'font-semibold text-ink')}>
            {formatTime(game.localTime)}
          </span>
          {game.status !== 'COMPLETED' && <StatusBadge status={game.status} />}
        </div>
        <div className="min-w-0 space-y-1.5">
          {competitionLabel && (
            <p className="truncate text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
              {competitionLabel}
              {game.matchday ? ` · J${game.matchday}` : ''}
            </p>
          )}
          <ClubLine club={game.home} score={played ? home : null} won={played && home > away} lost={played && home < away} />
          <ClubLine club={game.away} score={played ? away : null} won={played && away > home} lost={played && away < home} />
          {game.hall && <p className="hidden truncate pt-0.5 text-xs text-ink-subtle sm:block">{game.hall}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-ink-subtle" aria-hidden />
      </Link>
    </li>
  );
}

function ClubLine({ club, score, won, lost }: { club: PublicClubRef; score: number | null; won: boolean; lost: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <ClubMark club={club} size="xs" />
      <span className={cn('min-w-0 flex-1 truncate', won ? 'font-semibold text-ink' : lost ? 'text-ink-muted' : 'text-ink')}>
        {club.name}
      </span>
      {score !== null && (
        <span className={cn('w-8 text-right tabular-nums', won ? 'font-bold text-ink' : 'text-ink-muted')}>{score}</span>
      )}
    </div>
  );
}
