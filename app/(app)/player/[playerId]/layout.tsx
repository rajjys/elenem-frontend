'use client';

import React, { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { APP_THEME_COLOR, navItemsForSurface } from '@/components/layouts/nav-items';
import { useCurrentUser } from '@/hooks';

/**
 * The chrome around one player.
 *
 * Identical in shape to `/game/[gameId]/layout.tsx`, and for the identical reason: **the sidebar
 * belongs to whoever is reading, not to the resource** — with the surface they arrived from as a
 * hint, so a competition's roster does not hand them back to the organisation's menu.
 *
 * A player is the more ambiguous of the two: a roster entry can sit in no club, and its competition
 * is a field on the record rather than something the reader chose. That is exactly why the hint
 * comes from the *link* rather than from the player — where you were is a fact about you, not about
 * them.
 */
export default function PlayerLayout({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const params = useSearchParams();

  const navItems = navItemsForSurface(user?.roles ?? [], {
    teamId: params.get('ctxTeamId'),
    leagueId: params.get('ctxLeagueId'),
    tenantId: params.get('ctxTenantId'),
  });

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AppLayout navItems={navItems} themeColor={APP_THEME_COLOR}>
        {children}
      </AppLayout>
    </React.Suspense>
  );
}
