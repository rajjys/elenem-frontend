import { cn } from '@/utils/cn';
import type { PublicGameStatus } from '@/lib/public-site/api';

/**
 * A game's state in words (PHASE5B_LEAGUE_SITES §6, Matchs), in the semantic colours only — never
 * the league's. A past game with no score says « Résultat à venir », never that it is still to be
 * played. A game simply scheduled says nothing: its time does.
 */
const LABELS: Partial<Record<PublicGameStatus, { text: string; tone: string }>> = {
  COMPLETED: { text: 'Terminé', tone: 'text-ink-subtle' },
  FORFEIT: { text: 'Forfait', tone: 'bg-caution-soft text-caution' },
  POSTPONED: { text: 'Reporté', tone: 'bg-caution-soft text-caution' },
  CANCELLED: { text: 'Annulé', tone: 'bg-negative-soft text-negative' },
  AWAITING_RESULT: { text: 'Résultat à venir', tone: 'bg-surface-sunk text-ink-muted' },
};

export function StatusBadge({ status, className }: { status: PublicGameStatus; className?: string }) {
  const label = LABELS[status];
  if (!label) return null;
  const pill = status !== 'COMPLETED';
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap text-[0.7rem] font-semibold leading-tight',
        pill && 'rounded-full px-2 py-0.5',
        label.tone,
        className,
      )}
    >
      {label.text}
    </span>
  );
}

export const isPlayed = (s: PublicGameStatus) => s === 'COMPLETED' || s === 'FORFEIT';
