'use client';
import { UsersListView } from '@/components/users/users-list-view';
import { useScopeContext } from '@/hooks/useScopeContext';

export default function Page() {
  const { tenantId } = useScopeContext();
  return <UsersListView basePath="/tenant/users" scope={{ tenantId }} />;
}
