import Link from 'next/link';
import { cn } from '@/utils/cn';
import type { PublicScorers } from '@/lib/public-site/api';

/**
 * The scorers' table (PHASE5B_LEAGUE_SITES §6, Marqueurs): rank and player pinned on the left, the
 * total pinned on the right, the sheet's columns sliding between them on a phone — the same shape
 * as the standings, so a reader who has learnt one reads the other.
 */
export function ScorersTable({ board }: { board: PublicScorers }) {
  const left = 'sticky left-0 z-10 bg-surface shadow-[1px_0_0_var(--color-line)] md:shadow-none';
  const right = 'sticky right-0 z-10 bg-surface shadow-[-1px_0_0_var(--color-line)] md:shadow-none';
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
          <thead>
            <tr className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
              <th scope="col" className={cn(left, 'py-2.5 pl-3 pr-3 text-left font-semibold')}>
                <span className="inline-block w-6 text-center">#</span>
                <span className="ml-2">Joueur</span>
              </th>
              <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                <abbr title="Matchs joués" className="no-underline">MJ</abbr>
              </th>
              {board.columns.map((c) => (
                <th key={c.code} scope="col" className="whitespace-nowrap px-2 py-2.5 text-right font-semibold">
                  <abbr title={c.label} className="no-underline">{c.abbr}</abbr>
                </th>
              ))}
              <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                <abbr title="Moyenne par match" className="no-underline">Moy.</abbr>
              </th>
              <th scope="col" className={cn(right, 'px-3 py-2.5 text-right font-semibold text-ink')}>
                {board.totalAbbr}
              </th>
            </tr>
          </thead>
          <tbody>
            {board.rows.map((r) => (
              <tr key={`${r.rank}-${r.jerseyNumber}-${r.club?.name}`}>
                <td className={cn(left, 'border-t border-line py-2.5 pl-3 pr-3')}>
                  <span className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-center text-ink-muted">{r.rank}</span>
                    <span className="min-w-0 max-w-[9.5rem] sm:max-w-[18rem]">
                      {r.slug ? (
                        <Link href={`/players/${r.slug}`} className="block truncate font-medium text-ink hover:underline">
                          {r.name}
                        </Link>
                      ) : (
                        <span className="block truncate font-medium text-ink">{r.name ?? `n° ${r.jerseyNumber ?? '–'}`}</span>
                      )}
                      <span className="block truncate text-xs text-ink-muted">{r.club?.name ?? ''}</span>
                    </span>
                  </span>
                </td>
                <td className="border-t border-line px-2 py-2.5 text-right text-ink-muted">{r.gamesPlayed}</td>
                {board.columns.map((c) => (
                  <td key={c.code} className="border-t border-line px-2 py-2.5 text-right text-ink-muted">
                    {r.stats[c.code] ?? 0}
                  </td>
                ))}
                <td className="border-t border-line px-2 py-2.5 text-right text-ink-muted">{r.average.toLocaleString('fr-FR')}</td>
                <td className={cn(right, 'border-t border-line px-3 py-2.5 text-right text-base font-bold text-ink')}>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
