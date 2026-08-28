'use client';
import { UsersListView } from '@/components/users/users-list-view';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function Page() {
  const { leagueId } = useScopeContext();
  return <UsersListView basePath="/league/users" scope={{ managingLeagueId: leagueId }} />;
}
