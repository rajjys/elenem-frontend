'use client';
import { PlayersListView } from '@/components/players';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function TeamRosterPage() {
  const { teamId } = useScopeContext();
  return <PlayersListView title="Effectif" teamId={teamId} />;
}
