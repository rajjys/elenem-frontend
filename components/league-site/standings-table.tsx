import Link from 'next/link';
import { cn } from '@/utils/cn';
import type { PublicStandings, PublicStandingsRow } from '@/lib/public-site/api';
import { ClubMark } from './club-mark';

/**
 * The table (PHASE5B_LEAGUE_SITES §6, Classement): the columns, bands, rule and tie-breaks the
 * signed export prints, in the sport's own heads (MJ · MG · MP · FI · P.M · P.E · +/- · PTS).
 *
 * Mobile first. The rank and the club are pinned on the left and PTS on the right, so at 390 px a
 * reader sees who is where and on how many points without scrolling; the columns between slide
 * underneath. The club is its short code on a phone and its full name from `sm`.
 *
 * Bands are a bar on the rank in the semantic colours, with the legend below in words, so colour is
 * never the only signal and never the league's own.
 */
export function StandingsTable({ table, competition }: { table: PublicStandings; competition: string }) {
  const middle = table.columns.filter((c) => c.key !== 'points');
  const points = table.columns.find((c) => c.key === 'points');

  if (table.rows.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface px-6 py-12 text-center text-ink-muted">
        Le classement apparaîtra après le premier résultat.
      </div>
    );
  }

  // The dividers mark where the scrolling columns slide under the pinned ones — on a phone. From
  // `md` the whole table fits and they would only be stray lines.
  const stickyLeft = 'sticky left-0 z-10 bg-surface shadow-[1px_0_0_var(--color-line)] md:shadow-none';
  const stickyRight = 'sticky right-0 z-10 bg-surface shadow-[-1px_0_0_var(--color-line)] md:shadow-none';

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
          <thead>
            <tr className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
              <th scope="col" className={cn(stickyLeft, 'py-2.5 pl-3 pr-3 text-left font-semibold')}>
                <span className="inline-block w-6 text-center">#</span>
                <span className="ml-2">Équipe</span>
              </th>
              {middle.map((c) => (
                <th key={c.key} scope="col" className="px-2 py-2.5 text-right font-semibold">
                  <abbr title={c.label} className="no-underline">
                    {c.abbr}
                  </abbr>
                </th>
              ))}
              {points && (
                <th scope="col" className={cn(stickyRight, 'px-3 py-2.5 text-right font-semibold text-ink')}>
                  <abbr title={points.label} className="no-underline">
                    {points.abbr}
                  </abbr>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <Row key={row.rank + row.club.name} row={row} middle={middle.map((c) => c.key)} competition={competition} left={stickyLeft} right={stickyRight} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  row,
  middle,
  competition,
  left,
  right,
}: {
  row: PublicStandingsRow;
  middle: PublicStandings['columns'][number]['key'][];
  competition: string;
  left: string;
  right: string;
}) {
  const bar =
    row.band === 'QUALIFICATION' ? 'border-l-positive' : row.band === 'RELEGATION' ? 'border-l-negative' : 'border-l-transparent';
  const club = (
    <span className="flex min-w-0 items-center gap-2">
      <ClubMark club={row.club} size="xs" />
      <span className="truncate font-medium text-ink sm:hidden">{row.club.shortCode ?? row.club.name}</span>
      <span className="hidden truncate font-medium text-ink sm:inline">{row.club.name}</span>
    </span>
  );
  return (
    <tr className="group">
      <td className={cn(left, 'border-t border-l-[3px] border-t-line py-2.5 pl-2.5 pr-3', bar)}>
        <span className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-center text-ink-muted">{row.rank}</span>
          {row.club.slug ? (
            <Link href={`/teams/${competition}/${row.club.slug}`} className="min-w-0 max-w-[7.5rem] hover:underline sm:max-w-[16rem]">
              {club}
            </Link>
          ) : (
            <span className="min-w-0 max-w-[7.5rem] sm:max-w-[16rem]">{club}</span>
          )}
        </span>
      </td>
      {middle.map((key) => (
        <td key={key} className="border-t border-line px-2 py-2.5 text-right text-ink-muted">
          {key === 'goalDifference' && row[key] > 0 ? `+${row[key]}` : row[key]}
        </td>
      ))}
      <td className={cn(right, 'border-t border-line px-3 py-2.5 text-right text-base font-bold text-ink')}>{row.points}</td>
    </tr>
  );
}
