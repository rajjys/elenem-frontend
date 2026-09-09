'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
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
  calendar: 'Calendrier',
  generate: 'Génération',
  seasons: 'Saisons',
  format: 'Format',
  standings: 'Classement',
  stats: 'Statistiques',
  posts: 'Actualités',
  post: 'Actualité',
  settings: 'Paramètres',
  rules: 'Règles',
  tenants: 'Organisations',
  general: 'Paramètres',
  profile: 'Mon profil',
  security: 'Sécurité',
  account: 'Mon compte',
  onboarding: 'Configuration',
  game: 'Match',
  player: 'Joueur',
  team: 'Équipe',
  league: 'Compétition',
  tenant: 'Organisation',
  admin: 'Plateforme',
  create: 'Nouveau',
  edit: 'Modifier',
  manage: 'Gestion',
};

/**
 * The trail's own tail: the pages below the entity, deepest last.
 *
 * It used to return one label — the first path segment it recognised, scanning from the end — so
 * `/tenant/calendar/generate` produced nothing at all, because neither `calendar` nor `generate`
 * was in the table and the loop fell through to the surface prefix. The breadcrumb rendered
 * `LIBAGO ›` and stopped, chevron dangling at a page it could not name.
 *
 * Collecting the segments instead gives `Calendrier › Génération`, which is the actual answer to
 * "where am I", and the surface prefix (`tenant`, `league`) is dropped because the entity crumb
 * beside it already says which organisation you are in.
 */
const SURFACE_SEGMENTS = new Set(['tenant', 'league', 'team', 'admin', 'app']);

