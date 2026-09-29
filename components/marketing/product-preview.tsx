import { cn } from '@/utils/cn';

/**
 * The product, drawn in HTML for the landing (PHASE5A_PRODUCT_SITE §6.1, §6.5).
 *
 * Not screenshots, for now: the only data on hand belongs to real federations, and their names do
 * not go on our homepage without their consent (§3.4). These are fictional clubs whose numbers
 * obey the real rule — 2 points a win, 1 a loss — so the table is internally true, and they are
 * labelled as an example. Drawn on tokens, they follow the theme and weigh nothing. The demo
 * league's real screenshots replace them once it exists.
 */

const ROWS = [
  // Six clubs, home and away: 10 games each, 30 wins and 30 losses, differences summing to zero.
  { club: 'Aigles BC', mj: 10, g: 9, p: 1, diff: '+84' },
  { club: 'Étoile du Lac', mj: 10, g: 8, p: 2, diff: '+52' },
  { club: 'Lions BC', mj: 10, g: 6, p: 4, diff: '+21' },
  { club: 'Jeunesse Sportive', mj: 10, g: 4, p: 6, diff: '−9' },
  { club: 'Olympic BC', mj: 10, g: 2, p: 8, diff: '−58' },
  { club: 'Union BC', mj: 10, g: 1, p: 9, diff: '−90' },
];

/** A phone showing a league site's standings: what a supporter opens from WhatsApp. */
export function PhoneStandings({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'w-[17.5rem] rounded-[2rem] border border-line-strong bg-elevated p-2 shadow-e2',
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.6rem] border border-line bg-canvas">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-[0.6rem] font-bold text-accent-ink">
            LD
          </span>
          <span className="truncate text-xs font-semibold text-ink">Ligue de démonstration</span>
        </div>
        <div className="px-3 pb-3 pt-3">
          <div className="mb-2 flex gap-1.5 text-[0.65rem] font-medium">
            <span className="rounded-full bg-accent px-2.5 py-1 text-accent-ink">Messieurs</span>
            <span className="rounded-full bg-surface-sunk px-2.5 py-1 text-ink-muted">Dames</span>
          </div>
          <table className="w-full text-[0.65rem] tabular-nums">
            <thead>
              <tr className="text-ink-subtle">
                <th className="py-1 text-left font-medium">#</th>
                <th className="py-1 text-left font-medium">Équipe</th>
                <th className="py-1 text-right font-medium">MJ</th>
                <th className="py-1 text-right font-medium">+/-</th>
                <th className="py-1 text-right font-medium">PTS</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr
                  key={r.club}
                  className={cn(
                    'border-t border-line',
                    i < 4 && 'bg-accent-soft/60',
                    i === ROWS.length - 1 && 'bg-negative-soft',
                  )}
                >
                  <td className="py-1.5 pl-1 text-ink-muted">{i + 1}</td>
                  <td className="max-w-[6.5rem] truncate py-1.5 font-medium text-ink">{r.club}</td>
                  <td className="py-1.5 text-right text-ink-muted">{r.mj}</td>
                  <td className="py-1.5 text-right text-ink-muted">{r.diff}</td>
                  <td className="py-1.5 pr-1 text-right font-bold text-ink">{2 * r.g + r.p}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.6rem] text-ink-subtle">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-accent-soft ring-1 ring-accent-line" /> Phase finale
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-negative-soft ring-1 ring-negative/30" /> Relégation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One fixture on the drawn calendar. `score` present means played. */
type Fixture = { time: string; home: string; away: string; hall: string; score?: string; tone: 'm' | 'd' };

const WEEK: { day: string; date: string; fixtures: Fixture[] }[] = [
  {
    day: 'Sam.',
    date: '12',
    fixtures: [
      { time: '10:00', home: 'Aigles BC', away: 'Lions BC', hall: 'Salle A', score: '81–67', tone: 'm' },
      { time: '11:40', home: 'Étoile du Lac', away: 'Union BC', hall: 'Salle A', score: '78–74', tone: 'm' },
      { time: '13:20', home: 'Étoile Dames', away: 'Lionnes', hall: 'Salle A', tone: 'd' },
    ],
  },
  {
    day: 'Dim.',
    date: '13',
    fixtures: [
      { time: '10:00', home: 'Olympic BC', away: 'Jeunesse Sportive', hall: 'Salle B', tone: 'm' },
      { time: '11:40', home: 'Aigles Dames', away: 'Union Dames', hall: 'Salle B', tone: 'd' },
    ],
  },
];

/**
 * A laptop showing the calendar: two competitions sharing one weekend and one hall, played games
 * with their score. The organiser's side of the product, beside the supporter's phone.
 */
