import { Check } from 'lucide-react';
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

/** The score as it is entered: two numbers, one tap, and the table follows. */
export function ScoreEntryCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('w-[18rem] rounded-xl border border-line bg-elevated p-4 shadow-e2', className)}
    >
      <p className="text-[0.7rem] font-medium uppercase tracking-wider text-ink-subtle">
        Saisir le score · sam. 12 oct.
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-right text-xs font-semibold text-ink">Lions BC</span>
        <span className="rounded-md border border-line bg-surface px-2 py-1 text-xl font-bold tabular-nums text-ink">
          78
        </span>
        <span className="text-ink-subtle">–</span>
        <span className="rounded-md border border-line bg-surface px-2 py-1 text-xl font-bold tabular-nums text-ink">
          74
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">Union BC</span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-md bg-positive-soft px-2.5 py-1.5 text-[0.7rem] font-medium text-positive">
        <Check className="h-3.5 w-3.5" />
        Résultat enregistré · classement mis à jour
      </div>
    </div>
  );
}
