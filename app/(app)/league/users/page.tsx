'use client';
import { UsersListView } from '@/components/users/users-list-view';
import { ContextRequired } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function Page() {
  const { leagueId, isLoading } = useScopeContext();
  if (isLoading) return null;
  if (!leagueId) return <ContextRequired what="ligue" />;
  return <UsersListView basePath="/league/users" scope={{ managingLeagueId: leagueId }} />;
}
