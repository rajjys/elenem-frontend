'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { DraftInsight } from '@/services/calendar-draft';
import { cn } from '@/utils';

/**
 * What the draft is trying to tell the organiser.
 *
 * This is the point of the module, not a decoration on the generator. Counting each club's
 * fixtures, spotting the pairing that already happened, noticing the hall is shut that fortnight
 * — these are the checks a league secretary does by hand today, on paper, and they are where the
 * arguments come from when one of them is missed. The generator is the cheap half; doing these
 * automatically is the half worth paying for.
 *
 * Ordered by severity rather than by kind, because a reader scanning this wants the problems
 * first and does not care which check produced them.
 */

const RANK: Record<DraftInsight['severity'], number> = { problem: 0, caution: 1, info: 2 };

const TONE: Record<
  DraftInsight['severity'],
  { icon: typeof Info; wrap: string; mark: string; label: string }
> = {
  // `negative` and `caution` here mean "this calendar is wrong" and "look at this", not win and
  // loss. Nothing on this panel is about a result, so the semantic pair is free to carry its
  // other, older meaning.
  problem: {
    icon: XCircle,
    wrap: 'border-negative/30 bg-negative-soft',
    mark: 'text-negative',
    label: 'Problème',
  },
  caution: {
    icon: AlertTriangle,
    wrap: 'border-caution/30 bg-caution-soft',
    mark: 'text-caution',
    label: 'À vérifier',
  },
  info: { icon: Info, wrap: 'border-line bg-surface', mark: 'text-ink-subtle', label: 'Info' },
};

export function DraftInsights({
  insights,
  className,
}: {
  insights: DraftInsight[];
  className?: string;
}) {
  if (insights.length === 0) return null;

  const sorted = [...insights].sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const problems = sorted.filter((i) => i.severity === 'problem').length;
  const cautions = sorted.filter((i) => i.severity === 'caution').length;

  return (
    <section className={cn('rounded-lg border border-line bg-surface', className)}>
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Analyse du projet</h3>
        <p className="text-xs text-ink-subtle">
          {problems === 0 && cautions === 0 ? (
            <span className="inline-flex items-center gap-1 text-positive">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              rien à signaler
            </span>
          ) : (
            [
              problems > 0 && `${problems} problème${problems > 1 ? 's' : ''}`,
              cautions > 0 && `${cautions} à vérifier`,
            ]
              .filter(Boolean)
              .join(' · ')
          )}
        </p>
      </header>

      <ul className="divide-y divide-line">
        {sorted.map((insight, i) => {
          const tone = TONE[insight.severity];
          const Icon = tone.icon;
          return (
            <li
              key={`${insight.kind}-${i}`}
              className={cn('flex gap-2.5 px-4 py-2.5', tone.wrap, 'border-0')}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone.mark)} aria-label={tone.label} />
              <p className="min-w-0 flex-1 text-sm leading-snug text-ink">
                {insight.message}
                {/* A fixture the draft refused to duplicate is only useful if you can go and look
                    at the one that already exists. */}
                {insight.gameId && (
                  <Link
                    href={`/game/${insight.gameId}`}
                    className="ml-1.5 inline-flex items-center gap-0.5 whitespace-nowrap text-accent-text hover:underline"
                  >
                    voir
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  </Link>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
