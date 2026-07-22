'use client';
import { UsersListView } from '@/components/users/users-list-view';

export default function Page() {
  return <UsersListView basePath="/tenant/users" />;
}
