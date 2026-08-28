'use client';
import { PlayersListView } from '@/components/players';
import { useCurrentUser } from '@/hooks';

export default function TeamRosterPage() {
  const user = useCurrentUser();
  return <PlayersListView title="Effectif" teamId={user?.managingTeamId ?? undefined} />;
}
