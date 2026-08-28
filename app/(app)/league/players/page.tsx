'use client';
import { PlayersListView } from '@/components/players';
import { useCurrentUser } from '@/hooks';

export default function LeaguePlayersPage() {
  const user = useCurrentUser();
  return <PlayersListView title="Joueurs de la ligue" leagueId={user?.managingLeagueId ?? undefined} />;
}