function pageTrail(pathname: string): string[] {
  const parts = pathname.split('/').filter(Boolean);
  const trail: string[] = [];
  for (const [i, part] of parts.entries()) {
    // The leading surface segment is the entity's, not the page's.
    if (i === 0 && SURFACE_SEGMENTS.has(part)) continue;
    // Ids and slugs name nothing a reader would recognise.
    if (!PAGE_TITLES[part]) continue;
    trail.push(PAGE_TITLES[part]);
  }
  return trail;
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
  // A match is a leaf, not a surface: it is below its organisation and its competition, so both
  // stay links and neither offers a switcher — there are no sibling leagues to move between while
  // you are looking at one fixture.
  const isGameSurface = pathname.startsWith('/game');
  // A player is the other leaf, and for the same reason: below their organisation and their
  // competition, both of which stay links.
  const isPlayerSurface = pathname.startsWith('/player/');
  const roles = user?.roles ?? [];
  const canManageTenant = roles.some((r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN);

  /**
   * `/league/*` is gated to competition administrators in the middleware, so a club
   * administrator's league crumb was a link to an access-denied page. A crumb that refuses you is
   * worse than a crumb that is not a link.
   */
  const canReachLeagueSurface = roles.some(
    (r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN || r === Roles.LEAGUE_ADMIN,
  );

  /**
   * A switcher is a promise that there is something to switch to.
   *
   * A club administrator administers exactly one club and a league administrator exactly one
   * competition — `managingTeamId` and `managingLeagueId` are single values — so the chevron beside
   * their own name opened a dropdown that could only ever list them back to themselves, and on a
   * club administrator it also fires `GET /teams` which they are refused. Decided from the role
   * rather than from a count, because the count is only known after the menu is opened and paying
   * for that list on every page to decide whether to draw a chevron is the wrong trade.
   */
  const hasSiblingLeagues = roles.some((r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN);
  const hasSiblingTeams = canReachLeagueSurface;

  /**
   * A ctx param is only worth putting in a link when it says something the destination could not
   * work out for itself.
   *
   * `LIBAGO` in the trail of a LIBAGO tenant admin linked to
   * `/tenant/dashboard?ctxTenantId=cmtjmh69m…` — twenty-five characters of identifier stating what
   * the reader's own token already says. It matters for a system admin, who has no organisation of
   * their own and is genuinely drilling into someone else's; for everybody else it is noise in a
   * link they may well copy and send.
   */
  const own = (id: string | undefined, mine: string | null | undefined, base: string, key: string) =>
    id && id !== mine ? `${base}?${key}=${id}` : base;

  // The deepest entity for the surface you are on is the one you may switch between; everything
  // above it stays a link. Managing a team is not the moment to change organisation.
  if (
    scope.tenant &&
    (isTenantSurface || isLeagueSurface || isTeamSurface || isGameSurface || isPlayerSurface)
  ) {
    crumbs.push({
      label: scope.tenant.short,
      title: scope.tenant.name,
      href: isTenantSurface || !canManageTenant
        ? undefined
        : own(scope.tenant.id, user?.tenantId, '/tenant/dashboard', 'ctxTenantId'),
      // Only a system admin has sibling organisations to move between.
      switcher:
        isTenantSurface && roles.includes(Roles.SYSTEM_ADMIN)
          ? { kind: 'tenant', id: scope.tenant.id }
          : undefined,
    });
  }

  if (scope.league && (isLeagueSurface || isTeamSurface || isGameSurface || isPlayerSurface)) {
    crumbs.push({
      label: scope.league.short,
      title: scope.league.name,
      href:
        isLeagueSurface || !canReachLeagueSurface
          ? undefined
          : own(scope.league.id, user?.managingLeagueId, '/league/dashboard', 'ctxLeagueId'),
      switcher:
        isLeagueSurface && hasSiblingLeagues
          ? { kind: 'league', id: scope.league.id, parentId: scope.tenantId }
          : undefined,
    });
  }

  if (scope.team && isTeamSurface) {
    crumbs.push({
      label: scope.team.short,
      title: scope.team.name,
      switcher: hasSiblingTeams
        ? { kind: 'team', id: scope.team.id, parentId: scope.leagueId }
        : undefined,
    });
  }

  /**
   * A crumb in the middle earns its place by being navigable.
   *
   * A club administrator's trail read `Ligue de Basketball de Goma › D1 M › VIR ˅ › Tableau de
   * bord`. The competition crumb linked to `/league/dashboard`, which the middleware bounces them
   * off; the chevron beside their own club offered a choice between it and nothing. Neither was
   * orientation — one was a dead link and one was a dead menu.
   *
   * **The ends are kept whatever happens.** The first crumb is the organisation, which is what a
   * multi-tenant product is oriented by and the only place its name appears in the chrome; the
   * last is the thing being looked at. Only what sits between them has to justify itself, and it
   * does that by being a link or a switcher. A club administrator now reads `LIBAGO › VIR ›
   * Effectif`; a league administrator's `LIBAGO › D1 M › …` is untouched.
   */
  const last = crumbs.length - 1;
  const kept = crumbs.filter((c, i) => i === 0 || i === last || c.href || c.switcher);
  crumbs.length = 0;
  crumbs.push(...kept);

  const trail = pageTrail(pathname);

  // `LIBAGO › D1 M › Match` said what kind of page this is, which the reader knows because they
  // clicked it. `LIBAGO › D1 M › VIR – MUU` says which one, and is the only crumb on the page that
  // distinguishes it from any other match.
  if (scope.game && isGameSurface && trail[0] === PAGE_TITLES.game) {
    trail[0] = scope.game.short;
  }

  // Same again for a player: « … › Joueur » names the kind, « … › Kasereka » names the person.
  if (scope.player && isPlayerSurface) {
    trail.length = 0;
    trail.push(scope.player.name || scope.player.short);
  }

  // Nothing to orient by: a system admin on their own dashboard just gets the page name.
  if (crumbs.length === 0 && trail.length === 0) return null;

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
            {/* The separator belongs *between* crumbs. Rendering it after every one left a
                chevron pointing at nothing whenever the page had no name — which is exactly
                what `/tenant/calendar` did. */}
            {(i < crumbs.length - 1 || trail.length > 0) && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
            )}
          </li>
        ))}
        {trail.map((label, i) => (
          <li
            key={`${label}-${i}`}
            className="flex min-w-0 items-center gap-1.5"
            aria-current={i === trail.length - 1 ? 'page' : undefined}
          >
            <span
              className={cn(
                'truncate px-1',
                i === trail.length - 1 ? 'font-semibold text-ink' : 'font-medium text-ink-muted',
              )}
            >
              {label}
            </span>
            {i < trail.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
