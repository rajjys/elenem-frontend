import Link from 'next/link';
import type { PublicGame } from '@/lib/public-site/api';
import { ClubMark } from './club-mark';

type BoxScore = NonNullable<PublicGame['boxScore']>;
type Side = BoxScore['home'];

/**
 * The two clubs compared, column by column (3 pts, 2 pts, LF, fautes… and the total), as the
 * back office's match page shows it: each club's figure on its side, the column's name between,
 * and a bar each way so the gap reads at a glance. Above, each side's top scorer — the one line
 * anybody repeats out loud. Built only from a scoresheet: two blank columns compared say nothing.
 */
export function TeamComparison({ box }: { box: BoxScore }) {
  const sums = (side: Side) =>
    Object.fromEntries(box.columns.map((c) => [c.code, side.lines.reduce((n, l) => n + (l.stats[c.code] ?? 0), 0)]));
  const home = sums(box.home);
  const away = sums(box.away);
  const rows = [
    { key: 'total', abbr: box.totalAbbr, label: 'Total', h: box.home.total, a: box.away.total },
    ...box.columns.map((c) => ({ key: c.code, abbr: c.abbr, label: c.label, h: home[c.code] ?? 0, a: away[c.code] ?? 0 })),
  ];

  return (
    <section aria-labelledby="comparison">
      <h2 id="comparison" className="mb-3 text-lg font-bold text-ink">Comparaison</h2>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="grid grid-cols-2 divide-x divide-line">
          {[box.home, box.away].map((side) => {
            const top = [...side.lines].sort((x, y) => y.total - x.total)[0];
            return (
              <div key={side.club.name} className="min-w-0 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
                  <ClubMark club={side.club} size="xs" />
                  <span className="truncate">{side.club.name}</span>
                </p>
                {top && top.total > 0 ? (
                  <>
                    <p className="mt-1 truncate text-sm font-semibold text-ink">
                      {top.slug ? (
                        <Link href={`/players/${top.slug}`} className="hover:underline">
                          {top.name}
                        </Link>
                      ) : (
                        (top.name ?? `n° ${top.jerseyNumber ?? '–'}`)
                      )}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      <span className="font-semibold tabular-nums text-ink-muted">
                        {top.total} {box.totalAbbr.toLowerCase()}
                      </span>{' '}
                      · meilleur marqueur
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-ink-subtle">—</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="divide-y divide-line border-t border-line">
          {rows.map((r) => {
            const max = Math.max(r.h, r.a, 1);
            return (
              <div key={r.key} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`w-9 shrink-0 text-right text-sm tabular-nums ${r.h >= r.a ? 'font-bold text-ink' : 'text-ink-muted'}`}>{r.h}</span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex h-2 flex-1 justify-end overflow-hidden rounded-full bg-surface-sunk">
                    <span className="h-full rounded-full bg-[var(--site-accent)]" style={{ width: `${(r.h / max) * 100}%` }} />
                  </div>
                  {/* Fixed width: « LF » is narrower than « Ftes », and bars that moved with their
                      label stopped being a comparison. */}
                  <abbr title={r.label} className="w-14 shrink-0 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle no-underline">
                    {r.abbr}
                  </abbr>
                  <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface-sunk">
                    <span className="h-full rounded-full bg-[var(--site-accent)] opacity-45" style={{ width: `${(r.a / max) * 100}%` }} />
                  </div>
                </div>
                <span className={`w-9 shrink-0 text-sm tabular-nums ${r.a >= r.h ? 'font-bold text-ink' : 'text-ink-muted'}`}>{r.a}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
