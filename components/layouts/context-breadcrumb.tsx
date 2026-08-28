'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useCurrentUser } from '@/hooks';
import { Roles } from '@/schemas';
import { ScopeSwitcher, type ScopeKind } from './scope-switcher';

/**
 * The trail back up the chain.
 *
 * Flat, self-owned routes buy one UI per resource for every role, but they lose the way home: you
 * could descend platform → organisation → league → team and the only exit was a single "back to my
 * dashboard" button that dropped you at the top. Managing one team and then switching to its
 * sibling meant starting the whole descent again.
 *
 * The navbar is where that trail belongs — it is the one strip that persists across every screen
 * and it was otherwise empty. Each ancestor is a link that keeps the context above it and drops
 * everything below, so "switch to another team" is one click on the league.
 *
 * Short codes over full names (LIBAGO, D1 M, VIR) because the trail is scenery, not content: it
 * has to survive four levels without pushing the page title off the row.
 */

/** Where each admin surface starts, per role — used for the "you are here" root. */
function useRootCrumb() {
  const user = useCurrentUser();
  const roles = user?.roles ?? [];
  if (roles.includes(Roles.SYSTEM_ADMIN)) {
    return { label: 'Plateforme', href: '/admin/dashboard' };
  }
  if (roles.includes(Roles.TENANT_ADMIN)) return null; // the organisation crumb is their root
  return null;
}

/** The current page's own name, derived from the path. */
const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Tableau de bord',
  leagues: 'Ligues',
  teams: 'Équipes',
  players: 'Joueurs',
  roster: 'Effectif',
  users: 'Utilisateurs',
  games: 'Matchs',
  schedule: 'Calendrier',
  seasons: 'Saisons',
  standings: 'Classement',
  posts: 'Actualités',
  settings: 'Paramètres',
  tenants: 'Organisations',
  general: 'Paramètres',
  profile: 'Mon profil',
  security: 'Sécurité',
  create: 'Nouveau',
  edit: 'Modifier',
};

function currentPageTitle(pathname: string): string | undefined {
  const parts = pathname.split('/').filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const t = PAGE_TITLES[parts[i]];
    if (t) return t;
  }
  return undefined;
}

interface Crumb {
  label: string;
  title?: string;
  href?: string;
  /** Set on the deepest entity: it renders as a sibling switcher instead of plain text. */
  switcher?: { kind: ScopeKind; id: string; parentId?: string };
}

export function ContextBreadcrumb() {
  const pathname = usePathname() ?? '';
  const scope = useScopeContext();
  const root = useRootCrumb();
  const user = useCurrentUser();

  const crumbs: Crumb[] = [];

  // Only show the platform root once you have actually left it — on /admin/* it is where you are,
  // not somewhere to go back to.
  const insideAdmin = pathname.startsWith('/admin');
  if (root && !insideAdmin) crumbs.push(root);

  // An ancestor is a link only when you are somewhere below it.
  const isTenantSurface = pathname.startsWith('/tenant');
  const isLeagueSurface = pathname.startsWith('/league');
  const isTeamSurface = pathname.startsWith('/team');
  const canManageTenant =
    (user?.roles ?? []).some((r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN);

  // The deepest entity for the surface you are on is the one you may switch between; everything
  // above it stays a link. Managing a team is not the moment to change organisation.
  if (scope.tenant && (isTenantSurface || isLeagueSurface || isTeamSurface)) {
    crumbs.push({
      label: scope.tenant.short,
      title: scope.tenant.name,
      href: isTenantSurface || !canManageTenant
        ? undefined
        : `/tenant/dashboard?ctxTenantId=${scope.tenant.id}`,
      // Only a system admin has sibling organisations to move between.
      switcher:
        isTenantSurface && (user?.roles ?? []).includes(Roles.SYSTEM_ADMIN)
          ? { kind: 'tenant', id: scope.tenant.id }
          : undefined,
    });
  }

  if (scope.league && (isLeagueSurface || isTeamSurface)) {
    crumbs.push({
      label: scope.league.short,
      title: scope.league.name,
      href: isLeagueSurface ? undefined : `/league/dashboard?ctxLeagueId=${scope.league.id}`,
      switcher: isLeagueSurface
        ? { kind: 'league', id: scope.league.id, parentId: scope.tenantId }
        : undefined,
    });
  }

  if (scope.team && isTeamSurface) {
    crumbs.push({
      label: scope.team.short,
      title: scope.team.name,
      switcher: { kind: 'team', id: scope.team.id, parentId: scope.leagueId },
    });
  }

  const page = currentPageTitle(pathname);

  // Nothing to orient by: a system admin on their own dashboard just gets the page name.
  if (crumbs.length === 0 && !page) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {c.switcher ? (
              <ScopeSwitcher
                kind={c.switcher.kind}
                current={{ id: c.switcher.id, name: c.title ?? c.label, short: c.label }}
                parentId={c.switcher.parentId}
              />
            ) : c.href ? (
              <Link
                href={c.href}
                title={c.title}
                className="rounded px-1 py-0.5 font-medium text-ink-muted transition-colors hover:bg-surface-sunk hover:text-accent-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                {c.label}
              </Link>
            ) : (
              <span title={c.title} className="px-1 font-medium text-ink-muted">
                {c.label}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
          </li>
        ))}
        {page && (
          <li className="min-w-0 truncate px-1 font-semibold text-ink" aria-current="page">
            {page}
          </li>
        )}
      </ol>
    </nav>
  );
}
