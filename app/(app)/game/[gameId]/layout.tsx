'use client';

import React, { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { APP_THEME_COLOR, navItemsForSurface } from '@/components/layouts/nav-items';
import { useCurrentUser } from '@/hooks';

/**
 * The chrome around a single match.
 *
 * A game is reachable from four directions — the organisation's calendar, a competition's calendar,
 * either club's fixture list — and it is genuinely the *same* resource each time, with different
 * powers over it. So the sidebar belongs to **whoever is reading**, not to the game: the content is
 * decided by the resource and the permissions the server attaches to it, the navigation by the
 * reader, exactly as on every other screen they visit. A one-item sidebar naming the fixture would
 * be a menu with nothing in it, and worse, it strands them — every way back out of the app
 * disappears the moment they open a match.
 *
 * "Whoever is reading" turned out to need more than a role. A tenant administrator inside a
 * competition got the organisation's menu back, so the next fixture was four clicks away. The link
 * now carries the surface it was made on and `navItemsForSurface` intersects that with what the
 * role may actually reach. Nothing is required: a pasted `/game/abc123` still works, with the
 * reader's own default menu.
 */
export default function GameLayout({ children }: { children: ReactNode }) {
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
