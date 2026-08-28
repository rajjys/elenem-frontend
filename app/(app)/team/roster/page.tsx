'use client';
import { PlayersListView } from '@/components/players';
import { ContextRequired } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function TeamRosterPage() {
  const { teamId, isLoading } = useScopeContext();
  if (isLoading) return null;
  if (!teamId) return <ContextRequired what="équipe" />;
  return <PlayersListView title="Effectif" teamId={teamId} />;
}
