"use client";

import React, { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';

const accountAreaNavItems = [
  { items: [{ label: 'Tableau de bord', basePath: '/account/dashboard', icon: LayoutDashboard }] },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AppLayout navItems={accountAreaNavItems}>{children}</AppLayout>
    </React.Suspense>
  );
}
