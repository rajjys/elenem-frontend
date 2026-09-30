"use client";

import React, { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { APP_THEME_COLOR, adminNavItems } from '@/components/layouts/nav-items';
import { AppProviders } from '@/components/providers/app-providers';

export default function SystemAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <React.Suspense fallback={<LoadingSpinner />}>
        <AppLayout navItems={adminNavItems} themeColor={APP_THEME_COLOR}>
          {children}
        </AppLayout>
      </React.Suspense>
    </AppProviders>
  );
}
