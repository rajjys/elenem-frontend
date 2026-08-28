"use client";

import React, { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { APP_THEME_COLOR, adminNavItems } from '@/components/layouts/nav-items';

export default function SystemAdminLayout({ children }: { children: ReactNode }) {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AppLayout navItems={adminNavItems} themeColor={APP_THEME_COLOR}>
        {children}
      </AppLayout>
    </React.Suspense>
  );
}
