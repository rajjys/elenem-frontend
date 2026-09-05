import React from 'react';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { SeasonStatus } from '@/schemas';

/**
 * The four states, in the words an organiser uses.
 *
 * The labels used to read "Saison en cours", "Saison terminée" and so on, which is right beside a
 * competition's name — « Championnat Goma D1 · Saison en cours » — and wrong in a column headed
 * *Statut*, where it repeats the word the header already said. The badge names the state; whoever
 * places it supplies the noun.
 */
const statusLabels: Record<SeasonStatus, string> = {
  [SeasonStatus.PLANNING]: 'En préparation',
  [SeasonStatus.ACTIVE]: 'En cours',
  [SeasonStatus.COMPLETED]: 'Terminée',
  [SeasonStatus.CANCELED]: 'Annulée',
};

const statusVariants: Record<SeasonStatus, BadgeVariant> = {
  [SeasonStatus.PLANNING]: 'planning',
  [SeasonStatus.ACTIVE]: 'active',
  [SeasonStatus.COMPLETED]: 'completed',
  [SeasonStatus.CANCELED]: 'canceled',
};

interface SeasonStatusBadgeProps {
  status?: SeasonStatus | null;
  className?: string;
}

export function SeasonStatusBadge({ status, className }: SeasonStatusBadgeProps) {
  // A competition with no season at all is a real state and it is not "unknown" — it is a
  // competition waiting for one, which is a thing the reader can act on. Rendering nothing lets
  // the caller say so in its own words instead of showing a grey badge that explains nothing.
  if (!status) return null;

  return (
    <Badge variant={statusVariants[status]} className={className}>
      {statusLabels[status]}
    </Badge>
  );
}
