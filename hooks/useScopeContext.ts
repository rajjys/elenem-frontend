'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { useCurrentUser } from './useAuth';

/**
 * The single answer to "what am I looking at right now?"
 *
 * Routes here are flat and self-owned — `/league/*` is a root, not
 * `/tenant/leagues/[id]/*` — so the path alone cannot say which league you mean. Context travels
 * in `ctx*Id` query params instead, falling back to what the JWT says you own.
 *
 * Before this existed each page resolved scope on its own, and every one of them read only the
 * JWT: `/league/players` used `user.managingLeagueId`, which is null for a tenant admin. So a
 * tenant admin who drilled into a league still saw all 220 players in the organisation, and a
 * system admin saw all 700. Drilling down did not narrow anything — the backend scoped by *who
 * you are*, and nothing scoped by *what you opened*.
 *
 * Two rules this encodes:
 *   1. The URL wins. A ctx param is an explicit "show me this one".
 *   2. The JWT is the floor. With no ctx param, you get what you own.
 *
 * It never widens scope: the backend still enforces permissions, so a bad ctx param returns 403
 * or an empty list rather than someone else's data.
 */

export interface ScopeEntity {
  id: string;
  name: string;
  /** Short label for breadcrumbs — a tenant code, a team's shortCode. Falls back to the name. */
  short: string;
}

export interface ScopeContext {
  tenantId?: string;
  leagueId?: string;
  teamId?: string;
  gameId?: string;
  playerId?: string;
  tenant?: ScopeEntity;
  league?: ScopeEntity;
  team?: ScopeEntity;
  /** The match itself, when one is open. `short` is the matchup: "VIR – MUU". */
  game?: ScopeEntity;
  /** The player, when their page is open. `short` is their family name. */
  player?: ScopeEntity;
  isLoading: boolean;
}

/** Names change rarely; keep them cached so the breadcrumb never flickers on navigation. */
const ENTITY_STALE_MS = 5 * 60 * 1000;

