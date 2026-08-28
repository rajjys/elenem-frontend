"use client";

import React, { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';

export default function SeasonLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const seasonId = params?.seasonId;
  const navItems = [
    { items: [{ label: 'Saison', basePath: `/season/${seasonId}/dashboard`, icon: CalendarDays }] },
  ];

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AppLayout navItems={navItems}>{children}</AppLayout>
    </React.Suspense>
  );
}
