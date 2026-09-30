import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatShortDate } from '@/lib/public-site/format';

/**
 * Week by week (PHASE5B_LEAGUE_SITES §6, Matchs). The arrows go to the nearest week that has
 * games, not merely the adjacent one, so a reader never pages through an empty fortnight between
 * two phases.
 */
export function WeekPager({
  from,
  to,
  current,
  prevHref,
  nextHref,
  todayHref,
}: {
  from: string;
  to: string;
  current: boolean;
  prevHref: string | null;
  nextHref: string | null;
  todayHref: string;
}) {
  const arrow = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors';
  return (
    <nav aria-label="Semaines" className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5">
      {prevHref ? (
        <Link href={prevHref} aria-label="Semaine précédente" className={cn(arrow, 'text-ink hover:bg-surface-sunk')}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrow, 'text-line-strong')}>
          <ChevronLeft className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 flex-1 text-center">
        <p className="text-sm font-semibold text-ink">
          {current ? 'Cette semaine' : 'Semaine'}{' '}
          <span className="font-normal text-ink-muted">
            du {formatShortDate(from)} au {formatShortDate(to)}
          </span>
        </p>
        {!current && (
          <Link href={todayHref} className="text-xs font-medium text-[var(--site-accent)] hover:underline">
            Revenir à cette semaine
          </Link>
        )}
      </div>
      {nextHref ? (
        <Link href={nextHref} aria-label="Semaine suivante" className={cn(arrow, 'text-ink hover:bg-surface-sunk')}>
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrow, 'text-line-strong')}>
          <ChevronRight className="h-5 w-5" />
        </span>
      )}
    </nav>
  );
}
