'use client';
import { Suspense } from 'react';
import { JournalView } from '@/components/journal/journal-view';

export default function Page() {
  return (
    <Suspense>
      <JournalView usersBasePath="/tenant/users" />
    </Suspense>
  );
}
