'use client';
import { PlayersListView } from '@/components/players';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function TenantPlayersPage() {
  const { tenantId } = useScopeContext();
  return <PlayersListView title="Joueurs de l'organisation" tenantId={tenantId} />;
}