export function useScopeContext(): ScopeContext {
  const params = useSearchParams();
  const pathname = usePathname() ?? '';
  const user = useCurrentUser();

  const ctxTenantId = params.get('ctxTenantId') ?? undefined;
  const ctxLeagueId = params.get('ctxLeagueId') ?? undefined;
  const ctxTeamId = params.get('ctxTeamId') ?? undefined;

  // A match is the one resource whose id lives in the path rather than in a query parameter, and
  // deliberately so: `ctx*Id` exists to carry one scope across a *set* of pages, and a game has a
  // single page. It names its own league and organisation in its payload, so reading it here is
  // what lets `/game/abc123` — a link that survives being pasted into a message — produce the
  // same breadcrumb as any scoped screen, with nothing appended to the URL.
  const gameId = pathname.match(/^\/game\/([^/]+)/)?.[1];

  const game = useQuery({
    queryKey: ['scope', 'game', gameId],
    queryFn: async () => (await api.get(`/games/${gameId}`)).data,
    enabled: !!gameId,
    staleTime: ENTITY_STALE_MS,
  });

  // A player's page is the second leaf resource, and it works exactly the way a match does: the id
  // is in the path because there is one page, and the record names its own competition and
  // organisation, so `/player/abc123` produces the full trail with nothing appended to the URL.
  const playerId = pathname.match(/^\/player\/([^/]+)/)?.[1];

  const player = useQuery({
    queryKey: ['scope', 'player', playerId],
    queryFn: async () => (await api.get(`/players/${playerId}`)).data,
    enabled: !!playerId,
    staleTime: ENTITY_STALE_MS,
  });

  const teamId = ctxTeamId ?? user?.managingTeamId ?? undefined;
  const leagueId =
    ctxLeagueId ??
    game.data?.leagueId ??
    player.data?.primaryLeague?.id ??
    user?.managingLeagueId ??
    undefined;

  const team = useQuery({
    queryKey: ['scope', 'team', teamId],
    queryFn: async () => (await api.get(`/teams/${teamId}`)).data,
    enabled: !!teamId,
    staleTime: ENTITY_STALE_MS,
  });

  // A team implies its league, and a league implies its tenant, so the chain fills itself in
  // even when only the deepest id was passed.
  const effectiveLeagueId = leagueId ?? team.data?.leagueId ?? undefined;

  /**
   * The competition's identity, not its details.
   *
   * `GET /leagues/:id` returns the owner, the business profile, every team and every player with
   * their email address, and is refused to a club administrator — so the crumb naming the
   * competition their own club plays in 403'd on every page they opened. `/identity` answers the
   * smaller question, and answers it for anyone in the organisation.
   */
  const league = useQuery({
    queryKey: ['scope', 'league', effectiveLeagueId],
    queryFn: async () => (await api.get(`/leagues/${effectiveLeagueId}/identity`)).data,
    enabled: !!effectiveLeagueId,
    staleTime: ENTITY_STALE_MS,
  });

  const effectiveTenantId =
    ctxTenantId ??
    league.data?.tenantId ??
    team.data?.tenantId ??
    game.data?.tenantId ??
    player.data?.tenantId ??
    user?.tenantId ??
    undefined;

  /**
   * The reader's own organisation is already in their token — name, code and all — so the
   * breadcrumb has no reason to ask the server for it.
   *
   * It was asking, and `GET /tenants/:id` is `@Roles(SYSTEM_ADMIN, TENANT_ADMIN)`: a league
   * administrator and a club administrator belong to the organisation and may not read it, so the
   * crumb naming their own federation 403'd on **every page they opened**. The endpoint is right to
   * be narrow — it returns the owner, the business profile and the subscription, none of which a
   * breadcrumb wants — and the fix is not to widen it but to stop asking.
   *
   * The request survives for the one case that needs it: a system administrator looking at somebody
   * else's organisation through `ctxTenantId`, where the token says nothing useful.
   */
  const ownTenant = user?.tenant;
  const needsTenantFetch = !!effectiveTenantId && effectiveTenantId !== ownTenant?.id;

  const tenant = useQuery({
    queryKey: ['scope', 'tenant', effectiveTenantId],
    queryFn: async () => (await api.get(`/tenants/${effectiveTenantId}`)).data,
    enabled: needsTenantFetch,
    staleTime: ENTITY_STALE_MS,
  });

  const tenantIdentity =
    !needsTenantFetch && ownTenant?.id === effectiveTenantId ? ownTenant : tenant.data;

  return {
    tenantId: effectiveTenantId,
    leagueId: effectiveLeagueId,
    teamId,
    gameId,
    playerId,
    tenant: tenantIdentity
      ? {
          id: tenantIdentity.id,
          name: tenantIdentity.name,
          short: tenantIdentity.tenantCode ?? tenantIdentity.name,
        }
      : undefined,
    league: league.data
      ? {
          id: league.data.id,
          name: league.data.name,
          // Leagues have no short code, so build one from what distinguishes them inside a
          // tenant: division and gender ("D1 M"). Better than truncating a long French title.
          short:
            league.data.division && league.data.gender
              ? `${league.data.division} ${league.data.gender === 'FEMALE' ? 'F' : 'M'}`
              : league.data.name,
        }
      : undefined,
    team: team.data
      ? {
          id: team.data.id,
          name: team.data.name,
          short: team.data.shortCode ?? team.data.name,
        }
      : undefined,
    // "Match" as the last crumb names the *kind* of thing you are looking at, which the reader
    // already knows — they clicked it. The matchup is the one label that distinguishes this page
    // from every other page of the same kind, which is what a trail is for.
    game: game.data
      ? {
          id: game.data.id,
          name: `${game.data.homeTeam?.name ?? ''} vs ${game.data.awayTeam?.name ?? ''}`.trim(),
          // "VIR – KAR" is how a results table writes a fixture, and it is the right thing there.
          // In a breadcrumb the reader is not reading a score, they are identifying a page, and a
          // dash between two capitalised codes reads as a range or a hyphenated name. "vs" cannot.
          short: `${game.data.homeTeam?.shortCode ?? game.data.homeTeam?.name ?? ''} vs ${
            game.data.awayTeam?.shortCode ?? game.data.awayTeam?.name ?? ''
          }`.trim(),
        }
      : undefined,
    // The family name, not the kind. Same argument as the match above: a trail exists to say
    // which page this is, and « Joueur » is the one thing the reader already knew.
    player: player.data
      ? {
          id: player.data.id,
          name: `${player.data.firstName ?? ''} ${player.data.lastName ?? ''}`.trim(),
          short: player.data.lastName ?? player.data.firstName ?? '',
        }
      : undefined,
    isLoading:
      team.isLoading || league.isLoading || tenant.isLoading || game.isLoading || player.isLoading,
  };
}
