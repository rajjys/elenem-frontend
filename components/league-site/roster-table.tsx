import Link from 'next/link';
import { cn } from '@/utils/cn';
import { PlayerPhoto } from './player-photo';
import type { PublicClub } from '@/lib/public-site/api';

/**
 * A club's roster with each player's season (the owner's request, 2026-09-30): number, name and
 * position pinned on the left, games, the scoresheet's columns and the average between, points
 * pinned on the right — the club's own scorers table, without leaving its page. A named player
 * opens their page. Before any scoresheet, only the roster.
 */
export function RosterTable({ club }: { club: PublicClub }) {
  const withFigures = club.roster.some((p) => p.gamesPlayed > 0);
  // A photo column only when someone has one, and then a slot on every row so the names line up.
  // photoUrl is null for any player whose name is hidden, so a face never outlives its name.
  const withPhotos = club.roster.some((p) => p.photoUrl);
  const left = 'sticky left-0 z-10 bg-surface shadow-[1px_0_0_var(--color-line)] md:shadow-none';
  const right = 'sticky right-0 z-10 bg-surface shadow-[-1px_0_0_var(--color-line)] md:shadow-none';
  const head = 'px-2 py-2.5 text-right font-semibold';
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
          <thead>
            <tr className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
              <th scope="col" className={cn(left, 'py-2.5 pl-3 pr-3 text-left font-semibold')}>
                <span className="inline-block w-7">N°</span>
                <span>Joueur</span>
              </th>
              {withFigures ? (
                <>
                  <th scope="col" className={head}><abbr title="Matchs joués" className="no-underline">MJ</abbr></th>
                  {club.columns.map((c) => (
                    <th key={c.code} scope="col" className={cn(head, 'whitespace-nowrap')}>
                      <abbr title={c.label} className="no-underline">{c.abbr}</abbr>
                    </th>
                  ))}
                  <th scope="col" className={head}><abbr title="Moyenne par match" className="no-underline">Moy.</abbr></th>
                  <th scope="col" className={cn(right, 'px-3 py-2.5 text-right font-semibold text-ink')}>{club.totalAbbr}</th>
                </>
              ) : (
                <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Poste</th>
              )}
            </tr>
          </thead>
          <tbody>
            {club.roster.map((p, i) => {
              const name = p.name ?? (p.jerseyNumber !== null ? `n° ${p.jerseyNumber}` : 'Joueur');
              return (
                <tr key={`${p.jerseyNumber ?? 'x'}-${i}`}>
                  <td className={cn(left, 'border-t border-line py-2.5 pl-3 pr-3')}>
                    <span className="flex items-center">
                      <span className="w-7 shrink-0 text-ink-subtle">{p.jerseyNumber ?? '–'}</span>
                      {withPhotos &&
                        (p.photoUrl ? (
                          <PlayerPhoto url={p.photoUrl} size={28} className="mr-2.5" />
                        ) : (
                          // An invisible slot: the names stay aligned, without a column of empty discs to look past.
                          <span aria-hidden className="mr-2.5 h-7 w-7 shrink-0" />
                        ))}
                      <span className="min-w-0 max-w-[9rem] sm:max-w-[16rem]">
                        {p.slug ? (
                          <Link href={`/players/${p.slug}`} className="block truncate font-medium text-ink hover:underline">
                            {name}
                          </Link>
                        ) : (
                          <span className="block truncate font-medium text-ink">{name}</span>
                        )}
                        {withFigures && p.position && <span className="block truncate text-xs text-ink-muted">{p.position}</span>}
                      </span>
                    </span>
                  </td>
                  {withFigures ? (
                    <>
                      <td className="border-t border-line px-2 py-2.5 text-right text-ink-muted">{p.gamesPlayed}</td>
                      {club.columns.map((c) => (
                        <td key={c.code} className="border-t border-line px-2 py-2.5 text-right text-ink-muted">
                          {p.stats[c.code] ?? 0}
                        </td>
                      ))}
                      <td className="border-t border-line px-2 py-2.5 text-right text-ink-muted">{p.average.toLocaleString('fr-FR')}</td>
                      <td className={cn(right, 'border-t border-line px-3 py-2.5 text-right font-bold text-ink')}>{p.total}</td>
                    </>
                  ) : (
                    <td className="border-t border-line py-2.5 pr-4 text-right text-ink-muted">{p.position ?? ''}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
