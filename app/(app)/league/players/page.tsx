'use client';
import { PlayersListView } from '@/components/players';
import { ContextRequired } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function LeaguePlayersPage() {
  const { leagueId, isLoading } = useScopeContext();
  if (isLoading) return null;
  if (!leagueId) return <ContextRequired what="ligue" />;
  return <PlayersListView title="Joueurs de la ligue" leagueId={leagueId} />;
}
