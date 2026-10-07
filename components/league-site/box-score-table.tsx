import Link from 'next/link';
import { Star } from 'lucide-react';
import type { PublicGame } from '@/lib/public-site/api';
import { ClubMark } from './club-mark';

type BoxScore = NonNullable<PublicGame['boxScore']>;
type Side = BoxScore['home'];

/**
 * One club's scoresheet (PHASE5B_LEAGUE_SITES §6, Match): number, player, the sport's scoring
 * columns (LF, 2 pts, 3 pts…), and the total, with the top scorer starred. A player the site does
 * not name — the competition keeps identities private, or the player is not PUBLIC (§4.9) — is
 * shown by number only. On a phone the player column stays pinned while the figures slide.
 */
export function BoxScoreTable({ side, columns, totalAbbr }: { side: Side; columns: BoxScore['columns']; totalAbbr: string }) {
  // Player pinned left and total pinned right, as on the table: on a phone the figures slide
  // between them, and who scored how many never leaves the screen.
  const pinned = 'sticky left-0 z-10 bg-surface shadow-[1px_0_0_var(--color-line)] md:shadow-none';
  const pinnedRight = 'sticky right-0 z-10 bg-surface shadow-[-1px_0_0_var(--color-line)] md:shadow-none';
  return (
    <section aria-label={`Feuille de marque — ${side.club.name}`}>
      <h3 className="mb-2 flex items-center justify-between gap-3 px-1">
        <span className="flex min-w-0 items-center gap-2">
          <ClubMark club={side.club} size="sm" />
          <span className="truncate font-semibold text-ink">{side.club.name}</span>
        </span>
        <span className="font-bold tabular-nums text-ink">{side.total}</span>
      </h3>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
            <thead>
              <tr className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
                <th scope="col" className={`${pinned} py-2.5 pl-3 pr-3 text-left font-semibold`}>
                  Joueur
                </th>
                {columns.map((c) => (
                  <th key={c.code} scope="col" className="whitespace-nowrap px-1.5 py-2.5 text-right font-semibold sm:px-2">
                    <abbr title={c.label} className="no-underline">
                      {c.abbr}
                    </abbr>
                  </th>
                ))}
                <th scope="col" className={`${pinnedRight} px-3 py-2.5 text-right font-semibold text-ink`}>
                  {totalAbbr}
                </th>
              </tr>
            </thead>
            <tbody>
              {side.lines.map((line, i) => (
                <tr key={`${line.jerseyNumber ?? 'x'}-${i}`}>
                  <td className={`${pinned} border-t border-line py-2.5 pl-3 pr-3`}>
                    <span className="flex max-w-[9.5rem] items-center gap-2 sm:max-w-none">
                      <span className="w-6 shrink-0 text-right text-ink-subtle">{line.jerseyNumber ?? '–'}</span>
                      {line.slug ? (
                        <Link href={`/players/${line.slug}`} className="truncate text-ink hover:underline">
                          {line.name}
                        </Link>
                      ) : (
                        <span className="truncate text-ink">
                          {line.name ?? (line.jerseyNumber !== null ? `n° ${line.jerseyNumber}` : 'Joueur')}
                        </span>
                      )}
                      {line.topScorer && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-caution text-caution" aria-label="Meilleur marqueur" />
                      )}
                    </span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.code} className="border-t border-line px-1.5 py-2.5 text-right text-ink-muted sm:px-2">
                      {line.stats[c.code] ?? 0}
                    </td>
                  ))}
                  <td className={`${pinnedRight} border-t border-line px-3 py-2.5 text-right font-semibold text-ink`}>{line.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
