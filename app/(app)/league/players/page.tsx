'use client';
import { PlayersListView } from '@/components/players';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function LeaguePlayersPage() {
  // Whatever league you actually opened — not just the one you own. A tenant admin drilling in
  // used to see every player in the organisation here.
  const { leagueId } = useScopeContext();
  return <PlayersListView title="Joueurs de la ligue" leagueId={leagueId} />;
}
