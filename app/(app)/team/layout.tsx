"use client";

import React, { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { APP_THEME_COLOR, teamNavItems } from '@/components/layouts/nav-items';

export default function TeamAdminLayout({ children }: { children: ReactNode }) {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AppLayout navItems={teamNavItems} themeColor={APP_THEME_COLOR}>
        {children}
      </AppLayout>
    </React.Suspense>
  );
}
