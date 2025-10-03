import React from 'react';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { SeasonStatus } from '@/schemas';

// Mapping des statuts vers le texte en français
const statusLabels: Record<SeasonStatus, string> = {
  [SeasonStatus.PLANNING]: 'En planification',
  [SeasonStatus.SCHEDULED]: 'Planifiée',
  [SeasonStatus.ACTIVE]: 'En cours',
  [SeasonStatus.PAUSED]: 'En pause',
  [SeasonStatus.COMPLETED]: 'Terminée',
  [SeasonStatus.CANCELED]: 'Annulée',
  [SeasonStatus.ARCHIVED]: 'Archivée',
};

// Mapping des statuts vers les variantes visuelles
const statusVariants: Record<SeasonStatus, BadgeVariant> = {
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

export function SeasonStatusBadge({ status = SeasonStatus.PLANNING, className }: SeasonStatusBadgeProps) {
  const label = statusLabels[status] ?? 'Statut inconnu';
  const variant = statusVariants[status] ?? 'default';

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
