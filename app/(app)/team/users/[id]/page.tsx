'use client';
import { use } from 'react';
import { UserDetailView } from '@/components/users/user-detail-view';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <UserDetailView userId={id} backHref="/team/users" />;
}
