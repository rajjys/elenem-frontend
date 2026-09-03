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
 * The chrome around a single match.
 *
 * A game is reachable from four directions — the organisation's calendar, a competition's
 * calendar, either club's fixture list — and it is genuinely the *same* resource each time, with
 * different powers over it. So the question this layout answers is: whose sidebar?
 *
 * Not the game's. `/season/[seasonId]` and `/post/[postId]` each render a one-item sidebar naming
 * themselves, which is a menu with nothing in it; on a leaf resource that is furniture, and worse,
 * it strands the reader — every way back out of the app disappears the moment they open a fixture.
 *
 * So the sidebar belongs to **whoever is reading**. The content is decided by the resource and the
 * permissions the server attaches to it; the navigation is decided by the role, exactly as it is
 * on every other screen that person visits. A league admin opening a match keeps the league's
 * menu, a tenant admin keeps the organisation's, and both are one click from where they were.
 *
 * That is also why the route needs no `ctx*Id`. Those parameters exist so a *set* of pages can
 * share a scope — `/league/teams`, `/league/players` and `/league/calendar` all meaning the same
 * league. A match has one page, and it names its own league, season and organisation in its own
 * payload; the breadcrumb reads them from there. `/game/abc123` is also a link that survives being
 * pasted into WhatsApp, which `/game/dashboard?ctxGameId=abc123` is not.
 */
export default function GameLayout({ children }: { children: ReactNode }) {
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
