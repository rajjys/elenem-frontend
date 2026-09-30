import Link from 'next/link';
import { cn } from '@/utils/cn';
import type { PublicStandings } from '@/lib/public-site/api';
import { ClubMark } from './club-mark';

/**
 * The top of a table, for the home page and a club's page: rank, club, games played and points —
 * four columns that fit a phone without scrolling. `highlight` marks one club's row.
 */
export function MiniStandings({
  table,
  limit = 8,
  highlight,
}: {
  table: PublicStandings;
  limit?: number;
  highlight?: string | null;
}) {
  const rows = table.rows.slice(0, limit);
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-ink-muted">
        Le classement apparaîtra après le premier résultat.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
            <th scope="col" className="w-10 py-2.5 pl-3 text-left font-semibold">#</th>
            <th scope="col" className="py-2.5 text-left font-semibold">Équipe</th>
            <th scope="col" className="w-12 py-2.5 text-right font-semibold">
              <abbr title="Matchs joués" className="no-underline">MJ</abbr>
            </th>
            <th scope="col" className="w-14 py-2.5 pr-4 text-right font-semibold text-ink">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const mine = !!highlight && r.club.slug === highlight;
            return (
              <tr key={r.rank + r.club.name} className={cn(mine && 'bg-surface-sunk')}>
                <td
                  className={cn(
                    'border-t border-l-[3px] border-t-line py-2.5 pl-2.5 text-ink-muted',
                    r.band === 'QUALIFICATION' ? 'border-l-positive' : r.band === 'RELEGATION' ? 'border-l-negative' : 'border-l-transparent',
                  )}
                >
                  {r.rank}
                </td>
                <td className="max-w-0 border-t border-line py-2.5 pr-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <ClubMark club={r.club} size="xs" />
                    {r.club.slug ? (
                      <Link href={`/teams/${table.competition.slug}/${r.club.slug}`} className={cn('truncate hover:underline', mine ? 'font-bold text-ink' : 'font-medium text-ink')}>
                        {r.club.name}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-ink">{r.club.name}</span>
                    )}
                  </span>
                </td>
                <td className="border-t border-line py-2.5 text-right text-ink-muted">{r.gamesPlayed}</td>
                <td className="border-t border-line py-2.5 pr-4 text-right font-bold text-ink">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
