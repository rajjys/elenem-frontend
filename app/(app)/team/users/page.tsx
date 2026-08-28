'use client';
import { UsersListView } from '@/components/users/users-list-view';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function Page() {
  const { teamId } = useScopeContext();
  return <UsersListView basePath="/team/users" scope={{ managingTeamId: teamId }} />;
}
