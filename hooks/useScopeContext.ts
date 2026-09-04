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
  tenant?: ScopeEntity;
  league?: ScopeEntity;
  team?: ScopeEntity;
  /** The match itself, when one is open. `short` is the matchup: "VIR – MUU". */
  game?: ScopeEntity;
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

  const teamId = ctxTeamId ?? user?.managingTeamId ?? undefined;
  const leagueId = ctxLeagueId ?? game.data?.leagueId ?? user?.managingLeagueId ?? undefined;

  const team = useQuery({
    queryKey: ['scope', 'team', teamId],
    queryFn: async () => (await api.get(`/teams/${teamId}`)).data,
    enabled: !!teamId,
    staleTime: ENTITY_STALE_MS,
  });

  // A team implies its league, and a league implies its tenant, so the chain fills itself in
  // even when only the deepest id was passed.
  const effectiveLeagueId = leagueId ?? team.data?.leagueId ?? undefined;

  const league = useQuery({
    queryKey: ['scope', 'league', effectiveLeagueId],
    queryFn: async () => (await api.get(`/leagues/${effectiveLeagueId}`)).data,
    enabled: !!effectiveLeagueId,
    staleTime: ENTITY_STALE_MS,
  });

  const effectiveTenantId =
    ctxTenantId ??
    league.data?.tenantId ??
    team.data?.tenantId ??
    game.data?.tenantId ??
    user?.tenantId ??
    undefined;

  const tenant = useQuery({
    queryKey: ['scope', 'tenant', effectiveTenantId],
    queryFn: async () => (await api.get(`/tenants/${effectiveTenantId}`)).data,
    enabled: !!effectiveTenantId,
    staleTime: ENTITY_STALE_MS,
  });

  return {
    tenantId: effectiveTenantId,
    leagueId: effectiveLeagueId,
    teamId,
    gameId,
    tenant: tenant.data
      ? {
          id: tenant.data.id,
          name: tenant.data.name,
          short: tenant.data.tenantCode ?? tenant.data.name,
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
    isLoading: team.isLoading || league.isLoading || tenant.isLoading || game.isLoading,
  };
}
