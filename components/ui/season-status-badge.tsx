import React from 'react';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { SeasonStatus } from '@/schemas';

// Mapping des statuts vers le texte en français
const statusLabels: Record<SeasonStatus, string> = {
  [SeasonStatus.UNKNOWN]: 'Saison Inconnue',
  [SeasonStatus.PLANNING]: 'Saison en planification',
  [SeasonStatus.SCHEDULED]: 'Saison Planifiée',
  [SeasonStatus.ACTIVE]: 'Saison en cours',
  [SeasonStatus.PAUSED]: 'Saison en pause',
  [SeasonStatus.COMPLETED]: 'Saison terminée',
  [SeasonStatus.CANCELED]: 'Saison annulée',
  [SeasonStatus.ARCHIVED]: 'Saison archivée',
};

// Mapping des statuts vers les variantes visuelles
const statusVariants: Record<SeasonStatus, BadgeVariant> = {
  [SeasonStatus.UNKNOWN]: 'unknown',
  [SeasonStatus.PLANNING]: 'planning',
  [SeasonStatus.SCHEDULED]: 'scheduled',
  [SeasonStatus.ACTIVE]: 'active',
  [SeasonStatus.PAUSED]: 'paused',
  [SeasonStatus.COMPLETED]: 'completed',
  [SeasonStatus.CANCELED]: 'canceled',
  [SeasonStatus.ARCHIVED]: 'archived',
};

interface SeasonStatusBadgeProps {
  status?: SeasonStatus;
  className?: string;
}

export function SeasonStatusBadge({ status = SeasonStatus.UNKNOWN, className }: SeasonStatusBadgeProps) {
  const label = statusLabels[status];
  const variant = statusVariants[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
