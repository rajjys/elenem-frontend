'use client';

import { useState } from 'react';
import { ChevronDown, Scale } from 'lucide-react';
import { OUTCOME_LABELS, TIE_BREAK_LABELS, useSportRules } from '@/services/setup';

/**
 * What the league's table will be computed with, stated before it is created.
 *
 * The rules are seeded server-side from the organisation's sport, so a basketball league already
 * starts at 2 points a win and 1 a loss with point differential as the first tie-break — which
 * is LIPROBAKIN's own convention, and right. But it happened invisibly, and for a product whose
 * entire promise is that the table is not disputed, the rule producing that table is the first
 * thing a federation would want to see confirmed.
 *
 * Read-only on purpose. Editing scoring belongs on the league's settings page, where there is
 * room to explain what each tie-break means; asking someone to configure a ranking system before
 * they have entered a single team is how the old four-step form happened.
 */
export function RankingRulesPanel({ sportType }: { sportType?: string }) {
  const [open, setOpen] = useState(false);
  const { data, isPending } = useSportRules(sportType);

  if (!sportType || isPending || !data) return null;

  const points = data.pointSystem.rules.filter((r) => r.outcome !== 'FORFEIT_WIN');
  const tieBreaks = [...data.tieBreakers].sort((a, b) => a.order - b.order).slice(0, 3);

  return (
    <div className="rounded-lg border border-line bg-surface-sunk">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
      >
        <Scale className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-ink">Règles de classement</span>
          <span className="block text-xs text-ink-subtle truncate">
            {points.map((r) => `${OUTCOME_LABELS[r.outcome] ?? r.outcome} ${r.points}`).join(' · ')}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-subtle transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-t border-line px-3.5 py-3 space-y-3">
          <dl className="space-y-1">
            {points.map((rule) => (
              <div key={rule.outcome} className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="text-ink-muted">{OUTCOME_LABELS[rule.outcome] ?? rule.outcome}</dt>
                <dd className="font-medium text-ink tabular-nums">
                  {rule.points} {rule.points === 1 ? 'point' : 'points'}
                </dd>
              </div>
            ))}
          </dl>

          {tieBreaks.length > 0 && (
            <div>
              <p className="text-[0.6875rem] uppercase tracking-wider text-ink-subtle mb-1">
                En cas d&apos;égalité
              </p>
              <ol className="space-y-0.5 text-sm text-ink-muted">
                {tieBreaks.map((tb, i) => (
                  <li key={tb.rule}>
                    <span className="text-ink-subtle tabular-nums">{i + 1}.</span>{' '}
                    {TIE_BREAK_LABELS[tb.rule] ?? tb.label ?? tb.rule}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="text-xs text-ink-subtle">
            Valeurs standard pour ce sport. Modifiables plus tard dans les paramètres de la ligue.
          </p>
        </div>
      )}
    </div>
  );
}
