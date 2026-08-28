"use client";

import React, { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { APP_THEME_COLOR, tenantNavItems } from '@/components/layouts/nav-items';

export default function TenantAdminLayout({ children }: { children: ReactNode }) {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AppLayout navItems={tenantNavItems} themeColor={APP_THEME_COLOR}>
        {children}
      </AppLayout>
    </React.Suspense>
  );
}
