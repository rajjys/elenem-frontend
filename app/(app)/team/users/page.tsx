'use client';
import { UsersListView } from '@/components/users/users-list-view';
import { ContextRequired } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function Page() {
  const { teamId, isLoading } = useScopeContext();
  if (isLoading) return null;
  if (!teamId) return <ContextRequired what="équipe" />;
  return <UsersListView basePath="/team/users" scope={{ managingTeamId: teamId }} />;
}
