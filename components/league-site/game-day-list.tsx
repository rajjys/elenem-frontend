import type { PublicGameRow } from '@/lib/public-site/api';
import { dayLabel, formatDate } from '@/lib/public-site/format';
import { MatchRow } from './match-row';

/**
 * Games grouped by day under a quiet heading (« Demain · jeudi 1 octobre »), each day a card of
 * match rows. For the home page and a club's page; the Matchs page adds a sticky heading.
 */
export function GameDayList({
  games,
  today,
  labelOf,
}: {
  games: PublicGameRow[];
  today: string;
  /** Short competition label per slug, when several competitions are mixed. */
  labelOf?: Map<string, string>;
}) {
  const days = new Map<string, PublicGameRow[]>();
  for (const g of games) days.set(g.localDate, [...(days.get(g.localDate) ?? []), g]);
  return (
    <div className="space-y-4">
      {[...days.entries()].map(([date, list]) => {
        const label = dayLabel(date, today);
        const relative = label !== formatDate(date);
        return (
          <div key={date}>
            <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              {relative ? `${label} · ${formatDate(date)}` : formatDate(date, 'long')}
            </h3>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {list.map((g) => (
                <MatchRow
                  key={`${g.competition.slug}/${g.slug}`}
                  game={g}
                  competitionLabel={labelOf ? (labelOf.get(g.competition.slug) ?? g.competition.name) : undefined}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
