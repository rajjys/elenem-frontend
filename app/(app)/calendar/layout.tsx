'use client';

import React, { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import {
  APP_THEME_COLOR,
  leagueNavItems,
  teamNavItems,
  tenantNavItems,
} from '@/components/layouts/nav-items';
import { useAuthStore } from '@/store/auth.store';
import { Roles } from '@/schemas';

/**
 * The app shell around the calendar.
 *
 * `/calendar` is a flat route reached from more than one sidebar, so which sidebar it wears
 * follows the reader rather than the path — a league admin arriving here should not lose the
 * navigation they came from. Without this the page rendered on the bare root layout: no sidebar,
 * no breadcrumb, no page padding.
 */
export default function CalendarLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];

  const navItems = roles.includes(Roles.TENANT_ADMIN) || roles.includes(Roles.SYSTEM_ADMIN)
    ? tenantNavItems
    : roles.includes(Roles.LEAGUE_ADMIN)
      ? leagueNavItems
      : teamNavItems;

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AppLayout navItems={navItems} themeColor={APP_THEME_COLOR}>
        {children}
      </AppLayout>
    </React.Suspense>
  );
}
