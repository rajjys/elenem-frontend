import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';
import { SeasonStatus } from '@/schemas';

/**
 * The two dashboards.
 *
 * One request each, against endpoints built for the question the screen asks — which is a change
 * of kind, not of degree. The four screens these replace fired five sequential requests apiece and
 * still could not say how many results were waiting to be typed in, because no response carried
 * the number. Two of them fetched nothing at all and rendered invented data.
 */

const FixtureSchema = z.object({
  id: z.string(),
  dateTime: z.string(),
  status: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeShortCode: z.string().nullable(),
  awayShortCode: z.string().nullable(),
  homeScore: z.number().nullable(),
  awayScore: z.number().nullable(),
  venue: z.string().nullable(),
  leagueId: z.string(),
  leagueName: z.string(),
});

const CompetitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  division: z.string().nullable(),
  gender: z.string().nullable(),
  season: z
    .object({
      id: z.string(),
      name: z.string(),
      status: z.nativeEnum(SeasonStatus),
      startDate: z.string(),
      endDate: z.string(),
    })
    .nullable(),
  teamCount: z.number(),
  playerCount: z.number(),
  teamsWithoutPlayers: z.number(),
  fixtureCount: z.number(),
  playedCount: z.number(),
  missingResults: z.number(),
  champion: z
    .object({ teamId: z.string(), name: z.string(), shortCode: z.string().nullable() })
    .nullable(),
});

const OrganiserDashboardSchema = z.object({
  organisationId: z.string(),
  organisationName: z.string(),
  organisationCode: z.string().nullable(),
  competitions: z.array(CompetitionSchema),
  awaitingResults: z.array(FixtureSchema),
  upcoming: z.array(FixtureSchema),
});

const ClubDashboardSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  shortCode: z.string().nullable(),
  logoUrl: z.string().nullable(),
  leagueId: z.string(),
  leagueName: z.string(),
  organisationName: z.string(),
  season: z
    .object({ id: z.string(), name: z.string(), status: z.nativeEnum(SeasonStatus) })
    .nullable(),
  playerCount: z.number(),
  standing: z
    .object({
      rank: z.number(),
      totalTeams: z.number(),
      gamesPlayed: z.number(),
      wins: z.number(),
      losses: z.number(),
      points: z.number(),
      pointsLabel: z.string(),
    })
    .nullable(),
  form: z.array(z.string()),
  recent: z.array(FixtureSchema),
  upcoming: z.array(FixtureSchema),
});

const PlatformDashboardSchema = z.object({
  tenants: z.number(),
  leagues: z.number(),
  teams: z.number(),
  players: z.number(),
  users: z.number(),
  games: z.number(),
  resultsThisWeek: z.number(),
  tenantsWithoutFixtures: z.number(),
  recentTenants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      tenantCode: z.string().nullable(),
      createdAt: z.string(),
      leagues: z.number(),
    }),
  ),
});

export type PlatformDashboard = z.infer<typeof PlatformDashboardSchema>;
export type DashboardFixture = z.infer<typeof FixtureSchema>;
export type DashboardCompetition = z.infer<typeof CompetitionSchema>;
export type OrganiserDashboard = z.infer<typeof OrganiserDashboardSchema>;
export type ClubDashboard = z.infer<typeof ClubDashboardSchema>;

/**
 * A tenant administrator sees every competition; a league administrator sees theirs, whatever they
 * ask for — the server narrows it, so the two are one screen at two widths rather than two screens.
 */
export function useOrganiserDashboard(params: { tenantId?: string; leagueId?: string } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'organiser', params],
    queryFn: async () => {
      const res = await api.get('/dashboard/organiser', { params });
      return parseResponse(OrganiserDashboardSchema, res.data);
    },
    staleTime: 30_000,
  });
}

export function useClubDashboard(teamId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'club', teamId ?? 'mine'],
    queryFn: async () => {
      const res = await api.get('/dashboard/club', { params: teamId ? { teamId } : {} });
      return parseResponse(ClubDashboardSchema, res.data);
    },
    staleTime: 30_000,
  });
}

/**
 * The platform, in the numbers the platform actually has.
 *
 * Not revenue, not uptime, not support tickets — Elenem charges nobody, monitors nothing and has
 * no ticketing system, and the screen this serves reported all three from arrays written into the
 * component.
 */
export function usePlatformDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'platform'],
    queryFn: async () => {
      const res = await api.get('/dashboard/platform');
      return parseResponse(PlatformDashboardSchema, res.data);
    },
    staleTime: 60_000,
  });
}
