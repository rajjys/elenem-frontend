import { cn } from '@/utils/cn';

/**
 * The three modules, drawn in HTML for the landing (PHASE5A_PRODUCT_SITE §6.5): a day of the
 * calendar, the points behind a table, what gets published. Fictional clubs whose numbers obey the
 * real rule, labelled as an example; drawn on tokens, they follow the theme and weigh nothing.
 *
 * The hero shows the demo league's real screens instead (`hero-screens.tsx`): a panel this small
 * says one thing better drawn, a whole screen is better shown.
 */

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