export function DesktopCalendar({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('w-[30rem]', className)}>
      <div className="rounded-t-xl border border-b-0 border-line-strong bg-elevated p-2 shadow-e2">
        <div className="overflow-hidden rounded-md border border-line bg-canvas">
          <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-2">
            <span className="text-[0.7rem] font-semibold text-ink">Calendrier · octobre 2026</span>
            <span className="flex gap-1.5 text-[0.6rem] font-medium">
              <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-accent-text">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Messieurs
              </span>
              <span className="flex items-center gap-1 rounded-full bg-cat-2-soft px-2 py-0.5 text-cat-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cat-2" /> Dames
              </span>
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-line">
            {WEEK.map((d) => (
              <div key={d.date} className="p-2">
                <p className="mb-1.5 text-[0.65rem] font-semibold text-ink-muted">
                  {d.day} <span className="text-ink">{d.date}</span>
                </p>
                <ul className="space-y-1">
                  {d.fixtures.map((f) => (
                    <li
                      key={f.time + f.home}
                      className={cn(
                        'rounded border-l-2 px-1.5 py-1 text-[0.6rem] leading-tight',
                        f.tone === 'm' ? 'border-accent bg-accent-soft/60' : 'border-cat-2 bg-cat-2-soft/60',
                      )}
                    >
                      <span className="flex justify-between gap-1 text-ink-subtle">
                        <span className="tabular-nums">{f.time}</span>
                        <span>{f.hall}</span>
                      </span>
                      <span className="flex justify-between gap-1 font-medium text-ink">
                        <span className="truncate">
                          {f.home} – {f.away}
                        </span>
                        {f.score && <span className="shrink-0 font-bold tabular-nums">{f.score}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* The laptop's base: a lip wider than the screen, as the real thing has. */}
      <div className="-mx-4 h-3 rounded-b-xl border border-line-strong bg-surface-sunk shadow-e1" />
    </div>
  );
}

/**
 * One day of the calendar, opened: what the organiser handles in it — a clash refused before it
 * happens, a postponement with its reason, a result entered.
 */
export function DayPanel({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('w-full max-w-sm rounded-xl border border-line bg-elevated p-4 shadow-e2', className)}>
      <p className="text-xs font-semibold text-ink">Samedi 12 octobre · Salle A</p>
      <ul className="mt-3 space-y-2 text-xs">
        <li className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2">
          <span className="tabular-nums text-ink-subtle">10:00</span>
          <span className="flex-1 truncate font-medium text-ink">Aigles BC – Lions BC</span>
          <span className="font-bold tabular-nums text-ink">81–67</span>
        </li>
        <li className="rounded-md border border-caution/40 bg-caution-soft px-3 py-2">
          <span className="flex items-center justify-between gap-2">
            <span className="tabular-nums text-ink-subtle">11:40</span>
            <span className="flex-1 truncate font-medium text-ink">Olympic BC – Union BC</span>
            <span className="font-semibold text-caution">Reporté</span>
          </span>
          <span className="mt-1 block text-[0.7rem] text-ink-muted">« Salle réservée pour un tournoi scolaire »</span>
        </li>
        <li className="rounded-md border border-negative/30 bg-negative-soft px-3 py-2">
          <span className="font-medium text-negative">Conflit : Salle A déjà occupée à 13:20</span>
          <span className="mt-0.5 block text-[0.7rem] text-ink-muted">Étoile Dames – Lionnes · Championnat Dames</span>
        </li>
      </ul>
    </div>
  );
}

/**
 * The points engine at work: a final score entered, and the table it moves. Both clubs' lines
 * follow the rule the hero's table uses (2 points a win, 1 a loss), so the numbers agree with it.
 */
export function PointsPanel({ className }: { className?: string }) {
  const rows = [
    { club: 'Aigles BC', pts: 19, gain: '+2' },
    { club: 'Étoile du Lac', pts: 18 },
    { club: 'Lions BC', pts: 16, gain: '+1' },
  ];
  return (
    <div aria-hidden className={cn('w-full max-w-sm rounded-xl border border-line bg-elevated p-4 shadow-e2', className)}>
      <p className="text-xs font-semibold text-ink">Score final saisi</p>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2 text-xs">
        <span className="flex-1 truncate font-medium text-ink">Aigles BC</span>
        <span className="font-bold tabular-nums text-ink">81 – 67</span>
        <span className="flex-1 truncate text-right font-medium text-ink">Lions BC</span>
      </div>
      <p className="mt-4 text-xs font-semibold text-ink">Classement mis à jour</p>
      <ul className="mt-2 divide-y divide-line rounded-md border border-line bg-surface text-xs">
        {rows.map((r, i) => (
          <li key={r.club} className="flex items-center gap-2 px-3 py-2">
            <span className="w-4 tabular-nums text-ink-subtle">{i + 1}</span>
            <span className="flex-1 truncate font-medium text-ink">{r.club}</span>
            {r.gain && (
              <span className="rounded-full bg-positive-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-positive">
                {r.gain}
              </span>
            )}
            <span className="w-6 text-right font-bold tabular-nums text-ink">{r.pts}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.7rem] text-ink-muted">Meilleur marqueur du match : Kambale (Aigles BC), 24 points</p>
    </div>
  );
}

/**
 * Publication: the league's own site, and the official standings in the three forms it leaves in.
 */
export function PublishPanel({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('w-full max-w-sm overflow-hidden rounded-xl border border-line bg-elevated shadow-e2', className)}>
      <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
        </span>
        <span className="flex-1 truncate rounded bg-canvas px-2 py-0.5 text-[0.65rem] text-ink-muted">demo.dxscores.app</span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 text-[0.65rem] font-medium">
          <span className="rounded-full bg-accent px-2.5 py-1 text-accent-ink">Classement</span>
          <span className="rounded-full bg-surface-sunk px-2.5 py-1 text-ink-muted">Calendrier</span>
          <span className="rounded-full bg-surface-sunk px-2.5 py-1 text-ink-muted">Résultats</span>
          <span className="rounded-full bg-surface-sunk px-2.5 py-1 text-ink-muted">Communiqués</span>
        </div>
        <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
          <p className="text-[0.65rem] text-ink-subtle">Communiqué</p>
          <p className="text-xs font-medium text-ink">Ouverture de la saison 2026-2027</p>
        </div>
        <p className="mt-4 text-xs font-semibold text-ink">Classement officiel</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[0.65rem]">
          {[
            ['PDF', 'signé, cacheté'],
            ['Image', 'pour WhatsApp'],
            ['Excel', 'pour les archives'],
          ].map(([format, use]) => (
            <span key={format} className="rounded-md border border-line bg-surface px-2 py-2">
              <span className="block text-xs font-bold text-ink">{format}</span>
              <span className="text-ink-muted">{use}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
