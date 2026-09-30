import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { PublicClubRef, PublicGame } from '@/lib/public-site/api';
import { formatDate, formatTime } from '@/lib/public-site/format';
import { ClubMark } from './club-mark';
import { StatusBadge, isPlayed } from './status-badge';

/**
 * The top of a game's page (PHASE5B_LEAGUE_SITES §6, Match): the two clubs, the score large — or
 * the kickoff, before it is played — and where the game sits in the season.
 */
export function ScoreHeader({ game }: { game: PublicGame }) {
  const played = isPlayed(game.status);
  const home = game.homeScore ?? 0;
  const away = game.awayScore ?? 0;
  const context = [
    game.competition.name,
    game.phase && game.phase.format !== 'LEAGUE' ? game.phase.name : null,
    game.group,
    game.matchday ? `Journée ${game.matchday}` : null,
  ].filter(Boolean);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
      <p className="px-4 pt-5 text-center text-xs font-semibold uppercase tracking-wide text-ink-subtle sm:pt-6">
        {context.join(' · ')}
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 px-3 py-6 sm:gap-8 sm:px-10 sm:py-8">
        <Club club={game.home} competition={game.competition.slug} faded={played && home < away} />
        <div className="flex min-w-[6.5rem] flex-col items-center gap-2 pt-3 sm:pt-4">
          {played ? (
            <p className="whitespace-nowrap text-4xl font-bold tabular-nums tracking-tight text-ink sm:text-6xl">
              <span className={cn(home < away && 'text-ink-subtle')}>{home}</span>
              <span className="mx-2 text-ink-subtle">–</span>
              <span className={cn(away < home && 'text-ink-subtle')}>{away}</span>
            </p>
          ) : (
            <p className="text-3xl font-bold tabular-nums text-ink sm:text-4xl">{formatTime(game.localTime)}</p>
          )}
          <StatusBadge status={game.status} />
        </div>
        <Club club={game.away} competition={game.competition.slug} faded={played && away < home} />
      </div>
      {game.statusReason && (
        <p className="border-t border-line bg-caution-soft px-4 py-2.5 text-center text-sm text-caution">
          {game.status === 'CANCELLED' ? 'Annulé' : 'Reporté'} : {game.statusReason}
        </p>
      )}
      {/* Two parts that wrap whole, each with its icon — not a line of dots that breaks between them. */}
      <p className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 border-t border-line bg-surface-sunk px-4 py-3 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          <span className="first-letter:uppercase">
            {formatDate(game.localDate, 'long')} à {formatTime(game.localTime)}
          </span>
        </span>
        {game.hall && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {game.hall}
          </span>
        )}
      </p>
    </section>
  );
}

function Club({ club, competition, faded }: { club: PublicClubRef; competition: string; faded: boolean }) {
  const name = (
    <span className={cn('text-sm font-semibold leading-snug sm:text-base', faded ? 'text-ink-muted' : 'text-ink')}>
      {club.name}
    </span>
  );
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <ClubMark club={club} size="lg" />
      {club.slug ? (
        <Link href={`/teams/${competition}/${club.slug}`} className="hover:underline">
          {name}
        </Link>
      ) : (
        name
      )}
    </div>
  );
}
