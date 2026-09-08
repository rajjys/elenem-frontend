'use client';

import React, { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import {
  APP_THEME_COLOR,
  adminNavItems,
  leagueNavItems,
  teamNavItems,
  tenantNavItems,
} from '@/components/layouts/nav-items';
import { useCurrentUser } from '@/hooks';
import { Roles } from '@/schemas';

/**
 * The chrome around one player.
 *
 * Identical in shape to `/game/[gameId]/layout.tsx`, and for the identical reason: **the sidebar
 * belongs to whoever is reading, not to the resource**. Content follows the record — the server
 * resolves it and attaches the permissions — and navigation follows the role, so an organisation's
 * administrator opening a scorer keeps the organisation's menu and is one click from where they
 * were. A one-item sidebar naming the player would be a menu with nothing in it, and on a leaf it
 * strands the reader: every way back into the app disappears the moment they open a name.
 *
 * See `GAME_AND_STANDINGS` §2.3, where the split was first stated.
 */
export default function PlayerLayout({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const roles = user?.roles ?? [];

  const navItems = roles.includes(Roles.SYSTEM_ADMIN)
    ? adminNavItems
    : roles.includes(Roles.TENANT_ADMIN)
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
